"use strict";
var basic_helper = require("data/helper/basic_helper").basic_helper,
    url_c = require("sdk/url"),
    load_resource = (function () {

        return {
            /**
             * Lädt ein Bild und gibt es als Datauri an die Callback Funktion weiter
             * @param {string} url
             * @param {string} callback
             * @param {string} charset
             * @returns {void}
             */
            load_image_or_text: function (url, callback, charset) {

                // Falls es eine externe HTTP(S) Datei ist lade sie herunter
                if (url_c.isValidURI(url) === true) {

                    var xhr1 = require("sdk/net/xhr");
                    var xhr = new xhr1.XMLHttpRequest();

                    xhr.open('GET', url, true);

                    // Must include this line - specifies the response type we want
                    xhr.responseType = 'arraybuffer';

                    // ändere das angeforderte Charset, falls es gesetzt wurde
                    if (!basic_helper.empty(charset) && basic_helper.is_string(charset)) {
                        xhr.setRequestHeader("Content-Type", "text/plain; charset=" + charset);
                    }

                    xhr.onload = function () {

                        if (this.status === 200) {

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

                            var arr = new Uint8Array(this.response);

                            // Convert the int array to a binary string
                            // We have to use apply() as we are converting an *array*
                            // and String.fromCharCode() takes one or more single values, not
                            // an array.
                            var raw = String.fromCharCode.apply(null, arr);

                            // Falls der Content-Type mit "image" beginnt, wird dieses als base64 encodierter String zurückgegeben
                            if (/^image/.test(response_contenttype)) {
                                if (!basic_helper.empty(raw)) {
                                    var base64 = require("sdk/base64");
                                    // die Data URI an die Callback Funktion übergeben!
                                    callback("data:" + response_contenttype + ";base64," + base64.encode(raw), response_contenttype);
                                }
                            } else {
                                if (!basic_helper.empty(raw)) {
                                    // sehr verwahrscheinlich handelt es sich um einen Text
                                    callback(raw, response_contenttype);
                                }
                            }
                        }
                    };

                    xhr.send();
                    // return true -> Achtung! Dies bedeutet nicht dass die Abarbeitung schon erledigt ist!
                    return true;
                } else {

                    return false;
                }
            }
            
            /**
             * Holt externe Skripte
             * @param {string} url_str
             * @param {function} callback
             * @param {string} charset
             * @returns {Boolean}
             */
            , load_userscript_by_url: function (url_str, callback, charset) {

                // Nur wenn am Ende der URL ein .user.js steht!
                if (/.*\.user([()\d]*)\.js$/.test(url_str)) {
                    return this.load_text(url_str, callback, charset);
                } else {
                    return false;
                }
            }

            /**
             * 
             * @param {type} url
             * @param {type} callback
             * @param {type} charset
             * @returns {Boolean}
             */
            , load_text: function (url, callback, charset) {

                var Request = require("sdk/request").Request;

                // Wenn die URL gültig ist, wird true zurück geliefert
                if (url_c.isValidURI(url) === true) {

                    // Falls kein Charset gesetzt wurde
                    if (typeof charset === "undefined" || charset === null) {
                        charset = "utf-8";
                        //charset = "cp1252";
                    }

                    try {

                        var request_options = {
                            url: url,
                            headers: {// Damit der Request immer "frisch" ist!
                                'Cache-control': 'no-cache'
                            },
                            overrideMimeType: "text/plain; charset=" + charset,
                            onComplete: function (response) {
                                // nur wenn es auch erfolgreich war!
                                if (response.status === 200 && response.statusText === "OK") {

                                    // Rückgabe des Response Textes
                                    // Führe den Rest der Funktionen aus, die übergeben wurden!
                                    callback(response.text);

                                }
                            }
                        };

                        // Request mit den zuvor definierten Optionen ausführen
                        Request(request_options).get();

                        // Url ist gültig
                        return true;
                    } catch (e) {
                        // Fehler ist aufgetreten
                        return false;
                    }
                } else {
                    // Url Fehlerhaft
                    return false;
                }
            }
        };

    }());

if (typeof exports !== "undefined") {
    exports.load_resource = load_resource;
}