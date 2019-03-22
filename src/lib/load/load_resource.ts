import { valid_url, empty, url_ends_with_user_js } from "lib/helper/basic_helper";

export default function load_resource() {

    let self = {
        /**
         * Lädt ein Bild und gibt es als Datauri an die Callback Funktion weiter
         * @param {string} url
         * @param {string} charset
         * @returns {Boolean|Promise}
         */
        load_image_or_text: function (url: string, charset?: string): Promise<any> | boolean {
            if (!valid_url(url)) {
                return false;
            }
            const xhr = new XMLHttpRequest();

            xhr.open('GET', url, true);

            // Must include this line - specifies the response type we want
            xhr.responseType = 'arraybuffer';

            // ändere das angeforderte Charset, falls es gesetzt wurde
            if (!empty(charset)) {
                xhr.setRequestHeader("Content-Type", "text/plain; charset=" + charset);
            }

            const the_promise = new Promise((resolve: any, reject: any) => {

                xhr.onload = function () {
                    try {
                        if (xhr.status === 200) {
                            /**
                             * Abhängig vom Content-Type wird entschieden ob es es Bild ist,
                             * oder als es als Text behandelt wird, andere Datei Typen werden bisher
                             * nicht unterstützt!
                             */
                            let response_contenttype = xhr.getResponseHeader("Content-Type");

                            if (response_contenttype === null || empty(response_contenttype)) {
                                // Falls er leer sein sollte, setzte einfach => image/png
                                response_contenttype = "text/plain";
                            }

                            const arr = new Uint8Array(xhr.response) as any;

                            // Convert the int array to a binary string
                            // We have to use apply() as we are converting an *array*
                            // and String.fromCharCode() takes one or more single values, not
                            // an array.
                            const raw = String.fromCharCode.apply(null, arr);

                            // Falls der Content-Type mit "image" beginnt, wird dieses als base64 encodierter String zurückgegeben
                            if (/^image/.test(response_contenttype)) {
                                if (!empty(raw)) {
                                    // Arrow Funktion ohne geschweifete Klammer, gibt das Ergebnis wie "return" zurück
                                    const base64_encoded = window.btoa(raw);

                                    // die Data URI an die Callback Funktion übergeben!
                                    resolve("data:" + response_contenttype + ";base64," + base64_encoded, response_contenttype);
                                }
                            } else {
                                if (!empty(raw)) {
                                    // sehr verwahrscheinlich handelt es sich um einen Text
                                    resolve(raw, response_contenttype);
                                }
                            }
                        } else {
                            reject({ url: url, code: xhr.status, XMLHttpRequest: xhr });
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

        /**
         * Lädt den Inhalt einer Datei (dieser Extension) nach
         * @param {string} abs_file_url
         * @returns {string} Dateiinhalt
         */
        , load_internal_file: async function (file_url: string) {

            const internal_file_url = browser.extension.getURL(file_url);
            const xhr = new XMLHttpRequest();
            const file = new Promise((resolve, reject) => {
                try {
                    xhr.open("GET", internal_file_url, true);
                    xhr.overrideMimeType("text/plain; charset=utf-8");
                    xhr.addEventListener("load", resolve);
                    xhr.addEventListener("error", reject);
                    // Request mit den zuvor definierten Optionen ausführen
                    xhr.send();

                    return;
                } catch (e) {
                    // Fehler ist aufgetreten
                    reject("Unbekannter Fehler in load_internal_file()");
                    return;
                }
            });

            try {
                const response = await <any>file;
                if(!response.target.responseText){
                    throw "kein response.target.responseText in load_internal_file()";
                }

                return response.target.responseText;

            } catch (err) {
                throw err;
            }
        }
        /**
         * lädt etwas per XMLHttpRequest()
         * @param {string} url_str
         * @param {string} charset
         * @returns {Promise}
         */
        , load_by_url: function (url_str: string, charset: string = "utf-8"): Promise<any> | boolean {

            const xhr = new XMLHttpRequest();
            try {
                xhr.open("GET", url_str, true);
                xhr.overrideMimeType("text/plain; charset=" + charset);
                let return_promise = new Promise((resolve, reject) => {
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
         * @returns {Boolean}
         */
        , load_userscript_by_url: function (url_str: string, charset: string = "utf-8"): Promise<any> {

            return new Promise((resolve, reject) => {

                if (!url_ends_with_user_js(url_str)) {
                    // Nur URL erlaubt die mit .user.js endet
                    reject("keine .user.js Endung");
                    return false;
                }

                if (!valid_url(url_str)) {
                    reject("keine gültige URL übergeben");
                    return false;
                }

                const xhr = new XMLHttpRequest();
                try {

                    xhr.open("GET", url_str, true);
                    // Damit der Request immer "frisch" ist
                    xhr.setRequestHeader("Cache-control", "no-cache");

                    xhr.overrideMimeType("text/plain; charset=" + charset);

                    xhr.addEventListener("load", resolve);
                    xhr.addEventListener("error", reject);

                    // Request mit den zuvor definierten Optionen ausführen
                    xhr.send();

                    return true;
                } catch (e) {
                    // Fehler ist aufgetreten
                    reject("Unbekannter Fehler ist aufgetreten in load_userscript_by_url()");
                    return false;
                }

            });
        }
    };

    return self;
}