

import basic_helper from "lib/helper/basic_helper";



export default function download_controller() {
    var self = {
        /**
         * erzeugt einen Download (Datei Speichern Dialog)
         * @param {string} data
         * @param {string} type
         * @param {string} filename
         * @returns {void}
         */
        download: function (data: any, type: any, filename: any) {
            var link = document.createElement("a");
            // Dateinamen angeben
            if (!basic_helper().empty(filename)) {
                // z.B. %20 durch Leerzeichen ersetzen
                link.download = decodeURIComponent(filename);
            }

            // data type festlegen
            link.href = "data:";
            if (!basic_helper().empty(type)) {
                link.href += type;
            } else {
                link.href += "text/plain";
            }

            // Datenanhängen
            link.href += ";base64," + btoa(unescape(encodeURIComponent(data)));

            // Workaround, muss erst im DOM sein damit der click() getriggert werden kann m(
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return self;
}