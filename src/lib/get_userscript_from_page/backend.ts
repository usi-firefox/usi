import { empty, notify, getTranslation } from "lib/helper/basic_helper";
import page_injection_helper from "lib/inject/page_injection_helper";
import add_userscript from "lib/storage/add_userscript";

const add_userscript_instance = new add_userscript();

// init
browser.runtime.onConnect.addListener(function(port: any) {

    if (port.name !== "get-userscript-from-page") {
        return false;
    }

    // für Nachrichten vom Content Script
    port.onMessage.addListener(async function(message: usi.fromPageWithUserscriptFile.message) {

        try {
            switch (message.name) {
                case "USI-BACKEND:new-userscript":
                    const userscript = message.data.userscript,
                        // Hier wird das UserScript weiterverarbeitet und gespeichert
                        valid_userscript = add_userscript_instance.check_for_valid_userscript_settings(userscript, message.data.moreinformations);

                    if (valid_userscript.valid === false) {
                        // Userscript Konfiguration nicht in Ordnung
                        notify(getTranslation("userscript_config_is_wrong"));
                        return;
                    }

                    // Überprüfe ob das Userscript bereits gespeichert wurde
                    const userscript_id = await add_userscript_instance.exist_userscript_already(userscript);

                    if (userscript_id === 0) {
                        // neu anlegen
                        const userscript_handle = await add_userscript_instance.save_new_userscript(userscript, message.data.moreinformations) as any;
                        // füge das Skript gleich hinzu, damit es ausgeführt werden kann
                        (new page_injection_helper()).add_userscript(userscript_handle);

                        notify(getTranslation("userscript_was_created"));

                    } else {
                        // bzgl. update fragen
                        // Es wurde ein Userscript gefunden, soll es aktualisiert werden?
                        port.postMessage({ name: "USI-BACKEND:same-userscript-was-found", data: { id: userscript_id, userscript } } as usi.fromPageWithUserscriptFile.message);
                    }

                    break;

                case "USI-BACKEND:override-same-userscript":
                    // Wenn dies aufgerufen wird, überschreibe ein vorhandenes Userscript
                    if (!empty(message.data.id) && !empty(message.data.userscript)) {
                        let more_informations = null;
                        if (message.data.moreinformations) {
                            more_informations = message.data.moreinformations;
                        }

                        const userscript_handle = await add_userscript_instance.update_userscript(message.data.id as any, message.data.userscript, more_informations as usi.Userscript.AddionalData.Moreinformations) as any;
                        // füge das Skript gleich hinzu, damit es ausgeführt werden kann
                        (new page_injection_helper()).add_userscript(userscript_handle);

                        notify(getTranslation("userscript_was_overwritten"));
                    }
                    break;
            }
        } catch (ex) {
            notify("Excetion:" + ex);
        }
    });

});
