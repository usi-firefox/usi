"use strict"; // Strict Mode aktivieren!

/************************************************************************
 ************************* Page Injection Funktionen! *******************
 ************************************************************************/

/* global exports,require */

// Lade den basic_helper
var basic_helper = basic_helper || require("./basic_helper").basic_helper,
// Storage laden
addon_storage = addon_storage || require("sdk/simple-storage"),
// Einstellungsspeicher laden
preferences = preferences || require("sdk/simple-prefs"),
// hierrin werden alle Page Injections gesammelt ...
all_page_injections = all_page_injections || [],
// PageMod Module laden!
page_injection = page_injection || require("sdk/page-mod"),
// Userscript Parser laden!
parse_userscript = parse_userscript || require("./parse_userscript").parse_userscript,
// Self init für CFX Tool
self = self || require("sdk/self"),
 
// Kompatibilitäts Helfer
cfx_jpm_helper = require("./cfx_jpm_helper").cfx_jpm_helper,
// Übersetzungsschlüssel bestimmen
lang = require("./language").lang,

// Angular Options Controller
angular_options = require("./angular_options").angular_options,

// Bevorzugte Sprachen
PreferedLocales = require("sdk/l10n/locale").getPreferedLocales(),
// Resource Path festlegen
resource_path = cfx_jpm_helper.resource_path();
 
var page_injection_helper = {
	
/**
 * Events und Funktionen für die Options Übersicht um die Userscripte zu verwalten
 * 
 * @param {type} worker
 * @returns {void}
 */
 option_functions : function (worker) {

		//  @legacy --- nimm die Skript URL und verarbeite Sie weiter
		worker.port.on("USI-BACKEND:new-usi-script_url", function (script_content_response) {
 
			// Versuche das USER Skript herunterzuladen
			// übergib den Rest des Ablaufs als Callback, da der Aufruf nicht Syncron läuft!
			load_userscript_by_url(script_content_response.script_url,
				function (user_script_text) {

					// Hier wird das UserScript weiterverarbeitet und gespeichert
					check_for_userscript_settings_and_save_it(user_script_text, worker);

				}
			);
		});
		
		//  nimm die Skript URL und verarbeite Sie weiter
		worker.port.on("USI-BACKEND:loadexternal-script_url", function (script_content_response) {

			// Versuche das USER Skript herunterzuladen
			// übergib den Rest des Ablaufs als Callback, da der Aufruf nicht Syncron läuft!
			load_userscript_by_url(script_content_response.script_url,
				function (user_script_text) {

					// Hier wird das UserScript weiterverarbeitet und gespeichert
					check_for_userscript_settings_and_save_it(user_script_text, worker);

				}
			);
		});

		// hole das User Script direkt aus dem Text
		worker.port.on("USI-BACKEND:new-usi-script_content", function (script_content_response) {

			// Hier wird das UserScript weiterverarbeitet und gespeichert
			check_for_userscript_settings_and_save_it(script_content_response.script, worker);

		});
		
		// Wenn dies aufgerufen wird, überschreibe ein vorhandenes Userscript
		worker.port.on("USI-BACKEND:override-same-userscript", function (userscipt_infos){
			
			// Hier wird das UserScript weiterverarbeitet und gespeichert
			check_for_userscript_settings_and_save_it(userscipt_infos.userscript, worker, userscipt_infos.id);
			
		});
		

		// Schicke alle bisher verfügbaren Skripte! 
		worker.port.on("USI-BACKEND:request-for---list-all-scripts", function () {

			worker.port.emit("USI-BACKEND:list-all-scripts", addon_storage.storage);
			
			// Zeige den aktuellen Speicherverbauch an
			worker.port.emit("USI-BACKEND:storage-quota", addon_storage.quotaUsage);
		});

		// lösche einen Wert im Speicher
		worker.port.on("USI-BACKEND:delete-script-by-id", function (key) {

			// Wert darf nicht leer sein, und muss existieren
			if (key != "" && basic_helper.isset(addon_storage.storage[key])) {

				// lösche dieses Element
				delete addon_storage.storage[key];

				// check für das content script
				if (!basic_helper.isset(addon_storage.storage[key])) {
					worker.port.emit("USI-BACKEND:delete-script-is-now-deleted", true);
					
					// lade Page Mod neu!
					re_init_page_injection();
				} else {
					worker.port.emit("USI-BACKEND:delete-script-is-now-deleted", false);
				}
			}
		});

		// Zeige den aktuellen Speicherverbauch an
		worker.port.emit("USI-BACKEND:storage-quota", addon_storage.quotaUsage);

		//löscht sämtliche Einstellungen von USI!
		worker.port.on("USI-BACKEND:delete-everything", function () {
			// lösche die Kompletten Einstellungen im "addon_storage.storage"
			// lösche jeden einzelnen Wert...
			for (var i in addon_storage.storage) {
				delete addon_storage.storage[i];
			}
			
			// lade Page Mod neu!
			re_init_page_injection();
		});

		// Schalte um ob das Skript aktiviert oder deaktiviert werden soll
		worker.port.on("USI-BACKEND:toggle-userscript-state", function (script_id){

			// wenn das Skript deaktiviert war, dann aktiviere es jetzt wieder
			if(addon_storage.storage[script_id].deactivated === true){
				addon_storage.storage[script_id].deactivated = false;
			}else{
				//deaktiviere das Skript nun!
				addon_storage.storage[script_id].deactivated = true;
			}
			
			// lade Page Mod neu!
			re_init_page_injection();
		});

		// Suche in alle Skripten nach der UpdateURL, und prüfe ob es Veränderungen an der Versionsnummer gibt!
		worker.port.on("USI-BACKEND:check-for-userscript-updates", function (){
			// durchlaufe alle Einträge und suche nach einer UpdateURL
			for (var id in addon_storage.storage){
				
				// prüfe ob eine UpdateURL gesetzt wurde!
				if(basic_helper.isset(addon_storage.storage[id].settings.updateURL)){
					
					// Damit im Closure nicht die letzte ID genutzt wird
					// "immediately-invoked function expression or IIFE" Methode 
					(function(actual_script_id, loaded_script_version){
						
						// UpdateURL gefunden, lade es nach!
						load_userscript_by_url(addon_storage.storage[actual_script_id].settings.updateURL, function (userscipt_text){

							// Konfig suchen und danach die Optionen Parsen...
							var userscript_settings = parse_userscript.find_settings(userscipt_text);

							// Prüfe ob die Versionen verschieden sind!
							if(userscript_settings.version !== loaded_script_version){

								// Frage den Benutzer ob das Skript aktualisiert werden soll!
								worker.port.emit("USI-BACKEND:update-for-userscript-available", {id: actual_script_id, userscript: userscipt_text});

							}

						});
					// Damit im Closure nicht die letzte ID genutzt wird
					// aktuelle ID und Versionsnummer
					})(id, addon_storage.storage[id].settings.version);
				}
			}
			
		});

	}
	
};

// Einstellungen!
page_injection.PageMod({
	include: resource_path + "options/options.html"
	,contentScriptWhen: 'end'
	,attachTo: ['existing', 'top'] // TODO FF: make blocking policy start before this is run on install
	,contentScriptFile: [resource_path	+	"libs/jquery-2.2.0.min.js"	// always load jQuery
						,resource_path + "helper/basic_helper.js"]		
		// Angular Module!
		.concat(
			// Angular JS 1.4.x Library
			angular_options.getAngularJsJSFiles()
			// Angular JS Mobile Library
			,angular_options.getAngularJsMobileJSFiles()
		,[resource_path + "options/app/angular_functions.js"])
	
	// Stelle eine Möglichkeit zum übersetzen zur Verfügung
	,contentScriptOptions: {language: lang, init_storage_data: addon_storage.storage, version: self.version, PreferedLocales: PreferedLocales}
	
	// CSS ausgelagert
	,contentStyleFile: angular_options.getAngularJsMobileCSSFiles()
//	,contentStyleFile: [resource_path + "options/options.css"].concat(angular_options.getAngularJsMobileCSSFiles())
	
	// ausgelagert für bessere Übersicht
	,onAttach: page_injection_helper.option_functions

});



// Horche auf User Scripte die aufgerufen wurden!
	page_injection.PageMod({
		include: /.*\.user\.js/,
		contentScriptWhen: 'end',
		attachTo: ['existing', 'top'], // TODO FF: make blocking policy start before this is run on install
		contentScriptFile: resource_path + "userscript-get.js",
		// Dürfen externe UserScripte direkt importiert werden? -> preferences.prefs.enableExternalScriptLoadQuestion
		contentScriptOptions: {language: lang},
		
		onAttach: function (worker) {
			
			// sendet den Status zurück
			worker.port.emit("USI-BACKEND:active", preferences.prefs.enableExternalScriptLoadQuestion);
			
			//  nimm die Skript URL und verarbeite Sie weiter
			worker.port.on("USI-BACKEND:new-usi-script_url---call", function (script_content_response) {

				// Versuche das USER Skript herunterzuladen
				// übergib den Rest des Ablaufs!, da der Aufruf nicht Syncron läuft!
				load_userscript_by_url(script_content_response.script_url,
						function (user_script_text) {
							// Hier wird das UserScript weiterverarbeitet und gespeichert
							check_for_userscript_settings_and_save_it(user_script_text, worker);
						}
				);
			});
			
			
		// Wenn dies aufgerufen wird, überschreibe ein vorhandenes Userscript
		worker.port.on("USI-BACKEND:override-same-userscript", function (userscipt_infos){
			
			// Hier wird das UserScript weiterverarbeitet und gespeichert
			check_for_userscript_settings_and_save_it(userscipt_infos.userscript, worker, userscipt_infos.id);
			
		});
		
		}
	});

/************************************************************************
 ************************* Injection Bereich! ***************************
 ************************************************************************/


/**
 * Führe diese Funktion aus damit der Injection Bereich neu geladen werden kann!
 * @returns {void}
 */ 
function re_init_page_injection(){

	// entferne alle Userscripts die zuvor geladen wurden!
	for (var i in all_page_injections){
		//prüfe zunächst ob es solch eine Funktion gibt!
		if(basic_helper.isset(all_page_injections[i].destroy)){
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
		add_userscript_to_page(addon_storage.storage[i]);

	}
	
}

/**
 * 
 * Fügt ein Userscript in eine Seite ein!
 * @param {object} userscript_entry
 * @returns {void}
 */
function add_userscript_to_page(userscript_entry) {

	// URL/Includes darf natürlich nicht leer sein!
	if (!basic_helper.empty(userscript_entry.settings.include) && 
			(typeof userscript_entry.deactivated === "undefined" || userscript_entry.deactivated === false)) { // nur wenn das skript nicht deaktiviert wurde!
 
		// alle Includes des Skripts laden
		var script_settings = userscript_entry.settings;
		
		// die Includes könnten auch nur aus einem Aufruf bestehen!
		if (basic_helper.is_string(script_settings.include)) {
			//Wandle den String in ein einfaches Array um....
			script_settings.include = [script_settings.include];
		}

		// Prüfung ob es ein Array ist
		if (script_settings.include.length > 0) {
			// für die Übergabe an den PageMod aufruf
			var result_includes = [];
 
			// Durchlaufe alle Einträge
			for (var j in script_settings.include) {

				// aktuelle script_include_url
				var script_include_url = script_settings.include[j];

				// Wenn in dem String ein * vorkommt, ersetze alle Sternchen und erstelle einen Regulären Ausdruck
				// Ansonsten nimm einfach den String, und setze ihn so ein!
				/*******************************************
				 * DIESER WEG WIRD NICHT EMPFOHLEN!!! ******
				 *******************************************/
				if (script_include_url.indexOf("*") === -1) {
					// kein Stern gefunden, nimm es als String

					// Setze einfach nur den String ins Array!
					result_includes.push(script_include_url);
				} else {
					// mindestens ein Stern gefunden!

					// Neu ab Version 0.2.0-j, wenn es true gesetzt ist wird nichts umgeparst
					if(script_settings["clean-include"] !== "true"){

						// ersetze doppelte *, falls nötig...
						var test_include_url = parse_userscript.replace_wildcards_in_url(script_include_url);

						// erstelle daraus nun einen Regulären Ausdruck zum suchen!
						var test_include_url_regex = new RegExp(test_include_url);

						// dieses Array wird dann dem PageMod übergeben
						result_includes.push(test_include_url_regex);
						
					}else{

						// Setze einfach nur den String ins Array!
						result_includes.push(script_include_url);
					}
				}


			}

		} else {

			// das dürfte nie auftreten!
			throw new {code: 100, text: _("exception_100"), content: script_settings.include};
		}

		// src: https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/page-worker
		
		var userscript_load_when = false;
		// Entscheide wann das Userscript geladen werden soll, anhand von @run-at
		switch(script_settings["run-at"]){
			
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

		// Setze die Einstellungen für den PageMod Aufruf!
		var page_injection_object = {
				include: result_includes,
				contentScriptWhen: userscript_load_when,
				attachTo: ['existing', 'top'],
				contentScript: userscript_entry.userscript
//                                contentScriptOptions: userscript_entry.options || {} 
			};
		
		// init array
		page_injection_object.contentScriptFile		= [];
		// Wenn jQuery gefordert ist muss das page_injection_object angepasst werden!
		if (script_settings["include-jquery"] == "true") {
			page_injection_object.contentScriptFile.push(resource_path + "libs/jquery-2.2.0.min.js");
		}
		
		// Wenn jQuery gefordert ist muss das page_injection_object angepasst werden!
		if (script_settings["use-greasemonkey"] == "true") {
			// init JSON
			page_injection_object.contentScriptOptions	= {};

			// übergibt den val_store in die Storage Variable
			page_injection_object.contentScriptOptions.storage	=	userscript_entry.val_store;
			page_injection_object.contentScriptOptions.id		=	userscript_entry.id;

			// ermögliche der Webseite den Zugriff auf die Greasemonkey-Frontend Funktionen
			page_injection_object.contentScriptFile.push( resource_path + "helper/GM_Frontend.js");
			
			// Init Greasemonkey-Backend API
			var grease			=	require("./greasemonkey_functions").greasemonkey_functions;
			// Handler für dieses Skript
			var grease_handler	=	grease.init(userscript_entry.id);
			
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
					// Prüf-Variable damit es nicht zu einer "unendlichen" Rekursion kommt
					var not_wildcard_pagemod = true;
					for(var i in userscript_entry.include){
						if (userscript_entry.include[i] === "*"){
							// Wildcard Eintrag gefunden, open in Tab ist nicht möglich!
							not_wildcard_pagemod = false;
						}
					}
					// im neuen Tab öffnen, aber nur wenn das Userscript nicht für Wildcard Aufrufe genutzt wird!!!!
					if(not_wildcard_pagemod === true){
						try {
							var open_in_background;
                            if (value_pair.open_in_background === "true" || value_pair.open_in_background === true) {
                                open_in_background = true;
                            } else {
                                open_in_background = false;
                            }
                            require("sdk/tabs").open({url: value_pair.url, inBackground: open_in_background});
						} catch (ex) {}
					}
				});
				
				// xmlhttpRequest call
				worker.port.on("USI-BACKEND:GM_xmlhttpRequest", function (details) {

					// Init der XMLHttpRequest Funktion
					var xhr = require("sdk/net/xhr").XMLHttpRequest();

					/**
					 * (2016-02-11)		https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
					 *	mozAnon
					 *		Boolean: Setting this flag to true will cause the browser not to expose the origin and user credentials 
					 *		when fetching resources. Most important, this means that cookies will not be sent unless
					 *		explicitly added using setRequestHeader.
					 * 
					 *	mozSystem
					 *	Boolean: Setting this flag to true allows making cross-site connections 
					 *	without requiring the server to opt-in using CORS. Requires setting mozAnon: true, 
					 *	i.e. this can't be combined with sending cookies or other user credentials. 
					 *	This only works in privileged (reviewed) apps; it does not work on arbitrary webpages loaded in Firefox. 
					 */

					// Muss true sein, sonst wird mozSystem nicht akzeptiert
//					xhr.mozAnon = true;
					// If true, the same origin policy will not be enforced on the request.
//					xhr.mozSystem = true;

					// Nicht unterstützte Optionen
					var unsupported_options = ["context", "upload"];

					// Header
					if (details.headers && typeof details.headers === "object") {
						// Keys auslesen
						var header_keys = Object.keys(details.headers);
						
						for (var i in header_keys) {
							// Headers bei Bedarf setzen
							xhr.setRequestHeader(header_keys[i], details.headers[header_keys[i]]);
						}
					}

					// Wenn timeout angegeben ist, ansonsten 0
					if (typeof details.timeout === "number") {
						xhr.timeout = details.timeout;
					}

					// MimeType überschreiben
					if (details.overrideMimeType && typeof details.overrideMimeType === "string") {
						// keine Plausibilitätsprüfung
						xhr.overrideMimeType(details.overrideMimeType);
					}

					/******************
					 * EVENTS - START *
					 ******************/

					// Abort
					if (details.onabort && typeof details.onabort === "function") {
						xhr.onabort = details.onabort;
					}
					// Error
					if (details.onerror && typeof details.onerror === "function") {
						xhr.onerror = details.onerror;
					}
					// Load
					if (details.onload && typeof details.onload === "function") {
						xhr.onload = details.onload;
					}
					// Progress
					if (details.onprogress && typeof details.onprogress === "function") {
						xhr.onprogress = details.onprogress;
					}
					// ReadyStateChange
					if (details.onreadystatechange && typeof details.onreadystatechange === "function") {
						xhr.onreadystatechange = details.onreadystatechange;
					}
					// Timeout
					if (details.ontimeout && typeof details.ontimeout === "function") {
						xhr.ontimeout = details.ontimeout;
					}

					/****************
					 * EVENTS - END *
					 ****************/


					var method;
					// Wenn method gesetzt wurde
					if (details.method && typeof details.method === "string") {
						// immer Großschreiben! Wenn möglich
						if(typeof details.method.toUpperCase === "function"){
							method = details.method.toUpperCase();
						}else{
							method = details.method;
						}
					} else {
						// Falls keine Methode angegeben wurde!
						method = "GET";
					}


					// URL setzen
					var url;
					if (typeof details.url === "string") {
						// @todo URI Type prüfen
//						if(usiOptions.allow_other_uri_types === true){

//						}

						url = details.url;

					} else {
						throw {err_code: 551, err_text: "GM_xmlhttpRequest-> URL is not a string"};
					}

					// Username, Passwort setzen
					var user = (typeof details.user === "string") ? details.user : "";
					var synchronous = (typeof details.synchronous === "boolean") ? details.synchronous : true;
					var pass = (typeof details.password === "string") ? details.password : "";

					// Xhr Optionen setzen
					xhr.open(method, url, synchronous, user, pass);


					/******************************************
					 * Senden, normal oder als binär Variante *
					 ******************************************/
					// Wenn Daten mit übergeben falls vorhanden
					var data = details.data ? details.data : null;

					// als Binary senden, wenn data gesetzt ist
					if (details.binary && (data !== null)) {
						var dataData = new Uint8Array(data.length);
						for (var i = 0; i < data.length; i++) {
							dataData[i] = data.charCodeAt(i) & 0xff;
						}
						// sendAsBinary() ist deprecated seit 
						xhr.send(new Blob([dataData]));
					} else {
						// Standard Variante, also KEINE Binary übergabe!
						xhr.send(data);
					}

				});
				
				// in die Zwischenablage schreiben!
				worker.port.on("USI-BACKEND:GM_setClipboard", function (text) {
					try {
						var clipboard = require("sdk/clipboard");

						// Unter Android - Fennec unterstützt dies wohl bisher nicht ...
						if(typeof clipboard.set === "function"){
							// falls es kein String ist, versuche es umzuwandeln
							if(typeof text !== "string" && typeof text.toString !== "function"){
								text = text.toString();
							}
							// setze es nur in die Zwischenablage wenn es wirklich ein String ist...
							if(typeof text === "string"){
								clipboard.set(text);
							}
						} 
					// nichts...
					} catch(ex) {}
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
function check_for_userscript_settings_and_save_it(userscript, worker, override_userscript_id) {

	// Konfig suchen und danach die Optionen Parsen...
	var userscript_settings = parse_userscript.find_settings(userscript);
	
	// Prüfe ob kein Fehler enthalten ist!
	if (basic_helper.isset(userscript_settings.error_message)) {
		// es wurde ein Fehler in der Konfiguration gefunden, melde es nun dem Benutzer!
		worker.port.emit("USI-BACKEND:show-error", _("error_userscript_settings") + userscript_settings.error_message);

		return false;
	} else {
		
		// für den späteren Check notwendig
		var old_userscript_was_found = 0;

		// Wenn keine Override ID angegeben wurde, suche nach gleichem Skript
		if(!basic_helper.isset(override_userscript_id)){
			
			/********************************************************************************************************************************************
			 * Dieser Weg wird für neue Skripte verwendet, aber gleichzeitig wird auch geprüft ob schon gleiche Skripte existieren! *********************
			 *********************************************************************************************************************************************/

			// Prüfe ob das Skript bereits existiert, und wenn ja frage ob es aktualisiert werden soll!
			for(var index in addon_storage.storage){
				if(addon_storage.storage[index].settings.name == userscript_settings.name // Namen sind identisch
					&& addon_storage.storage[index].settings.namespace == userscript_settings.namespace // Namespace ist identisch
					&& addon_storage.storage[index].settings.author == userscript_settings.author // Author ist identisch
					&& addon_storage.storage[index].settings.updateURL == userscript_settings.updateURL // updateURL ist identisch
					&& addon_storage.storage[index].settings.downloadURL == userscript_settings.downloadURL){ // downloadURL ist identisch

					// Es wurde ein Userscript gefunden, soll es aktualisiert werden?
					worker.port.emit("USI-BACKEND:same-userscript-was-found", {id : index, userscript: userscript});

					// Erhöhe den Zähler! theoretisch könnten mehrere gleiche skripte vorhanden sein
					old_userscript_was_found++;
				}
			}
			
			// Datum als ID ... @TODO
			var id = new Date().getTime();
			
		}else{
			/****************************************************************************************************************
			 * Dieser Weg wird nur für Skripte genutzt, die aktualisiert werden und bereits existieren! *********************
			 ****************************************************************************************************************/
			// es wurde eine ID zum überschreiben mitgelierfert!
			var id = override_userscript_id;
			
		}
		
		// Speichere nun das Skript ab!
		if(old_userscript_was_found == 0){
						
			// speichere dieses Skript && und schalte es gleich auf aktiviert!
			speichere_in_storage(id, {id: id, userscript: userscript, settings: userscript_settings, deactivated: false});
			
			// darf nicht false sein, es wird sonst eine ID geliefert
			if (id !== false) {
				// füge das Skript gleich hinzu, damit es ausgeführt werden kann!
				add_userscript_to_page(addon_storage.storage[id]);

				// Reset ...
				id = override_userscript_id = userscript_settings = null;

				// erneuere die Ausgabe!
				worker.port.emit("USI-BACKEND:list-all-scripts", addon_storage.storage);
			}

			return true;
		}else{
			// es wurde mindestens ein Skript gefunden, welches die gleichen einstellungen besitzt
			
			return false;
		}

	}
}

/**
 * Holt externe Skripte
 * @param {string} url_str
 * @param {function} callback
 * @returns {Boolean}
 */
function load_userscript_by_url(url_str, callback) {

	// Nur wenn am Ende der URL ein .user.js steht!
	if (/\.user\.\js$/.test(url_str)) {

		var Request = require("sdk/request").Request;

		Request({
			url: url_str,
			headers: { // Damit der Request immer "frisch" ist!
				'Cache-control': 'no-cache'
			 },
			onComplete: function (response) {
				// nur wenn es auch erfolgreich war!
				if(response.status === 200 && response.statusText === "OK"){
					
					// Rückgabe des Response Textes
					var user_script_text = response.text;

					// Führe den Rest der Funktionen aus, die übergeben wurden!
					callback(user_script_text);

				}
			}
		}).get();
		
		// zur Sicherheit zurücksetzen
		Request = null;

		return true;
		
	} else {
		return false;
	}
}

/************************************************************************
 ************************* URL Funktionen! *************************
 ************************************************************************/





/************************************************************************
 ************************* Speicher Funktionen! *************************
 ************************************************************************/

/**
 * Setze die Einstellungen in den Storage 
 * @param {string} key
 * @param {mixed} value
 * @returns {void}
 */
function speichere_in_storage(key, value) {
	// Den Wert speichern!
	addon_storage.storage[key] = value;
}



// führe die Page Injection durch!
re_init_page_injection();



if(typeof exports !== "undefined"){
	exports.page_injection_helper = page_injection_helper;
}