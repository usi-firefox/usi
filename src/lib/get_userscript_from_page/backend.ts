"use strict"; // Strict Mode aktivieren!

import load_resource from "lib/load/load_resource";
import basic_helper from "lib/helper/basic_helper";
import add_userscript from "lib/storage/add_userscript";
import page_injection_helper from "lib/inject/page_injection_helper";
import { getUserscriptFromPageMessage } from "lib/get_userscript_from_page/content";



// init
browser.runtime.onConnect.addListener(function (port: any) {

    if (port.name !== "get-userscript-from-page") {
        return false;
    }

    // für Nachrichten vom Content Script
    port.onMessage.addListener(async function (message: getUserscriptFromPageMessage) {

        try {
            let lang = browser.i18n;

            switch (message.name) {
                case "USI-BACKEND:new-userscript":
                    let userscript = message.data.userscript,
                        // Hier wird das UserScript weiterverarbeitet und gespeichert
                        valid_userscript = add_userscript().check_for_valid_userscript_settings(userscript, message.data.moreinformations);

                    if (valid_userscript.valid === false) {
                        // Userscript Konfiguration nicht in Ordnung
                        basic_helper().notify(browser.i18n.getMessage("userscript_config_is_wrong"));
                        return;
                    }

                    // Überprüfe ob das Userscript bereits gespeichert wurde
                    let userscript_id = await add_userscript().exist_userscript_already(userscript);

                    if (userscript_id === 0) {
                        // neu anlegen
                        let userscript_handle = await <any>add_userscript().save_new_userscript(userscript, message.data.moreinformations);
                        // füge das Skript gleich hinzu, damit es ausgeführt werden kann
                        (new page_injection_helper()).add_userscript(userscript_handle);

                        basic_helper().notify(browser.i18n.getMessage("userscript_was_created"));

                    } else {
                        // bzgl. update fragen
                        // Es wurde ein Userscript gefunden, soll es aktualisiert werden?
                        port.postMessage(<getUserscriptFromPageMessage>{ name: "USI-BACKEND:same-userscript-was-found", data: { id: userscript_id, userscript: userscript } });
                    }

                    break;

                case "USI-BACKEND:override-same-userscript":
                    // Wenn dies aufgerufen wird, überschreibe ein vorhandenes Userscript
                    if (!basic_helper().empty(message.data.id) && !basic_helper().empty(message.data.userscript)) {
                        let more_informations = null;
                        if (message.data.moreinformations) {
                            more_informations = message.data.moreinformations;
                        }

                        let userscript_handle = await <any>add_userscript().update_userscript(message.data.id, message.data.userscript, more_informations);
                        // füge das Skript gleich hinzu, damit es ausgeführt werden kann
                        (new page_injection_helper()).add_userscript(userscript_handle);

                        basic_helper().notify(browser.i18n.getMessage("userscript_was_overwritten"));
                    }
                    break;
            }
        } catch (ex) {
            basic_helper().notify("Excetion:" + ex);
        }
    });

});