"use strict"; // Strict Mode aktivieren!

/************************************************************************
 ************************* Page Injection Funktionen! *******************
 ************************************************************************/

/* global browser, SPA, load_resource, page_injection_helper, add_userscript, userscript_storage, basic_helper, parse_userscript, userscript_handle */

// zunächste den Userscript storage initialisieren

var options_backend = (function () {
    var self = {
        start: function () {
            browser.runtime.onConnect.addListener(function (port) {

                if (port.name !== "options-backend") {
                    // Port name passt nicht, abbruch
                    return false;
                }

                port.onMessage.addListener(async function (message) {

                    try {
                        var message_data = message.data;

                        switch (message.name) {
                            case "USI-BACKEND:pageinjection-add":
                                page_injection_helper.add_userscript(message_data.id);
                                break;
                            case "USI-BACKEND:pageinjection-remove":
                                page_injection_helper.remove_userscript(message_data.id);
                                break;
                            case "USI-BACKEND:pageinjection-refresh":
                                page_injection_helper.re_init_page_injection();
                                break;
                                
                            case "USI-BACKEND:start-spa":
                                /**
                                 * Startet ein SPA, in einem neuen Tab
                                 */
                                let spa_instance = new SPA();
                                
                                spa_instance.createPage(message_data.userscript);
                                break;
                            
                            case "USI-BACKEND:reload-from-source":
                                if (message_data.url) {
                                    /**
                                     * @todo
                                     * Zunächst einmal nur einen neuen Tab öffnen
                                     * Skript später wieder richtig laden
                                     */
                                    browser.tabs.create({url: message_data.url});
                                }
                                break;
                            case "USI-BACKEND:create-userscript":
                                if (!message_data.userscript) {
                                    throw "Userscript is missing";
                                }

                                let userscript = message.data.userscript;
                                // Hier wird das UserScript weiterverarbeitet und gespeichert

                                if (!message.data.moreinformations) {
                                    message.data.moreinformations = null;
                                }
                                let valid_userscript = add_userscript.check_for_valid_userscript_settings(userscript, message.data.moreinformations);

                                if (valid_userscript.valid === false) {
                                    // Userscript Konfiguration nicht in Ordnung
                                    port.postMessage({name: "userscript-config-is-wrong", data: {valid_userscript}});
                                    return;
                                }

                                // Überprüfe ob das Userscript bereits gespeichert wurde
                                let userscript_id = await add_userscript.exist_userscript_already(userscript);

                                if (userscript_id === false) {
                                    // neu anlegen
                                    let userscript_handle = await add_userscript.save_new_userscript(userscript, message.data.moreinformations);
                                    // füge das Skript gleich hinzu, damit es ausgeführt werden kann
                                    page_injection_helper.add_userscript(userscript_handle.getId());

                                    port.postMessage({name: "userscript-is-created", data: {id: userscript_handle.getId()}});
                                } else {
                                    // bzgl. update fragen
                                    // Es wurde ein Userscript gefunden, soll es aktualisiert werden?
                                    port.postMessage({name: "USI-BACKEND:same-userscript-was-found", data: {id: userscript_id, userscript: userscript}});
                                }

                                break;
                            case "USI-BACKEND:override-same-userscript":

                                if (!message_data.id) {
                                    throw "Userscript ID is missing";
                                }
                                if (!message_data.userscript) {
                                    throw "Userscript is missing";
                                }

                                // Hier wird das UserScript weiterverarbeitet und gespeichert
                                let moreinformations = null;
                                if (message_data.moreinformations) {
                                    moreinformations = message_data.moreinformations;
                                }

                                let userscript_handle = await add_userscript.update_userscript(message_data.id, message_data.userscript, moreinformations);
                                page_injection_helper.add_userscript(userscript_handle.getId());

                                port.postMessage({name: "userscript-was-overwritten", data: {id: message_data.id}});

                                break;

                            case "USI-BACKEND:check-for-userscript-updates":
                                // durchlaufe alle Einträge und suche nach einer UpdateURL
                                let script_storage = await userscript_storage;
                                let all_userscripts = script_storage.getAll();

                                if (all_userscripts.length === 0) {
                                    throw "no Userscripts available";
                                }

                                for (var i in all_userscripts) {
                                    let userscript_settings = all_userscripts[i].settings;
                                    let userscript_id = all_userscripts[i].id;

                                    // prüfe ob eine UpdateURL gesetzt wurde!
                                    if (basic_helper.isset(userscript_settings["updateURL"])) {

                                        try {
                                            // UpdateURL gefunden, lade es nach!
                                            let loaded_userscript = await load_resource.load_userscript_by_url_promise(userscript_settings["updateURL"]);
                                            if(!loaded_userscript.target.responseText){
                                                // keine antwort
                                                continue;
                                            } 
                                            let loaded_userscript_text = loaded_userscript.target.responseText;
                                            
                                            // Konfig suchen und danach die Optionen Parsen...
                                            let loaded_userscript_settings = parse_userscript.find_settings(loaded_userscript_text);
                                            // Prüfe ob die Versionen verschieden sind!
                                            if (loaded_userscript_settings.version !== userscript_settings["version"]) {

                                                // Frage den Benutzer ob das Skript aktualisiert werden soll!
                                                port.postMessage({name: "USI-BACKEND:update-for-userscript-available", data: {id: userscript_id, userscript: loaded_userscript_text}});
                                            }
                                        } catch (exception) {

                                        }
                                    }
                                }
                                break;

                        }
                    } catch (ex) {
                        port.postMessage({name: "USI-BACKEND:get-alert", data: ex});
                    }
                });

            });

        }
    };

    return self;
})();
// Zeige den aktuellen Speicherverbauch an
//port.postMessage({name: "USI-BACKEND:storage-quota", data: script_storage.getQuota()});