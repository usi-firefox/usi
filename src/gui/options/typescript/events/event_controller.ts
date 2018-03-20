

declare var jQuery: any;
declare var document: any;

import basic_helper from "lib/helper/basic_helper";
import userscript_storage from "lib/storage/storage";
import config_storage from "lib/storage/config";

import template_controller from "template";
import download_controller from "download";
import event_manager_controller from "events/event_manager";
import bootstrap_toggle_controller from "bootstraptoggle";



export default function event_controller() {

    // Abstraktions Möglichkeit
    var port = <any>browser.runtime.connect(basic_helper().getExtId(), { name: "options-backend" });

    // Workaround Wrapper
    port.on = function (response_name: string, callback: Function) {
        port.onMessage.addListener(function (response: any) {
            if (response.name === response_name) {
                callback(response.data);
            }
        });
    };

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
                                download_controller().download(result_export, "text/plain", "usi-export.usi.json");
                            } else {
                                download_controller().download(result_export, "application/octet-stream", "usi-export.usi.js");
                            }
                        } else {
                            // Kein Userscript für den Export vorhanden
                        }

                    }
                    , single: async function (id: number) {
                        let script_storage = await userscript_storage();
                        let userscript_handler = script_storage.getById(id);

                        if (userscript_handler !== false) {
                            // Bietet das Userscript zur lokalen Speicherung an!
                            download_controller().download(userscript_handler.getUserscriptContent(), "text/plain", encodeURI(userscript_handler.getSettings()["name"] + ".user.js"));
                        }

                    }
                }

            }
        }

        // Registriert ein Event 
        , register: {
            frontend_events: function () {
                // Initialisiere die Tab übergreifenden Events im Frontend
                // Tab Wechsel Event
                event_manager_controller().register_once(document, "USI-FRONTEND:changeTab", function (event: any, action: string, param1?: any) {
                    switch (action) {
                        case "edit":
                            template_controller().load(action, {
                                callback_on_complete: function () {
                                    jQuery(document).trigger("USI-FRONTEND:editTab-get-userscript", param1);
                                }
                            });
                            break;
                    }
                });
            }
            , userscript: {
                quota: function (c: Function) {

                    /**
                     * Firefox Version 54.0
                     * Aktuell nicht möglich, da angeblich .getBytesInUse() keine Funktion wäre
                     */
                    //                            let quota_pro = browser.storage.local.getBytesInUse(null);
                    //                            if(typeof c === "function"){
                    //                                quota_pro.then(c);
                    //                            }
                }

                , external_load: {
                    ready: function (c: Function) {
                        port.on("USI-BACKEND:external-script-is-now-loaded", c);
                    }
                }
                , update: {
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
                refresh: function () {
                    jQuery(document).trigger("USI-FRONTEND:refresh-userscripts");
                }
                , all: async function (c?: Function) {
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

                    self.request.userscript.refresh();
                    // lade Page Mod neu!
                    port.postMessage({ name: "USI-BACKEND:pageinjection-refresh" });

                }
                , delete: async function (id: number) {
                    let script_storage = await userscript_storage();
                    let userscript_handle = script_storage.getById(id);
                    // userscript_handle darf nicht false sein
                    if (userscript_handle !== false) {
                        // lösche dieses Element
                        await userscript_handle.deleteUserscript();

                        basic_helper().notify(browser.i18n.getMessage("userscript_was_successful_deleted") + " (ID " + id + ")");

                        // Userscript entfernen lassen
                        port.postMessage({ name: "USI-BACKEND:pageinjection-remove", data: { id: id } });

                        self.request.userscript.refresh();
                    } else {
                        // konnte nicht gefunden und daher auch nicht gelöscht werden
                        basic_helper().notify(browser.i18n.getMessage("userscript_could_not_deleted"));
                    }
                }
                , update_check: function () {
                    port.postMessage({ name: "USI-BACKEND:check-for-userscript-updates" });
                }
                , reload_from_source: function (source_path: string) {
                    port.postMessage({ name: "USI-BACKEND:reload-from-source", data: { url: source_path } });
                }
                , start_spa: function (userscript: any) {
                    port.postMessage({ name: "USI-BACKEND:start-spa", data: { userscript } });
                }
                , gm_values: async function (id: number) {
                    let script_storage = await userscript_storage();

                    let userscript = <any>script_storage.getById(id);

                    var result = [], completeValStore = userscript.getValStore();
                    for (var name in completeValStore) {
                        // Key => value ...
                        result.push({ key: name, value: completeValStore[name] });
                    }
                    return basic_helper().convertToText(result);
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
                    port.postMessage({ name: "USI-BACKEND:create-userscript", data });
                }
                , override: function (data: any) {
                    port.postMessage({ name: "USI-BACKEND:override-same-userscript", data });
                }
                , toogle_state: async function (id: number) {
                    var script_storage = await userscript_storage();
                    var userscript_handle = <any>script_storage.getById(id);
                    if (userscript_handle !== false) {
                        // wechsele den Status ob das Userscript aktiviert oder deaktiviert ist
                        userscript_handle.switchActiveState();
                    }

                    let page_injection_helper_port = browser.runtime.connect(basic_helper().getExtId(), { name: "page-injection-helper" });

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


            port.on("userscript-is-created", function (data: any) {
                // Neues Userscript wurde erstellt
                basic_helper().notify(browser.i18n.getMessage("userscript_was_created") + " (ID " + data.id + ")");
            });
            port.on("userscript-was-overwritten", function (data: any) {
                // Userscript wurde überschrieben
                basic_helper().notify(browser.i18n.getMessage("userscript_was_overwritten") + " (ID " + data.id + ")");
            });
            port.on("userscript-already-exist", function (data: any) {
                // Userscript existiert bereits
                basic_helper().notify(browser.i18n.getMessage("userscript_already_exist") + " (ID " + data.id + ")");
            });

            port.on("USI-BACKEND:get-alert", function (text: string) {
                basic_helper().notify(text);
            });

            /**
             * Wenn das Userscript schon existiert und überschrieben werden kann
             */
            port.on("USI-BACKEND:same-userscript-was-found",
                /**
                 * 
                 * @param {object} userscript_infos
                 * @returns {void}
                 */
                function (userscript_infos: any) {

                    //wurde gefunden, möchtest du es aktualisieren?")){
                    if (window.confirm(browser.i18n.getMessage("same_userscript_was_found_ask_update_it_1") + userscript_infos.id + browser.i18n.getMessage("same_userscript_was_found_ask_update_it_2"))) {
                        // Dieses Skript wird nun aktualisiert! userscript_infos = {id : id , userscript: userscript}
                        self.set.userscript.override(userscript_infos);
                        self.request.userscript.all();
                    }
                });

            // Event Weiterleitung vom Backend
            port.on("USI-BACKEND:To-Frontend-Document-Event-Forwarder", function (data: any) {
                jQuery(document).trigger(data.event_name, [data.action, data.param1]);
            });

        }

    };

    return self;
}