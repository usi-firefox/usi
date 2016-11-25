"use strict"; // Strict Mode aktivieren!

/************************************************************************
 ************************* Page Injection Funktionen! *******************
 ************************************************************************/

/* global require */

// Lade den basic_helper
var basic_helper = basic_helper || require("data/helper/basic_helper").basic_helper,
// Userscript Storage laden
    userscript_storage = userscript_storage || require("lib/storage/userscript").userscript_storage,
// Einstellungsspeicher laden
    preferences = preferences || require("sdk/simple-prefs"),
// PageMod Module laden!
    page_injection = page_injection || require("sdk/page-mod"),
// Userscript Parser laden!
    parse_userscript = parse_userscript || require("lib/parse/parse_userscript").parse_userscript,
// Self init für CFX Tool
    self = self || require("sdk/self"),
// Kompatibilitäts Helfer
    cfx_jpm_helper = require("lib/configuration/cfx_jpm_helper").cfx_jpm_helper,
// Übersetzungsschlüssel bestimmen
    lang = require("lib/configuration/language").lang,
// Page Injection Helfer
    page_injection_helper = require("lib/inject/page_injection_helper").page_injection_helper,
// Speichert die Userscripte
    add_userscript = require("lib/storage/add_userscript").add_userscript,
// Bevorzugte Sprachen
    PreferedLocales = require("sdk/l10n/locale").getPreferedLocales(),
// Resource Path festlegen
    resource_path = cfx_jpm_helper.resource_path(),
    load_resource = require("lib/load/load_resource").load_resource,
// Chrome Path
    chrome_path = cfx_jpm_helper.chrome_path();
		


// Einstellungen!
page_injection.PageMod({
	include: [resource_path + "options.html", chrome_path + "options.html"]
	,contentScriptWhen: 'end'
	,attachTo: ['existing', 'top'] // TODO FF: make blocking policy start before this is run on install
	,contentScriptFile: [
						resource_path	+	"libs/jquery/jquery-2.2.4.min.js"		// always load jQuery
						,resource_path	+	"libs/jquery.loadtemplate/jquery.loadTemplate.js"		// jQuery loadTemplate
						,resource_path	+	"helper/basic_helper.js"
						,resource_path	+	"libs/highlight/highlight.pack.js"
						,resource_path	+	"libs/bootstrap-toggle/bootstrap-toggle.js"

						// Mit Google Closure Compiler erstellte Skripte
//						,resource_path	+	"options/js/build/options.js"

						,resource_path	+	"options/js/controller/download.js"
						,resource_path	+	"options/js/controller/language.js"
						,resource_path	+	"options/js/controller/events/backend_events.js"
						,resource_path	+	"options/js/controller/events/event_manager.js"
						,resource_path	+	"options/js/controller/highlightjs.js"
						,resource_path	+	"options/js/controller/bootstraptoggle.js"
						,resource_path	+	"options/js/controller/userscript/config.js"
						,resource_path	+	"options/js/controller/userscript/overview.js"
						,resource_path	+	"options/js/controller/userscript/edit.js"
						,resource_path	+	"options/js/controller/userscript/list_entry.js"
						,resource_path	+	"options/js/controller/userscript/list.js"
						,resource_path	+	"options/js/controller/userscript/load_external.js"
						,resource_path	+	"options/js/controller/userscript/sync.js"
						,resource_path	+	"options/js/controller/userscript/help.js"
						,resource_path	+	"options/js/controller/manager.js"
						,resource_path	+	"options/js/controller/template.js"
						,resource_path	+	"options/js/controller/events/frontend_events.js"
						,resource_path	+	"options/js/controller/startup.js"
						]
					
	// Stelle eine Möglichkeit zum übersetzen zur Verfügung
	,contentScriptOptions: {
		language: lang
		,version: self.version
		,prefered_locales: PreferedLocales
		,baseurl: resource_path
//		,baseurl: chrome_path
		// CSS Dateien, diese werden per JS im Frontend eingebunden, dadurch wird das CSS Debugging vereinfacht
		,css_files: [
			resource_path + "libs/angularjs-mobile/css/font-awesome.css"
			,resource_path + "libs/angularjs-mobile/css/mobile-angular-ui-base.min.css"
			,resource_path + "libs/angularjs-mobile/css/mobile-angular-ui-desktop.min.css"
			,resource_path + "libs/bootstrap-toggle/bootstrap-toggle.css"
			,resource_path + "options/css/extra.css"
		]
	}
	 	
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
			load_resource.load_userscript_by_url(script_content_response.script_url,
				function (user_script_text) {

					// Hier wird das UserScript weiterverarbeitet und gespeichert
					add_userscript.check_for_userscript_settings_and_save_it(user_script_text, worker, null, null, script_content_response.moreinformations, 

						function(userscript_handle){
							// das Userscript direkt aktivieren
							page_injection_helper.init_page_injection_by_id(userscript_handle.getId());

							// Sende Benachrichtigung, dass eine neues Skript geladen wurde
							worker.port.emit("USI-BACKEND:external-script-is-now-loaded", true);
						});
				}
				// legt das charset fest
				,script_content_response.charset
			);
		});

		worker.port.on("USI-BACKEND:sync-test-login", function (url, user, pass) {
			if (basic_helper.empty(url) || basic_helper.empty(user) || basic_helper.empty(pass)) {
				// mindestens ein Wert nicht gesetzt
				return false;
			}

			var url_c = require("sdk/url");
			// Wenn die URL gültig ist, wird true zurück geliefert
			if (url_c.isValidURI(url) === true) {

				var Request = require("sdk/request").Request;

				try {
					var request_options = {
						url: url
						, headers: {// Damit der Request immer "frisch" ist!
							'Cache-control': 'no-cache'
						}
						, content: {username: user, password: pass}
						, onComplete: function (response) {
							worker.port.emit("USI-BACKEND:sync-test-login-done", {status: response.status, text: response.text});
						}
					};

					// Request mit den zuvor definierten Optionen ausführen
					Request(request_options).post();

				} catch (e) {

				}

			}
		});


		worker.port.on("USI-BACKEND:sync-create-new-account", function (url, user, pass) {
			if (typeof url !== "string") {
				// keine URL
				return false;
			}

			if (typeof user === "undefined") {
				user = "";
			}
			if (typeof pass === "undefined") {
				pass = "";
			}


		});
        
		// hole das User Script direkt aus dem Text
		worker.port.on("USI-BACKEND:new-usi-script_content", function (script_content_response) {

			// Hier wird das UserScript weiterverarbeitet und gespeichert
			add_userscript.check_for_userscript_settings_and_save_it(script_content_response.script, worker, null, null, null, 
			
				function(userscript_handle){
					// das Userscript direkt aktivieren
					page_injection_helper.init_page_injection_by_id(userscript_handle.getId());
				});
		});
		
		// Anfrage für das Beispiel Userscript
		worker.port.on("USI-BACKEND:get-userscript-example", function(language){
			var userscript_example = self.data.load(resource_path + "options/example/" + language + "-example.user.js");
			// Antworten
			worker.port.emit("USI-BACKEND:get-userscript-example-done", userscript_example);
		});
		
		/**
		 * Wrapper Funktion für einfache Optionen (boolean)
		 */
		function changeState (event_name, pref_name){
			/**
			 *  Beispiel
			 *  
			 *	worker.port.emit("USI-BACKEND:options_always_activate_greasemonkey", preferences.prefs.options_always_activate_greasemonkey);
			 *	worker.port.on("USI-BACKEND:options_always_activate_greasemonkey-change", function(state){
			 *		preferences.prefs.options_always_activate_greasemonkey = state;
			 * 	});
			 */
			// Wert wurde von der Options Übersicht geändert
			worker.port.on("USI-BACKEND:" + event_name + "-change", function(state){
				preferences.prefs[pref_name] = state;
			});
		}
		
		function sendState (event_name, pref_name){
			// Daten an die Options Übersicht senden
			worker.port.emit("USI-BACKEND:" + event_name , preferences.prefs[pref_name]);
		}
		
		function getChangeStateEvents(){
			return [
				{
					// Übermittelt den aktuellen Status ob Greasemonkey Funktionen immer aktiviert sind oder nicht
					name: "options_always_activate_greasemonkey"
					,pref_name: "options_always_activate_greasemonkey"
				}
				,{
					// Übermittelt den aktuellen Status wie die Include Regeln verarbeitet werden sollen
					name: "OldUsiIncludeBehavior"
					,pref_name: "OldUsiIncludeBehavior"
				}
				,{
					// Übermittelt den aktuellen Status ob .user.js Dateien importiert werden sollen
					name: "ExternalScriptLoadQuestion"
					,pref_name: "enableExternalScriptLoadQuestion"
				}
				,{
					// Übermittelt den aktuellen Status ob HighlightJS aktiviert ist oder nicht
					name: "highlightjs-activation-state"
					,pref_name: "options_activate_highlightjs"
				}
				,{
					// Highlightjs Style festlegen
					name: "highlightjs-style"
					,pref_name: "hightlightjsstyle"
				}
			];
		}
		
		// registriert alle Change Events
		(function registerChangeStateEvents(){
			var events = getChangeStateEvents();
			for (var i in events){
				changeState(events[i].name, events[i].pref_name);
			}
		}());

		worker.port.on("USI-BACKEND:get-all-changeable-states" , function(){
			var events = getChangeStateEvents();
			for (var i in events){
				sendState(events[i].name, events[i].pref_name);
			}
		});

		
		
		// Wenn dies aufgerufen wird, überschreibe ein vorhandenes Userscript
		worker.port.on("USI-BACKEND:override-same-userscript", function (userscipt_infos){
			
			// Hier wird das UserScript weiterverarbeitet und gespeichert
			add_userscript.check_for_userscript_settings_and_save_it(userscipt_infos.userscript, worker, userscipt_infos.id, null, userscipt_infos.moreinformations,
			function(userscript_handle){
				// das Userscript direkt aktivieren
				page_injection_helper.init_page_injection_by_id(userscript_handle.getId());
			});
		});
        
		// Wenn dies aufgerufen wird, werden die vorhanden Variablen des Userscripts entfernt (val_store)
		worker.port.on("USI-BACKEND:delete-reset-GM-Values-userscript", function (userscipt_id){
			var userscript_handle = userscript_storage.getById(userscipt_id);
			if(userscript_handle !== false){
				// entfernen aller zuvor gesetzten Variablen
				userscript_handle.resetValStore().save();
			}
		});
		
		// Prüft ob die eingebene URL auf eine Include Regel greifen wird
		worker.port.on("USI-BACKEND:test-url-match", function (request) {
			// test_url Helfer
			var test_url = require("lib/testing/test_url").test_url;
			
			// Prüfe die URL und setze das Ergebnis als Status
			var state = test_url.check(request.url , request.id);
			
			// Rückgabe des URL Tests 
			worker.port.emit("USI-BACKEND:test-url-match-" + request.id, state);
		});

		// Schicke alle bisher verfügbaren Skripte! 
		worker.port.on("USI-BACKEND:request-for---list-all-scripts", function () {

			worker.port.emit("USI-BACKEND:list-all-scripts", userscript_storage.getAll());
			
			// Zeige den aktuellen Speicherverbauch an
			worker.port.emit("USI-BACKEND:storage-quota", userscript_storage.getQuota());
		});

		// lösche einen Wert im Speicher
		worker.port.on("USI-BACKEND:delete-script-by-id", function (userscript_id) {

			var userscript_handle = userscript_storage.getById(userscript_id);
			
			// userscript_handle darf nicht false sein
			if(userscript_handle !== false){
				// lösche dieses Element
				userscript_handle.deleteUserscript();
				
				worker.port.emit("USI-BACKEND:delete-script-is-now-deleted", true);

				// PageMod zerstören
				page_injection_helper.destroy_page_mod_by_id(userscript_handle.getId());
			}else{
				// konnte nicht gefunden und daher auch nicht gelöscht werden
				worker.port.emit("USI-BACKEND:delete-script-is-now-deleted", false);
			}
		});

		// liefert die gesetzten Variablen für diesen Userscript Eintrag
		worker.port.on("USI-BACKEND:list-GMValues", function(userscript_id){
			
			var grease = require("lib/inject/GM/greasemonkey_functions").greasemonkey_functions;
			var grease_handler = grease.init(userscript_id);
			
			worker.port.emit("USI-BACKEND:list-GMValues-done-" + userscript_id , convertToText(grease_handler.GM_listValues()));
		});
		
		// Zeige den aktuellen Speicherverbauch an
		worker.port.emit("USI-BACKEND:storage-quota", userscript_storage.getQuota());
		
		// Einzel Export eines Userscripts
		worker.port.on("USI-BACKEND:export-userscript", function(userscript_id){
			var userscript_handler = userscript_storage.getById(userscript_id);
			if(userscript_handler !== false){
				// Zurücksenden des Userscripts
				worker.port.emit("USI-BACKEND:export-userscript-done", 
					{
						userscript: userscript_handler.getUserscriptContent(),
						filename: userscript_handler.getSettings()["name"]
					} );
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

			var all_userscripts = userscript_storage.getAll();
			// Userscript aus dem userscript_storage holen
			for (var i in all_userscripts) {
				if (complete_export === "FALSE") {
					result_export_tmp.push(all_userscripts[i].getUserscriptContent());
				} else {
					result_export_tmp.push(all_userscripts[i]);
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
			// lösche jedes einzelene Userscript...
			userscript_storage.deleteAll();
			
			// lade Page Mod neu!
			page_injection_helper.re_init_page_injection();
		});

		// Schalte um ob das Skript aktiviert oder deaktiviert werden soll
		worker.port.on("USI-BACKEND:toggle-userscript-state", function (userscript_id){
			var userscript_handle = userscript_storage.getById(userscript_id);
			
			if(userscript_handle !== false){
				// wechsele den Status ob das Userscript aktiviert oder deaktiviert ist
				userscript_handle.switchActiveState();
			}
			// lade Page Mod neu!
			
			if(userscript_handle.isDeactivated()){
				// deaktivieren
				page_injection_helper.destroy_page_mod_by_id(userscript_handle.getId());
			}else{
				// aktivieren
				page_injection_helper.init_page_injection_by_id(userscript_handle.getId());
			}
		});

		// Suche in alle Skripten nach der UpdateURL, und prüfe ob es Veränderungen an der Versionsnummer gibt!
		worker.port.on("USI-BACKEND:check-for-userscript-updates", function (){
			// durchlaufe alle Einträge und suche nach einer UpdateURL
			var all_userscripts_handler = userscript_storage.getAndInitAll();
			
			for (var i in all_userscripts_handler){
				
				// Damit im Closure nicht die letzte ID genutzt wird
				// "immediately-invoked function expression or IIFE" Methode 
				(function(userscript_handler){
					// prüfe ob eine UpdateURL gesetzt wurde!
					if(basic_helper.isset(userscript_handler.getSettings()["updateURL"])){
						
						// UpdateURL gefunden, lade es nach!
						load_resource.load_userscript_by_url(userscript_handler.getSettings()["updateURL"], function (loaded_userscipt_text){

							// Konfig suchen und danach die Optionen Parsen...
							var loaded_userscript_settings = parse_userscript.find_settings(loaded_userscipt_text);

							// Prüfe ob die Versionen verschieden sind!
							if(loaded_userscript_settings.version !== userscript_handler.getSettings()["version"]){

								// Frage den Benutzer ob das Skript aktualisiert werden soll!
								worker.port.emit("USI-BACKEND:update-for-userscript-available", {id: userscript_handler.getId(), userscript: loaded_userscipt_text});

							}

						});
					}
				// Direkt ausführen
				})(all_userscripts_handler[i]);
			}
			
		});

	}
	

});


/**
 * Funktion zum umwandeln von Objekten in Strings
 * 
 * http://stackoverflow.com/a/18368918
 * Source http://jsfiddle.net/numoccpk/1/
 * 
 * @param {mixed} obj
 * @returns {String}
 */
function convertToText(obj) {
    //create an array that will later be joined into a string.
    var string = [];

    //is object
    //    Both arrays and objects seem to return "object"
    //    when typeof(obj) is applied to them. So instead
    //    I am checking to see if they have the property
    //    join, which normal objects don't have but
    //    arrays do.
	if (obj === "undefined") {
		return String(obj);
	} else if (typeof (obj) === "object" && (obj.join === "undefined")) {
		for (var prop in obj) {
			if (obj.hasOwnProperty(prop)){
				string.push(prop + ": " + convertToText(obj[prop]));
			}
		}
		return "{" + string.join(",") + "}";

		//is array
	} else if (typeof (obj) === "object" && !(obj.join === "undefined")) {
		for (var prop in obj) {
			string.push(convertToText(obj[prop]));
		}
		return "[" + string.join(",") + "]";

		//is function
	} else if (typeof (obj) === "function") {
		string.push(obj.toString());

		//all other values can be done with JSON.stringify
	} else {
		string.push(JSON.stringify(obj));
	}

    return string.join(",");
}
 
