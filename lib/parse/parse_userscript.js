"use strict"; // Strict Mode aktivieren!
/************************************************************************
 ********* Parse-Userscript-Konfiguration Funktionen ********************
 ************************************************************************/

/* global require,exports */

// nutze den basic_helper, oder lade den basic_helper nach mittels require()!
var basic_helper = basic_helper || require("data/helper/basic_helper").basic_helper,
GM_convert2RegExp = GM_convert2RegExp || require("./convert2RegExp").GM_convert2RegExp,
tldRegExp = tldRegExp || require("./convert2RegExp").tldRegExp,

parse_userscript = {
	
	/**
	 * Metablock Konfiguration
	 */
	metablock:{
		start		: /\/\/\s*==UserScript==\s*$/
		,end		: /\/\/\s*==\/UserScript==\s*$/
		,start_s	: "// ==UserScript=="
		,end_s		: "// ==/UserScript=="
	},
	
	/**
	 * Dem übergebenen Userscript (string) werden weitere Werte in den Metablock geschrieben
	 * 
	 * @param {String} userscript
	 * @param {Array} new_entries
	 * @returns {String}
	 */
	add_option_to_userscript_metablock : function(userscript, new_entries){
		
		var userscript_metablock	= parse_userscript.find_lines_with_settings(userscript);
		var userscript_rest			= parse_userscript.find_lines_with_settings(userscript, true);
		
		var new_userscript_metablock	= parse_userscript.create_metablock_from_array(userscript_metablock, new_entries);

		return new_userscript_metablock + "\n" +  userscript_rest.join("\n");
	},
	
	/**
	 * Fügt den Userscript Metablock (array) wieder zusammen,
	 * falls das Array new_entries gefüllt ist, wird dieses an den Anfang geschrieben
	 * 
	 * @param {Array} userscript_metablock
	 * @param {Array} new_entries
	 * @returns {String}
	 */
	create_metablock_from_array : function(userscript_metablock, new_entries){
		if(basic_helper.isset(new_entries) && !basic_helper.empty(new_entries) && typeof new_entries.concat){
			// Füge die neuen Einträge an den Anfang
			userscript_metablock = new_entries.concat(userscript_metablock);
		}
		
		// Zusammenfügen mittels Zeilenumbruch
		return [parse_userscript.metablock.start_s , userscript_metablock.join("\n"), parse_userscript.metablock.end_s].join("\n");
	},
	
	/**
	 * Sucht im String nach der Userscript Konfiguration (Metablock)
	 * und liefert als Ergebnis ein Zeilen-basiertes Array der Konfiguration zurück
	 * ohne das umschließende " ... ==UserScript== ..."
	 * 
	 * @param {string} userscript
	 * @param {Boolean} getRestOfUserscript
	 * @returns {Boolean,Array}
	 */
	find_lines_with_settings: function (userscript, getRestOfUserscript) {
		// Teile Anhand von Zeilenumbrüchen ...
		var userscript_lines = userscript.split("\n"),

		// Start und Ende der Userscript Konfiguration
		start_regex = parse_userscript.metablock.start,
		end_regex = parse_userscript.metablock.end,

		// Nur zwischen diesen beiden Zeilen darf die Konfiguration zu finden sein!
		start_line = false,
		end_line = false;

		/**
		 * Selbstverständlich darf nur eine Konfiguration enthalten sein, und die Erste "gültige" wird verwendet
		 */

		// Durchlaufe jede Zeile!
		for (var i in userscript_lines) {

			// Suche den Beginn der Konfiguration
			if ((start_line === false) && (start_regex.test(userscript_lines[i]))) {
				start_line = parseInt(i);
			}

			// Suche das Ende der Konfiguration
			if ((end_line === false) && (end_regex.test(userscript_lines[i]))) {
				end_line = parseInt(i);
				
				// Ermöglicht es nur den Inhalt des Userscripts zu erhalten ohne den Metablock
				if(basic_helper.isset(getRestOfUserscript) && getRestOfUserscript === true){
					return userscript_lines.slice(end_line + 1);
				}
				
				// falls die Letzte des Metablock gefunden wurde, brauch nicht weiter gesucht zu werden ...
				break;
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
	
	get_userscript_keyword_config_by_name: function(keyword){
		var userscript_keyword_config = parse_userscript.userscript_keyword_config();
		
		for(var i in userscript_keyword_config){
			if(userscript_keyword_config[i].keyword === keyword){
				return userscript_keyword_config[i];
			}
		}
		
		// Falls das Keyword nicht gefunden werden konnte!
		return false;
	},
	
	/**
	 * Ausgelagert für mehrfache Verwendung
	 * @returns {Array}
	 */
	userscript_keyword_config : function(){
	
		// Konfigurations-Varianten die gefunden werden können
		return [
			// m: steht für Multiple, also mehrfache Werte möglich
			{m: false,	keyword: "name",			types:["string"]},
			{m: false,	keyword: "namespace",		types:["string"]},
			{m: false,	keyword: "author",			types:["string"]},
			{m: false,	keyword: "homepageURL",		types:["url"]},
			{m: false,	keyword: "date",			types:["string"]},
			{m: false,	keyword: "license",			types:["string"]},
			{m: false,	keyword: "icon",			types:["url","datauri"]},
			{m: false,	keyword: "description",		types:["string"]},
			{m: true,	keyword: "exclude",			types:["url","regex"]},
			{m: true,	keyword: "match",			types:["url","regex"]},		// Match und Include werden gleich behandelt!
			{m: true,	keyword: "include",			types:["url","regex"]},		// Match und Include werden gleich behandelt!
			{m: false,	keyword: "info",			types:["string"]},
			{m: true,	keyword: "require",			types:["url"]},				// nachladen externer JS Dateien
			{m: true,	keyword: "resource",		types:["url","datauri"]},	// Damit du andere Dinge zusätzlich herunterladen kannst
			{m: false,	keyword: "run-at",			types:["string"]},			// document-end || document-start || document-ready
			{m: true,	keyword: "grant",			types:["string"]},
			{m: false,	keyword: "include-jquery",	types:["bool"]},			// true || false --- du brauchst zusätzlich jQuery? setze "true" || "false", keine sorge es wird vorher geprüft ob bereits jQuery auf der Seite existiert!
			{m: false,	keyword: "updateURL",		types:["url"]},				// Hierüber wird später geprüft ob eine neue Version vom Skript zur Verfügung steht
			{m: false,	keyword: "downloadURL",		types:["url"]},				// Hierüber wird später geprüft ob eine neue Version vom Skript zur Verfügung steht
			{m: false,	keyword: "version",			types:["string"]},
			{m: false,	keyword: "use-greasemonkey",types:["bool"]},			// true || false
			{m: true,	keyword: "options"	,		types:["string"]}			// Damit kannst du mehrere Werte bestimmen, die dein UserScript nutzen soll!
		];
		
	},
	
	// Suche nach Einstellungen für das UserScript
	find_settings: function (userscript) {
		// Language
		var _ = require("sdk/l10n").get,
		
		// setze die Zeilen die die Konfiguration beinhalten!
		userscript_settings = parse_userscript.find_lines_with_settings(userscript);

		// Konfigurations-Varianten die gefunden werden können
		var possible_entries = parse_userscript.userscript_keyword_config();

		//init
		var options = {},
		option_found = false;

		// Prüfe für jeden Eintrag, ob du etwas brauchbares im Userscript vorfindest
		for (var i in possible_entries) {
			// lege den aktuellen Key fest
			var key = possible_entries[i].keyword,
			// Wenn dies true ist, dürfen die Keys mehrfach vorkommen, ansonsten wird einfach nur der Erste verwendet!
			m = possible_entries[i].m,

			// der Key muss immer am Anfang zu finden sein, in der Klammer wird der Wert dann gesucht!
			search_for_key = new RegExp("^\\s*\/\/\\s*\\@" + key + "\\s+(.+)");

			/************************************************************************
			 *****************************	ACHTUNG *********************************
			 ************************************************************************/
			// Da Include und Match, im grunde das gleiche bedeuten, werden wir im weiteren nur Incluce nutzen
			// Trotzdem musste zuvor natürlich der passende Reguläre Ausdruck gesetzt werden
			if (key === "match") {
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
					
					// Überflüssige Leerzeichen entfernen, wenn möglich
					if(typeof value.trim === "function"){
						value = value.trim();
					}
					
					// Setze einfach nur den Wert ...
					if (m === false) {
						options[key] = value;
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
				return {error_message: error_text, error_code: 100};
				break;

				// Du solltest schon einen Namen vergeben
			case !basic_helper.isset(options.name):
				var error_text = _("required_script_name");
				// keine gültige Konfiguration!
				return {error_message: error_text, error_code: 101};
				break;

			default:
				// Konfiguration schein in Ordnung zu sein, gib sie zurück!
				return options;
		}

	},
	
    prepare_includes_and_excludes: function (rules, script_settings, keyword) {

        // für die Übergabe an den PageMod aufruf
        var result = []
            , url_rule
            , domain_beginning_asterisk_match = /^\*\..+/
            , protocol_match = /^\w+:\/\/.*/ // ohne data: --- A URL followed by an asterisk
            , protocol_match_all = /^(data:|(\w+:\/\/))\*/  // A scheme followed by an asterisk
            , result_rule;

        // Durchlaufe alle Einträge
        for (var j in rules) {
            // Reset
            result_rule = null;
            url_rule = rules[j];

            if (typeof url_rule === "string" && typeof url_rule.trim === "function") {
                url_rule = url_rule.trim();
            } else {
                // url_rule muss ein String sein
                continue;
            }

            // Für mehr Information https://developer.mozilla.org/en-US/Add-ons/SDK/Low-Level_APIs/util_match-pattern
            switch (true) {
                case url_rule === "*":
                    // alle Seiten, außer file://, resource://,data:
                    // Protokolle: http, https, ftp
                    result_rule = url_rule;
                    break;

                case tldRegExp.test(url_rule):
                    // .tld gefunden, muss also durch GM_convert2RegExp() geparst werden
                    result_rule = GM_convert2RegExp(url_rule);
                    break;

                case domain_beginning_asterisk_match.test(url_rule) && (url_rule.indexOf("/") === - 1):
                    // Beispiel *.example.com, es darf kein / enthalten sein
                    // Protokolle: http, https, ftp
                    // 
                    // A domain name prefixed with an asterisk and dot matches any URL of that domain or a subdomain, using any of http, https, ftp.
                    result_rule = url_rule;
                    break;

                case protocol_match.test(url_rule) && (url_rule.indexOf("*") === - 1):
                    // Beispiel: http://example.com/
                    // Exakter Treffer, es darf kein * vorkommen
                    result_rule = url_rule;
                    break;

                case protocol_match_all.test(url_rule):
                    // Beispiel: file://*
                    // A scheme followed by an asterisk 
                    result_rule = url_rule;
                    break;

                default:
                    // alle anderen Varianten werden durch die Funktion von GreaseMonkey verarbeitet
                    // GM_convert2RegExp() sollte eigentlich 'null' oder 'RegExp' liefern ... Bug?
                    result_rule = GM_convert2RegExp(url_rule);
                    break;
            }

            // Die Regel wird nur übernommen, wenn sie String oder ein regulärer Ausdruck ist
            if (result_rule instanceof RegExp || (typeof result_rule.exec === "function" && typeof result_rule.test === "function") || typeof result_rule === "string") {
                result.push(result_rule);
            }
        }

        return result;
    }

};


// nötig damit es auch im Content Script verwendet werden kann!!!
if(typeof exports !== "undefined"){
	exports.parse_userscript = parse_userscript;
}