/* global self,console,document */

(function(win){
    
// Wichtig für die Sicherstellung der passenden Antwort zur richtigen Abfrage
var GM_xmlhttpRequest_counter = 0,    
/*
 *  damit keine Fehler geworfen werden
 *  jedoch ist es praktisch nicht nutzbar
 */
unsafeWindow = {},
GM_info = {
	script : JSON.parse(self.options.scriptSettings)
	, uuid : self.options.id
	, scriptSource : self.options.scriptSource
	, scriptMetaStr : self.options.scriptMetaStr
	, scriptWillUpdate : false
	, version : self.options.usiVersion
	, scriptHandler : "USI"
	, isUsi : true
},

storage = {
    // Initiere den Scriptstorage
    initialized : false,
    data : false,
    identifier : "usi+" + self.options.id,
    init : function(){
        var script_localstorage = window.localStorage.getItem(storage.identifier);
        if (typeof script_localstorage === "string") {
            storage.initialized = true;
            // window.localStorage existiert bereits
            storage.data = JSON.parse(script_localstorage);
            return true;
        }else if(script_localstorage === null){
            // bisher nicht initialisiert
            if(typeof self.options.storage === "object"){
                storage.initialized = true;
                storage.data = self.options.storage;
                return true;
            }else{
                // sollte eigentlich nicht auftreten
                throw "self.options.storage is no object";
            }
        }else{
            throw "script_localstorage neither 'string' or 'null'";
        }
    }
    , get : function (name) {
        return storage.data[name];
    }
    , getStorage : function () {
        return storage.data;
    }
    , saveStorage: function(){
        // neuen Wert in den localStorage schreiben
        window.localStorage.setItem(storage.identifier, JSON.stringify(storage.data));
    }
    , set: function(name, value){
        // neuen Wert setzen
        storage.data[name] = value;
        storage.saveStorage();        
        return true;
    }
    , delete: function(name){
        // Wert löschen
        delete storage.data[name];
        storage.saveStorage();
        return true;
    }
};

try {
    // Storage initialisiere
    storage.init();
}catch(error_message){
   GM_log(error_message);
}

/**
 * GREASEMONKEY Funktionen --- START
 */

/**
 * 
 * @param {string} name
 * @param {any} default_value
 * @returns {Array|Object|GM_getValue.script_localstorage|self.options.storage|Window.options.storage}
 */

function GM_getValue(name, default_value) {
	var value = storage.get(name);
	if (typeof value === "undefined") {
		// Daten aus dem Localstorage beziehen...
		return default_value;
	} else { 
		return value;
	}
}

/**
 * 
 * @param {string} name
 * @param {any} value
 * @returns {void}
 */
function GM_setValue(name, value) {
    storage.set(name, value);
    
    // Daten im Extension Speicher sichern
    self.port.emit("USI-BACKEND:GM_setValue", {name: name, value: value});
}

/**
 * 
 * @param {string} name
 * @returns {void}
 */
function GM_deleteValue(name) {
	// Localstorage schreiben
	storage.delete(name);

	// Variable löschen
	self.port.emit("USI-BACKEND:GM_deleteValue", {name: name});
} 

/**
 * 
 * @returns {Array|GM_listValues.result}
 */
function GM_listValues() {
	// Alle Variablen namen zurück liefern
	var script_storage = storage.getStorage();
	var result = [];
	for (var key in script_storage) {
		result.push(key);
	}
	return result;
}

/**
 * 
 * @param {string} text
 * @returns {void}
 */
function GM_setClipboard(text) {
	self.port.emit("USI-BACKEND:GM_setClipboard", text);
}

/**
 * 
 * @param {string} url
 * @param {boolean} open_in_background
 * @returns {void}
 */
function GM_openInTab(url, open_in_background) {
	self.port.emit("USI-BACKEND:GM_openInTab", {url: url, open_in_background: open_in_background });
}

/**
 * 
 * @param {any} value
 * @returns {void}
 */
function GM_log(value) {
	// Ausgabe in die Konsole
	console.error(value);
}

/**
 * 
 * @param {string} css
 * @returns {void}
 */
function GM_addStyle(css) {
	var elem		=	document.createElement("style");
	var css_code	=	document.createTextNode(css);
	// Textsetzen ohne innerHMTML
	elem.appendChild(css_code);
	// in den Head schreiben
	document.getElementsByTagName("head")[0].appendChild(elem);
} 

/**
 * 
 * @param {object} details
 * @returns {void}
 */
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

/**
 * 
 * @param {string} caption
 * @param {string} commandFunc
 * @param {string} accessKey
 * @returns {void}
 */
function GM_registerMenuCommand(caption, commandFunc, accessKey) {
	self.port.emit("USI-BACKEND:GM_registerMenuCommand", 
		{caption: caption,
			// Wandelt die Funktion in einen String um, ansonsten wird Sie einfach weggeworfen :/ ... 
		commandFunc: commandFunc.toString(), 
		accessKey: accessKey}
	);
}

/**
 * Hilfsfunktion die die gesuchte Resource zurückliefert
 * @param {string} name
 * @returns {object|null}
 */
function GM_helper___search_for_resource(name){
	if(typeof name === "string" && name.trim() !== ""){
	// name muss ein String sein
		name = name.trim();
		// die Resource Daten werden in den Script Settings gesichert
		var resources = GM_info.script.resources_data;
		if(typeof resources === "object" && resources.length > 0){
			for (var i in resources){
				if(name === resources[i].name){
					// Rückgabe der gefundenen Resource
					return resources[i];
				}
			}
		}
	}
	
	// Name nicht gefunden gibt null zurück
	return null;
}

/**
 * Liefert den Inhalt der Resource zurück
 * @param {string} name
 * @returns {string}
 */
function GM_getResourceText(name) {
	// Resource suchen
	var resource = GM_helper___search_for_resource(name);
	
	if(resource !== null){
		return resource.data;
	}else{
		// Name nicht gefunden Error werfen
		throw new Error("USI-Function GM_getResourceText: name -> " + name + " was not found!");
	}
}

/**
 * Liefert die Datauri der Resource zurück
 * @param {string} name
 * @returns {string}
 */
function GM_getResourceURL(name) {
	// Resource suchen
	var resource = GM_helper___search_for_resource(name);

	if(resource !== null){
		// Test ob es eine datauri ist
		if(/^data:/.test(resource.data)){
			return resource.data;
		}else{
            return resource.origUrl;
		}
	}else{
		// Name nicht gefunden!
		throw new Error("USI-Function GM_getResourceURL: name -> " + name + " was not found!");
	}
}

// Schreibt Fehlermeldungen vom Backend
self.port.on("GM-FRONTEND-ERROR", function (err) {
	console.error("USI: In function -> " + err.func);
	console.error("USI: reason -> " + err.reason);
	console.error("USI: object -> ");
	console.error(err.object);
	console.error("############");
});

/**
 * GREASEMONKEY Funktionen --- STOP
 */

// EXPORT to window
win.GM_addStyle = GM_addStyle;
win.GM_deleteValue = GM_deleteValue;
win.GM_getResourceText = GM_getResourceText;
win.GM_getResourceURL = GM_getResourceURL;
win.GM_getValue = GM_getValue;
win.GM_listValues = GM_listValues;
win.GM_log = GM_log;
win.GM_openInTab = GM_openInTab;
win.GM_registerMenuCommand = GM_registerMenuCommand;
win.GM_setClipboard = GM_setClipboard;
win.GM_setValue = GM_setValue;
win.GM_xmlhttpRequest = GM_xmlhttpRequest;
win.GM_info = GM_info;
win.unsafeWindow = unsafeWindow;

}(window));