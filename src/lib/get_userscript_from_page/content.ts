import { getExtId, getTranslation } from "lib/helper/basic_helper";
import config_storage from "lib/storage/config";

new config_storage().get().then((config: any) => {

    // is_active -> wird über die Konfigurationsvariable gesetzt
    if (config.load_script_with_js_end !== true) {
        // Stop
        return false;
    }

    // Port zum Backend Skript öffnen
    const port = browser.runtime.connect(getExtId(), { name: "get-userscript-from-page" });

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

        port.postMessage(message);
    }

    port.onMessage.addListener((response: any) => {

        const message = response as usi.fromPageWithUserscriptFile.message;

        switch (message.name) {

            case "USI-BACKEND:same-userscript-was-found":
                if (window.confirm(getTranslation("same_userscript_was_found_ask_update_it_1") + message.data.id + getTranslation("same_userscript_was_found_ask_update_it_2"))) {
                    // Dieses Skript wird nun aktualisiert! userscript_infos = {id : id , userscript: userscript}
                    const message_override: usi.fromPageWithUserscriptFile.message = {
                        data: {
                            id: message.data.id,
                            moreinformations: { url: window.location.href },
                            userscript: message.data.userscript,
                        },
                        name: "USI-BACKEND:override-same-userscript",
                    };

                    port.postMessage(message_override);
                }
                break;
        }

    });
});
