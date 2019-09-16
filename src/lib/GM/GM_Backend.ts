import GM_xhrHandler from "lib/GM/GM_xhrHandler";
import { valid_url } from "lib/helper/basic_helper";
import userscript_storage from "lib/storage/storage";

export default class GM_Backend {

    /**
     * Registriert die Listener für GM_Frontend.js
     * @returns void
     */
    public register_listener() {
        if (!browser.runtime.onConnect.hasListener(this.listener)) {
            browser.runtime.onConnect.addListener(this.listener);
        }
    }
    public listener(port: browser.runtime.Port) {

        if (!port || !port.name || !/^usi-gm-backend/.test(port.name)) {
            return false;
        }

        // Userscript ID, aus dem Port Namen extrahieren
        const regex_res = /^usi-gm-backend---(\d+)/.exec(port.name);

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
                    throw new Error("missing message|message.name|message.counter");
                }

                switch (message.name) {
                    case "GM_openInTab":
                        if(!message.data){
                            throw new Error("GM_openInTab() missing message.data");
                        }

                        this.GM_openInTab(message.data, userscript_id);
                        break;

                    case "GM_registerMenuCommand":
                        this.GM_registerMenuCommand(message.data);
                        break;

                    case "GM_setValue":
                    case "GM_deleteValue":
                    case "GM_getValue":
                        const message_data = message.data as usi.GM_Backend.GM_value;

                        if (!message_data.val_name) {
                            throw new Error("no property name was given");
                        }

                        const storage = await userscript_storage();
                        const userscript_handle = storage.getById(userscript_id);

                        if (!userscript_handle) {
                            throw new Error("couldn't find 'userscript'");
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
                            const message_data = message.data.details as usi.GM_Backend.GM_xhr;
                            GM_xhrHandler().init(message_data, message.counter, port);
                        }
                        break;
                    default:
                        // @todo
                        break;
                }

            } catch (ex) {
                const funcName = message.name;
                // Basic Exception catch
                port.postMessage({ name: "GM_Backend:error", func_name: funcName, text: ex });
            }

        });
    }

    // neuen Tab öffnen
    public async GM_openInTab(data: usi.GM_Backend.GM_openInTab, userscript_id: number) {
        const url = data.url;
        const open_in_background = data.open_in_background;

        // Prüft ob value_pair.url wirklich valide ist!
        if (valid_url(url) === true) {

            const script_storage = await userscript_storage();
            const userscript_handle = script_storage.getById(userscript_id) as any;

            // Prüf-Variable damit es nicht zu einer "unendlichen" Rekursion kommt
            let not_wildcard_pagemod = true,
                includes = userscript_handle.getSettings().include;
            for (const i in includes) {
                if (includes[i] === "*") {
                    // Wildcard Eintrag gefunden, open in Tab ist nicht möglich!
                    not_wildcard_pagemod = false;
                }
            }
            // im neuen Tab öffnen, aber nur wenn das Userscript nicht für Wildcard Aufrufe genutzt wird!!!!
            if (not_wildcard_pagemod === true) {
                try {
                    // neuen Tab öffnen
                    browser.tabs.create({ url, active: open_in_background });

                } catch (ex) {
                    // @todo Exception Handling
                    throw new Error("tab couldn't be created");
                }
            } else {
                throw new Error("your userscript must not have a wildcard in the include rules e.g. ( // @include * )");
            }

        } else {
            // Schicke den Fehler zurück zum Aufrufenden Skript
            // @todo Exception Handling
            throw new Error("url not valid");
        }

    }
    // GM_registerMenuCommand -> Kommando im Menü Registrieren
    public GM_registerMenuCommand(data: any) {
        throw new Error("this function is currently not implemented");
    }

}
