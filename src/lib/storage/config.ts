// Holt die Userscripte aus dem Speicher (simple-storage)
export default class config_storage {

    private config_default: usi.Storage.Config = {
        load_script_with_js_end: true
        , hightlightjs: {
            active: true
            , style: "default",
        }
        , greasemonkey: {
            global_active: true,
        },
    };

    /**
     * ACHTUNG, setzt die gesamte Konfiguration auf ihre Standard Werte zurück
     */
    public create_defaults() {
        // neue Struktur speichern
        return browser.storage.local.set(this.get_default_settings());
    }
    /**
     * Liefert die Konfiguration zurück,
     * falls keine Konfiguration gefunden wurde wird der Default verwendet
     */
    public get_default_settings() {
        return {
            configuration: this.config_default as any,
        };
    }

    public async get(): Promise<usi.Storage.Config> {
        /**
         * the_storage.settings -> settings.config
         */
        try {
            const configuration = await browser.storage.local.get(this.get_default_settings()) as any;
            return configuration.config;
        } catch (ex) {
            throw ex;
        }
    }

    public async set(newConfig: usi.Storage.Config): Promise<boolean> {
        try {
            const the_storage = await this.get() as any;
            /**
             * @TODO
             * neue Config setzen
             */
            the_storage.config = JSON.parse(JSON.stringify(newConfig));

            // gib true zurück, wenn fertig
            await browser.storage.local.set(the_storage);
            return true;
        } catch (ex) {
            throw ex;
        }

    }
}
