 // Strict Mode aktivieren!
/************************************************************************
 ************************* Basic Funktionen! *************************
 ************************************************************************/

import basic_helper from "lib/helper/basic_helper";



export default function GM_xhrHandler() {

    var self = {
        init: function (details: usi.GM_Backend.GM_xhr, counter: number, port: browser.runtime.Port) {
            // Init der XMLHttpRequest Funktion
            var xhr = new XMLHttpRequest();

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

            self.createSimpleRequestEvent(xhr, "load", counter, port);
            self.createSimpleRequestEvent(xhr, "loadstart", counter, port);
            self.createSimpleRequestEvent(xhr, "loadend", counter, port);
            self.createSimpleRequestEvent(xhr, "abort", counter, port);
            self.createSimpleRequestEvent(xhr, "progress", counter, port);
            self.createSimpleRequestEvent(xhr, "error", counter, port);
            self.createSimpleRequestEvent(xhr, "readystatechange", counter, port);
            self.createSimpleRequestEvent(xhr, "timeout", counter, port);

            /****************
             * EVENTS - END *
             ****************/

            var method;
            // Wenn method gesetzt wurde
            if (details.method && typeof details.method === "string") {
                // immer Großschreiben! Wenn möglich
                method = details.method.toUpperCase();
            } else {
                // Falls keine Methode angegeben wurde!
                method = "GET";
            }

            // URL setzen
            var url;
            if (typeof details.url === "string") {
                // Überprüfe die URL ob diese in Ordnung ist
                url = self.checkUrl(details.url, details.originUrl);

                // Fügt einen extra Parameter der URL hinzu, um das Cache zu umgehen
                if (details.ignoreCache) {
                    url = url + ((/\?/).test(url) ? "&" : "?") + (new Date()).getTime();
                }

            } else {
                throw "url is not a string";
            }

            // Username, Passwort setzen
            var user = (typeof details.user === "string") ? details.user : "";
            var pass = (typeof details.password === "string") ? details.password : "";

            // Xhr Optionen setzen
            xhr.open(method, url, true , user, pass);

            // Header
            if (details.headers && typeof details.headers === "object") {
                // Keys auslesen
                var header_keys = Object.keys(details.headers);

                for (let i in header_keys) {
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
                for (let i: number = 0; i < data.length; i++) {
                    dataData[i] = data.charCodeAt(i) & 0xff;
                }
                // sendAsBinary() ist deprecated seit 
                xhr.send(new Blob([dataData]));
            } else {
                // Standard Variante, also KEINE Binary übergabe!
                xhr.send(data);
            }

        },
        createSimpleRequestEvent: function (xhr: XMLHttpRequest, event: string, counter: number, port: browser.runtime.Port) {

            xhr.addEventListener(event, function (evt: any) {
                try {
                    // res -> responseState
                    var res = {};
                    // Die Events haben selbstverständlich unterschiedliche Eigenschaften
                    switch (event) {
                        // Spezial Fall progress
                        case "progress":
                            res = {
                                lengthComputable: evt.lengthComputable,
                                loaded: evt.loaded,
                                total: evt.total
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

                    // Rückgabe
                    port.postMessage({ name: "GM_xmlhttpRequest---" + event + "-" + counter, data: res, counter: counter });

                } catch (ignore) {

                }
            });
        },
        checkUrl: function (test_url: string, originUrl: string): string {
            // falls die gesamte Url korrekt ist
            if (basic_helper().valid_url(test_url) === true) {
                return test_url;
            } else {
                // versuche die URL mithilfe der originUrl zusammen zu bauen
                if (typeof originUrl === "string") {

                    // Origin URL plus "test_url", falls diese relativ ist
                    if (basic_helper().valid_url(originUrl + "/" + test_url)) {
                        return originUrl + "/" + test_url;
                    }
                }
            }

            // Ansonsten liefere immer false!
            throw "url not valid";

        }
    }

    return self;
};