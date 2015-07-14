"use strict"; // Strict Mode aktivieren!
/************************************************************************
 ********* Parse-Userscript-Konfiguration Funktionen ********************
 ************************************************************************/

/* global require */


// nutze den basic_helper, oder lade den basic_helper nach mittels require()!
var basic_helper = basic_helper || require("./basic_helper").basic_helper;


var parse_userscript = {
	
	find_lines_with_settings: function (userscript) {
		// Teile Anhand von Zeilenumbrüchen ...
		var userscript_lines = userscript.split("\n");

		// Start und Ende der Userscript Konfiguration
		var start_regex = /\/\/\s*==UserScript==\s*$/;
		var end_regex = /\/\/\s*==\/UserScript==\s*$/;

		// Nur zwischen diesen beiden Zeilen darf die Konfiguration zu finden sein!
		var start_line = false;
		var end_line = false;

		/**
		 * Selbstverständlich darf nur eine Konfiguration enthalten sein, und die Erste "gültige wird verwendet
		 */

		// Durchlaufe jede Zeile!
		for (var i in userscript_lines) {

			// Suche den Beginn der Konfiguration
			if ((start_line === false) && (start_regex.test(userscript_lines[i]))) {
				start_line = i;
			}

			// Suche das Ende der Konfiguration
			if ((end_line === false) && (end_regex.test(userscript_lines[i]))) {
				end_line = i;
			}

		}

		// Es müssen beiden Werte gesetzt sein, und die start_line muss natürlich kleiner sein!
		if ((start_line !== false) && (end_line !== false) && (start_line < end_line)) {

			// Gib ein Array zurück mit den Zeilen der Konfiguration
			// Start_line + 1 => da bei Array.slice ansonsten die Start-Zeile "// ==UserScript==" auch enthalten wäre
			return userscript_lines.slice(start_line + 1, end_line);
		} else {
			// Keine gültige Konfiguration gefunden
			return false;
		}
	},
	
	// Suche nach Einstellungen für das UserScript
	find_settings: function (userscript) {
		// Language
		var _ = require("sdk/l10n").get;
		
		// setze die Zeilen die die Konfiguration beinhalten!
		var userscript_settings = this.find_lines_with_settings(userscript);


		// Konfigurations-Varianten die gefunden werden können
		var possible_entries = [
			{val: "name", multiple: false},
			{val: "namespace", multiple: false},
			{val: "author", multiple: false},
			{val: "homepageURL", multiple: false},
			{val: "date", multiple: false},
			{val: "license", multiple: false},
			{val: "icon", multiple: false},
			{val: "description", multiple: false},
			{val: "match", multiple: true},			// Match und Include werden gleich behandelt!
			{val: "include", multiple: true},		// Match und Include werden gleich behandelt!
			{val: "info", multiple: false},
			{val: "resource", multiple: true},		// Damit du andere Dinge zusätzlich herunterladen kannst
			{val: "run-at", multiple: false},		// document-end || document-start || document-ready
			{val: "grant", multiple: true},
			{val: "include-jquery", multiple: false},	// true || false --- du brauchst zusätzlich jQuery? setze "true" || "false", keine sorge es wird vorher geprüft ob bereits jQuery auf der Seite existiert!
			{val: "updateURL", multiple: false},		// Hierüber wird später geprüft ob eine neue Version vom Skript zur Verfügung steht
			{val: "downloadURL", multiple: false},		// Hierüber wird später geprüft ob eine neue Version vom Skript zur Verfügung steht
			{val: "version", multiple: false},
			{val: "options", multiple: true},               // Damit kannst du mehrere Werte bestimmen, die dein UserScript nutzen soll!
		];

		//init
		var options = {};
		var option_found = false;

		// Prüfe für jeden Eintrag, ob du etwas brauchbares im Userscript vorfindest
		for (var i in possible_entries) {
			// lege den aktuellen Key fest
			var key = possible_entries[i].val;

			// Wenn dies true ist, dürfen die Keys mehrfach vorkommen, ansonsten wird einfach nur der Erste verwendet!
			var multiple = possible_entries[i].multiple;

			// der Key muss immer am Anfang zu finden sein, in der Klammer wird der Wert dann gesucht!
			var search_for_key = new RegExp("^\\s*\/\/\\s*\\@" + key + "\\s+(.+)");

			/************************************************************************
			 *****************************	ACHTUNG *********************************
			 ************************************************************************/
			// Da Include und Match, im grunde das gleiche bedeuten, werden wir im weiteren nur Incluce nutzen
			// Trotzdem musste zuvor natürlich der passende Reguläre Ausdruck gesetzt werden
			if (key == "match") {
				key = "include";
			}
			/************************************************************************
			 *****************************	ACHTUNG *********************************
			 ************************************************************************/


			// Durchlaufe für jeden Key alle userscript_settings
			for (var j in userscript_settings) {

				//Prüfe ob der Key in der Zeile enthalten ist
				option_found = search_for_key.exec(userscript_settings[j]);

				// Der Key ist enthalten
				if (option_found !== null) {

					// Wert festlegen
					var value = option_found[1];

					// Setze einfach nur den Wert ...
					if (multiple === false) {
						options[key] = value;

						// Erzeuge ein Array mit 
					} else {

						// "object" wird auch bei einem Array geliefert, und darauf prüfen wir nur ...
						if (typeof options[key] !== "object") {
							//es ist noch kein Array,deswegen erzeugen wir jetzt eins!
							options[key] = [];
						}

						// füge den Wert hinzu
						options[key].push(value);
					}
				}
			}
		}


		// Prüfe den Inhalt des options Array
		switch (true) {

			// --- Mindestens ein Include Eintrag muss vorhanden sein! ---
			case !basic_helper.isset(options.include):
				var error_text = _("required_script_one_include");
				// keine gültige Konfiguration!
				return {error_message: error_text};
				break;

				// Du solltest schon einen Namen vergeben
			case !basic_helper.isset(options.name):
				var error_text = _("required_script_name");
				// keine gültige Konfiguration!
				return {error_message: error_text};
				break;

			default:
				// Konfiguration schein in Ordnung zu sein, gib sie zurück!
				return options;
		}

	}

}


// nötig damit es auch im Content Script verwendet werden kann!!!
if(typeof exports != "undefined"){
	exports.parse_userscript = parse_userscript;
}