



import load_resource from "lib/load/load_resource";
import sdk_to_webext from "lib/update/sdk_to_webext";

// Holt die Userscripte aus dem Speicher (simple-storage)
export default function config_storage () {

    var self = {
        get: async function () {
            /**
             * the_storage.settings -> settings.config
             */
            let the_storage = <any> await browser.storage.local.get("settings");
            if (!the_storage.settings) {
                // Update nötig
                the_storage = await (new sdk_to_webext()).do_update();
            }

            return the_storage.settings.config;

        }

        , set: async function (newConfig : any) {
            let the_storage = <any> await browser.storage.local.get("settings");

            // neue Config setzen
            the_storage.settings.config = newConfig;

            // gib true zurück, wenn fertig
            return browser.storage.local.set(the_storage).then(() => true);
        }
    };

    return self;
}