"use strict"; // Strict Mode aktivieren!

/* global exports,require */

// Language Helper vom SDK
var _		= _ || require("sdk/l10n").get,
lang	=	{},
// Self init für CFX Tool
self		=	self || require("sdk/self");

// Wenn die Variable lang nicht gefüllt ist, sammel alle Daten aus den .properties


// Damit die Übersetzungskeys nicht hard codiert werden müssen
var key,
language_keys	=	self.data.load("../locale/de-DE.properties");
// anhand des Zeilen Umbruchs splitten
language_keys	=	language_keys.split("\r\n");

for (var x in language_keys) {
	// nur wenn ein Begriff in der Zeile gefunden wurde!
	if (/([\w]+) = (.+)$/.test(language_keys[x])) {
		// [0] => entspricht dem key vor dem " = "
		key			=	language_keys[x].split(" = ")[0];
		lang[key]	=	_(key);
	}
}

if (typeof exports	!==	"undefined") {
	exports.lang	=	lang;
}