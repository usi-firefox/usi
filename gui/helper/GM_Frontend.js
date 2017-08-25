/* global self, console, document, browser, prefilled_data */

(function(win, given_data){    
    
// Wichtig für die Sicherstellung der passenden Antwort zur richtigen Abfrage
var message_counter = 0,    
backend_port = browser.runtime.connect({name: "usi-gm-backend---" + given_data.id}),
/*
 *  damit keine Fehler geworfen werden
 *  jedoch ist es praktisch nicht nutzbar
 */
unsafeWindow = {},
GM_info = {
	script : given_data.scriptSettings
	, uuid : given_data.id
	, scriptSource : given_data.scriptSource
	, scriptMetaStr : given_data.scriptMetaStr
	, scriptWillUpdate : false
	, version : given_data.usiVersion
	, scriptHandler : "USI"
	, isUsi : true
	, systemPlatform : given_data.systemPlatform
},

storage = {
    // Initiere den Scriptstorage
    initialized : false,
    data : false,
    identifier : "usi+" + given_data.id,
    init : function(){
        var script_localstorage = window.localStorage.getItem(storage.identifier);
        if (typeof script_localstorage === "string") {
            storage.initialized = true;
            // window.localStorage existiert bereits
            storage.data = JSON.parse(script_localstorage);
            return true;
        }else if(script_localstorage === null){
            // bisher nicht initialisiert
            if(typeof given_data.storage === "object"){
                storage.initialized = true;
                storage.data = given_data.storage;
                return true;
            }else{
                // sollte eigentlich nicht auftreten
                throw "given_data.storage is no object";
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
 * @returns {Array|Object|GM_getValue.script_localstorage|given_data.storage|Window.options.storage}
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
 * Experimental
 * 
 * Liefert den Inhalt der gespeicherten Variable asynchron zurück
 * 
 * @param {string} name
 * @param {any} default_value
 * @returns {Promise}
 */
    async function GM_getValue_async (name, default_value) {

        // Counter für "eindeutige" Abfragen erhöhen
        message_counter++;

        return new Promise((resolve,reject) => {
            var local_counter = message_counter;
            backend_port.onMessage.addListener((response) => {
                if (response.name === "GM_getValue_done" && response.counter === local_counter) {
                    resolve(response.data.value);
                }
            });

            backend_port.postMessage({name: "GM_getValue", 
                data: {val_name: name, value: default_value}, 
                counter: local_counter});
        });
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
    backend_port.postMessage({name : "GM_setValue", data: {val_name: name, value: value}});
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
	backend_port.postMessage({name : "GM_deleteValue", data: {val_name: name}});
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
    
   // Element erzeugen und darin den Text festlegen
    let temp_a = document.createElement("a");
    temp_a.appendChild(document.createTextNode(text));
    document.body.appendChild(temp_a);
    temp_a.select();
    
    // Clipboard schreiben
    document.execCommand("Copy");
    
    document.body.removeChild(temp_a);
}

/**
 * 
 * @param {string} url
 * @param {boolean} open_in_background
 * @returns {void}
 */
function GM_openInTab(url, open_in_background) {
    backend_port.postMessage({name: "GM_openInTab", data: {url: url, open_in_background: open_in_background}});
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
 * @param {object} gm_details
 * @returns {void}
 */
function GM_xmlhttpRequest(gm_details) {
    // Counter für "eindeutige" Abfragen erhöhen
    message_counter++;

    // Wrapper für counter
    (function (counter) {

        let supported_events = ["onabort", "onerror", "onload", "onloadstart", "loadend", "onprogress", "onreadystatechange", "ontimeout"];
        for (let evt of supported_events) {
            if (typeof gm_details[evt] === "function") {
                backend_port.onMessage.addListener((response) => {
                    let event_name_for_backend = evt;
                    // entferne das Präfix "on"
                    if(/^on/.test(event_name_for_backend)){
                        event_name_for_backend = event_name_for_backend.replace(/^on/,"");
                    }
                    
                    if (response.name === "GM_xmlhttpRequest---" + event_name_for_backend + "-" + counter) {
                        gm_details[evt](response.data);
                    }
                });
            }
        }

        // Übergabe an die Backend Funktion!
        backend_port.postMessage({name: "GM_xmlhttpRequest", data: {
                details: {
                    url: gm_details.url
                        // OriginUrl hinzufügen, für den Fall einer relativen URL
                    , originUrl: window.location.origin
                    , timeout: gm_details.timeout
                    , ignoreCache: gm_details.ignoreCache
                    , synchronous: gm_details.synchronous
                    , user: gm_details.user
                    , password: gm_details.password
                    , headers: gm_details.headers
                    , binary: gm_details.binary
                    , data: gm_details.data
                    , method: gm_details.method
                    , overrideMimeType: gm_details.overrideMimeType
                }}, counter: counter});

    })(message_counter);
}

/**
 * 
 * @param {string} caption
 * @param {string} commandFunc
 * @param {string} accessKey
 * @returns {void}
 */
function GM_registerMenuCommand(caption, commandFunc, accessKey) {
    backend_port.postMessage({name: "GM_registerMenuCommand", data: {caption: caption,
            // Wandelt die Funktion in einen String um, ansonsten wird Sie einfach weggeworfen :/ ... 
            commandFunc: commandFunc.toString(),
            accessKey: accessKey}});
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



/**
 * GREASEMONKEY Funktionen --- STOP
 */

// EXPORT to window
win.GM_addStyle = GM_addStyle;
win.GM_deleteValue = GM_deleteValue;
win.GM_getResourceText = GM_getResourceText;
win.GM_getResourceURL = GM_getResourceURL;
win.GM_getValue = GM_getValue;
win.GM_getValue_async = GM_getValue_async;
win.GM_listValues = GM_listValues;
win.GM_log = GM_log;
win.GM_openInTab = GM_openInTab;
win.GM_registerMenuCommand = GM_registerMenuCommand;
win.GM_setClipboard = GM_setClipboard;
win.GM_setValue = GM_setValue;
win.GM_xmlhttpRequest = GM_xmlhttpRequest;
win.GM_info = GM_info;
win.unsafeWindow = unsafeWindow;

}(window, prefilled_data));

// prefilled_data entfernen
prefilled_data = null;