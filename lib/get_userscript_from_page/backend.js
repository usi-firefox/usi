"use strict"; // Strict Mode aktivieren!

/* global browser, load_resource, add_userscript, basic_helper, page_injection_helper */

// init
browser.runtime.onConnect.addListener(function (port) {

    if (port.name !== "get-userscript-from-page") {
        return false;
    }

    // für Nachrichten vom Content Script
    port.onMessage.addListener(async function (message) {

        switch (message.name) {
            case "USI-BACKEND:new-userscript":
                let userscript = message.data.userscript,
                    // Hier wird das UserScript weiterverarbeitet und gespeichert
                    valid_userscript = add_userscript.check_for_valid_userscript_settings(userscript, message.data.moreinformations);

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

                break;

            case "USI-BACKEND:override-same-userscript":
                // Wenn dies aufgerufen wird, überschreibe ein vorhandenes Userscript
                if (!basic_helper.empty(message.data.id) && !basic_helper.empty(message.data.userscript) && !basic_helper.empty(message.data.moreinformations)) {
                    let userscript_handle = await add_userscript.update_userscript(message.data.id, message.data.userscript, message.data.moreinformations);
                    // füge das Skript gleich hinzu, damit es ausgeführt werden kann
                    page_injection_helper.add_userscript(userscript_handle);

                    port.postMessage({name: "userscript-is-created", data: {id: userscript_id}});
                }
                break;
        }
    });

});