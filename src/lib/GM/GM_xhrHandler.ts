/************************************************************************
 ************************* Basic Funktionen! *************************
 ************************************************************************/

import { valid_url } from "lib/helper/basic_helper";

export default function GM_xhrHandler() {

    const self = {
        init(details: usi.GM_Backend.GM_xhr, counter: number, port: browser.runtime.Port) {
            // Init der XMLHttpRequest Funktion
            const xhr = new XMLHttpRequest();

            /**
             * (2016-02-11)    https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
             *  mozAnon
             *    Boolean: Setting this flag to true will cause the browser not to expose the origin and user credentials
             *    when fetching resources. Most important, this means that cookies will not be sent unless
             *    explicitly added using setRequestHeader.
             *
             *  mozSystem
             *  Boolean: Setting this flag to true allows making cross-site connections
             *  without requiring the server to opt-in using CORS. Requires setting mozAnon: true,
             *  i.e. this can't be combined with sending cookies or other user credentials.
             *  This only works in privileged (reviewed) apps; it does not work on arbitrary webpages loaded in Firefox.
             */

            // Muss true sein, sonst wird mozSystem nicht akzeptiert
            // 					xhr.mozAnon = true;
            // If true, the same origin policy will not be enforced on the request.
            // 					xhr.mozSystem = true;

            // Nicht unterstützte Optionen
            const unsupported_options = ["context", "upload", "synchronous"];

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

            let method;
            // Wenn method gesetzt wurde
            if (details.method && typeof details.method === "string") {
                // immer Großschreiben! Wenn möglich
                method = details.method.toUpperCase();
            } else {
                // Falls keine Methode angegeben wurde!
                method = "GET";
            }

            // URL setzen
            let url;
            if (typeof details.url === "string") {
                // Überprüfe die URL ob diese in Ordnung ist
                url = self.checkUrl(details.url, details.originUrl);

                // Fügt einen extra Parameter der URL hinzu, um das Cache zu umgehen
                if (details.ignoreCache) {
                    url = url + ((/\?/).test(url) ? "&" : "?") + (new Date()).getTime();
                }

            } else {
                throw new Error("url is not a string");
            }

            // Username, Passwort setzen
            const user = (typeof details.user === "string") ? details.user : "";
            const pass = (typeof details.password === "string") ? details.password : "";

            // Xhr Optionen setzen
            xhr.open(method, url, true, user, pass);

            // Header
            if (details.headers && typeof details.headers === "object") {
                // Keys auslesen
                const header_keys = Object.keys(details.headers);

                for (const i in header_keys) {
                    if (!header_keys[i]) {
                        continue;
                    }
                    // Headers bei Bedarf setzen
                    xhr.setRequestHeader(header_keys[i], details.headers[header_keys[i]]);
                }
            }

            /******************************************
             * Senden, normal oder als binär Variante *
             ******************************************/
            // Wenn Daten mit übergeben falls vorhanden
            const data = details.data ? details.data : null;

            // als Binary senden, wenn data gesetzt ist
            if (details.binary && (data !== null)) {
                const dataData = new Uint8Array(data.length);
                for (let i: number = 0; i < data.length; i++) {
                    // tslint:disable-next-line:no-bitwise
                    dataData[i] = data.charCodeAt(i) & 0xff;
                }
                // sendAsBinary() ist deprecated seit
                xhr.send(new Blob([dataData]));
            } else {
                // Standard Variante, also KEINE Binary übergabe!
                xhr.send(data);
            }

        },
        createSimpleRequestEvent(xhr: XMLHttpRequest, event: string, counter: number, port: browser.runtime.Port) {

            xhr.addEventListener(event, (evt: any) => {
                try {
                    // res -> responseState
                    let res = {};
                    // Die Events haben selbstverständlich unterschiedliche Eigenschaften
                    switch (event) {
                        // Spezial Fall progress
                        case "progress":
                            res = {
                                lengthComputable: evt.lengthComputable,
                                loaded: evt.loaded,
                                total: evt.total,
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
                                statusText: xhr.statusText,
                            };
                            break;
                    }

                    // Rückgabe
                    port.postMessage({ name: "GM_xmlhttpRequest---" + event + "-" + counter, data: res, counter });

                } catch (exception) {
                    console.error("exception in GM_xhrHandler.createSimpleRequestEvent()");
                    if ((exception as Error).message) {
                        console.error((exception as Error).message);
                    } else {
                        console.error(exception);
                    }
                }
            });
        },
        checkUrl(test_url: string, originUrl: string): string {
            // falls die gesamte Url korrekt ist
            if (valid_url(test_url) === true) {
                return test_url;
            } else {
                // versuche die URL mithilfe der originUrl zusammen zu bauen
                if (typeof originUrl === "string") {

                    // Origin URL plus "test_url", falls diese relativ ist
                    if (valid_url(originUrl + "/" + test_url)) {
                        return originUrl + "/" + test_url;
                    }
                }
            }

            // Ansonsten liefere immer false!
            throw new Error("url not valid");

        },
    };

    return self;
}
