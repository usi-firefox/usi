"use strict";

/* global basic_helper, browser */

var load_resource = (function () {

    let self = {
        /**
         * Lädt ein Bild und gibt es als Datauri an die Callback Funktion weiter
         * @param {string} url
         * @param {string} charset
         * @returns {Boolean|Promise}
         */
        load_image_or_text: function (url, charset) {
            if (!basic_helper.valid_url(url)) {
                return false;
            }
            var xhr = new window.XMLHttpRequest();

            xhr.open('GET', url, true);

            // Must include this line - specifies the response type we want
            xhr.responseType = 'arraybuffer';

            // ändere das angeforderte Charset, falls es gesetzt wurde
            if (!basic_helper.empty(charset) && basic_helper.is_string(charset)) {
                xhr.setRequestHeader("Content-Type", "text/plain; charset=" + charset);
            }

            var the_promise = new Promise((resolve, reject) => {

                xhr.onload = function () {
                    try {
                        if (xhr.status === 200) {
                            /**
                             * Abhängig vom Content-Type wird entschieden ob es es Bild ist,
                             * oder als es als Text behandelt wird, andere Datei Typen werden bisher
                             * nicht unterstützt!
                             */
                            var response_contenttype = xhr.getResponseHeader("Content-Type");

                            if (response_contenttype === null || basic_helper.empty(response_contenttype)) {
                                // Falls er leer sein sollte, setzte einfach => image/png
                                response_contenttype = "text/plain";
                            }

                            var arr = new Uint8Array(xhr.response);

                            // Convert the int array to a binary string
                            // We have to use apply() as we are converting an *array*
                            // and String.fromCharCode() takes one or more single values, not
                            // an array.
                            var raw = String.fromCharCode.apply(null, arr);

                            // Falls der Content-Type mit "image" beginnt, wird dieses als base64 encodierter String zurückgegeben
                            if (/^image/.test(response_contenttype)) {
                                if (!basic_helper.empty(raw)) {
                                    // Arrow Funktion ohne geschweifete Klammer, gibt das Ergebnis wie "return" zurück
                                    var base64 = {encode: (a) => window.btoa(a), decode: (a) => window.atob(a)};
                                    
                                    // die Data URI an die Callback Funktion übergeben!
                                    resolve("data:" + response_contenttype + ";base64," + base64.encode(raw), response_contenttype);
                                }
                            } else {
                                if (!basic_helper.empty(raw)) {
                                    // sehr verwahrscheinlich handelt es sich um einen Text
                                    resolve(raw, response_contenttype);
                                }
                            }
                        } else {
                            reject({url: url, code: xhr.status, XMLHttpRequest: xhr});
                        }

                    } catch (exception) {
                        console.error("Exception in load_resource.js:load_image_or_text()");
                        console.error(exception);
                        return false;
                    }
                };

                xhr.onerror = function (xhr_response) {
                    reject(xhr_response);
                };
            });

            // Request starten
            xhr.send();
            
            return the_promise;
        }
        
        , load_userscript_by_url_promise: function (url_str, charset) {
            return new Promise((resolve,reject) => {
                self.load_userscript_by_url(url_str, charset, resolve, reject);
            });
        }
        
        /**
         * Lädt den Inhalt einer Datei (dieser Extension) nach
         * @param {string} abs_file_url
         * @returns {string} Dateiinhalt
         */
        , load_internal_file : async function(file_url){
            let response = await load_resource.load_by_url(browser.extension.getURL(file_url), null);
            return response.target.responseText;
        }
        /**
         * lädt etwas per XMLHttpRequest()
         * @param {string} url_str
         * @param {string} charset
         * @returns {Promise}
         */
        , load_by_url : function(url_str, charset) {
            
            var xhr = new window.XMLHttpRequest();
            // Falls kein Charset gesetzt wurde
            if (typeof charset === "undefined" || charset === null) {
                charset = "utf-8";
                //charset = "cp1252";
            }
            try {
                xhr.open("GET", url_str, true);
                xhr.overrideMimeType("text/plain; charset=" + charset);
                let return_promise = new Promise((resolve,reject) => {
                    xhr.addEventListener("load", resolve);
                    xhr.addEventListener("error", reject);
                });
                // Request mit den zuvor definierten Optionen ausführen
                xhr.send();

                return return_promise;
            } catch (e) {
                // Fehler ist aufgetreten
                return false;
            }
        }
        /**
         * Holt externe Skripte, und gibt bei Erfolg ein Promise zurück
         * @param {string} url_str
         * @param {string} charset
         * @param {function} success_callback
         * @param {function} error_callback
         * @returns {Boolean}
         */
        , load_userscript_by_url: function (url_str, charset, success_callback, error_callback) {

            // Nur wenn am Ende der URL ein .user.js steht!
            if (!basic_helper.url_ends_with_user_js(url_str)) {
                // keine .user.js Endung
                return false;
            }

            if (!basic_helper.valid_url(url_str)) {
                // keine gültige URL übergeben
                return false;
            }

            var xhr = new window.XMLHttpRequest();
            // Falls kein Charset gesetzt wurde
            if (typeof charset === "undefined" || charset === null) {
                charset = "utf-8";
                //charset = "cp1252";
            }
            try {
                
                xhr.open("GET", url_str, true);
                // Damit der Request immer "frisch" ist
                xhr.setRequestHeader("Cache-control", "no-cache");

                xhr.overrideMimeType("text/plain; charset=" + charset);

                xhr.addEventListener("load", success_callback);
                xhr.addEventListener("error", error_callback);

                // Request mit den zuvor definierten Optionen ausführen
                xhr.send();

                return true;
            } catch (e) {
                // Fehler ist aufgetreten
                return false;
            }
        }
    };

    return self;
}());