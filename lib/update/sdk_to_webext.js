"use strict";

/* global browser, basic_helper, Promise */

var sdk_to_webext = (function () {

    let self = {
        default_settings: {
            config: {
                own_css: ""
                , load_script_with_js_end: true
                , hightlightjs: {
                    active: true
                    , style: "default"
                }
                , greasemonkey: {
                    global_active: true
                }
            }
        },
        create_defaults: function () {
            // ACHTUNG, setzt alle "settings" auf ihre Standard Werte
            // neue Struktur speichern
            return browser.storage.local.set({settings: self.default_settings});
        }
        , prefs_update: function (complete_storage) {
            // Alte Einstellungen anpassen
            if (typeof complete_storage.prefs === "object") {
                // alte SDK Daten vorhanden
                let old_sdk_prefs = complete_storage.prefs;

                // Alte Optionsnamen anpassen - START
                let new_sdk_prefs = self.default_settings;

                if (typeof old_sdk_prefs.config_add_css === "string") {
                    new_sdk_prefs.config.own_css = old_sdk_prefs.config_add_css;
                }
                if (typeof old_sdk_prefs.enableExternalScriptLoadQuestion === "boolean") {
                    new_sdk_prefs.config.load_script_with_js_end = old_sdk_prefs.enableExternalScriptLoadQuestion;
                }
                if (typeof old_sdk_prefs.options_activate_highlightjs === "boolean") {
                    new_sdk_prefs.config.hightlightjs.active = old_sdk_prefs.options_activate_highlightjs;
                }
                if (typeof old_sdk_prefs.hightlightjsstyle === "string") {
                    new_sdk_prefs.config.hightlightjs.style = !old_sdk_prefs.hightlightjsstyle;
                }
                if (typeof old_sdk_prefs.options_always_activate_greasemonkey === "boolean") {
                    new_sdk_prefs.config.greasemonkey.global_active = !old_sdk_prefs.options_always_activate_greasemonkey;
                }
                // Alte Optionsnamen anpassen - END

                // Alte Datenstruktur entfernen
                browser.storage.local.remove("prefs");


                // neue Struktur speichern
                return browser.storage.local.set({settings: new_sdk_prefs});

            } else if (typeof complete_storage.settings !== "object") {
                // Falls keine Einstellungen gesetzt wurden, setze die Standard Werte
                return self.create_defaults();
            }
        }
        , userscripts_update: async function (complete_storage, callback) {
            if (typeof complete_storage.storage === "object") {

                // alte SDK Daten vorhanden
                let old_sdk_userscript_storage = complete_storage.storage;

                let userscript_ids = Object.keys(old_sdk_userscript_storage);

                for (var i in userscript_ids) {

                    let userscript_id = userscript_ids[i];

                    if (/(\d+)/.test(userscript_id)) {
                        let entry = {};
                        entry["userscript_" + userscript_id] = old_sdk_userscript_storage[userscript_id];

                        await browser.storage.local.set(entry);
                    }
                }

                // den alten Storage entfernen
                await browser.storage.local.remove("storage");
                return true;

            }
        }
        , do_update: async function () {
            // Daten Struktur für Webextension anpassen
            browser.storage.local.get(null).then(async (complete_storage) => {

                // Zunächst die Einstellungen updaten
                let prefs_updated = await self.prefs_update(complete_storage);

                // Wenn die Einstellungen fertig sind, müssen die Userscripte angepasst 
                let userscripts_updated = await self.userscripts_update(complete_storage);

                // jetzt den neuen Inhalt zurückgeben
                return browser.storage.local.get(null);

            });
        }
    };

    return self;

})();

if (typeof exports !== "undefined") {
    exports.sdk_to_webext = sdk_to_webext;
}