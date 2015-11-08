"use strict"; // Strict Mode aktivieren!

function GM_getValue(name, default_value) {
	// Inhalt einer Variable anfordern
	self.port.emit("GM_getValue",  {name: name} );
}

function GM_setValue(name, value) {
	// Variable schreiben
	self.port.emit("GM_setValue", {name: name, value: value} );
}

function GM_deleteValue(name) {
	// Variable löschen
	self.port.emit("GM_deleteValue", {name : name} );
}

function GM_listValues() {
	// Alle Variablen namen zurück liefern
	self.port.emit("GM_listValues" );
}
