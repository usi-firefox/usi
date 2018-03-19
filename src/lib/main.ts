"use strict"; // Strict Mode aktivieren!

import page_injection_helper from "lib/inject/page_injection_helper";
import options_backend from "lib/gui/options_backend";
import sdk_to_webext from "lib/update/sdk_to_webext";
import GM_Backend from "lib/GM/GM_Backend";
import basic_helper from "lib/helper/basic_helper";



/************************************************************************
 ************************* Options Bereich! *****************************
 ************************************************************************/

export default class usi_main {

    private active_tab: number = 0;

    private page_injection_helper: page_injection_helper;
    private options_backend: options_backend;

    constructor() {
        this.page_injection_helper = new page_injection_helper();
        this.options_backend = new options_backend();
    }

    createGui() {
        try {
            browser.browserAction.onClicked.addListener(() => {

                if (this.active_tab !== 0) {
                    let possible_tab = browser.tabs.update(this.active_tab, { active: true });

                    possible_tab.then((ok) => {
                        if (ok.url !== browser.extension.getURL("/gui/options.html")) {
                            this._create_new_options_tab();
                        }
                    },
                        (error) => {
                            // Aktiven Tab entfernen
                            this.active_tab = 0;
                            this._create_new_options_tab();
                        }
                    );
                } else {
                    this._create_new_options_tab();
                }

            });
        } catch (exception) {
        }
    }

    _create_new_options_tab() {
        // optionen gui starten ...
        let creating_options_tab = browser.tabs.create({
            url: "/gui/options.html"
        });
        creating_options_tab.then((success: any) => {
            // Damit nicht unnötig viele Tabs geöffnet werden
            this.active_tab = success.id;
        });
    }

    startPageInjection() {
        this.page_injection_helper.re_init_page_injection();
        this.page_injection_helper.register_re_init_page_injection_event();
    }
    startOptionsBackend() {
        this.options_backend.start();
    }
    startGMBackend() {
        GM_Backend().register_listener();
    }
    doUpdateFromSDKToWebext(details: any) {
        switch (details.reason) {
            case "install":
            case "update":
                let after_update = (new sdk_to_webext()).do_update();
                after_update.then(() => {
                    if (details.reason === "install") {
                        // Fehler beim ersten Start m(
                            this.page_injection_helper.re_init_page_injection();
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
usi_main_instance.createGui();
usi_main_instance.startOptionsBackend();

// GM Backend Listener starten
usi_main_instance.startGMBackend();

// PageInjection starten
usi_main_instance.startPageInjection();
