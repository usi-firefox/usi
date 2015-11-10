/* global self */

// Initiere den Scriptstorage
function get_123141482457923434792() {

	var script_localstorage = window.localStorage.getItem("usi+" + self.options.id);

	if (script_localstorage !== "" && script_localstorage !== null) {
		// in ein JSON umwandeln
		script_localstorage = JSON.parse(script_localstorage);
	} else {
		// initial erzeugen!
		script_localstorage = {};
	}

	return script_localstorage;
}
// In den LocalStorage schreiben
function set_123141482457923434792(script_localstorage) {
	// Wrapper Funktion
	window.localStorage.setItem("usi+" + self.options.id, JSON.stringify(script_localstorage));
}



function GM_getValue(name, default_value) {
	// holt aus dem Localstorage, den Speicher für das USI Skript
	var script_localstorage = get_123141482457923434792();

	// Prüft ob im Localstorage etwas zu finden ist...
	if (typeof script_localstorage !== "" && typeof script_localstorage[name] !== "undefined") {
		// Daten aus dem Localstorage beziehen...
		return script_localstorage[name];
	} else if (typeof self.options.storage !== "undefined" && typeof self.options.storage[name] !== "undefined") {
		// Daten aus den übergebenen ScriptOptions
		return self.options.storage[name];
	} else {
		return default_value;
	}
}

function GM_setValue(name, value) {
	// holt aus dem Localstorage, den Speicher für das USI Skript
	var script_localstorage = get_123141482457923434792();

	// Variable setzen
	script_localstorage[name] = value;

	console.log("---SET---");
	console.log("---SET script_localstorage");
	console.log(script_localstorage);
	console.log("---SET script_localstorage.name");
	console.log(script_localstorage[name]);

	console.log("---SET---");

	// Localstorage schreiben
	set_123141482457923434792(script_localstorage);

	// Im Extension Speichern sichern!
	self.port.emit("GM_setValue", {name: name, value: value});
}

function GM_deleteValue(name) {
	var script_localstorage = get_123141482457923434792();
	delete script_localstorage[name];

	// Localstorage schreiben
	set_123141482457923434792(script_localstorage);

	// Variable löschen
	self.port.emit("GM_deleteValue", {name: name});
}

function GM_listValues() {
	// Alle Variablen namen zurück liefern
	var script_storage = get_123141482457923434792();
	var result = [];
	for (var key in script_storage) {
		result.push(key);
	}
	return result;
}


// Bisher nicht implementiert - Nur Platzhalter
/**
 * START
 */
function GM_registerMenuCommand() {
}
function GM_setClipboard() {
}
function GM_openInTab() {
}
function GM_xmlhttpRequest() {
}
function GM_addStyle() {
}
function GM_getResourceText() {
}
function GM_getResourceURL() {
}
function GM_log() {
}

var GM_info = {};
/**
 * END
 */