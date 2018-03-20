import basic_helper from "lib/helper/basic_helper";

declare function unescape(s:string): string;

/**
 * erzeugt einen Download (Datei Speichern Dialog)
 * @param {string} data
 * @param {string} type
 * @param {string} filename
 * @returns {void}
 */
export default function download_controller(data: string, type?: string, filename?: string) : void {
    var link = document.createElement("a");
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