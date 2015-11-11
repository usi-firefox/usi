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
		language_keys;

try { 
	
	// JPM - Weg, führt allerdings bei CFX zu einem gravierenden Fehler!
	language_keys = self.data.load("../locale/" + preferences.prefs.language + ".properties");

} catch( exception ){}

// JPM
if (typeof language_keys !== "undefined" && language_keys !== "") {

// anhand des Zeilen Umbruchs splitten
	language_keys = language_keys.split("\r\n");

	for (var x in language_keys) {
		// nur wenn ein Begriff in der Zeile gefunden wurde!
		if (/([\w]+) = (.+)$/.test(language_keys[x])) {
			// [0] => entspricht dem key vor dem " = "
			key = language_keys[x].split(" = ")[0];
			lang[key] = _(key);
		}
	}

} else {

	// CFX
	lang = self.data.load("./lang_cfx/" + preferences.prefs.language + ".json");
	
	// wandel den Text in ein echtes Javascript Objekt
	lang = JSON.parse(lang);
	
}

if (typeof exports !== "undefined") {
	exports.lang = lang;
}