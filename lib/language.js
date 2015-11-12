"use strict"; // Strict Mode aktivieren!

/* global exports,require */

// Language Helper vom SDK
var _ = _ || require("sdk/l10n").get,
		lang = {},
// Self init für CFX Tool
		self = self || require("sdk/self"),
		preferences = preferences || require("sdk/simple-prefs");

// Wenn die Variable lang nicht gefüllt ist, sammel alle Daten aus den .properties

// Damit die Übersetzungskeys nicht hard codiert werden müssen
var key,
	// Statische Keys hinterlegt -> müssen bei neuen Schlüsselwörtern in den properties neu erzeugt werden
	static___language_keys = ["loadOptions_title","loadOptions_label","enableExternalScriptLoadQuestion_title","enableExternalScriptLoadQuestion_description","required_script_one_include","required_script_name","exception_100","error_userscript_settings","usi_options","description","deactivated_userscript","add_new_userscript","load_userscript_by_url","after_load","load_userscript_by_url_label","load_userscript_by_textarea","load_example","clear_textarea","save_userscript","delete_all_userscripts","revert_all","check_updates_for_all_userscripts","check_now","empty_userscript_url","same_userscript_was_found_ask_update_it_1","same_userscript_was_found_ask_update_it_2","yes","no","not_set","want_to_delete_this_userscript_1","want_to_delete_this_userscript_2","delete_x","change","show_hide","activate_deactivate","actual_used_quota","userscript_was_successful_deleted","userscript_could_not_deleted","really_reset_all_settings","really_really_reset_all_settings","userscript_update_was_found_1","userscript_update_was_found_2","should_usi_import_this_userscript","language"];

/**
 * Erstellt das benötigte LANG Objekt
 * 
 * @param {Array} language_keys
 * @returns {object}
 */
function generateLangObject(language_keys){
	var result = {};
	// check 
	if(typeof language_keys === "object" && language_keys.length > 0){
		
		// alle durchlaufen und Ergebnis in Result festhalten
		for(var key in language_keys){
			result[language_keys[key]]	=	_(language_keys[key]);
		}
		
	}
	
	return result;
}


/**
 * Liefert alle Schlüssel aus den .properties zurück
 * 
 * @returns {Array}
 */
function searchKeysInProperties(){
	
	// JPM - Weg, führt allerdings bei CFX zu einem gravierenden Fehler!
	var language_key_file = self.data.load("../locale/de.properties");
	
	// JPM - alle Key Words sammeln ...
	if (typeof language_key_file !== "undefined" && language_key_file !== "") {

		// anhand des Zeilen Umbruchs splitten
		var language_keys = language_key_file.split("\r\n");

		var all_keys = [];

		for (var x in language_keys) {
			// nur wenn ein Begriff in der Zeile gefunden wurde!
			if (/([\w]+) = (.+)$/.test(language_keys[x])) {
				// [0] => entspricht dem key vor dem " = "
				key = language_keys[x].split(" = ")[0];

				// dem Array alle Keys hinzufügen
				all_keys.push(key);
			}
		}

		// Ausgabe der Keys, damit diese gesichert werden können.... aufgrund der fehlenden Möglichkeit die Keys für die CFX Variante auszulesen 

		return all_keys;

	}
}

// befüllt das lang Objekt
lang = generateLangObject(static___language_keys);

if (typeof exports !== "undefined") {
	exports.lang = lang;
}