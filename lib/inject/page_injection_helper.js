"use strict"; // Strict Mode aktivieren!

/************************************************************************
 ************************* Page Injection Funktionen! *******************
 ************************************************************************/

/* global exports,require, Promise */

// Lade den basic_helper
var basic_helper = basic_helper || require("data/helper/basic_helper").basic_helper,
// Einstellungsspeicher laden
preferences = preferences || require("sdk/simple-prefs"),
// hierrin werden alle Page Injections gesammelt ...
all_page_injections = all_page_injections || [],
// PageMod Module laden!
page_injection = page_injection || require("sdk/page-mod"),
// Userscript Parser laden!
parse_userscript = parse_userscript || require("lib/parse/parse_userscript").parse_userscript,
// Self init für CFX Tool
self = self || require("sdk/self"),
// Kompatibilitäts Helfer
cfx_jpm_helper = require("lib/configuration/cfx_jpm_helper").cfx_jpm_helper,
// Sichert alle Registrierten Menü Kommandos
last_menuCommands = last_menuCommands || [],
// Übersetzungsschlüssel bestimmen
lang = require("lib/configuration/language").lang,
// Url Check		
url_c = require("sdk/url"),
// Resource Path festlegen
resource_path = cfx_jpm_helper.resource_path(),
    
type_guess = require("lib/testing/type_guess").type_guess,
// Ermöglicht einen vereinfachten Umgang mit den gespeicherten Userscripts
userscript_storage = require("lib/storage/userscript").userscript_storage;
 
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

        // hole alle Userscripts aus dem Speicher
        var all_userscripts = userscript_storage.getAll();

		// Registriere alle Userscripte!
		//
		// durchlaufe alle Einträge im Storage
		for (var i in all_userscripts) {

			// führe für jedes Userscript die einfüge Funktion aus!
			page_injection_helper.add_userscript_to_page(all_userscripts[i]);

		}
	}

	, prepare_includes_and_excludes: function (rules, script_settings, keyword) {

		// für die Übergabe an den PageMod aufruf
		var result = [];
		var url_rule
		,result_rule
		,script_url_rule;

		// suche nach der passenden Konfiguration anhand des Keywords
		var userscript_keyword_config = parse_userscript.get_userscript_keyword_config_by_name(keyword);
		
		// Durchlaufe alle Einträge
		for (var j in rules) {

			// aktuelle script_url_rule
			script_url_rule = rules[j];

			// Überprüfe die URL
			url_rule = type_guess.typeGuess(script_url_rule, userscript_keyword_config.types);

			if(url_rule === null){
				// falls es null sein sollte, gehe gleich zum nächsten
				continue;
			}
			
			// Damit kann das Verhalten auf die alte Verhaltensweise zum verarbeiten der Include Regeln gesetzt werden
			if(preferences.prefs.OldUsiIncludeBehavior === false){
				// Dies ist der neue bevorzugte Weg -> GM				
				if(typeof url_rule.trim === "function" && "*" === url_rule.trim()){
					result.push("*");
				}else{
					// von GM_convert2RegExp() verarbeiten
					result_rule = parse_userscript.process_matching_rules(url_rule);

					// check
					if(result_rule !== null){
						result.push(result_rule);
					}
				}
			
			}else{
			
				// der frühere Weg zum verabeiten der Include Regeln

				// Neu ab Version 0.2.0-j, wenn es true gesetzt ist wird nichts umgeparst
				if (script_settings["clean-include"] === "true" || script_settings["clean-include"] === true
						// Oder wenn es ein Regulärer Ausdruck ist ->
						|| (typeof url_rule === "object" && typeof url_rule.test === "function")) {

					// direkt hinzufügen
					result.push(url_rule);

				} else {
					// Möglicher Anpassungen durchführen

					var url_splitted = url_rule.split("*");

					// Wenn das Array mindestens aus 3 Teilen besteht, wurden mindestens 2 Asterisk verwendet 
					if (url_splitted.length >= 3) {

						// ersetze doppelte *
						var test_url = parse_userscript.replace_wildcards_in_url(url_rule);

						// erstelle daraus nun einen Regulären Ausdruck zum suchen!
						var test_url_regex = new RegExp(test_url);

						// dieses Array wird dann dem PageMod übergeben
						result.push(test_url_regex);

					} else {
						// nicht mehr als 1 Asterisk gefunden!
						result.push(url_rule);
					}

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
				var result_includes = page_injection_helper.prepare_includes_and_excludes(script_settings.include, script_settings, "include");

			} else {

				// das dürfte nie auftreten!
				throw new {code: 100, text: lang.exception_100, content: script_settings.include};
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
				var prepared_result_excludes = page_injection_helper.prepare_includes_and_excludes(exclude_rules, script_settings, "exclude");

				// Sicherheitscheck
				if (typeof prepared_result_excludes !== "undefined" && prepared_result_excludes.length > 0) {
                    for (var i in prepared_result_excludes) {
                        result_excludes.push(prepared_result_excludes[i]);
                    }
				}
			}

            // Default ist nun "ready", da es zu oft zu Problemen kam, dass das "document" nicht verfügbar war
			var userscript_load_when = "ready";
            
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
				case "end":
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

			// alle ungültigen Zeichen entfernen!
			contentScript_result = contentScript_result.replace(/\uFFFD/g, '');


			// Die include dürfen nicht leer sein!
			if(result_includes.length == 0){
				return false;
			}

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
				page_injection_object.contentScriptFile.push(resource_path + "libs/jquery/jquery-2.2.4.min.js");
			}
			
			// Wenn jQuery gefordert ist muss das page_injection_object angepasst werden!
			if (preferences.prefs.options_always_activate_greasemonkey === true || 
					script_settings["use-greasemonkey"] === "true" || 
					script_settings["use-greasemonkey"] === true) {
				// init JSON
				page_injection_object.contentScriptOptions = {};

				// übergibt den val_store in die Storage Variable
				page_injection_object.contentScriptOptions.storage = userscript_entry.val_store;
				page_injection_object.contentScriptOptions.id = userscript_entry.id;

				// Werte für die Variable GM_info
				page_injection_object.contentScriptOptions.scriptsettings	=	JSON.stringify(userscript_entry.settings); // enthält die Settings
				page_injection_object.contentScriptOptions.scriptSource		=	contentScript_result; // inklusive der require skripte
				page_injection_object.contentScriptOptions.scriptMetaStr	=	parse_userscript.find_lines_with_settings(userscript_entry.userscript).join("\n");
				page_injection_object.contentScriptOptions.usiversion		=	self.version; // übergibt die USI Version
				
				
				// ermögliche der Webseite den Zugriff auf die Greasemonkey-Frontend Funktionen
				page_injection_object.contentScriptFile.push(resource_path + "helper/GM_Frontend.js");

				// Init Greasemonkey-Backend API
				var grease = require("lib/inject/GM/greasemonkey_functions").greasemonkey_functions;
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
						var GM_xhrHandler = require("lib/inject/GM/GM_xhrHandler").GM_xhrHandler;

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
	  * Lädt ein Bild und gibt es als Datauri an die Callback Funktion weiter
	  * @param {string} url
	  * @param {string} callback
	  * @param {string} charset
	  * @returns {void}
	  */
	 , load_image_and_convert_to_datauri_or_return_text : function(url, callback, charset){
		 
		// Falls es eine externe HTTP(S) Datei ist lade sie herunter
		if (/^http/.test(url) && url_c.isValidURI(url)) {

			var xhr1 = require("sdk/net/xhr");
			var xhr = new xhr1.XMLHttpRequest();

			xhr.open('GET', url, true);

			// Must include this line - specifies the response type we want
			xhr.responseType = 'arraybuffer';

			// ändere das angeforderte Charset, falls es gesetzt wurde
			if(!basic_helper.empty(charset) && basic_helper.is_string(charset)){
				xhr.setRequestHeader("Content-Type", "text/plain; charset="+charset);
			}

			xhr.onload = function () {

				if (this.status === 200) {

					/**
					 * Abhängig vom Content-Type wird entschieden ob es es Bild ist,
					 * oder als es als Text behandelt wird, andere Datei Typen werden bisher
					 * nicht unterstützt!
					 */
					var response_contenttype = xhr.getResponseHeader("Content-Type");

					if (response_contenttype === null || basic_helper.empty(response_contenttype)) {
						// Falls er leer sein sollte, setzte einfach => image/png
						response_contenttype = "text/plain";
					}
					
					var arr = new Uint8Array(this.response);

					// Convert the int array to a binary string
					// We have to use apply() as we are converting an *array*
					// and String.fromCharCode() takes one or more single values, not
					// an array.
					var raw = String.fromCharCode.apply(null, arr);

					// Falls der Content-Type mit "image" beginnt, wird dieses als base64 encodierter String zurückgegeben
					if(/^image/.test(response_contenttype)){
						if (!basic_helper.empty(raw)) {
							var base64 = require("sdk/base64");
							// die Data URI an die Callback Funktion übergeben!
							callback("data:" + response_contenttype + ";base64," + base64.encode(raw), response_contenttype);
						}
					}else{
						if (!basic_helper.empty(raw)) {
							// sehr verwahrscheinlich handelt es sich um einen Text
							callback(raw, response_contenttype);
						}
					}
				}
			};

			xhr.send();
		}
	 }

	/**
	 * Prüft ob es für das Userscript eine Aktualisierung gibt, und überschreibt es bei Bedarf
	 * @param {string} userscript
	 * @param {object} worker
	 * @param {string} override_userscript_id
	 * @param {string} charset
	 * @param {object} moreinformations
	 * @returns {boolean}
	 */
	, check_for_userscript_settings_and_save_it: function (userscript, worker, override_userscript_id, charset, moreinformations) {
		var alternative_name, userscript_handle;
		
		// Falls im Userscript kein Name vorhanden ist, setze den Dateinamen als @name
		if(basic_helper.isset(moreinformations) && !basic_helper.empty(moreinformations.url)){
			alternative_name = basic_helper.getFilenameFromURL(moreinformations.url);
		}

		// Konfig suchen und danach die Optionen Parsen...
		// us als Shortcur für userscript_settings
		var us = parse_userscript.find_settings(userscript);

		// Falls kein @name gefunden werden konnte, und ein alternativer Name vorhanden ist
		// versuche es
		if(us.error_code === 101 && !basic_helper.empty(alternative_name)){
			// setze den @name in den Metablock des Userscripts ein
			var modified_userscript = parse_userscript.add_option_to_userscript_metablock(userscript, ["// @name     " + alternative_name]);
			
			// @todo
			// übler Workaround ...
			worker.port.emit("USI-BACKEND:To-Frontend-Document-Event-Forwarder", {event_name: "USI-FRONTEND:changeTab", action: "edit",  param1: {userscript : modified_userscript}});
			
			// Benachrichtige den Nutzer, dass das Userscript verändert wurde!
			worker.port.emit("USI-BACKEND:get-alert", lang.userscript_was_modified_by_usi___reason_missing_name);
		
			// Prüfe ob kein Fehler enthalten ist!
		}else if (basic_helper.isset(us.error_message)) {
			// es wurde ein Fehler in der Konfiguration gefunden, melde es nun dem Benutzer!
			worker.port.emit("USI-BACKEND:get-alert", lang.error_userscript_settings + us.error_message);

			return false;
		} else {

			// für den späteren Check notwendig
			var old_userscript_was_found = 0;

			// Wenn keine Override ID angegeben wurde, suche nach gleichem Skript
			if (override_userscript_id === null || !basic_helper.isset(override_userscript_id)) {

				/********************************************************************************************************************************************
				 * Dieser Weg wird für neue Skripte verwendet, aber gleichzeitig wird auch geprüft ob schon gleiche Skripte existieren! *********************
				 *********************************************************************************************************************************************/

				// Shortcuts, für mehr Übersichtlichkeit
				var as = userscript_storage.getAll();

				var found_id = false;
				// Prüfe ob das Skript bereits existiert, und wenn ja frage ob es aktualisiert werden soll!
				for (var i in as) {					
					if (as[i].settings.name == us.name // Namen sind identisch
							&& as[i].settings.namespace == us.namespace // Namespace ist identisch
							&& as[i].settings.author == us.author // Author ist identisch
							&& as[i].settings.updateURL == us.updateURL // updateURL ist identisch
							&& as[i].settings.downloadURL == us.downloadURL) { // downloadURL ist identisch
						// zuletzt gefundene ID
						found_id = as[i].id;
						// Erhöhe den Zähler! theoretisch könnten mehrere gleiche skripte vorhanden sein
						old_userscript_was_found++;
					}
				}

				if (old_userscript_was_found === 0) {
					// Erzeuge ein neues Userscipt
					userscript_handle = userscript_storage.createNew();

					return page_injection_helper.update_userscript(userscript_handle, userscript, us, moreinformations, worker);

				}else{
					
					// Es wurde ein Userscript gefunden, soll es aktualisiert werden?
					worker.port.emit("USI-BACKEND:same-userscript-was-found", {id: found_id, userscript: userscript, moreinformations: moreinformations});
					
					return false;
				}

			} else {
				/****************************************************************************************************************
				 * Dieser Weg wird nur für Skripte genutzt, die aktualisiert werden und bereits existieren! *********************
				 ****************************************************************************************************************/
				// es wurde eine ID zum überschreiben mitgelierfert!

				if (typeof override_userscript_id !== "undefined" && override_userscript_id > 0) {
					// Userscript gefunden, es soll überschrieben werden
					userscript_handle = userscript_storage.getById(override_userscript_id);

					if (userscript_handle === false) {

						// Darf niemalas passieren
						return false;
					} else {
						return page_injection_helper.update_userscript(userscript_handle, userscript, us, moreinformations, worker);
					}

				}
			}
		}
	}
	
	, update_userscript : function(userscript_handle, userscript, settings, moreinformations, worker){
        var running_promises = [];

        // setze und speichere die gefundenen Einstellungen
        userscript_handle.
            changeValues("settings", settings).
            changeValues("userscript", userscript).
            changeValues("moreinformations", moreinformations).
            // alle Extern geladenen Daten zurücksetzen
            resetAllExternals();

        // lade die @resource angaben
        if (!basic_helper.empty(settings.resource)) {
            var one_resource, resource_name, resource_url, resource_charset,
                resource_allowed_types = parse_userscript.get_userscript_keyword_config_by_name("resource");

            for (var j in settings.resource) {
                // in [0] => name , [1] => url
                one_resource = settings.resource[j].split(/\s+/);
                resource_name = one_resource[0].trim();
                resource_url = one_resource[1].trim();
                // ermöglicht es ein eigenes Charset zu definieren, falls es Probleme gibt
                if (typeof one_resource[2] !== "undefined") {
                    resource_charset = one_resource[2].trim();
                }

                // resource überschreiben! und setzt es auf Null falls nicht genutzt werden kann
                resource_url = type_guess.typeGuess(resource_url, resource_allowed_types.types);

                // Resource nachladen!
                running_promises.push(new Promise(function (resolve) {
                    userscript_handle.loadAndAddExternals("resource", resource_url, resource_name, resource_charset, resolve, function(message){
                        // Bisher keine Fehlerbehandlung
                    });
                }));
            }
        }

        // Verarbeite das @icon
        if (!basic_helper.empty(settings.icon)) {
            var icon_allowed_types = parse_userscript.get_userscript_keyword_config_by_name("icon");

            // icon URL
            var icon_url = type_guess.typeGuess(settings.icon, icon_allowed_types.types);

            // icon nachladen
            running_promises.push(new Promise(function (resolve) {
                userscript_handle.loadAndAddExternals("icon", icon_url, null, null, resolve, function(message){
                        // Bisher keine Fehlerbehandlung
                });
            }));
        }

        // Lade externe Skripte nach, falls vorhanden
        if (!basic_helper.empty(settings.require)) {
            var one_require, require_url,
                require_allowed_types = parse_userscript.get_userscript_keyword_config_by_name("require");

            // da mehrere require Anweisungen erhalten sein können
            for (var require_index in settings.require) {
                one_require = settings.require[require_index];

                // Überprüfe die URL
                require_url = type_guess.typeGuess(one_require, require_allowed_types.types);

                // Nachladen des benötigten Skripts
                running_promises.push(new Promise(function (resolve) {
                    userscript_handle.loadAndAddExternals("require", require_url, null, null, resolve, function(message){
                        // Bisher keine Fehlerbehandlung
                    });
                }));

            }
        }

        // alle Promises abarbeiten, es darf kein Fehler aufgetreten sein!
        Promise.all(running_promises).then(function (answers) {
            // erst jetzt darf es gespeichert werden
            userscript_handle.save();

            // füge das Skript gleich hinzu, damit es ausgeführt werden kann!
            page_injection_helper.add_userscript_to_page(userscript_handle.getData());

            // Benachrichtige den Benutzer über die Speicherung!
            worker.port.emit("USI-BACKEND:get-alert", lang.userscript_was_saved + " -> ID " + userscript_handle.getId());

            // erneuere die Ausgabe!
            worker.port.emit("USI-BACKEND:list-all-scripts", userscript_storage.getAll());

        }, function (e) {
            // Im Fehlerfall
            worker.port.emit("USI-BACKEND:get-alert", lang.userscript_couldnt_saved + " -> ID " + userscript_handle.getId());
        });
        
        return true;
	}
};

if (typeof exports !== "undefined") {
	exports.page_injection_helper = page_injection_helper;
}