import GM_Backend from "lib/GM/GM_Backend";
import page_injection_helper from "lib/inject/page_injection_helper";

/************************************************************************
 ************************* Options Bereich! *****************************
 ************************************************************************/

export default class usi_main {

    public static _create_new_options_tab(): void {
        // optionen gui starten ...
        const creating_options_tab = browser.tabs.create({
            url: "/gui/options.html",
        });
        creating_options_tab.then((success: any) => {
            // Damit nicht unnötig viele Tabs geöffnet werden
            usi_main.active_tab = success.id;
        });
    }

    private static active_tab: number = 0;

    private static page_injection_helper: page_injection_helper;

    constructor() {
        usi_main.page_injection_helper = new page_injection_helper();
    }

    public createGuiListener(): void {
        try {
            // USI Button
            if (!browser.browserAction.onClicked.hasListener(this._create_or_update_options_tab)) {
                browser.browserAction.onClicked.addListener(this._create_or_update_options_tab);
            }
        } catch (exception) {
            console.error("exception in main.createGuiListener()");
            if (exception.message) {
                console.error(exception.message);
            } else {
                console.error(exception);
            }
        }
    }

    public _create_or_update_options_tab(): void {
        if (usi_main.active_tab !== 0) {
            const possible_tab = browser.tabs.update(usi_main.active_tab, { active: true });

            possible_tab.then((ok) => {
                if (ok.url !== browser.extension.getURL("/gui/options.html")) {
                    usi_main._create_new_options_tab();
                }
            },
                (error) => {
                    // Aktiven Tab entfernen
                    usi_main.active_tab = 0;
                    usi_main._create_new_options_tab();
                },
            );
        } else {
            usi_main._create_new_options_tab();
        }
    }

    public startPageInjection(): void {
        usi_main.page_injection_helper.re_init_page_injection();
        usi_main.page_injection_helper.register_re_init_page_injection_event();
    }
    public startGMBackend(): void {
        new GM_Backend().register_listener();
    }
    public doUpdate(details: any): void {
        switch (details.reason) {
            case "install":
            case "update":
                usi_main.page_injection_helper.re_init_page_injection();
                break;
        }

    }
}

const usi_main_instance = new usi_main();

// führt ein Daten Update (Addon-SDK => Webextension) durch
if (!browser.runtime.onInstalled.hasListener(usi_main_instance.doUpdate)) {
    browser.runtime.onInstalled.addListener(usi_main_instance.doUpdate);
}

// Konfigurations Button erstellen
usi_main_instance.createGuiListener();

// GM Backend Listener starten
usi_main_instance.startGMBackend();

// PageInjection starten
usi_main_instance.startPageInjection();
