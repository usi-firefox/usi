"use strict";
/* global browser, basic_helper, config_storage */

config_storage.get().then((config) => {

    // is_active -> wird über die Konfigurationsvariable gesetzt
    if (config.load_script_with_js_end !== true) {
        // Stop
        return false;
    }

    // Port zum Backend Skript öffnen
    let port = browser.runtime.connect(basic_helper.getExtId(), {name: "get-userscript-from-page"}),
        lang = browser.i18n;

    let userscript_content = document.body.innerText;

    // frage ob das Skript heruntergeladen werden soll
    if (window.confirm(lang.getMessage("should_usi_import_this_userscript"))) {
        port.postMessage({
            name: "USI-BACKEND:new-userscript",
            data: {userscript: userscript_content, moreinformations: {url: window.location.href}}
        });
    }

    port.onMessage.addListener((response) => {

        switch (response.name) {

            case "USI-BACKEND:same-userscript-was-found":
                if (window.confirm(lang.getMessage("same_userscript_was_found_ask_update_it_1") + response.data.id + lang.getMessage("same_userscript_was_found_ask_update_it_2"))) {
                    // Dieses Skript wird nun aktualisiert! userscript_infos = {id : id , userscript: userscript}
                    port.postMessage({name: "USI-BACKEND:override-same-userscript", data: {
                            id : response.data.id,
                            userscript: response.data.userscript,
                            moreinformations: {url: window.location.href}
                    }});
                }
                break;
        }

    });
});
