declare var jQuery: any;
declare var document: any;

import { notify, getExtId, isset } from "lib/helper/basic_helper";
import userscript_storage from "lib/storage/storage";
import config_storage from "lib/storage/config";
import page_injection_helper from "lib/inject/page_injection_helper";
import SPA from "lib/spa/handler";
import add_userscript from "lib/storage/add_userscript";
import load_resource from "lib/load/load_resource";
import parse_userscript from "lib/parse/parse_userscript";

declare function unescape(s: string): string;

/**
 * erzeugt einen Download (Datei Speichern Dialog)
 * @param {string} data
 * @param {string} type
 * @param {string} filename
 * @returns {void}
 */
function download_file(data: string, type?: string, filename?: string): void {
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
        // Daten vom Backend erhalten
        get: {
            userscript: {
                export: {
                    /** 
                     * Erzeugt ein Download Fenster für den Fertigen Export
                     */
                    all: async function (complete_export: boolean) {

                        let script_storage = await userscript_storage();

                        let result_export = "",
                            result_export_tmp = [],
                            separator = "//*******************USI-EXPORT*************************//\n",
                            date_obj = new Date();

                        let export_date = [date_obj.getFullYear(),
                        date_obj.getMonth(),
                        date_obj.getDate(),
                            "-",
                        date_obj.getHours(),
                        date_obj.getMinutes()].join("-");
                        // Hinweis darauf ob alles exportiert wurde und lediglich die Userscripte
                        // ---> complete_export

                        let infos = ["USI-EXPORT", "VERSION:0.2", "DATE:" + export_date, "COMPLETE:" + complete_export];
                        // infos hinzufügen
                        for (var i in infos) {
                            result_export += "//" + infos[i] + "\n";
                        }

                        // Trenner hinzufügen
                        result_export += separator + separator + separator;
                        let all_userscripts = script_storage.getAll();
                        // Userscript aus dem script_storage holen
                        for (var j in all_userscripts) {
                            if (complete_export === false) {
                                result_export_tmp.push(all_userscripts[j].userscript);
                            } else {
                                result_export_tmp.push(all_userscripts[j]);
                            }
                        }

                        if (result_export_tmp.length > 0) {
                            if (complete_export === false) {
                                result_export += result_export_tmp.join("\n" + separator);
                            } else {
                                result_export += JSON.stringify(result_export_tmp);
                            }

                            if (jQuery("#usi-config-change-complete-export").prop("checked") === true) {
                                download_file(result_export, "text/plain", "usi-export.usi.json");
                            } else {
                                download_file(result_export, "application/octet-stream", "usi-export.usi.js");
                            }
                        } else {
                            // Kein Userscript für den Export vorhanden
                        }

                    }
                    , single: async function (id: number) {
                        let script_storage = await userscript_storage();
                        let userscript_handler = <any>script_storage.getById(id);

                        if (userscript_handler !== false) {
                            // Bietet das Userscript zur lokalen Speicherung an!
                            download_file(userscript_handler.getUserscriptContent(), "text/plain", encodeURI(userscript_handler.getSettings()["name"] + ".user.js"));
                        }

                    }
                }

            }
        }

        // Registriert ein Event 
        , register: {
            userscript: {
                update: {
                    available: function (c: Function) {
                        port.on("USI-BACKEND:update-for-userscript-available", c);
                    }
                }
                , gm_values: function (id: number, c: Function) {
                    port.on("USI-BACKEND:list-GMValues-done-" + id, c);
                }
            }
        }

        // löst eine Aktion im Backend aus, ohne direkt Daten zurück zu erhalten
        , request: {
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
                , update_check: async function () {
                    // durchlaufe alle Einträge und suche nach einer UpdateURL
                    let script_storage = await userscript_storage();
                    let all_userscripts = script_storage.getAll();

                    if (all_userscripts.length === 0) {
                        throw "no Userscripts available";
                    }

                    for (var i in all_userscripts) {
                        let userscript_settings = all_userscripts[i].settings;
                        let userscript_id = all_userscripts[i].id;

                        // prüfe ob eine UpdateURL gesetzt wurde!
                        if (isset(userscript_settings["updateURL"])) {

                            try {
                                // UpdateURL gefunden, lade es nach!
                                let loaded_userscript = await <any>load_resource().load_userscript_by_url(userscript_settings["updateURL"]);
                                if (!loaded_userscript.target.responseText) {
                                    // keine antwort
                                    continue;
                                }
                                let loaded_userscript_text = loaded_userscript.target.responseText;

                                // @todo Konfig suchen und danach die Optionen Parsen...
                                let loaded_userscript_settings = <any> parse_userscript().find_settings(loaded_userscript_text);
                                // Prüfe ob die Versionen verschieden sind!
                                if (loaded_userscript_settings !== null && loaded_userscript_settings["version"] !== userscript_settings["version"]) {

                                    // Frage den Benutzer ob das Skript aktualisiert werden soll!
                                    port.postMessage({ name: "USI-BACKEND:update-for-userscript-available", data: { id: userscript_id, userscript: loaded_userscript_text } });
                                }
                            } catch (exception) {

                            }
                        }
                    }
                }
                , reload_from_source: function (source_path: string) {
                    if (source_path) {
                        /**
                         * @todo
                         * Zunächst einmal nur einen neuen Tab öffnen
                         * Skript später wieder richtig laden
                         */
                        browser.tabs.create({ url: source_path });
                    }
                }
                , start_spa: function (userscript: any) {
                    /**
                             * Startet ein SPA, in einem neuen Tab
                             */
                    let spa_instance = new SPA();

                    spa_instance.createPage(userscript.id);
                }
                , gm_values: async function (id: number) {
                    let script_storage = await userscript_storage();

                    let userscript = <any>script_storage.getById(id);

                    var result = [], completeValStore = userscript.getValStore();
                    for (var name in completeValStore) {
                        // Key => value ...
                        result.push({ key: name, value: completeValStore[name] });
                    }
                    return result;
                }
            }

        }
        // Daten zum setzen
        , set: {
            config: {
                load_external_script: async function (bool: boolean) {
                    let config = await config_storage().get();
                    config.load_script_with_js_end = bool;
                    return await config_storage().set(config);
                }
                , highlightjs_state: async function (bool: boolean) {
                    let config = await config_storage().get();
                    config.hightlightjs.active = bool;
                    return await config_storage().set(config);
                }
                , gm_funcs_always_on: async function (bool: boolean) {
                    let config = await config_storage().get();
                    config.greasemonkey.global_active = bool;
                    return await config_storage().set(config);
                }
                , own_css: async function (new_css: string) {
                    let config = await config_storage().get();
                    config.own_css = new_css;
                    return await config_storage().set(config);
                }
            }
            // highlightjs
            , highlightjs: {
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

                        port.postMessage({ name: "userscript-is-created", data: { id: userscript_handle.getId() } });
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
                        // Wenn dies aufgerufen wird, werden die vorhanden Variablen des Userscripts entfernt (val_store)

                        let script_storage = await userscript_storage();
                        let userscript_handle = script_storage.getById(id);
                        if (userscript_handle !== false) {
                            // entfernen aller zuvor gesetzten Variablen
                            userscript_handle.resetValStore().save();
                        }

                    }
                }
            }
        }
        // Registiert die globalen Events
        , register_global_events: function () {

            /**
            * Fragt ob ein Userscript aktualisiert werden soll
            * 
            * @param {object} userscript_infos
            * @returns {void}
            */
            const confirmationUserscriptUpdate = function (userscript_infos: any): void {
                //wurde gefunden, möchtest du es aktualisieren?")){
                if (window.confirm(browser.i18n.getMessage("same_userscript_was_found_ask_update_it_1") + userscript_infos.id + browser.i18n.getMessage("same_userscript_was_found_ask_update_it_2"))) {
                    // Dieses Skript wird nun aktualisiert! userscript_infos = {id : id , userscript: userscript}
                    self.set.userscript.override(userscript_infos);
                    self.request.userscript.all();
                }
            }

            // falls ein aktualisiertes Userscript gefunden wurde
            self.register.userscript.update.available(confirmationUserscriptUpdate);

            port.on("userscript-is-created", function (data: any) {
                // Neues Userscript wurde erstellt
                notify(browser.i18n.getMessage("userscript_was_created") + " (ID " + data.id + ")");
            });
            port.on("userscript-already-exist", function (data: any) {
                // Userscript existiert bereits
                notify(browser.i18n.getMessage("userscript_already_exist") + " (ID " + data.id + ")");
            });

            port.on("USI-BACKEND:get-alert", function (text: string) {
                notify(text);
            });

            /**
             * Wenn das Userscript schon existiert und überschrieben werden kann
             */
            port.on("USI-BACKEND:same-userscript-was-found", confirmationUserscriptUpdate);

            // Event Weiterleitung vom Backend
            port.on("USI-BACKEND:To-Frontend-Document-Event-Forwarder", function (data: any) {
                jQuery(document).trigger(data.event_name, [data.action, data.param1]);
            });

        }

    };

    return self;
}