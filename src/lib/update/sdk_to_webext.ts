export default class sdk_to_webext {

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

    public create_defaults() {
        // ACHTUNG, setzt alle "settings" auf ihre Standard Werte
        // neue Struktur speichern
        return browser.storage.local.set({
            settings: {
                config: this.config_default,
            } as any,
        });
    }

    public prefs_update(complete_storage: any) {
        // Alte Einstellungen anpassen
        if (typeof complete_storage.prefs === "object") {
            // alte SDK Daten vorhanden
            const old_sdk_prefs = complete_storage.prefs;

            // Alte Optionsnamen anpassen - START
            const new_sdk_prefs = {
                config: this.config_default,
            };

            if (typeof old_sdk_prefs.enableExternalScriptLoadQuestion === "boolean") {
                new_sdk_prefs.config.load_script_with_js_end = old_sdk_prefs.enableExternalScriptLoadQuestion;
            }
            if (typeof old_sdk_prefs.options_activate_highlightjs === "boolean") {
                new_sdk_prefs.config.hightlightjs.active = old_sdk_prefs.options_activate_highlightjs;
            }
            if (typeof old_sdk_prefs.hightlightjsstyle === "string") {
                new_sdk_prefs.config.hightlightjs.style = old_sdk_prefs.hightlightjsstyle;
            }
            if (typeof old_sdk_prefs.options_always_activate_greasemonkey === "boolean") {
                new_sdk_prefs.config.greasemonkey.global_active = !old_sdk_prefs.options_always_activate_greasemonkey;
            }
            // Alte Optionsnamen anpassen - END

            // Alte Datenstruktur entfernen
            browser.storage.local.remove("prefs");

            // neue Struktur speichern
            return browser.storage.local.set({ settings: new_sdk_prefs as any });

        } else if (typeof complete_storage.settings !== "object") {
            // Falls keine Einstellungen gesetzt wurden, setze die Standard Werte
            return this.create_defaults();
        }
    }

    public async userscripts_update(complete_storage: any) {
        if (typeof complete_storage.storage === "object") {

            // alte SDK Daten vorhanden
            const old_sdk_userscript_storage = complete_storage.storage;

            const userscript_ids = Object.keys(old_sdk_userscript_storage);

            for (const i in userscript_ids) {

                const userscript_id = userscript_ids[i];

                if (/(\d+)/.test(userscript_id)) {
                    const entry = {} as any;
                    entry["userscript_" + userscript_id] = old_sdk_userscript_storage[userscript_id];

                    await browser.storage.local.set(entry);
                }
            }

            // den alten Storage entfernen
            await browser.storage.local.remove("storage");
            return true;

        }
    }

    public async do_update() {
        // Daten Struktur für Webextension anpassen
        return browser.storage.local.get(null).then(async (complete_storage) => {

            // Zunächst die Einstellungen updaten
            const prefs_updated = await this.prefs_update(complete_storage);

            // Wenn die Einstellungen fertig sind, müssen die Userscripte angepasst
            const userscripts_updated = await this.userscripts_update(complete_storage);

            // jetzt den neuen Inhalt zurückgeben
            const refreshed_data = await browser.storage.local.get(null);

            return refreshed_data;
        });
    }
}
