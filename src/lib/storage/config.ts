import sdk_to_webext from "lib/update/sdk_to_webext";

// Holt die Userscripte aus dem Speicher (simple-storage)
export default function config_storage() {

    const self = {
        async get(): Promise<usi.Storage.Config> {
            /**
             * the_storage.settings -> settings.config
             */
            try {
                let the_storage = await browser.storage.local.get("settings") as any;
                if (!the_storage.settings) {
                    // Update nötig
                    the_storage = await (new sdk_to_webext()).do_update();
                }
                return the_storage.settings.config;
            } catch (ex) {
                throw ex;
            }
        }

        , async set(newConfig: usi.Storage.Config): Promise<boolean> {
            const the_storage = await browser.storage.local.get("settings") as any;
            /**
             * @TODO
             * neue Config setzen
             */
            the_storage.settings.config = JSON.parse(JSON.stringify(newConfig));

            // gib true zurück, wenn fertig
            return browser.storage.local.set(the_storage).then(() => true);
        },
    };

    return self;
}
