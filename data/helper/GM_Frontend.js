/* global self,console,document */

//window.localStorage.clear();

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

/**
 * GREASEMONKEY Funtkionen --- START
 */

/**
 * 
 * @param string name
 * @param {type} default_value
 * @returns {Array|Object|GM_getValue.script_localstorage|self.options.storage|Window.options.storage}
 */

function GM_getValue(name, default_value) {
	// holt aus dem Localstorage, den Speicher für das USI Skript
	var script_localstorage = get_123141482457923434792();

	// Prüft ob im Localstorage etwas zu finden ist...
	if (typeof script_localstorage[name] !== "undefined") {
		// Daten aus dem Localstorage beziehen...
//		console.log("--- aus Localstorage ---");
		return script_localstorage[name];
	} else if (typeof self.options.storage !== "undefined" && typeof self.options.storage[name] !== "undefined") {
//		console.log("--- aus übergebenen Optionen ---");
		// Daten aus den übergebenen ScriptOptions
		return self.options.storage[name];
	} else { 
//		console.log("--- DEFAULT ---");
		return default_value;
	}
}

function GM_setValue(name, value) {
	// holt aus dem Localstorage, den Speicher für das USI Skript
	var script_localstorage = get_123141482457923434792();

	// Variable setzen
	script_localstorage[name] = value;

	// Localstorage schreiben
	set_123141482457923434792(script_localstorage);

	// Im Extension Speichern sichern!
	self.port.emit("USI-BACKEND:GM_setValue", {name: name, value: value});
}

function GM_deleteValue(name) {
	var script_localstorage = get_123141482457923434792();
	// Variable entfernen
	delete script_localstorage[name];

	// Localstorage schreiben
	set_123141482457923434792(script_localstorage);

	// Variable löschen
	self.port.emit("USI-BACKEND:GM_deleteValue", {name: name});
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

function GM_setClipboard(text) {
	self.port.emit("USI-BACKEND:GM_setClipboard", text);
}

function GM_openInTab(url, open_in_background) {
	self.port.emit("USI-BACKEND:GM_openInTab", {url: url, open_in_background: open_in_background });
}
  
function GM_log(value) {
	// falls es eine Variable ist, und toString() anbietet, wird es genutzt
	if(typeof value !== "string" && typeof value.toString === "function"){
		value =	value.toString();
	}
	// Ausgabe in die Konsole
	console.log(value);
}

function GM_addStyle(css) {
	var elem		=	document.createElement("style");
	var css_code	=	document.createTextNode(css);
	// Textsetzen ohne innerHMTML
	elem.appendChild(css_code);
	// in den Head schreiben
	document.getElementsByTagName("head")[0].appendChild(elem);
} 

// Wichtig für die Sicherstellung der passenden Antwort zur richtigen Abfrage
var GM_xmlhttpRequest_counter = 0; 

function GM_xmlhttpRequest(details) {
	// Counter für "eindeutige" Abfragen erhöhen
	GM_xmlhttpRequest_counter++;

	// Wrapper Funktion
	function if_function_add_to_self_port(func, event_name, counter) {
		if (func && typeof func === "function") {
			self.port.on("GM-FRONTEND-xmlhttpRequest---" + event_name + "-" + counter, func);
		}
	}

	// Wrapper damit definitiv kein Closure entsteht
	(function (counter) {

		// Abort
		if_function_add_to_self_port(details.onabort,			"abort", counter);
		// Error
		if_function_add_to_self_port(details.onerror,			"error", counter);
		// Load
		if_function_add_to_self_port(details.onload,			"load", counter);
		// Loadstart
		if_function_add_to_self_port(details.onloadstart,		"loadstart", counter);
		// Loadend
		if_function_add_to_self_port(details.loadend,			"loadend", counter);
		// Progress
		if_function_add_to_self_port(details.onprogress,		"progress", counter);
		// ReadyStateChange
		if_function_add_to_self_port(details.onreadystatechange,"readystatechange", counter);
		// Timeout
		if_function_add_to_self_port(details.ontimeout,			"timeout", counter);

	})(GM_xmlhttpRequest_counter);

	// OriginUrl hinzufügen, für den Fall einer relativen URL
	details.originUrl = window.location.origin;

	// Übergabe an die Backend Funktion!
	self.port.emit("USI-BACKEND:GM_xmlhttpRequest", {data: details, counter: GM_xmlhttpRequest_counter});
}

function GM_registerMenuCommand(caption, commandFunc, accessKey) {
	self.port.emit("USI-BACKEND:GM_registerMenuCommand", 
		{caption: caption,
			// Wandelt die Funktion in einen String um, ansonsten wird Sie einfach weggeworfen :/ ... 
		commandFunc: commandFunc.toString(), 
		accessKey: accessKey}
	);
}
// Bisher nicht implementiert - Nur Platzhalter
/**
 * START
 */
function GM_getResourceText() {
}
function GM_getResourceURL() {
}

var GM_info = {
	script : JSON.parse(self.options.scriptsettings)
	, uuid : self.options.id
	, scriptSource : self.options.scriptSource
	, scriptMetaStr : self.options.scriptMetaStr
	, scriptWillUpdate : false
	, version : self.options.usiversion
};
/**
 * END
 */
 
// Schreibt Fehlermeldungen vom Backend
self.port.on("GM-FRONTEND-ERROR", function (err) {
	console.log("USI: In function -> " + err.func);
	console.log("USI: reason -> " + err.reason);
	console.log("USI: object -> ");
	console.log(err.object);
	console.log("############");
});
 
/**
 * GREASEMONKEY Funtkionen --- STOP
 */