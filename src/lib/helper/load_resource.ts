import { valid_url, empty, url_ends_with_user_js } from "lib/helper/basic_helper";

export default class load_resource {

    async loadImage(url: string) : Promise<string> {
        if (!valid_url(url)) {
            throw "ungültige URL";
        }
        /**
        * Konfiguration für fetch()
        */
        const fetchInit = <RequestInit>{
            cache: "no-store",
            // Wichtig damit externe Dateien geladen werden können
            mode: "cors"
        };

        try {
            const response = await fetch(url, fetchInit);
            if (response.ok === true) {
                const headers = <Headers>response.headers;
                const mimetype = headers.get("content-type");

                // Bild in Base64 umwandeln
                const buffer = await response.arrayBuffer();
                const arr = new Uint8Array(buffer) as any;

                // Convert the int array to a binary string
                // We have to use apply() as we are converting an *array*
                // and String.fromCharCode() takes one or more single values, not
                // an array.
                const raw = String.fromCharCode.apply(null, arr);
                const base64 = window.btoa(raw);

                return "data:" + mimetype + ";base64," + base64;
            }

            // Unbekannter Fehler
            throw response;
        } catch (exception) {
            console.error('exception');
            console.error(exception);

            // Fehler ist aufgetreten
            throw "Unbekannter Fehler ist aufgetreten in loadImage()";
        }
    }

    /**
     * Lädt ein Bild und gibt es als Datauri an die Callback Funktion weiter
     * @param {string} url
     * @param {string} charset
     * @returns {Boolean|Promise}
     */
    load_image_or_text(url: string, charset?: string): Promise<any> | boolean {
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
     * Interner Funktions Wrapper für fetch()
     * @param url 
     * @param charset 
     */
    async loadText(url: string, charset: string = "utf-8"): Promise<string> {
        /**
        * Konfiguration für fetch()
        */
        const headers = new Headers();
        headers.set("Content-Type", "text/plain; charset=" + charset);

        const fetchInit = <RequestInit>{
            cache: "no-store",
            // Wichtig damit externe Dateien geladen werden können
            mode: "cors",
            headers: headers
        };

        try {
            const response = await fetch(url, fetchInit);
            if (response.ok === true) {
                // Rückgabe des Textes
                return await response.text();
            }

            // Unbekannter Fehler
            throw response;
        } catch (exception) {
            console.error('exception');
            console.error(exception);

            // Fehler ist aufgetreten
            throw "Unbekannter Fehler ist aufgetreten in load_userscript_by_url()";
        }
    }

    /**
     * Lädt den Inhalt einer Datei (dieser Extension) nach
     */
    async load_internal_file(file_url: string) {
        const internal_file_url = browser.extension.getURL(file_url);
        const response = await this.loadText(internal_file_url);
        return response;
    }

    /**
     * Holt externe Skripte, und gibt bei Erfolg ein Promise zurück
     */
    async load_userscript_by_url(url: string, charset: string = "utf-8"): Promise<any> {

        if (!url_ends_with_user_js(url)) {
            // Nur URL erlaubt die mit .user.js endet
            throw "keine .user.js Endung";
        }

        if (!valid_url(url)) {
            throw "keine gültige URL übergeben";
        }

        const response = await this.loadText(url, charset);
        return response;
    }
}