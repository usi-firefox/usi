"use strict"; // Strict Mode aktivieren!
/************************************************************************
 ************************* Basic Funktionen! *************************
 ************************************************************************/

/* global exports, browser */

var basic_helper = (function () {

    var self = {
        /**
         * Funktion zum umwandeln von Objekten in Strings
         * 
         * http://stackoverflow.com/a/18368918
         * Source http://jsfiddle.net/numoccpk/1/
         * 
         * @param {mixed} obj
         * @returns {String}
         */
        convertToText: function (obj) {
            //create an array that will later be joined into a string.
            var string = [];
            //is object
            //    Both arrays and objects seem to return "object"
            //    when typeof(obj) is applied to them. So instead
            //    I am checking to see if they have the property
            //    join, which normal objects don't have but
            //    arrays do.
            if (obj === "undefined") {
                return String(obj);
            } else if (typeof (obj) === "object" && (obj.join === "undefined")) {
                for (var prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        string.push(prop + ": " + self.convertToText(obj[prop]));
                    }
                }
                return "{" + string.join(",") + "}";
                //is array
            } else if (typeof (obj) === "object" && !(obj.join === "undefined")) {
                for (var prop in obj) {
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

        isset: function (v) {
            if (typeof v !== "undefined") {
                return true;
            } else {
                return false;
            }
        },
        addScriptLink: function (srcLink) {
            if (srcLink) {
                return "<script type=\"text/javascript\" src=\"" + browser.extension.getURL(srcLink) + "\" ></script>";
            } else {
                return "";
            }
        },
        getExtId: function () {
            var manifest = browser.runtime.getManifest(),
                // default
                extId = "firefox-addon-usi@jetpack";

            if (typeof manifest === "object" && typeof manifest.applications.gecko.id === "string") {
                extId = manifest.applications.gecko.id;
            }

            return extId;
        },
        is_string: function (v) {
            if (typeof v === "string") {
                return true;
            } else {
                return false;
            }
        },
        is_object: function (v) {
            if (typeof v === "object") {
                return true;
            } else {
                return false;
            }
        },
        is_boolean: function (v) {
            if (typeof v === "boolean") {
                return true;
            } else {
                return false;
            }
        },
        is_function: function (v) {
            if (typeof v === "function") {
                return true;
            } else {
                return false;
            }
        },
        valid_url: function (v) {
            if (self.is_string(v) && /^(https?|file):\/\//.test(v)) {
                return true;
            } else {
                return false;
            }
        },
        url_ends_with_user_js: function (v) {
            if (self.is_string(v) && /.*\.user([()\d]*)\.js$/.test(v)) {
                return true;
            } else {
                return false;
            }
        },
        empty: function (v) {
            if (typeof v === "undefined" || v === "" || v === 0 || v === false || v === null) {
                return true;
            } else {
                return false;
            }
        },
        is_user_script_ending: function (url) {
            if (/\.user\.\js$/g.test(url)) {
                return true;
            } else {
                return false;
            }
        },
        escapeHTMLEntities: function (str) {
            return str.replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
                return '&#' + i.charCodeAt(0) + ';';
            });
        },
        escapeRegExp: function (str) {
            return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        },
        getFilenameFromURL: function (url) {

            if (this.is_string(url) && !this.empty(url)) {
                // http://example.com/img/image.png => image.png
                var url_suffix = url.split("/").pop();

                if (!this.empty(url_suffix)) {
                    return url_suffix;
                }
            }

            return false;
        },
        arrayWrap: function (arr, wrapper_front, wrapper_back) {
            var result_arr = [];
            arr = arr || []; // default Value => []
            wrapper_front = wrapper_front || ""; // wenn nichts übergeben wurde, ist es leer ... 
            wrapper_back = wrapper_back || wrapper_front; // wenn der "wrapper_back" nicht gesetzt wurde ist es der gleiche wie "wrapper_front"
            for (var i in arr) {
                result_arr.push(wrapper_front + arr[i] + wrapper_back);
            }
            return result_arr.join("");
        }
    };
    return self;

})();

// nötig damit es auch im Content Script verwendet werden kann!!!
if (typeof exports !== "undefined") {
    exports.basic_helper = basic_helper;
}