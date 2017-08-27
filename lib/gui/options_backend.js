"use strict"; // Strict Mode aktivieren!

/************************************************************************
 ************************* Page Injection Funktionen! *******************
 ************************************************************************/

/* global require, browser, port, load_resource, page_injection_helper, worker, add_userscript, Promise, userscript_storage, basic_helper, parse_userscript, userscript_handle */

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

                    var message_data = message.data;

                    switch (message.name) {
                        case "USI-BACKEND:loadexternal-script_url":
                            //  nimm die Skript URL und verarbeite Sie weiter

                            try {
                                // Versuche das USER Skript herunterzuladen
                                // übergib den Rest des Ablaufs als Callback, da der Aufruf nicht Syncron läuft!
                                let user_script_text = await load_resource.load_userscript_by_url(message_data.script_url, message_data.charset);

                                // Hier wird das UserScript weiterverarbeitet und gespeichert
                                add_userscript.check_for_userscript_settings_and_save_it(user_script_text.responseText, port, null, null, message_data.moreinformations,
                                    (userscript_handle) => {

                                    // das Userscript direkt aktivieren
                                    page_injection_helper.add_userscript(userscript_handle);

                                    // Sende Benachrichtigung, dass eine neues Skript geladen wurde
                                    port.postMessage({name: "USI-BACKEND:external-script-is-now-loaded", data: true});
                                });
                            } catch (exception) {
                                port.postMessage({name: "USI-BACKEND:get-alert", data: "Userscript couldn't be saved!"});
                            }
                            break;
                        case "USI-BACKEND:create-userscript":
                            try {
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
                                    page_injection_helper.add_userscript(userscript_handle);

                                    port.postMessage({name: "userscript-is-created", data: {id: userscript_id}});
                                } else {
                                    // bzgl. update fragen
                                    // Es wurde ein Userscript gefunden, soll es aktualisiert werden?
                                    port.postMessage({name: "USI-BACKEND:same-userscript-was-found", data: {id: userscript_id, userscript: userscript}});
                                }

                            } catch (exception) {
                                port.postMessage({name: "USI-BACKEND:get-alert", data: "Userscript couldn't be saved!"});
                            }
                            break;
                        case "USI-BACKEND:override-same-userscript":
                            // Hier wird das UserScript weiterverarbeitet und gespeichert
                            try {
                                
                                let moreinformations = null;
                                if(message_data.moreinformations){
                                    moreinformations = message_data.moreinformations;
                                }
                                
                                let userscript_handle = await add_userscript.update_userscript(message_data.id, message_data.userscript, moreinformations);
                                page_injection_helper.add_userscript(userscript_handle);

                                port.postMessage({name: "userscript-was-overwritten", data: {id: message_data.id}});
                            } catch (exception) {
                                port.postMessage({name: "USI-BACKEND:get-alert", data: "Userscript couldn't be saved!"});
                            }
                            break;

                        case "USI-BACKEND:check-for-userscript-updates":
                            try {
                                // durchlaufe alle Einträge und suche nach einer UpdateURL
                                let script_storage = await userscript_storage;
                                let all_userscripts = script_storage.getAll();

                                for (let i in all_userscripts) {
                                    let userscript_handler = userscript_handle.initWithData(all_userscripts[i]);

                                    // prüfe ob eine UpdateURL gesetzt wurde!
                                    if (basic_helper.isset(userscript_handler.getSettings()["updateURL"])) {

                                        // UpdateURL gefunden, lade es nach!
                                        let loaded_userscript_text = await load_resource.load_userscript_by_url_promise(userscript_handler.getSettings()["updateURL"]);
                                        // Konfig suchen und danach die Optionen Parsen...
                                        let loaded_userscript_settings = parse_userscript.find_settings(loaded_userscript_text);
                                        // Prüfe ob die Versionen verschieden sind!
                                        if (loaded_userscript_settings.version !== userscript_handler.getSettings()["version"]) {

                                            // Frage den Benutzer ob das Skript aktualisiert werden soll!
                                            port.postMessage({name: "USI-BACKEND:update-for-userscript-available", data: {id: userscript_handler.getId(), userscript: loaded_userscript_text}});
                                        }
                                    }
                                }
                            } catch (exception) {
                                port.postMessage({name: "USI-BACKEND:get-alert", data: "Userscript couldn't be saved!"});
                            }
                            break;
                    }
                });

            });

        }
    };

    return self;
})();
// Zeige den aktuellen Speicherverbauch an
//port.postMessage({name: "USI-BACKEND:storage-quota", data: script_storage.getQuota()});