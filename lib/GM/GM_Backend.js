"use strict";

/* global userscript_handle, basic_helper, browser, GM_xhrHandler, usi_main, userscript_storage */

var GM_Backend = (function () {

    var self = {

        /**
         * Registriert die Listener für GM_Frontend.js
         * @returns void
         */
        register_listener: function () {
            browser.runtime.onConnect.addListener(function (port) {
                if (!port || !port.name || !/^usi-gm-backend/.test(port.name)) {
                    return false;
                }
                // Userscript ID, aus dem Port Namen extrahieren
                var userscript_id = /^usi-gm-backend---(\d+)/.exec(port.name)[1];

                userscript_id = parseInt(userscript_id);

                if (userscript_id <= 0) {
                    // Keine passende ID gefunden
                    return false;
                }

                port.onMessage.addListener(async function (message) {
                    try {
                        if (!message || !message.name || !message.counter) {
                            throw "missing message|message.name|message.counter";
                        }

                        switch (message.name) {
                            case "GM_openInTab":
                                self.GM_openInTab(message.data, userscript_id);

                                break;
                            case "GM_registerMenuCommand":
                                self.GM_registerMenuCommand(message.data);
                                break;

                            case "GM_setValue":
                            case "GM_deleteValue":
                            case "GM_getValue":
                                if (!message.data.val_name) {
                                    throw "no property name was given";
                                }

                                let storage = await userscript_storage;
                                let userscript_handle = storage.getById(userscript_id);

                                if (!userscript_handle) {
                                    throw "couldn't find 'userscript'";
                                }

                                if (message.name === "GM_setValue") {
                                    // neuen Wert speichern
                                    userscript_handle.setValStore(message.data.val_name, message.data.value);
                                } else if (message.name === "GM_getValue") {
                                    // Wert holen
                                    let found_value = userscript_handle.getValStore(message.data.val_name);

                                    if (typeof found_value === "undefined") {
                                        if(typeof message.data.value === "undefined"){
                                            found_value = null;
                                        }else{
                                            found_value = message.data.value;
                                        }
                                    }

                                    port.postMessage({name: "GM_getValue_done", data: {value: found_value}, counter: message.counter});

                                } else if (message.name === "GM_deleteValue") {
                                    // Wert aus dem Speicher entfernen
                                    userscript_handle.deleteInValStore(message.data.val_name);
                                }
                                break;

                            case "GM_xmlhttpRequest":
                                // @todo
                                GM_xhrHandler.init(message.data.details, message.counter, port);
                                break;
                            default:
                                //@todo
                                break;
                        }

                    } catch (ex) {
                        let funcName = "'unknown function'";
                        if (!funcName) {
                            funcName = message.name;
                        }
                        // Basic Exception catch
                        port.postMessage({name: "GM_Backend:error", func_name: funcName, text: ex});
                    }

                });

            });
        }

        // neuen Tab öffnen
        , GM_openInTab: async function (data, userscript_id) {
            let url = data.url;
            let open_in_background = data.open_in_background;

            if (open_in_background === "true" || open_in_background === true) {
                open_in_background = true;
            } else {
                open_in_background = false;
            }

            // Prüft ob value_pair.url wirklich valide ist!
            if (basic_helper.valid_url(url) === true) {

                let script_storage = await userscript_storage;
                let userscript_handle = script_storage.getById(userscript_id);

                // Prüf-Variable damit es nicht zu einer "unendlichen" Rekursion kommt
                var not_wildcard_pagemod = true,
                    includes = userscript_handle.getSettings()["include"];
                for (var i in includes) {
                    if (includes[i] === "*") {
                        // Wildcard Eintrag gefunden, open in Tab ist nicht möglich!
                        not_wildcard_pagemod = false;
                    }
                }
                // im neuen Tab öffnen, aber nur wenn das Userscript nicht für Wildcard Aufrufe genutzt wird!!!!
                if (not_wildcard_pagemod === true) {
                    try {
                        // neuen Tab öffnen
                        browser.tabs.create({url: url, active: open_in_background});

                    } catch (ex) {
                        // @todo Exception Handling
                        throw "tab couldn't be created";
                    }
                } else {
                    throw "your userscript must not have a wildcard in the include rules e.g. ( // @include * )";
                }

            } else {
                // Schicke den Fehler zurück zum Aufrufenden Skript
                // @todo Exception Handling
                throw "url not valid";
            }

        }
        // GM_registerMenuCommand -> Kommando im Menü Registrieren
        , GM_registerMenuCommand: function (data) {

            throw "this function is currently not implemented";

            // @todo unsupported at the moment
//            let caption = data.caption;
//            let commandFunc = data.commandFunc;
//
//            // als JSON lässt es sich natürlich nicht simpel vergleichen, daher die Umwandlung in einen String
//            var stringified_data = JSON.stringify({caption: caption, commandFunction: commandFunc});
//
//            // Prüfe ob data nicht schon bereits gesetzt wurde!
//            // Schutz Abfrage, falls das Kommando auf mehreren Seiten greifen würde (zu lockere Inlcude/Match Anweisung)
//            if (usi_main.GM_last_menuCommands.indexOf(stringified_data) === -1) {
//
//                /**
//                 * WICHTIGER Workaround, nur so kann eine Funktion vom Frontend ans Backend übergeben und ausgeführt werden!
//                 */
//                // Funktions-String zurück in eine Funktion wandeln...
//                var commandFunction = new Function("return " + commandFunc + "();");
//
//                if (browser.runtime.PlatformOs.platform === "android") {
//                    // Obtain commonly used services : Services.jsm
//                    // https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Services.jsm
//                    const {Services} = require("resource://gre/modules/Services.jsm");
//
//                    function getNativeWindow () {
//                        // Initialisierung für das Native Window (Fennec)
//                        let window = Services.wm.getMostRecentWindow("navigator:browser");
//                        return window.NativeWindow;
//                    }
//
//                    // nur bei Fennec
//                    if (typeof getNativeWindow() !== "undefined") {
//                        getNativeWindow().menu.add({
//                            name: caption,
//                            icon: {
//                                "16": "./icon/usi.png"
//                            },
//                            callback: commandFunction
//                        });
//                    }
//
//                } else { // Nur im Desktop
//                    // @todo!!!
//                    browser.contextMenus.create({
//                        id: "usi-menu-" + usi_main.GM_last_menuCommands.length,
//                        label: caption,
//                        icon: {
//                            "16": "./icon/usi.png"
//                        },
//                        onClick: commandFunction
//                    });
//                }
//                
//                // Command Funktion dem Sammeler Array hinzufügen
//                usi_main.GM_last_menuCommands.push(stringified_data);
//
//                // setze es in das Array wo die MenuCommands gesammelt werden
//                return stringified_data;
//            }
        }
    };

    return self;
})();