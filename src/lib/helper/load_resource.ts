import { valid_url, empty, url_ends_with_user_js } from "lib/helper/basic_helper";

export default class load_resource {

    /**
     * Lädt ein Bild und gibt es als Datauri an die Callback Funktion weiter
     * @param url 
     */
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
            throw "Unbekannter Fehler ist aufgetreten in loadText()";
        }
    }

    /**
     * Lädt den Inhalt einer Datei (dieser Extension) nach
     */
    async load_internal_file(file_url: string): Promise<string> {
        const internal_file_url = browser.extension.getURL(file_url);
        const response = await this.loadText(internal_file_url);
        return response;
    }

    /**
     * Holt externe Skripte, und gibt bei Erfolg ein Promise zurück
     */
    async load_userscript_by_url(url: string, charset: string = "utf-8"): Promise<string> {

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