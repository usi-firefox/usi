
import basic_helper from "lib/helper/basic_helper";
import config_storage from "lib/storage/config";

config_storage().get().then((config: any) => {

    // is_active -> wird über die Konfigurationsvariable gesetzt
    if (config.load_script_with_js_end !== true) {
        // Stop
        return false;
    }

    // Port zum Backend Skript öffnen
    let port = browser.runtime.connect(basic_helper().getExtId(), { name: "get-userscript-from-page" }),
        lang = browser.i18n;

    let userscript_content = document.body.innerText;

    // frage ob das Skript heruntergeladen werden soll
    if (window.confirm(browser.i18n.getMessage("should_usi_import_this_userscript"))) {
        let message: usi.fromPageWithUserscriptFile.message = {
            name: "USI-BACKEND:new-userscript",
            data: { userscript: userscript_content, moreinformations: { url: window.location.href } }
        };

        port.postMessage(message);
    }

    port.onMessage.addListener((response: any) => {

        let message = <usi.fromPageWithUserscriptFile.message>response;

        switch (message.name) {

            case "USI-BACKEND:same-userscript-was-found":
                if (window.confirm(browser.i18n.getMessage("same_userscript_was_found_ask_update_it_1") + message.data.id + browser.i18n.getMessage("same_userscript_was_found_ask_update_it_2"))) {
                    // Dieses Skript wird nun aktualisiert! userscript_infos = {id : id , userscript: userscript}
                    let message_override: usi.fromPageWithUserscriptFile.message = {
                        name: "USI-BACKEND:override-same-userscript", data: {
                            id: message.data.id,
                            userscript: message.data.userscript,
                            moreinformations: { url: window.location.href }
                        }
                    };

                    port.postMessage(message_override);
                }
                break;
        }

    });
});
