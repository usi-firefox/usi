// Strict Mode aktivieren!

import page_injection_helper from "lib/inject/page_injection_helper";
import options_backend from "lib/gui/options_backend";
import sdk_to_webext from "lib/update/sdk_to_webext";
import GM_Backend from "lib/GM/GM_Backend";
import basic_helper from "lib/helper/basic_helper";



/************************************************************************
 ************************* Options Bereich! *****************************
 ************************************************************************/

export default class usi_main {

    private static active_tab: number = 0;

    private static page_injection_helper: page_injection_helper;
    private static options_backend: options_backend;

    constructor() {
        usi_main.page_injection_helper = new page_injection_helper();
        usi_main.options_backend = new options_backend();
    }

    createGuiListener(): void {
        try {
            // USI Button
            if (!browser.browserAction.onClicked.hasListener(this._create_or_update_options_tab)) {
                browser.browserAction.onClicked.addListener(this._create_or_update_options_tab);
            }
        } catch (exception) {
        }
    }

    _create_or_update_options_tab(): void {
        if (usi_main.active_tab !== 0) {
            let possible_tab = browser.tabs.update(usi_main.active_tab, { active: true });

            possible_tab.then((ok) => {
                if (ok.url !== browser.extension.getURL("/gui/options.html")) {
                    usi_main._create_new_options_tab();
                }
            },
                (error) => {
                    // Aktiven Tab entfernen
                    usi_main.active_tab = 0;
                    usi_main._create_new_options_tab();
                }
            );
        } else {
            usi_main._create_new_options_tab();
        }
    }

    static _create_new_options_tab(): void {
        // optionen gui starten ...
        let creating_options_tab = browser.tabs.create({
            url: "/gui/options.html"
        });
        creating_options_tab.then((success: any) => {
            // Damit nicht unnötig viele Tabs geöffnet werden
            usi_main.active_tab = success.id;
        });
    }

    startPageInjection(): void {
        usi_main.page_injection_helper.re_init_page_injection();
        usi_main.page_injection_helper.register_re_init_page_injection_event();
    }
    startOptionsBackend(): void {
        usi_main.options_backend.start();
    }
    startGMBackend(): void {
        new GM_Backend().register_listener();
    }
    doUpdateFromSDKToWebext(details: any): void {
        switch (details.reason) {
            case "install":
            case "update":
                let after_update = (new sdk_to_webext()).do_update();
                after_update.then(() => {
                    if (details.reason === "install") {
                        // Fehler beim ersten Start m(
                        usi_main.page_injection_helper.re_init_page_injection();
                    }
                });
                break;
        }

    }
}

let usi_main_instance = new usi_main();

// führt ein Daten Update (Addon-SDK => Webextension) durch
if (!browser.runtime.onInstalled.hasListener(usi_main_instance.doUpdateFromSDKToWebext)) {
    browser.runtime.onInstalled.addListener(usi_main_instance.doUpdateFromSDKToWebext);
}

// Konfigurations Button erstellen
usi_main_instance.createGuiListener();
usi_main_instance.startOptionsBackend();

// GM Backend Listener starten
usi_main_instance.startGMBackend();

// PageInjection starten
usi_main_instance.startPageInjection();


// DEBUG!!!
usi_main_instance._create_or_update_options_tab();