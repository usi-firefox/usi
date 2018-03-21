

import basic_helper from "lib/helper/basic_helper";
import GM_xhrHandler from "lib/GM/GM_xhrHandler";
import userscript_storage from "lib/storage/storage";
import userscript_handle from "lib/storage/userscript";



export default class GM_Backend {

    /**
     * Registriert die Listener für GM_Frontend.js
     * @returns void
     */
    register_listener() {
        if (!browser.runtime.onConnect.hasListener(this.listener)) {
            browser.runtime.onConnect.addListener(this.listener);
        }
    }
    listener(port: browser.runtime.Port) {

        if (!port || !port.name || !/^usi-gm-backend/.test(port.name)) {
            return false;
        }

        // Userscript ID, aus dem Port Namen extrahieren
        let regex_res = /^usi-gm-backend---(\d+)/.exec(port.name);

        if (regex_res === null || !regex_res[1]) {
            // Keine passende ID gefunden
            return false;
        }

        const userscript_id: number = Number(regex_res[1]);

        if (userscript_id <= 0) {
            // Keine passende ID gefunden
            return false;
        }

        port.onMessage.addListener(async (message: any) => {
            try {
                if (!message || !message.name || !message.counter) {
                    throw "missing message|message.name|message.counter";
                }

                switch (message.name) {
                    case "GM_openInTab":
                        {
                            let message_data = <usi.GM_Backend.GM_openInTab>message.data;
                            this.GM_openInTab(message_data, userscript_id);
                        }

                        break;
                    case "GM_registerMenuCommand":
                        {
                            this.GM_registerMenuCommand(message.data);
                        }
                        break;

                    case "GM_setValue":
                    case "GM_deleteValue":
                    case "GM_getValue":
                        let message_data = <usi.GM_Backend.GM_value>message.data;

                        if (!message_data.val_name) {
                            throw "no property name was given";
                        }

                        let storage = await userscript_storage();
                        let userscript_handle = storage.getById(userscript_id);

                        if (!userscript_handle) {
                            throw "couldn't find 'userscript'";
                        }

                        if (message.name === "GM_setValue") {
                            // neuen Wert speichern
                            userscript_handle.setValStore(message_data.val_name, message_data.value);
                        } else if (message.name === "GM_getValue") {
                            // Wert holen
                            let found_value = userscript_handle.getValStore(message_data.val_name);

                            if (typeof found_value === "undefined") {
                                if (typeof message_data.value === "undefined") {
                                    found_value = null;
                                } else {
                                    found_value = message_data.value;
                                }
                            }

                            port.postMessage({ name: "GM_getValue_done", data: { value: found_value }, counter: message.counter });

                        } else if (message.name === "GM_deleteValue") {
                            // Wert aus dem Speicher entfernen
                            userscript_handle.deleteInValStore(message_data.val_name);
                        }
                        break;

                    case "GM_xmlhttpRequest":
                        // @todo
                        {
                            let message_data = <usi.GM_Backend.GM_xhr>message.data.details;
                            GM_xhrHandler().init(message_data, message.counter, port);
                        }
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
                port.postMessage({ name: "GM_Backend:error", func_name: funcName, text: ex });
            }

        });
    }

    // neuen Tab öffnen
    async GM_openInTab(data: usi.GM_Backend.GM_openInTab, userscript_id: number) {
        let url = data.url;
        let open_in_background = data.open_in_background;

        // Prüft ob value_pair.url wirklich valide ist!
        if (basic_helper().valid_url(url) === true) {

            let script_storage = await userscript_storage();
            let userscript_handle = <any>script_storage.getById(userscript_id);

            // Prüf-Variable damit es nicht zu einer "unendlichen" Rekursion kommt
            let not_wildcard_pagemod = true,
                includes = userscript_handle.getSettings()["include"];
            for (let i in includes) {
                if (includes[i] === "*") {
                    // Wildcard Eintrag gefunden, open in Tab ist nicht möglich!
                    not_wildcard_pagemod = false;
                }
            }
            // im neuen Tab öffnen, aber nur wenn das Userscript nicht für Wildcard Aufrufe genutzt wird!!!!
            if (not_wildcard_pagemod === true) {
                try {
                    // neuen Tab öffnen
                    browser.tabs.create({ url: url, active: open_in_background });

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
    GM_registerMenuCommand(data: any) {
        throw "this function is currently not implemented";
    }

}