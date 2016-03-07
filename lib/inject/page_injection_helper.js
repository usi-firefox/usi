"use strict"; // Strict Mode aktivieren!

/************************************************************************
 ************************* Page Injection Funktionen! *******************
 ************************************************************************/

/* global exports,require */

// Lade den basic_helper
var basic_helper = basic_helper || require("../core/basic_helper").basic_helper,
// Storage laden
addon_storage = addon_storage || require("sdk/simple-storage"),
// Einstellungsspeicher laden
preferences = preferences || require("sdk/simple-prefs"),
// hierrin werden alle Page Injections gesammelt ...
all_page_injections = all_page_injections || [],
// PageMod Module laden!
page_injection = page_injection || require("sdk/page-mod"),
// Userscript Parser laden!
parse_userscript = parse_userscript || require("../parse/parse_userscript").parse_userscript,
// Self init für CFX Tool
self = self || require("sdk/self"),
// Kompatibilitäts Helfer
cfx_jpm_helper = require("../configuration/cfx_jpm_helper").cfx_jpm_helper,
// Sichert alle Registrierten Menü Kommandos
last_menuCommands = last_menuCommands || [],
// Url Check		
url_c = require("sdk/url"),
// Resource Path festlegen
resource_path = cfx_jpm_helper.resource_path();
 
/************************************************************************
 ************************* Injection Bereich! ***************************
 ************************************************************************/


var page_injection_helper = {
	/**
	 * Führe diese Funktion aus damit der Injection Bereich neu geladen werden kann!
	 * @returns {void}
	 */
	re_init_page_injection: function () {
		// entferne alle Userscripts die zuvor geladen wurden!
		for (var i in all_page_injections) {
			//prüfe zunächst ob es solch eine Funktion gibt!
			if (typeof all_page_injections[i].destroy === "function") {
				// zerstöre die PageMods mithilfe der Destroy Funktion!
				all_page_injections[i].destroy();
			}
		}
		// zurücksetzen vom Sammler Objekt!
		all_page_injections = [];

		// Registriere alle Userscripte!
		//
		// durchlaufe alle Einträge im Storage
		for (var i in addon_storage.storage) {

			// führe für jedes Userscript die einfüge Funktion aus!
			this.add_userscript_to_page(addon_storage.storage[i]);

		}
	}

	, prepare_includes_and_excludes: function (rules, script_settings, keyword) {

		// für die Übergabe an den PageMod aufruf
		var result = [];
		var url_rule
		,script_url_rule;

		// suche nach der passenden Konfiguration anhand des Keywords
		var userscript_keyword_config = parse_userscript.get_userscript_keyword_config_by_name(keyword);
		
		// Durchlaufe alle Einträge
		for (var j in rules) {

			// aktuelle script_url_rule
			script_url_rule = rules[j];

			// Überprüfe die URL
			url_rule = basic_helper.typeGuess(script_url_rule, userscript_keyword_config.types);

			if(url_rule === null){
				// falls es null sein sollte, gehe gleich zum nächsten
				continue;
			}
			
			// Neu ab Version 0.2.0-j, wenn es true gesetzt ist wird nichts umgeparst
			if (script_settings["clean-include"] === "true" || script_settings["clean-include"] === true
					// Oder wenn es ein Regulärer Ausdruck ist ->
					|| (typeof url_rule === "object" && typeof url_rule.test === "function")) {
				
				// direkt hinzufügen
				result.push(url_rule);
				
			}else{
				// Möglicher Anpassungen durchführen
					
				var url_splitted = url_rule.split("*");

				// Wenn das Array mindestens aus 3 Teilen besteht, wurden mindestens 2 Asterisk verwendet 
				if(url_splitted.length >= 3){

					// ersetze doppelte *
					var test_url = parse_userscript.replace_wildcards_in_url(url_rule);

					// erstelle daraus nun einen Regulären Ausdruck zum suchen!
					var test_url_regex = new RegExp(test_url);

					// dieses Array wird dann dem PageMod übergeben
					result.push(test_url_regex);

				}else{
					// nicht mehr als 1 Asterisk gefunden!
					result.push(url_rule);
				}
		
			}
		}
		
		return result;

	}

	/**
	 * 
	 * Fügt ein Userscript in eine Seite ein!
	 * @param {object} userscript_entry
	 * @returns {void}
	 */
	, add_userscript_to_page: function (userscript_entry) {

		if(typeof userscript_entry === "undefined" || userscript_entry.settings === null){
			return false;
		}
		
		// URL/Includes darf natürlich nicht leer sein!
		if (!basic_helper.empty(userscript_entry.settings.include) &&
				(typeof userscript_entry.deactivated === "undefined" || userscript_entry.deactivated === false)) { // nur wenn das skript nicht deaktiviert wurde!

			// alle Includes des Skripts laden
			var script_settings = userscript_entry.settings;
			var exclude_rules = userscript_entry.settings.exclude;

			// die Includes könnten auch nur aus einem Aufruf bestehen!
			if (basic_helper.is_string(script_settings.include)) {
				//Wandle den String in ein einfaches Array um....
				script_settings.include = [script_settings.include];
			}

			// Prüfung ob es ein Array ist
			if (script_settings.include.length > 0) {

				// ausgelagert, für Wiederverwendung
				var result_includes = this.prepare_includes_and_excludes(script_settings.include, script_settings, "include");

			} else {

				// das dürfte nie auftreten!
				throw new {code: 100, text: _("exception_100"), content: script_settings.include};
			}

			// src: https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/page-worker

			// die Excludes könnten auch nur aus einem Aufruf bestehen!
			if (basic_helper.is_string(exclude_rules)) {
				//Wandle den String in ein einfaches Array um....
				exclude_rules = [exclude_rules];
			}

			// Wichtig damit die Konfigurations Oberfläche von USI nicht unbrauchbar gemacht werden kann!
			var result_excludes = [/resource:\/\/firefox-addon-usi-at-jetpack\/.*/];

			if (typeof exclude_rules !== "undefined" && exclude_rules.length > 0) {
				// Exclude Regeln hinzufügen
				var prepared_result_excludes = this.prepare_includes_and_excludes(exclude_rules, script_settings, "exclude");

				// Sicherheitscheck
				if (typeof prepared_result_excludes !== "undefined" && prepared_result_excludes.length > 0) {
					result_excludes = result_excludes.concat(prepared_result_excludes);
				}
			}

			var userscript_load_when = false;
			// Entscheide wann das Userscript geladen werden soll, anhand von @run-at
			switch (script_settings["run-at"]) {

				case "document-start":
				case "start":
					// "start": load content scripts immediately after the document element for the page is inserted into the DOM, but before the DOM content itself has been loaded
					userscript_load_when = "start";
					break;

					//
				case "document-ready":
				case "ready":
					// "ready": load content scripts once DOM content has been loaded, corresponding to the DOMContentLoaded event
					userscript_load_when = "ready";
					break;

				case "document-end": // eigentlich überflüssig, aber zu Dokumentationszwecken vielleicht nicht unnötig
				case "end":// eigentlich überflüssig, aber zu Dokumentationszwecken vielleicht nicht unnötig
				default:
					// "end": load content scripts once all the content (DOM, JS, CSS, images) for the page has been loaded, at the time the window.onload event fires
					userscript_load_when = "end";
					break;

			}
			
			// sammelt alle Skripte die auf der Seite eingebunden werden sollen
			var contentScript_result = new Array();
			
			// Füge @require Skripte hinzu
			if(!basic_helper.empty(userscript_entry.require_scripts)){
				var req_scripts = userscript_entry.require_scripts;
				for(var i in req_scripts){
					contentScript_result.push(req_scripts[i].text);
				}
				
			}

			// Das Userscript erst nach den @require Skripten einbinden!
			contentScript_result.push(userscript_entry.userscript);
			
			// aus den einzelnen Skripten nur einen String bauen, damit Referenzierungen möglich bleiben
			contentScript_result = contentScript_result.join("\n\n\n");

			// Setze die Einstellungen für den PageMod Aufruf!
			var page_injection_object = {
				include: result_includes,
				contentScriptWhen: userscript_load_when,
				attachTo: ['existing', 'top'],
				exclude: result_excludes,
				contentScript: contentScript_result
//                                contentScriptOptions: userscript_entry.options || {} 
			};

			// init array
			page_injection_object.contentScriptFile = [];
			// Wenn jQuery gefordert ist muss das page_injection_object angepasst werden!
			if (script_settings["include-jquery"] === "true" || script_settings["include-jquery"] === true) {
				page_injection_object.contentScriptFile.push(resource_path + "libs/jquery-2.2.1.min.js");
			}

			// Wenn jQuery gefordert ist muss das page_injection_object angepasst werden!
			if (script_settings["use-greasemonkey"] === "true" || script_settings["use-greasemonkey"] === true) {
				// init JSON
				page_injection_object.contentScriptOptions = {};

				// übergibt den val_store in die Storage Variable
				page_injection_object.contentScriptOptions.storage = userscript_entry.val_store;
				page_injection_object.contentScriptOptions.id = userscript_entry.id;

				// ermögliche der Webseite den Zugriff auf die Greasemonkey-Frontend Funktionen
				page_injection_object.contentScriptFile.push(resource_path + "helper/GM_Frontend.js");

				// Init Greasemonkey-Backend API
				var grease = require("../inject/GM/greasemonkey_functions").greasemonkey_functions;
				// Handler für dieses Skript
				var grease_handler = grease.init(userscript_entry.id);

				// Registriere die Events für die entgegennahme aus dem Content-Script
				page_injection_object.onAttach = function (worker) {

					// Variable speichern
					worker.port.on("USI-BACKEND:GM_setValue", function (value_pair) {
						grease_handler.GM_setValue(value_pair.name, value_pair.value);
					});

					// Variable löschen
					worker.port.on("USI-BACKEND:GM_deleteValue", function (value_pair) {
						grease_handler.GM_deleteValue(value_pair.name);
					});

					// neuen Tab öffnen
					worker.port.on("USI-BACKEND:GM_openInTab", function (value_pair) {

						// Prüft ob value_pair.url wirklich valide ist!
						if (url_c.isValidURI(value_pair.url) === true) {

							// Prüf-Variable damit es nicht zu einer "unendlichen" Rekursion kommt
							var not_wildcard_pagemod = true;
							for (var i in userscript_entry.include) {
								if (userscript_entry.include[i] === "*") {
									// Wildcard Eintrag gefunden, open in Tab ist nicht möglich!
									not_wildcard_pagemod = false;
								}
							}
							// im neuen Tab öffnen, aber nur wenn das Userscript nicht für Wildcard Aufrufe genutzt wird!!!!
							if (not_wildcard_pagemod === true) {
								try {
									var open_in_background;
									if (value_pair.open_in_background === "true" || value_pair.open_in_background === true) {
										open_in_background = true;
									} else {
										open_in_background = false;
									}
									require("sdk/tabs").open({url: value_pair.url, inBackground: open_in_background});
								} catch (ex) {
									worker.port.emit("GM-FRONTEND-ERROR",
											{
												func: "GM_openInTab",
												reason: "Unknown Error",
												object: {Exception: ex, GivenValues: value_pair}
											});
								}
							}

						} else {
							// Schicke den Fehler zurück zum Aufrufenden Skript
							worker.port.emit("GM-FRONTEND-ERROR",
									{
										func: "GM_openInTab",
										reason: "url is not valid!",
										object: value_pair
									});
						}
					});

					// xmlhttpRequest call
					worker.port.on("USI-BACKEND:GM_xmlhttpRequest", function (details) {
						// ausgelagert in eigene Datei
						var GM_xhrHandler = require("../inject/GM/GM_xhrHandler").GM_xhrHandler;

						GM_xhrHandler.init(details.data, details.counter, worker);

					});

					// GM_registerMenuCommand -> Kommando im Menü Registrieren
					worker.port.on("USI-BACKEND:GM_registerMenuCommand", function (data) {
						// als JSON lässt es sich natürlich nicht simpel vergleichen, daher die Umwandlung in einen String
						var stringified_data = JSON.stringify(data);

						// Prüfe ob data nicht schon bereits gesetzt wurde!
						// Schutz Abfrage, falls das Kommando auf mehreren Seiten greifen würde (zu lockere Inlcude/Match Anweisung)
						if (last_menuCommands.indexOf(stringified_data) === -1) {
							// setze data in das Array wo du MenuCommands gesammelt werden
							last_menuCommands.push(stringified_data);

							// init
							var utils = require('sdk/window/utils'),
									recentWindow = utils.getMostRecentBrowserWindow(),
									/**
									 * WICHTIGER Workaround, nur so kann eine Funktion vom Frontend ans Backend übergeben und ausgeführt werden!
									 */
									// Funktions-String zurück in eine Funktion wandeln...
									commandFunction = new Function("return " + data.commandFunc + "();");

							// nur bei Fennec
							if (typeof recentWindow.NativeWindow !== "undefined") {
								recentWindow.NativeWindow.menu.add({
									name: data.caption,
									icon: {
										"16": "./icon/usi.png"
//								,"32": "./icon/icon-32.png"
//								,"64": "./icon/icon-64.png"
									},
									//    parent: recent.NativeWindow.menu.toolsMenuID,
									callback: commandFunction
								});

							} else { // Nur im Desktop
								// Desktop Variante mit Action Button
								require('sdk/ui/button/action').ActionButton({
									id: "usi-menu-" + last_menuCommands.length,
									label: data.caption,
									icon: {
										"16": "./icon/usi.png"
//								,"32": "./icon/icon-32.png"
//								,"64": "./icon/icon-64.png"
									},
									onClick: commandFunction
								});

							}

						}
					});

					// in die Zwischenablage schreiben!
					worker.port.on("USI-BACKEND:GM_setClipboard", function (text) {
						try {
							var clipboard = require("sdk/clipboard");

							// Android - Fennec unterstützt dies wohl bisher nicht ...
							if (typeof clipboard.set === "function") {
								// falls es kein String ist, versuche es umzuwandeln
								if (typeof text !== "string" && typeof text.toString === "function") {
									text = text.toString();
								}
								// setze es nur in die Zwischenablage wenn es wirklich ein String ist...
								if (typeof text === "string") {
									clipboard.set(text);
								}
							}
							// nichts...
						} catch (ex) {
						}
					});

				};
			}

			// prüfe ob der aktuelle reguläre Ausdruck vom Script, auf die URL passt!, füge das Skript ein!
			// Setze es in den PAGEMOD!!!
			// Setze die Einstellung im PageMod und liefere die Referenz an "res_page"
			var res_page = page_injection.PageMod(page_injection_object);


			// aktuelles PageMod Objekt dem Sammler Objekt hinzufügen!
			all_page_injections.push(res_page);
		}

	}

	/************************************************************************
	 ********* Parse-Userscript-Konfiguration Funktionen ********************
	 ************************************************************************/

	/**
	 * Prüft ob es für das Userscript eine Aktualisierung gibt, und überschreibt es bei Bedarf
	 * @param {string} userscript
	 * @param {object} worker
	 * @param {string} override_userscript_id
	 * @returns {Boolean}
	 */

	, check_for_userscript_settings_and_save_it: function (userscript, worker, override_userscript_id) {

		// Konfig suchen und danach die Optionen Parsen...
		// us als Shortcur für userscript_settings
		var us = parse_userscript.find_settings(userscript);

		// Prüfe ob kein Fehler enthalten ist!
		if (basic_helper.isset(us.error_message)) {
			// es wurde ein Fehler in der Konfiguration gefunden, melde es nun dem Benutzer!
			worker.port.emit("USI-BACKEND:show-error", _("error_userscript_settings") + us.error_message);

			return false;
		} else {

			// für den späteren Check notwendig
			var old_userscript_was_found = 0;

			// Wenn keine Override ID angegeben wurde, suche nach gleichem Skript
			if (!basic_helper.isset(override_userscript_id)) {

				/********************************************************************************************************************************************
				 * Dieser Weg wird für neue Skripte verwendet, aber gleichzeitig wird auch geprüft ob schon gleiche Skripte existieren! *********************
				 *********************************************************************************************************************************************/

				// Shortcuts, für mehr Übersichtlichkeit
				var as = addon_storage.storage;

				// Prüfe ob das Skript bereits existiert, und wenn ja frage ob es aktualisiert werden soll!
				for (var i in as) {					
					if (as[i].settings.name == us.name // Namen sind identisch
							&& as[i].settings.namespace == us.namespace // Namespace ist identisch
							&& as[i].settings.author == us.author // Author ist identisch
							&& as[i].settings.updateURL == us.updateURL // updateURL ist identisch
							&& as[i].settings.downloadURL == us.downloadURL) { // downloadURL ist identisch

						// Es wurde ein Userscript gefunden, soll es aktualisiert werden?
						worker.port.emit("USI-BACKEND:same-userscript-was-found", {id: i, userscript: userscript});

						// Erhöhe den Zähler! theoretisch könnten mehrere gleiche skripte vorhanden sein
						old_userscript_was_found++;
					}
				}

				// Datum als ID ... @TODO
				var id = new Date().getTime();

			} else {
				/****************************************************************************************************************
				 * Dieser Weg wird nur für Skripte genutzt, die aktualisiert werden und bereits existieren! *********************
				 ****************************************************************************************************************/
				// es wurde eine ID zum überschreiben mitgelierfert!
				var id = override_userscript_id;

			}

			// Speichere nun das Skript ab!
			if (old_userscript_was_found === 0) {

				// Lade externe Skripte nach, falls vorhanden
				if(!basic_helper.empty(us.require)){
					var require_allowed_types = parse_userscript.get_userscript_keyword_config_by_name("require");

					var one_require,require_address,this_module,require_length,require_cache;
					// damit im Callback die eigenen Funktionen genutzt werden können
					this_module		=	this;
					require_length	=	us.require.length;
					// sammelt alle geladenen Skripte
					require_cache	=	[];
					
					// da mehrere require Anweisungen erhalten sein können
					for (var require_index in us.require) {
						one_require = us.require[require_index];

						// Überprüfe die URL
						require_address = basic_helper.typeGuess(one_require, require_allowed_types.types);

						// Wenn es nicht leer ist, lade es nach
						if (require_address !== null) {
							this.__load_external_by_url(require_address, function (require_result) {
								
								// erstmal im Cache sichern
								require_cache.push({url: one_require, text: require_result});
																
								// wenn es der letzte Durchlauf ist!
								if((parseInt(require_index) + 1) === require_length){
									
									// speichere dieses Skript sobald alle require Statements erfolgreich durchlaufen sind!
									this_module.speichere_in_storage(id, {id: id, userscript: userscript, require_scripts: require_cache, settings: us, deactivated: false});
								
								}
							});
						}

					}
				}else{

					// speichere dieses Skript && und schalte es gleich auf aktiviert!
					this.speichere_in_storage(id, {id: id, userscript: userscript, settings: us, deactivated: false});
					
				}
				
				// darf nicht false sein, es wird sonst eine ID geliefert
				if (id !== false) {
					// füge das Skript gleich hinzu, damit es ausgeführt werden kann!
					this.add_userscript_to_page(addon_storage.storage[id]);

					// Reset ...
//					id = override_userscript_id = us = null;

					// erneuere die Ausgabe!
					worker.port.emit("USI-BACKEND:list-all-scripts", addon_storage.storage);
				}

				return true;
			} else {
				// es wurde mindestens ein Skript gefunden, welches die gleichen einstellungen besitzt

				return false;
			}

		}
	}

	, __load_external_by_url: function(url_str, callback){
		
		var Request = require("sdk/request").Request;
		
		// Wenn die URL gültig ist, wird true zurück geliefert
		if(url_c.isValidURI(url_str) === true){
			
			Request({
				url: url_str,
				headers: {// Damit der Request immer "frisch" ist!
					'Cache-control': 'no-cache'
				},
				onComplete: function (response) {
					// nur wenn es auch erfolgreich war!
					if (response.status === 200 && response.statusText === "OK") {

						// Rückgabe des Response Textes
						var user_script_text = response.text;

						// Führe den Rest der Funktionen aus, die übergeben wurden!
						callback(user_script_text);

					}
				}
			}).get();
			
			// Url ist gültig
			return true;
		}else{
			// Url Fehlerhaft
			return false;
		}
	}

	/**
	 * Holt externe Skripte
	 * @param {string} url_str
	 * @param {function} callback
	 * @returns {Boolean}
	 */
	, load_userscript_by_url: function (url_str, callback) {

		// Nur wenn am Ende der URL ein .user.js steht!
		if (/\.user\.\js$/.test(url_str)) {
			return this.__load_external_by_url(url_str, callback);
		} else {
			return false;
		}
	}


	/************************************************************************
	 ************************* Speicher Funktionen! *************************
	 ************************************************************************/

	/**
	 * Setze die Einstellungen in den Storage 
	 * @param {string} key
	 * @param {mixed} value
	 * @returns {void}
	 */
	, speichere_in_storage: function (key, value) {
		// Den Wert speichern!
		addon_storage.storage[key] = value;
	}

};

if (typeof exports !== "undefined") {
	exports.page_injection_helper = page_injection_helper;
}