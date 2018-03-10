"use strict";

/* global browser, load_resource, userscript_handle */

// Holt die Userscripte aus dem Speicher (simple-storage)
var config_storage = (function () {

    var self = {
        get: async function () {
            /**
             * the_storage.settings -> settings.config
             */
            let the_storage = await browser.storage.local.get("settings");
            if (!the_storage.settings) {
                // Update nötig
                the_storage = await sdk_to_webext.do_update();
            }

            return the_storage.settings.config;

        }

        , set: async function (newConfig) {
            let the_storage = await browser.storage.local.get("settings");

            // neue Config setzen
            the_storage.settings.config = newConfig;

            // gib true zurück, wenn fertig
            return browser.storage.local.set(the_storage).then(() => true);
        }
    };

    return self;
}());