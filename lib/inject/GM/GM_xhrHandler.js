"use strict"; // Strict Mode aktivieren!
/************************************************************************
 ************************* Basic Funktionen! *************************
 ************************************************************************/

/* global exports */

var GM_xhrHandler = {
	init: function (details, counter, worker) {

		try {

			// Init der XMLHttpRequest Funktion
			var xhr1 = require("sdk/net/xhr");
			var xhr = new xhr1.XMLHttpRequest();

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
			var unsupported_options = ["context", "upload", "synchronous"];

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

			this.createSimpleRequestEvent(xhr, "load", counter, worker);
			this.createSimpleRequestEvent(xhr, "loadstart", counter, worker);
			this.createSimpleRequestEvent(xhr, "loadend", counter, worker);
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
//			if(usiOptions.allow_other_uri_types === true){
//
//			}
				// Überprüfe die URL ob diese in Ordnung ist
				url = this.checkUrl(details.url, details.originUrl);

				// ungültige URL
				if (url === false) {
					// Error-Code senden
					throw {err_code: 550, err_text: "URL is malformed"};
				}
			} else {
				throw {err_code: 551, err_text: "URL is not a string"};
			}

			// Username, Passwort setzen
			var user = (typeof details.user === "string") ? details.user : "";
			var asynchronous = (typeof details.synchronous === "boolean") ? !details.synchronous : true;
			var pass = (typeof details.password === "string") ? details.password : "";

			if (asynchronous !== true) {
				/**
				 * Falls ein syncroner Abruf verlangt wurde, setze ihn wieder zurück auf einen asyncronen
				 * Da dies momentan nicht unterstützt wird!
				 * 
				 *  Sende zusätzlich einen Fehlertext zurück! 
				 */

				// Error-Code senden
				worker.port.emit("GM-FRONTEND-ERROR",
						{
							func: "GM_xmlhttpRequest",
							reason: "Only Asyncronous calls are permitted!",
							object: details
						});

				// zurücksetzen auf async
				asynchronous = true;
			}

			// Xhr Optionen setzen
			xhr.open(method, url, asynchronous, user, pass);

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

		} catch (e) {

			// DEBUG
//			console.log("exception");
//			console.log(typeof e); 
//			console.log(e.message);              
//			console.log(e.name);                 
//			console.log(e.fileName);             
//			console.log(e.lineNumber);           
//			console.log(e.columnNumber);         
//			console.log(e.stack);

			// Error-Code senden
			worker.port.emit("GM-FRONTEND-ERROR",
					{
						code: e.err_code,
						func: "GM_xmlhttpRequest",
						reason: e.err_text,
						object: details
					});

			return false;
		}

	},
	createFunctionFromString: function (func) {
		return new Function("return " + func)();
	},
	createSimpleRequestEvent: function (xhr, event, counter, worker) {
		
		xhr.addEventListener(event, function (evt) {
			try {
				// res -> responseState
				var res = {};
				// Die Events haben selbstverständlich unterschiedliche Eigenschaften
				switch (event) {
					// Spezial Fall progress
					case "progress" :
							res = {
								lengthComputable : evt.lengthComputable,
								loaded : evt.loaded,
								total : evt.total
							};
						break;

					default:
						res = {
							readyState: xhr.readyState,
							response: xhr.response,
							responseHeaders: xhr.getAllResponseHeaders(),
							responseText: xhr.responseText,
							responseXML: xhr.responseXML,
							status: xhr.status,
							statusText: xhr.statusText
						};
						break;
				}
			} catch (ignore) {
				
			}
				// Rückgabe
				worker.port.emit("GM-FRONTEND-xmlhttpRequest---" + event + "-" + counter, res);
		});
	},
	checkUrl: function (test_url, originUrl) {

		var url_c = require("sdk/url");

		// falls die gesamte Url korrekt ist
		if (url_c.isValidURI(test_url) === true) {
			return test_url;
		} else {
			// versuche die URL mithilfe der originUrl zusammen zu bauen
			if (typeof originUrl === "string") {

				// Origin URL plus "test_url", falls diese relativ ist
				if (url_c.isValidURI(originUrl + "/" + test_url)) {
					return originUrl + "/" + test_url;
				}
			}
		}

		// Ansonsten liefere immer false!
		return false;

	}
};

// nötig damit es auch im Content Script verwendet werden kann!!!
if (typeof exports !== "undefined") {
	exports.GM_xhrHandler = GM_xhrHandler;
}