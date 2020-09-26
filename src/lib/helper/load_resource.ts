import { empty, url_ends_with_user_js, valid_url } from "lib/helper/basic_helper";

export default class load_resource {

    /**
     * Lädt ein Bild und gibt es als Datauri an die Callback Funktion weiter
     * @param url
     */
    public async loadImage(url: string): Promise<string> {
        if (!valid_url(url)) {
            throw new Error("ungültige URL");
        }
       /**
        * Konfiguration für fetch()
        */
        const fetchInit = {
            cache: "no-store",
            // Wichtig damit externe Dateien geladen werden können
            mode: "cors",
        } as RequestInit;

        const response = await fetch(url, fetchInit);
        if (response.ok === true) {
            const headers = response.headers as Headers;
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

        console.error("response from loadImage()");
        console.error(response);

        // Fehler ist aufgetreten
        throw new Error("Unbekannter Fehler ist aufgetreten in load_resource.loadImage()");
    }

    /**
     * Interner Funktions Wrapper für fetch()
     * @param url
     * @param charset
     */
    public async loadText(url: string, charset: string = "utf-8"): Promise<string> {
       /**
        * Konfiguration für fetch()
        */
        const headers = new Headers();
        headers.set("Content-Type", "text/plain; charset=" + charset);

        const fetchInit = {
            cache: "no-store",
            // Wichtig damit externe Dateien geladen werden können
            headers,
            mode: "cors",
        } as RequestInit;

        const response = await fetch(url, fetchInit);
        if (response.ok === true) {
            // Rückgabe des Textes
            return await response.text();
        }

        console.error("response from loadText()");
        console.error(response);

        // Fehler ist aufgetreten
        throw new Error("Unbekannter Fehler ist aufgetreten in load_resource.loadText()");
    }

    /**
     * Lädt den Inhalt einer Datei (dieser Extension) nach
     */
    public async load_internal_file(file_url: string): Promise<string> {
        const internal_file_url = browser.extension.getURL(file_url);
        const response = await this.loadText(internal_file_url);
        return response;
    }

    /**
     * Holt externe Skripte, und gibt bei Erfolg ein Promise zurück
     */
    public async load_userscript_by_url(url: string, charset: string = "utf-8"): Promise<string> {

        if (!valid_url(url)) {
            throw new Error("keine gültige URL übergeben");
        }

        const response = await this.loadText(url, charset);
        return response;
    }
}
