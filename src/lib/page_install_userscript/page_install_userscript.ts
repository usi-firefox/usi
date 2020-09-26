import { getTranslation, notify, empty } from "lib/helper/basic_helper";
import config_storage from "lib/storage/config";
import page_injection_helper from "lib/inject/page_injection_helper";
import add_userscript from "lib/storage/add_userscript";

const add_userscript_instance = new add_userscript();

async function create_new_userscript(message: usi.fromPageWithUserscriptFile.message) {
    const userscript = message.data.userscript;
    // Hier wird das UserScript weiterverarbeitet und gespeichert
    const valid_userscript = add_userscript_instance.check_for_valid_userscript_settings(userscript, message.data.moreinformations);

    if (valid_userscript.valid === false) {
        // Userscript Konfiguration nicht in Ordnung
        notify(getTranslation("userscript_config_is_wrong"));
        return;
    }

    // Überprüfe ob das Userscript bereits gespeichert wurde
    const userscript_id = await add_userscript_instance.exist_userscript_already(userscript);

    if (userscript_id === 0) {
        // neu anlegen
        try {

            const userscript_handle = await add_userscript_instance.save_new_userscript(userscript, message.data.moreinformations) as any;
            // füge das Skript gleich hinzu, damit es ausgeführt werden kann
            (new page_injection_helper()).add_userscript(userscript_handle);

            notify(getTranslation("userscript_was_created"));

        } catch (excetion) {
            notify(excetion.message);
        }

    } else {
        // bzgl. update fragen
        // Es wurde ein Userscript gefunden, soll es aktualisiert werden?
        if (window.confirm(getTranslation("same_userscript_was_found_ask_update_it_1") + userscript_id + getTranslation("same_userscript_was_found_ask_update_it_2"))) {
            await override_same_userscript({ name: "USI-BACKEND:same-userscript-was-found", data: { id: userscript_id, userscript } } as usi.fromPageWithUserscriptFile.message);
        }
    }
}

async function override_same_userscript(message: usi.fromPageWithUserscriptFile.message) {
    // Wenn dies aufgerufen wird, überschreibe ein vorhandenes Userscript
    if (!empty(message.data.id) && !empty(message.data.userscript)) {
        let more_informations = null;
        if (message.data.moreinformations) {
            more_informations = message.data.moreinformations;
        }

        try {

            const userscript_handle = await add_userscript_instance.update_userscript(message.data.id as any, message.data.userscript, more_informations as usi.Userscript.AddionalData.Moreinformations) as any;
            // füge das Skript gleich hinzu, damit es ausgeführt werden kann
            (new page_injection_helper()).add_userscript(userscript_handle);

            notify(getTranslation("userscript_was_overwritten"));

        } catch (excetion) {
            notify(excetion.message);
        }
    }
}

function start() {
    new config_storage().get().then((config: any) => {

        // is_active -> wird über die Konfigurationsvariable gesetzt
        if (config.load_script_with_js_end !== true) {
            // Stop
            return false;
        }

        const userscript_content = document.body.innerText;

        // frage ob das Skript heruntergeladen werden soll
        if (window.confirm(getTranslation("should_usi_import_this_userscript"))) {
            const message: usi.fromPageWithUserscriptFile.message = {
                data: {
                    moreinformations: { url: window.location.href },
                    userscript: userscript_content,
                },
                name: "USI-BACKEND:new-userscript",
            };

            create_new_userscript(message);
        }
    });
}


// main()
start();