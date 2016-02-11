"use strict"; // Strict Mode aktivieren!
/************************************************************************
 ************************* Basic Funktionen! *************************
 ************************************************************************/

/* global exports */

var GM_xhrHandler = {
	init: function (details, counter, worker) {
		// Init der XMLHttpRequest Funktion
		var xhr = require("sdk/net/xhr").XMLHttpRequest();

		/**
		 * (2016-02-11)		https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
		 *	mozAnon
		 *		Boolean: Setting this flag to true will cause the browser not to expose the origin and user credentials 
		 *		when fetching resources. Most important, this means that cookies will not be sent unless
		 *		explicitly added using setRequestHeader.
		 * 
		 *	mozSystem
		 *	Boolean: Setting this flag to true allows making cross-site connections 
		 *	without requiring the server to opt-in using CORS. Requires setting mozAnon: true, 
		 *	i.e. this can't be combined with sending cookies or other user credentials. 
		 *	This only works in privileged (reviewed) apps; it does not work on arbitrary webpages loaded in Firefox. 
		 */

		// Muss true sein, sonst wird mozSystem nicht akzeptiert
//					xhr.mozAnon = true;
		// If true, the same origin policy will not be enforced on the request.
//					xhr.mozSystem = true;

		// Nicht unterstützte Optionen
		var unsupported_options = ["context", "upload"];

		// Wenn timeout angegeben ist, ansonsten 0
		if (typeof details.timeout === "number") {
			xhr.timeout = details.timeout;
		}

		// MimeType überschreiben
		if (details.overrideMimeType && typeof details.overrideMimeType === "string") {
			// keine Plausibilitätsprüfung
			xhr.overrideMimeType(details.overrideMimeType);
		}

		/******************
		 * EVENTS - START *
		 ******************/

		// Abort
//					if (details.onabort && typeof details.onabort === "string") {
//						xhr.onabort = createFunctionFromString(details.onabort);
//					}
//					// Error
//					if (details.onerror && typeof details.onerror === "string") {
//						xhr.onerror = createFunctionFromString(details.onerror);
//					}
//					// Load
//					if (details.onload && typeof details.onload === "string") {
//						xhr.onload = createFunctionFromString(details.onload);
//					}
//					// Progress
//					if (details.onprogress && typeof details.onprogress === "string") {
//						xhr.onprogress = createFunctionFromString(details.onprogress);
//					}
//					// ReadyStateChange
//					if (details.onreadystatechange && typeof details.onreadystatechange === "string") {
//						xhr.onreadystatechange = createFunctionFromString(details.onreadystatechange);
//					}
//					// Timeout
//					if (details.ontimeout && typeof details.ontimeout === "string") {
//						xhr.ontimeout = createFunctionFromString(details.ontimeout);
//					}

					
		this.createSimpleRequestEvent(xhr, "load", counter, worker);
		this.createSimpleRequestEvent(xhr, "abort", counter, worker);
		this.createSimpleRequestEvent(xhr, "progress", counter, worker);
		this.createSimpleRequestEvent(xhr, "error", counter, worker);
		this.createSimpleRequestEvent(xhr, "readystatechange", counter, worker);
		this.createSimpleRequestEvent(xhr, "timeout", counter, worker);

		/****************
		 * EVENTS - END *
		 ****************/


		var method;
		// Wenn method gesetzt wurde
		if (details.method && typeof details.method === "string") {
			// immer Großschreiben! Wenn möglich
			if (typeof details.method.toUpperCase === "function") {
				method = details.method.toUpperCase();
			} else {
				method = details.method;
			}
		} else {
			// Falls keine Methode angegeben wurde!
			method = "GET";
		}


		// URL setzen
		var url;
		if (typeof details.url === "string") {
			// @todo URI Type prüfen
//						if(usiOptions.allow_other_uri_types === true){

//						}

			url = details.url;

		} else {
			throw {err_code: 551, err_text: "GM_xmlhttpRequest-> URL is not a string"};
		}

		// Username, Passwort setzen
		var user = (typeof details.user === "string") ? details.user : "";
		var synchronous = (typeof details.synchronous === "boolean") ? details.synchronous : true;
		var pass = (typeof details.password === "string") ? details.password : "";

		// Xhr Optionen setzen
		xhr.open(method, url, synchronous, user, pass);


		// Header
		if (details.headers && typeof details.headers === "object") {
			// Keys auslesen
			var header_keys = Object.keys(details.headers);

			for (var i in header_keys) {
				// Headers bei Bedarf setzen
				xhr.setRequestHeader(header_keys[i], details.headers[header_keys[i]]);
			}
		}

		/******************************************
		 * Senden, normal oder als binär Variante *
		 ******************************************/
		// Wenn Daten mit übergeben falls vorhanden
		var data = details.data ? details.data : null;

		// als Binary senden, wenn data gesetzt ist
		if (details.binary && (data !== null)) {
			var dataData = new Uint8Array(data.length);
			for (var i = 0; i < data.length; i++) {
				dataData[i] = data.charCodeAt(i) & 0xff;
			}
			// sendAsBinary() ist deprecated seit 
			xhr.send(new Blob([dataData]));
		} else {
			// Standard Variante, also KEINE Binary übergabe!
			xhr.send(data);
		}


	},
	
	createFunctionFromString: function (func) {
		return new Function("return " + func)();
	},
	
	createSimpleRequestEvent: function (xhr, event, counter, worker) {
		xhr.addEventListener(event, function () {
			var responseState = {
				readyState: xhr.readyState,
				response: xhr.response,
				responseHeaders: xhr.responseHeaders,
				responseText: xhr.responseText,
				responseXML: xhr.responseXML,
				status: xhr.status,
				statusText: xhr.statusText
			};
			
			// Rückgabe
			worker.port.emit("GM-FRONTEND-xmlhttpRequest---" + event + "-" + counter, responseState);
		});
	},
	
	createRequestEvent: function (request, event, details) {

		var eventCallback = details["on" + event];
		if (!eventCallback) {
			return;
		}

		request.addEventListener(event, function (evt) {
			var responseState = {
				context: null,
				finalUrl: null,
				lengthComputable: null,
				loaded: null,
				readyState: request.readyState,
				response: request.response,
				responseHeaders: null,
				responseText: null,
				responseXML: null,
				status: null,
				statusText: null,
				total: null
			};

			try {
				responseState.responseText = request.responseText;
			} catch (e) {
				// Some response types don't have .responseText (but do have e.g. blob
				// .response).  Ignore.
			}

			var responseXML = null;
			try {
				responseXML = request.responseXML;
			} catch (e) {
				// Ignore failure.  At least in responseType blob case, this access fails.
			}
//    if (responseXML) {
//      // Clone the XML object into a content-window-scoped document.
//      var xmlDoc = new wrappedContentWin.Document();
//      var clone = xmlDoc.importNode(responseXML.documentElement, true);
//      xmlDoc.appendChild(clone);
//      responseState.responseXML = xmlDoc;
//    }

			switch (event) {
				case "progress":
					responseState.lengthComputable = evt.lengthComputable;
					responseState.loaded = evt.loaded;
					responseState.total = evt.total;
					break;
				case "error":
					break;
				default:
					if (4 !== request.readyState) {
						break;
					}
					responseState.responseHeaders = request.getAllResponseHeaders();
					responseState.status = request.status;
					responseState.statusText = request.statusText;
					responseState.finalUrl = request.channel.URI.spec;
					break;
			}

		});
	}
};

// nötig damit es auch im Content Script verwendet werden kann!!!
if (typeof exports !== "undefined") {
	exports.GM_xhrHandler = GM_xhrHandler;
}