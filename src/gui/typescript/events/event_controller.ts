declare var document: any;

import { notify, getExtId, isset, download_file } from "lib/helper/basic_helper";
import userscript_storage from "lib/storage/storage";
import config_storage from "lib/storage/config";
import page_injection_helper from "lib/inject/page_injection_helper";
import add_userscript from "lib/storage/add_userscript";

declare function unescape(s: string): string;


function getBackendPort(): usi.Backend.Port {
    // Abstraktions Möglichkeit
    var backend_port = <usi.Backend.Port>browser.runtime.connect(getExtId(), { name: "options-backend" });

    // Workaround Wrapper
    backend_port.on = function (response_name: string, callback: Function) {
        backend_port.onMessage.addListener(function (response: any) {
            if (response.name === response_name) {
                callback(response.data);
            }
        });
    };

    return backend_port;
}

// Instanziere den Backend Port
var port = getBackendPort();

export default function event_controller() {

    var self = {
        // löst eine Aktion im Backend aus, ohne direkt Daten zurück zu erhalten
        request: {
            userscript: {
                all: async function (c?: Function) {
                    let script_storage = await userscript_storage();

                    await script_storage.refresh();

                    if (typeof c === "function") {
                        c(script_storage.getAll());
                    } else {
                        return script_storage.getAll();
                    }
                }
                /**
                 * löscht alle gespeicherten Userskripte
                 */
                , delete_all: async function () {
                    let script_storage = await userscript_storage();
                    // lösche jedes einzelene Userscript...
                    script_storage.deleteAll();

                    // lade Page Mod neu!
                    (new page_injection_helper()).re_init_page_injection();

                }
                , delete: async function (id: number) {
                    let script_storage = await userscript_storage();
                    let userscript_handle = script_storage.getById(id);
                    // userscript_handle darf nicht false sein
                    if (userscript_handle !== false) {
                        // lösche dieses Element
                        await userscript_handle.deleteUserscript();

                        notify(browser.i18n.getMessage("userscript_was_successful_deleted") + " (ID " + id + ")");

                        // Userscript entfernen lassen
                        (new page_injection_helper()).remove_userscript(id);
                    } else {
                        // konnte nicht gefunden und daher auch nicht gelöscht werden
                        notify(browser.i18n.getMessage("userscript_could_not_deleted"));
                    }
                }
            }

        }
        // Daten zum setzen
        , set: {
            // highlightjs
            highlightjs: {
                style: async function (style_name: string) {
                    let config = await config_storage().get();
                    config.hightlightjs.style = style_name;
                    return await config_storage().set(config);
                }
            }
            , userscript: {
                create: async function (data: any) {
                    if (!data.userscript) {
                        throw "Userscript is missing";
                    }

                    let userscript = data.userscript;
                    // Hier wird das UserScript weiterverarbeitet und gespeichert

                    if (!data.moreinformations) {
                        data.moreinformations = null;
                    }
                    let valid_userscript = add_userscript().check_for_valid_userscript_settings(userscript, data.moreinformations);

                    if (valid_userscript.valid === false) {
                        // Userscript Konfiguration nicht in Ordnung
                        port.postMessage({ name: "userscript-config-is-wrong", data: { valid_userscript } });
                        return;
                    }

                    // Überprüfe ob das Userscript bereits gespeichert wurde
                    let userscript_id = await add_userscript().exist_userscript_already(userscript);

                    if (userscript_id === 0) {
                        // neu anlegen
                        let userscript_handle = await <any>add_userscript().save_new_userscript(userscript, data.moreinformations);
                        // füge das Skript gleich hinzu, damit es ausgeführt werden kann
                        (new page_injection_helper()).add_userscript(userscript_handle.getId());

                        // Neues Userscript wurde erstellt
                        notify(browser.i18n.getMessage("userscript_was_created") + " (ID " + userscript_handle.getId() + ")");
                    } else {
                        // bzgl. update fragen
                        // Es wurde ein Userscript gefunden, soll es aktualisiert werden?
                        port.postMessage({ name: "USI-BACKEND:same-userscript-was-found", data: { id: userscript_id, userscript: userscript } });
                    }
                }
                , override: async function (data: any) {

                    if (!data.id) {
                        throw "Userscript ID is missing";
                    }
                    if (!data.userscript) {
                        throw "Userscript is missing";
                    }

                    // Hier wird das UserScript weiterverarbeitet und gespeichert
                    let moreinformations = null;
                    if (data.moreinformations) {
                        moreinformations = data.moreinformations;
                    }

                    let userscript_handle = await <any>add_userscript().update_userscript(data.id, data.userscript, moreinformations);
                    (new page_injection_helper()).add_userscript(userscript_handle.getId());

                    // Userscript wurde überschrieben
                    notify(browser.i18n.getMessage("userscript_was_overwritten") + " (ID " + data.id + ")");

                }
                , toogle_state: async function (id: number) {
                    var script_storage = await userscript_storage();
                    var userscript_handle = <any>script_storage.getById(id);
                    if (userscript_handle !== false) {
                        // wechsele den Status ob das Userscript aktiviert oder deaktiviert ist
                        userscript_handle.switchActiveState();
                    }

                    let page_injection_helper_port = browser.runtime.connect(getExtId(), { name: "page-injection-helper" });

                    if (userscript_handle.isDeactivated()) {
                        // deaktivieren
                        page_injection_helper_port.postMessage({ name: "remove_userscript", data: { userscript_id: userscript_handle.getId() } });
                    } else {
                        // aktivieren
                        page_injection_helper_port.postMessage({ name: "add_userscript", data: { userscript_id: userscript_handle.getId() } });
                    }

                }
                , gm_values: {
                    delete_all: async function (id: number) {
                        

                    }
                }
            }
        }
    };

    return self;
}