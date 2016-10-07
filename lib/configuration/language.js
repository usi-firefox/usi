"use strict"; // Strict Mode aktivieren!

/* global exports,require */

// Language Helper vom SDK
var _ = _ || require("sdk/l10n").get,
// Self init für CFX Tool
self = self || require("sdk/self");

// Wenn die Variable lang nicht gefüllt ist, sammel alle Daten aus den .properties

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
			result[language_keys[key]]	=	unicode_decode(_(language_keys[key]));
		}
		
	}
	
	return result;
}

function unicode_decode(str){
	// http://stackoverflow.com/questions/7885096/how-do-i-decode-a-string-with-escaped-unicode
	var r = /\\u([\d\w]{4})/gi;
	str = str.replace(r, function (match, grp) {
		return String.fromCharCode(parseInt(grp, 16));
	});
	return unescape(str);
	
}

/**
 * Liefert alle Schlüssel aus den .properties zurück
 * Hilfsfunktion für das JPM
 * @returns {Array}
 */
function searchKeysInProperties(){
	
	// JPM - Weg, führt allerdings bei CFX zu einem gravierenden Fehler!
	var language_key_file = self.data.load("../../locale/de.properties");
	
	// JPM - alle Key Words sammeln ...
	if (typeof language_key_file !== "undefined" && language_key_file !== "") {

		// anhand des Zeilen Umbruchs splitten
		var language_keys = language_key_file.split("\r\n");

		var all_keys = [];
		var key;

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

if (typeof exports !== "undefined") {
    
    // befüllt das lang Objekt, dies ist nötig damit beim JPM alle Keys nutzbar sind
    var language_keys = searchKeysInProperties();
    
	exports.lang = generateLangObject(language_keys);
}