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
	,contentScriptFile: [resource_path	+	"libs/jquery-2.2.0.min.js"	// always load jQuery
						,resource_path	+	"helper/basic_helper.js"]		
		// Angular Module!
		.concat(
			// Angular JS 1.4.x Library
			angular_options.getAngularJsJSFiles()
			// Angular JS Mobile Library
			,angular_options.getAngularJsMobileJSFiles()
		,[resource_path + "options/app/angular_functions.js"])
	
	// Stelle eine Möglichkeit zum übersetzen zur Verfügung
	,contentScriptOptions: {language: lang,
		init_storage_data: addon_storage.storage, 
		version: self.version, PreferedLocales: PreferedLocales}
	
	// CSS ausgelagert
	,contentStyleFile: angular_options.getAngularJsMobileCSSFiles()
//	,contentStyleFile: [resource_path + "options/options.css"].concat(angular_options.getAngularJsMobileCSSFiles())
	
	
	/**
	 * Events und Funktionen für die Options Übersicht um die Userscripte zu verwalten
	 * 
	 * @param {type} worker
	 * @returns {void}
	 */
	,onAttach: function (worker) {

		//  @legacy --- nimm die Skript URL und verarbeite Sie weiter
		worker.port.on("USI-BACKEND:new-usi-script_url", function (script_content_response) {
 
			// Versuche das USER Skript herunterzuladen
			// übergib den Rest des Ablaufs als Callback, da der Aufruf nicht Syncron läuft!
			page_injection_helper.load_userscript_by_url(script_content_response.script_url,
				function (user_script_text) {

					// Hier wird das UserScript weiterverarbeitet und gespeichert
					page_injection_helper.check_for_userscript_settings_and_save_it(user_script_text, worker);

				}
			);
		});
		
		//  nimm die Skript URL und verarbeite Sie weiter
		worker.port.on("USI-BACKEND:loadexternal-script_url", function (script_content_response) {

			// Versuche das USER Skript herunterzuladen
			// übergib den Rest des Ablaufs als Callback, da der Aufruf nicht Syncron läuft!
			page_injection_helper.load_userscript_by_url(script_content_response.script_url,
				function (user_script_text) {

					// Hier wird das UserScript weiterverarbeitet und gespeichert
					page_injection_helper.check_for_userscript_settings_and_save_it(user_script_text, worker);

				}
			);
		});

		// hole das User Script direkt aus dem Text
		worker.port.on("USI-BACKEND:new-usi-script_content", function (script_content_response) {

			// Hier wird das UserScript weiterverarbeitet und gespeichert
			page_injection_helper.check_for_userscript_settings_and_save_it(script_content_response.script, worker);

		});
		
		// Wenn dies aufgerufen wird, überschreibe ein vorhandenes Userscript
		worker.port.on("USI-BACKEND:override-same-userscript", function (userscipt_infos){
			
			// Hier wird das UserScript weiterverarbeitet und gespeichert
			page_injection_helper.check_for_userscript_settings_and_save_it(userscipt_infos.userscript, worker, userscipt_infos.id);
			
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