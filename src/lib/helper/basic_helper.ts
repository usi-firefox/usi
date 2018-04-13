/************************************************************************
 ************************* Basic Funktionen *****************************
 ************************************************************************/

export default function basic_helper() {

    const self = {
        /**
         * Funktion zum umwandeln von Objekten in Strings
         * 
         * http://stackoverflow.com/a/18368918
         * Source http://jsfiddle.net/numoccpk/1/
         * 
         * @param {mixed} obj
         * @returns {String}
         */
        convertToText: function (obj: any): string {
            //create an array that will later be joined into a string.
            let string = [];
            //is object
            //    Both arrays and objects seem to return "object"
            //    when typeof(obj) is applied to them. So instead
            //    I am checking to see if they have the property
            //    join, which normal objects don't have but
            //    arrays do.
            if (obj === "undefined") {
                return String(obj);
            } else if (typeof (obj) === "object" && (obj.join === "undefined")) {
                for (let prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        string.push(prop + ": " + self.convertToText(obj[prop]));
                    }
                }
                return "{" + string.join(",") + "}";
                //is array
            } else if (typeof (obj) === "object" && !(obj.join === "undefined")) {
                for (let prop in obj) {
                    string.push(self.convertToText(obj[prop]));
                }
                return "[" + string.join(",") + "]";
                //is function
            } else if (typeof (obj) === "function") {
                string.push(obj.toString());
                //all other values can be done with JSON.stringify
            } else {
                string.push(JSON.stringify(obj));
            }

            return string.join(",");
        },

        isset: function (v: any): boolean {
            return (typeof v !== "undefined");
        },
        notify: function (text: string): Promise<string> {
            return browser.notifications.create(
                null,
                {
                    type: "basic",
                    title: "USI",
                    iconUrl: browser.extension.getURL("/gui/icon/usi.png"),
                    message: text
                });
        },
        addScriptLink: function (srcLink: string): string {
            if (srcLink) {
                return "<script type=\"text/javascript\" src=\"" + browser.extension.getURL(srcLink) + "\" ></script>";
            } else {
                return "";
            }
        },
        getExtId: function (): string {
            const manifest = <any>browser.runtime.getManifest();
            if (typeof manifest === "object" && typeof manifest.applications.gecko.id === "string") {
                return manifest.applications.gecko.id;
            } else {
                // default
                return "firefox-addon-usi@jetpack";
            }
        },
        is_datauri: function (v: string): boolean {
            // wenn zu beginn, data: steht -> dann sollte es sich auch um eine DataURI handeln?!
            return (/^data:(.*)/.test(v));
        },
        is_function: function (v: any): boolean {
            return (typeof v === "function");
        },
        valid_url: function (v: string): boolean {
            return /^(https?|file):\/\//.test(v);
        },
        url_ends_with_user_js: function (v: string): boolean {
            return /.*\.user([()\d]*)\.js$/.test(v);
        },
        empty: function (v: any): boolean {
            if (typeof v === "undefined" || v === "" || v === 0 || v === false || v === null) {
                return true;
            } else {
                return false;
            }
        },
        is_user_script_ending: function (url: any): boolean {
            if (/\.user\.\js$/g.test(url)) {
                return true;
            } else {
                return false;
            }
        },
        escapeHTMLEntities: function (str: string): string {
            return str.replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
                return '&#' + i.charCodeAt(0) + ';';
            });
        },
        escapeRegExp: function (str: string): string {
            return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        },
        getFilenameFromURL: function (url: string): string {

            if (!this.empty(url)) {
                // http://example.com/img/image.png => image.png
                const url_suffix = String(url.split("/").pop());

                if (!this.empty(url_suffix)) {
                    return url_suffix;
                }
            }

            return "";
        }
    };
    return self;

};