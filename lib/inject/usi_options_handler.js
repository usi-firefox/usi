"use strict"; // Strict Mode aktivieren!

/************************************************************************
 ************************* Page Injection Funktionen! *******************
 ************************************************************************/

/* global require */

// Lade den basic_helper
var basic_helper = basic_helper || require("../core/basic_helper").basic_helper,
// Storage laden
addon_storage = addon_storage || require("sdk/simple-storage"),
// Einstellungsspeicher laden
preferences = preferences || require("sdk/simple-prefs"),
// PageMod Module laden!
page_injection = page_injection || require("sdk/page-mod"),
// Userscript Parser laden!
parse_userscript = parse_userscript || require("../parse/parse_userscript").parse_userscript,
// Self init für CFX Tool
self = self || require("sdk/self"),
 
// Kompatibilitäts Helfer
cfx_jpm_helper = require("../configuration/cfx_jpm_helper").cfx_jpm_helper,
// Übersetzungsschlüssel bestimmen
lang = require("../configuration/language").lang,

// Angular Options Controller
angular_options = require("../options/angular_options").angular_options,
// Page Injection Helfer
page_injection_helper = require("../inject/page_injection_helper").page_injection_helper,

// Bevorzugte Sprachen
PreferedLocales = require("sdk/l10n/locale").getPreferedLocales(),
// Resource Path festlegen
resource_path = cfx_jpm_helper.resource_path();



// Einstellungen!
page_injection.PageMod({
	include: resource_path + "options/options.html"
	,contentScriptWhen: 'end'
	,attachTo: ['existing', 'top'] // TODO FF: make blocking policy start before this is run on install
	,contentScriptFile: [resource_path	+	"libs/pleasewait/please-wait.min.js"	// PleaseWait.js
						,resource_path	+	"options/app/pleasewait_init.js"	// PleaseWait.js Initialiserung
						,resource_path	+	"libs/jquery-2.2.3.min.js"	// always load jQuery
						,resource_path	+	"helper/basic_helper.js"
						,resource_path	+	"libs/highlight/highlight.pack.js"]		
		// Angular Module!
		.concat(
			// Angular JS 1.4.x Library
			angular_options.getAngularJsJSFiles()
			// Angular JS Mobile Library
			,angular_options.getAngularJsMobileJSFiles()
			// Angular Frontend Controller - Options
		,[resource_path + "options/app/angular_functions.js"])
	
	// Stelle eine Möglichkeit zum übersetzen zur Verfügung
	,contentScriptOptions: {
		language: lang
		,init_storage_data: addon_storage.storage
		,version: self.version
		,PreferedLocales: PreferedLocales
	}
	
	// CSS ausgelagert
	,contentStyleFile: [resource_path + "options/css/extra.css", resource_path + "libs/pleasewait/please-wait.css"]
			.concat(angular_options.getAngularJsMobileCSSFiles())
	
	/**
	 * Events und Funktionen für die Options Übersicht um die Userscripte zu verwalten
	 * 
	 * @param {type} worker
	 * @returns {void}
	 */
	,onAttach: function (worker) {

		//  nimm die Skript URL und verarbeite Sie weiter
		worker.port.on("USI-BACKEND:loadexternal-script_url", function (script_content_response) {

			// Versuche das USER Skript herunterzuladen
			// übergib den Rest des Ablaufs als Callback, da der Aufruf nicht Syncron läuft!
			page_injection_helper.load_userscript_by_url(script_content_response.script_url,
				function (user_script_text) {

					// Hier wird das UserScript weiterverarbeitet und gespeichert
					var check_if_userscript_is_added = page_injection_helper.check_for_userscript_settings_and_save_it(user_script_text, worker);

					// Sende Benachrichtigung, dass eine neues Skript geladen wurde
					if(check_if_userscript_is_added === true){
						
						worker.port.emit("USI-BACKEND:external-script-is-now-loaded", true);
					}
				}
			);
		});

		// hole das User Script direkt aus dem Text
		worker.port.on("USI-BACKEND:new-usi-script_content", function (script_content_response) {

			// Hier wird das UserScript weiterverarbeitet und gespeichert
			page_injection_helper.check_for_userscript_settings_and_save_it(script_content_response.script, worker);

		});
		
		// Anfrage für das Beispiel Userscript
		worker.port.on("USI-BACKEND:get-userscript-example", function(language){
			var userscript_example = self.data.load(resource_path + "options/example/" + language + "-example.user.js");
			// Antworten
			worker.port.emit("USI-BACKEND:get-userscript-example-done", userscript_example);
		});
		
		// Highlightjs Style festlegen
		worker.port.emit("USI-BACKEND:highlightjs-style", preferences.prefs.hightlightjsstyle);
		worker.port.on	("USI-BACKEND:highlightjs-style-set", function(style){
			// Style setzen
			preferences.prefs.hightlightjsstyle = style;
			// und nochmal zurückschicken!
			worker.port.emit("USI-BACKEND:highlightjs-style", preferences.prefs.hightlightjsstyle);
		});
		
		// Wenn dies aufgerufen wird, überschreibe ein vorhandenes Userscript
		worker.port.on("USI-BACKEND:override-same-userscript", function (userscipt_infos){
			
			// Hier wird das UserScript weiterverarbeitet und gespeichert
			page_injection_helper.check_for_userscript_settings_and_save_it(userscipt_infos.userscript, worker, userscipt_infos.id);
			
		});
		
		// Prüft ob die eingebene URL auf eine Include Regel greifen wird
		worker.port.on("USI-BACKEND:test-url-match", function (request) {
			// test_url Helfer
			var test_url = require("../core/test_url").test_url;
			
			// Prüfe die URL und setze das Ergebnis als Status
			var state = test_url.check(request.url , request.id);
			
			// Rückgabe des URL Tests 
			worker.port.emit("USI-BACKEND:test-url-match-" + request.id, state);
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
					page_injection_helper.re_init_page_injection();
				} else {
					worker.port.emit("USI-BACKEND:delete-script-is-now-deleted", false);
				}
			}
		});

		// Zeige den aktuellen Speicherverbauch an
		worker.port.emit("USI-BACKEND:storage-quota", addon_storage.quotaUsage);
		
		// Einzel Export eines Userscripts
		worker.port.on("USI-BACKEND:export-userscript", function(userscript_id){
			if(!basic_helper.empty(addon_storage.storage[userscript_id])){
				// Zurücksenden des Userscripts
				worker.port.emit("USI-BACKEND:export-userscript-done", 
					{userscript: addon_storage.storage[userscript_id].userscript,
						filename: addon_storage.storage[userscript_id].settings.name} );
			}
		});
		
		// exportiere alle Userscripte
		worker.port.on("USI-BACKEND:get-all-userscripts-for-export", function (complete_export) {
			var result_export = "";
			var result_export_tmp = [];
			var separator = "//*******************USI-EXPORT*************************//\n";

			var date_obj = new Date();

			var export_date = [date_obj.getFullYear(),
				date_obj.getMonth(),
				date_obj.getDate(),
				"-",
				date_obj.getHours(),
				date_obj.getMinutes()].join("-");

			// Hinweis darauf ob alles exportiert wurde und lediglich die Userscripte
			// ---> complete_export

			var infos = ["USI-EXPORT", "VERSION:0.2", "DATE:" + export_date, "COMPLETE:" + complete_export];
			// infos hinzufügen
			for (var i in infos) {
				result_export += "//" + infos[i] + "\n";
			}

			// Trenner hinzufügen
			result_export += separator + separator + separator;

			// Userscript aus dem Addon.storage holen
			for (var i in addon_storage.storage) {
				if (complete_export === "FALSE") {
					result_export_tmp.push(addon_storage.storage[i].userscript);
				} else {
					result_export_tmp.push(addon_storage.storage[i]);
				}
			}

			if (result_export_tmp.length > 0) {
				if (complete_export === "FALSE") {
					result_export += result_export_tmp.join("\n" + separator);
				} else {
					result_export += JSON.stringify(result_export_tmp);
				}

				worker.port.emit("USI-BACKEND:get-all-userscripts-for-export-done", result_export);

			} else {
				// Kein Userscript für den Export vorhanden
			}
		});

		//löscht sämtliche Einstellungen von USI!
		worker.port.on("USI-BACKEND:delete-everything", function () {
			// lösche die Kompletten Einstellungen im "addon_storage.storage"
			// lösche jeden einzelnen Wert...
			for (var i in addon_storage.storage) {
				delete addon_storage.storage[i];
			}
			
			// lade Page Mod neu!
			page_injection_helper.re_init_page_injection();
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
			page_injection_helper.re_init_page_injection();
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
						page_injection_helper.load_userscript_by_url(addon_storage.storage[actual_script_id].settings.updateURL, function (userscipt_text){

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
	

});