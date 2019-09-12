/************************************************************************
 ************************* Basic Funktionen *****************************
 ************************************************************************/

/**
 * Funktion zum umwandeln von Objekten in Strings
 *
 * http://stackoverflow.com/a/18368918
 * Source http://jsfiddle.net/numoccpk/1/
 *
 * @param {mixed} obj
 * @returns {String}
 */
export function convertToText(obj: any): string {
    // create an array that will later be joined into a string.
    const string = [];
    // is object
    //    Both arrays and objects seem to return "object"
    //    when typeof(obj) is applied to them. So instead
    //    I am checking to see if they have the property
    //    join, which normal objects don't have but
    //    arrays do.
    if (obj === "undefined") {
        return String(obj);
    } else if (typeof (obj) === "object" && (obj.join === "undefined")) {
        for (const prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                string.push(prop + ": " + convertToText(obj[prop]));
            }
        }
        return "{" + string.join(",") + "}";
        // is array
    } else if (typeof (obj) === "object" && !(obj.join === "undefined")) {
        for (const prop in obj) {
            string.push(convertToText(obj[prop]));
        }
        return "[" + string.join(",") + "]";
        // is function
    } else if (typeof (obj) === "function") {
        string.push(obj.toString());
        // all other values can be done with JSON.stringify
    } else {
        string.push(JSON.stringify(obj));
    }

    return string.join(",");
}

export function getSeconds() {
    return Math.floor(new Date().getTime() / 1000);
}

export function isset(v: any): boolean {
    return (typeof v !== "undefined");
}
export function getTranslation(str: string) {
    return browser.i18n.getMessage(str);
}
export function notify(text: string): Promise<string> {
    return browser.notifications.create(
        null,
        {
            type: "basic",
            title: "USI",
            iconUrl: browser.extension.getURL("/gui/icon/usi.png"),
            message: text,
        });
}
export function getExtId(): string {
    const manifest = browser.runtime.getManifest();
    if (manifest && manifest.applications && manifest.applications.gecko && manifest.applications.gecko.id === "string") {
        return manifest.applications.gecko.id;
    } else {
        // default
        return "firefox-addon-usi@jetpack";
    }
}
export function is_datauri(v: string): boolean {
    // wenn zu beginn, data: steht -> dann sollte es sich auch um eine DataURI handeln?!
    return (/^data:(.*)/.test(v));
}
export function valid_url(v: string): boolean {
    return /^(https?|file):\/\//.test(v);
}
export function url_ends_with_user_js(v: string): boolean {
    return /.*\.user([()\d]*)\.js$/.test(v);
}
export function empty(v: any): boolean {
    if (typeof v === "undefined" || v === "" || v === 0 || v === false || v === null) {
        return true;
    } else {
        return false;
    }
}
export function escapeHTMLEntities(str: string): string {
    return str.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
        return "&#" + i.charCodeAt(0) + ";";
    });
}
export function escapeRegExp(str: string): string {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
export function getFilenameFromURL(url: string): string {

    if (!empty(url)) {
        // http://example.com/img/image.png => image.png
        const url_suffix = String(url.split("/").pop());

        if (!empty(url_suffix)) {
            return url_suffix;
        }
    }

    return "";
}

/**
* erzeugt einen Download (Datei Speichern Dialog)
* @param {string} data
* @param {string} type
* @param {string} filename
* @returns {void}
*/
export function download_file(data: string, type?: string, filename?: string): void {
    const link = document.createElement("a");
    // Dateinamen angeben
    if (filename) {
        // z.B. %20 durch Leerzeichen ersetzen
        link.download = decodeURIComponent(filename);
    }

    // data type festlegen
    if (type) {
        link.href = "data:" + type;
    } else {
        link.href = "data:text/plain";
    }

    // Datenanhängen
    link.href += ";base64," + btoa(unescape(encodeURIComponent(data)));

    // Workaround, muss erst im DOM sein damit der click() getriggert werden kann m(
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
