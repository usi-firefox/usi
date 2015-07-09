"use strict"; // Strict Mode aktivieren!
/************************************************************************
 ************************* Init Bereich! ********************************
 ************************************************************************/

/* global require */

/*********************************************************
 * Übersetzung für options_content.js ********************
 * *******************************************************/
var lang_options_content = ["empty_userscript_url",
"same_userscript_was_found_ask_update_it_1",
"same_userscript_was_found_ask_update_it_2",
"yes",
"no",
"not_set",
"want_to_delete_this_userscript_1",
"want_to_delete_this_userscript_2",
"delete_x",
"change",
"show_hide",
"activate_deactivate",
"actual_used_quota",
"userscript_was_successful_deleted",
"userscript_could_not_deleted",
"really_reset_all_settings",
"really_really_reset_all_settings",
"userscript_update_was_found_1",
"userscript_update_was_found_2"];

// Language
var _ = require("sdk/l10n").get;

var lang = {}, key;
for (var i in lang_options_content){
	key = lang_options_content[i];
	lang[key] = _(key);
}
// leeren
lang_options_content = key = null;

// Lade den basic_helper
var basic_helper = require("./basic_helper.js").basic_helper;

// Storage laden
var addon_storage = require("sdk/simple-storage");
// Prüfe das kein Speicherüberlauf stattfindet!
addon_storage.on("OverQuota", function () {
	
});

// Einstellungsspeicher laden
var preferences = require("sdk/simple-prefs");

// hierrin werden alle Page Injections gesammelt ...
var all_page_injections = [];

// PageMod Module laden!
var page_injection = require("sdk/page-mod");

// führe die Page Injection durch!
re_init_page_injection();


//// Sammelt alle aktiven Workers, und kann diese dann wieder ablösen...
//var all_workers = [];
//
//// hiermit werden die Worker wieder abgelöst!
//function detachWorker(worker, workerArray) {
//  var index = workerArray.indexOf(worker);
//  if(index != -1) {
//    workerArray.splice(index, 1);
//  }
//}


/************************************************************************
 ************************* Options Bereich! ***************************
 ************************************************************************/

// höre auf einen Aufruf vom Options Knopf
// Einstellungen setzen
preferences.on("loadOptions", function () {

	// lade alles nötige für die Options Einstellungen
	var options_url = "options/options.html";

	try {
		// Versuche die Tabs zu laden!
		var tabs = require("sdk/tabs");

		// optionen gui starten ...
		tabs.open(options_url);

	} catch (exception) {

	}

});

// Einstellungen!
page_injection.PageMod({
	include: "resource://firefox-addon-usi-at-jetpack/data/options/options.html",
	contentScriptWhen: 'end',
	attachTo: ['existing', 'top'], // TODO FF: make blocking policy start before this is run on install
	contentScriptFile: [
		"./external/jquery-2.1.3.min.js", // always load jQuery
		"./helper/basic_helper.js", // Helper Funktionen
		"./options/options_content.js"
	],
	onAttach: function (worker) {

		// Stelle eine Möglichkeit zum übersetzen zur Verfügung
		worker.port.emit("language", lang);

		//  nimm die Skript URL und verarbeite Sie weiter
		worker.port.on("new-usi-script_url", function (script_content_response) {

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
		worker.port.on("new-usi-script_content", function (script_content_response) {

			// Hier wird das UserScript weiterverarbeitet und gespeichert
			check_for_userscript_settings_and_save_it(script_content_response.script, worker);

		});
		
		// Wenn dies aufgerufen wird, überschreibe ein vorhandenes Userscript
		worker.port.on("override-same-userscript", function (userscipt_infos){
			
			// Hier wird das UserScript weiterverarbeitet und gespeichert
			check_for_userscript_settings_and_save_it(userscipt_infos.userscript, worker , userscipt_infos.id);
			
		});
		

		// Schicke alle bisher verfügbaren Skripte! 
		worker.port.on("request-for---list-all-scripts", function () {

			worker.port.emit("list-all-scripts", addon_storage.storage);
			
			// Zeige den aktuellen Speicherverbauch an
			worker.port.emit("storage-quota", addon_storage.quotaUsage);
		});

		// lösche einen Wert im Speicher
		worker.port.on("delete-script-by-id", function (key) {

			// Wert darf nicht leer sein, und muss existieren
			if (key != "" && basic_helper.isset(addon_storage.storage[key])) {

				// lösche dieses Element
				delete addon_storage.storage[key];

				// check für das content script
				if (!basic_helper.isset(addon_storage.storage[key])) {
					worker.port.emit("delete-script-is-now-deleted", true);
					
					// lade Page Mod neu!
					re_init_page_injection();
				} else {
					worker.port.emit("delete-script-is-now-deleted", false);
				}
			}
		});

		// Zeige den aktuellen Speicherverbauch an
		worker.port.emit("storage-quota", addon_storage.quotaUsage);

		//löscht sämtliche Einstellungen von USI!
		worker.port.on("delete-everything", function () {
			// lösche die Kompletten Einstellungen im "addon_storage.storage"
			// lösche jeden einzelnen Wert...
			for (var i in addon_storage.storage) {
				delete addon_storage.storage[i];
			}
			
			// lade Page Mod neu!
			re_init_page_injection();
		});

		// Schalte um ob das Skript aktiviert oder deaktiviert werden soll
		worker.port.on("toggle-userscript-state", function (script_id){

			// wenn das Skript deaktiviert war, dann aktiviere es jetzt wieder
			if(addon_storage.storage[script_id].deactivated == true){
				addon_storage.storage[script_id].deactivated = false;
			}else{
				//deaktiviere das Skript nun!
				addon_storage.storage[script_id].deactivated = true;
			}
			
			// lade Page Mod neu!
			re_init_page_injection();
		});

		// Suche in alle Skripten nach der UpdateURL, und prüfe ob es Veränderungen an der Versionsnummer gibt!
		worker.port.on("check-for-userscript-updates", function (){
			// durchlaufe alle Einträge und suche nach einer UpdateURL
			for (var id in addon_storage.storage){
				
				// prüfe ob eine UpdateURL gesetzt wurde!
				if(basic_helper.isset(addon_storage.storage[id].settings.updateURL)){
					
					// Damit im Closure nicht die letzte ID genutzt wird
					// "immediately-invoked function expression or IIFE" Methode 
					(function(actual_script_id, loaded_script_version){
						
						// UpdateURL gefunden, lade es nach!
						load_userscript_by_url(addon_storage.storage[actual_script_id].settings.updateURL, function (userscipt_text){

							// Parser laden!
							var parse_userscript = parse_userscript || require("./parse_userscript.js").parse_userscript;

							// Konfig suchen und danach die Optionen Parsen...
							var userscript_settings = parse_userscript.find_settings(userscipt_text);

							// Prüfe ob die Versionen verschieden sind!
							if(userscript_settings.version != loaded_script_version){

								// Frage den Benutzer ob das Skript aktualisiert werden soll!
								worker.port.emit("update-for-userscript-available", {id: actual_script_id, userscript: userscipt_text});

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

// Dürfen externe UserScripte direkt importiert werden?
if (preferences.prefs.enableExternalScriptLoadQuestion == true) {

// Horche auf User Scripte die aufgerufen wurden!
	page_injection.PageMod({
		include: /.*\.user\.js/,
		contentScriptWhen: 'end',
		attachTo: ['existing', 'top'], // TODO FF: make blocking policy start before this is run on install
		contentScriptFile: "./userscript-get.js",
		onAttach: function (worker) {

			//  nimm die Skript URL und verarbeite Sie weiter
			worker.port.on("new-usi-script_url---call", function (script_content_response) {

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
		worker.port.on("override-same-userscript", function (userscipt_infos){
			
			// Hier wird das UserScript weiterverarbeitet und gespeichert
			check_for_userscript_settings_and_save_it(userscipt_infos.userscript, worker , userscipt_infos.id);
			
		});
		
		}
	});

}

/************************************************************************
 ************************* Injection Bereich! ***************************
 ************************************************************************/


// Führe diese Funktion aus damit der Injection Bereich neu geladen werden kann!
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
 * Fügt ein Userscript in eine Seite ein!
 */
function add_userscript_to_page(userscript_entry) {

	// URL/Includes darf natürlich nicht leer sein!
	if (!basic_helper.empty(userscript_entry.settings.include) && 
			(typeof userscript_entry.deactivated == "undefined" || userscript_entry.deactivated == false)) { // nur wenn das skript nicht deaktiviert wurde!

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

					// ersetze doppelte *, falls nötig...
					var test_include_url = replace_wildcards_in_url(script_include_url);

					// erstelle daraus nun einen Regulären Ausdruck zum suchen!
					var test_include_url_regex = new RegExp(test_include_url);

					// dieses Array wird dann dem PageMod übergeben
					result_includes.push(test_include_url_regex);

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
		
		// Wenn jQuery gefordert ist muss das page_injection_object angepasst werden!
		if (script_settings["include-jquery"] == "true") {
			page_injection_object.contentScriptFile = "./external/jquery-2.1.3.min.js";
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
 ************************* Simple Prefs Bereich! ************************
 ************************************************************************/



//// zurücksetzen aller Optionen!
//preferences.on("delete-everything", function () {
//	// lösche die Kompletten Einstellungen im "addon_storage.storage"
//	// lösche jeden einzelnen Wert...
//	for (var i in addon_storage.storage) {
//		delete addon_storage.storage[i];
//	}
//});





/************************************************************************
 ************************* Speicher Funktionen! *************************
 ************************************************************************/

// Setze die Einstellungen in den Storage 
function speichere_in_storage(key, value) {
	// Den Wert speichern!
	addon_storage.storage[key] = value;
}

/************************************************************************
 ************************* URL Funktionen! *************************
 ************************************************************************/

// Holt externe Skripte
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
				if(response.status == 200 && response.statusText == "OK"){
					
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


/**
 * Diese Funktion wandelt mehrere "*" in ein passendes RegExp Ausdruck um!
 * 
 * @param {type} include_url
 * @param {type} tab_url
 * @returns {undefined}
 */
function replace_wildcards_in_url(include_url) {

	/***
	 * @TODO alle abfragen müssen noch umgebaut werden!
	 * z.B. wenn kein * gesetzt ist?!
	 */


	// Teile anhand von *
	var include_url__splitted_by_wildcard = include_url.split("*");

	// wandle mehrfach Vorkommen von * in der URL um!
	if (include_url__splitted_by_wildcard.length > 1) {

		// diese werden für den regulären ausdruck genutzt und mittel \\ escaped!
		// !!! Das erste Element ist LEER, damit auch das "zweite" gleich escaped wird!!!
//		var allowed_special_chars = ["","w","d","_",".","-","/","?",":","="];
//
//		// für die Ersetzung von *
//		var replacement_for_wildcard = "([" + allowed_special_chars.join("\\") + "]*)";

		// alle anderen müssen maskiert werden!
		for (var i in include_url__splitted_by_wildcard) {
			include_url__splitted_by_wildcard[i] = basic_helper.escapeRegExp(include_url__splitted_by_wildcard[i]);
		}

		// passender Ausdruck für das RegExp Objekt
		var include_url__replaced = include_url__splitted_by_wildcard.join(".*");

		// Prüfe ob http gesetzt wurde!
		if (/^https?:\\\/\\\//.test(include_url__replaced)) {
			// Keine Anpassung nötig!
			return include_url__replaced;
		} else {
			//vorn http anfügen!
			return "^https?:\/\/" + include_url__replaced;
		}

	} else {
		// Gib Sie unverändert zurück
		return basic_helper.escapeRegExp(include_url);
	}
}

///************************************************************************
// ************************* Basic Funktionen! *************************
// ************************************************************************/
// Lade einfach den basic_helper.js!


/************************************************************************
 ********* Parse-Userscript-Konfiguration Funktionen ********************
 ************************************************************************/

function check_for_userscript_settings_and_save_it(userscript, worker, override_userscript_id) {
	// Parser laden!
	var parse_userscript = parse_userscript || require("./parse_userscript.js").parse_userscript;

	// Konfig suchen und danach die Optionen Parsen...
	var userscript_settings = parse_userscript.find_settings(userscript);
	
	// Prüfe ob kein Fehler enthalten ist!
	if (basic_helper.isset(userscript_settings.error_message)) {
		// es wurde ein Fehler in der Konfiguration gefunden, melde es nun dem Benutzer!
		worker.port.emit("show-error", _("error_userscript_settings") + userscript_settings.error_message);

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
					worker.port.emit("same-userscript-was-found", {id : index, userscript: userscript});

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
				worker.port.emit("list-all-scripts", addon_storage.storage);
			}

			return true;
		}else{
			// es wurde mindestens ein Skript gefunden, welches die gleichen einstellungen besitzt
			
			return false;
		}

	}
}





//************* TEST BEREICH *************//
//var greasemonkey_functions = require("./greasemonkey_functions.js").greasemonkey_functions;
//// es muss zunächst einmal eine Userscript ID übergeben werden, und init aufgerufen werden!
//FFFF = greasemonkey_functions.init(1427963898372);