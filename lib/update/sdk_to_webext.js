"use strict";

/* global browser, basic_helper, Promise */

var sdk_to_webext = (function () {

    let self = {
        create_defaults : function(){
            // ACHTUNG, setzt alle "settings" auf ihre Standard Werte
            let default_settings = {
                config : {
                    own_css : ""
                    ,load_script_with_js_end : true
                    ,hightlightjs : {
                        active : true
                        ,style : "default"
                    }
                    , greasemonkey : {
                        global_active : true
                    }
                }
            };

            // neue Struktur speichern
            return browser.storage.local.set({settings: default_settings});
        }
        , prefs_update: function (complete_storage) {
            // Alte Einstellungen anpassen
            if (basic_helper.is_object(complete_storage.prefs) && basic_helper.is_object(complete_storage.prefs.sdk_prefs)) {
                // alte SDK Daten vorhanden
                let old_sdk_prefs = complete_storage.prefs.sdk_prefs;

                // Alte Optionsnamen anpassen - START
                old_sdk_prefs.config = {};

                if (basic_helper.is_string(old_sdk_prefs.config_add_css)) {
                    old_sdk_prefs.config.own_css = old_sdk_prefs.config_add_css;

                    delete old_sdk_prefs.config_add_css;
                }

                if (basic_helper.is_boolean(old_sdk_prefs.enableExternalScriptLoadQuestion)) {
                    old_sdk_prefs.config.load_script_with_js_end = old_sdk_prefs.enableExternalScriptLoadQuestion;

                    delete old_sdk_prefs.enableExternalScriptLoadQuestion;
                }

                if (basic_helper.is_boolean(old_sdk_prefs.options_activate_highlightjs)) {
                    if (!basic_helper.is_object(old_sdk_prefs.config.hightlightjs)) {
                        old_sdk_prefs.config.hightlightjs = {};
                    }

                    old_sdk_prefs.config.hightlightjs.active = old_sdk_prefs.options_activate_highlightjs;

                    delete old_sdk_prefs.options_activate_highlightjs;
                }
                if (typeof old_sdk_prefs.hightlightjsstyle === "string") {
                    if (!basic_helper.is_object(old_sdk_prefs.config.hightlightjs)) {
                        old_sdk_prefs.config.hightlightjs = {};
                    }

                    old_sdk_prefs.config.hightlightjs.style = !old_sdk_prefs.hightlightjsstyle;

                    delete old_sdk_prefs.hightlightjsstyle;
                }
                if (basic_helper.is_boolean(old_sdk_prefs.options_always_activate_greasemonkey)) {
                    if (!basic_helper.is_object(old_sdk_prefs.config.greasemonkey)) {
                        old_sdk_prefs.config.greasemonkey = {};
                    }

                    old_sdk_prefs.config.greasemonkey.global_active = !old_sdk_prefs.options_always_activate_greasemonkey;

                    delete old_sdk_prefs.options_always_activate_greasemonkey;
                }
                // Alte Optionsnamen anpassen - END

                if (old_sdk_prefs.highlightJSactivated) {
                    delete old_sdk_prefs.highlightJSactivated;
                }
                if (old_sdk_prefs.highlightJSdeactivated) {
                    delete old_sdk_prefs.highlightJSdeactivated;
                }

                delete complete_storage.prefs.sdk_prefs;
                delete complete_storage.prefs;

                // Alte Datenstruktur entfernen
                browser.storage.local.remove("prefs");


                // neue Struktur speichern
                return browser.storage.local.set({settings: old_sdk_prefs});

            }else if(!basic_helper.is_object(complete_storage.settings)){
                // Falls keine Einstellungen gesetzt wurden, setze die Standard Werte
                return self.create_defaults();
            }
        }
        , userscripts_update: async function (complete_storage, callback) {
            if (basic_helper.is_object(complete_storage.storage) && basic_helper.is_object(complete_storage.storage.sdk_userscript_storage)) {

                // alte SDK Daten vorhanden
                let old_sdk_userscript_storage = complete_storage.storage.sdk_userscript_storage;

                let userscript_ids = Object.keys(old_sdk_userscript_storage);

                for (let i in userscript_ids) {

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
            return browser.storage.local.get(null).then(async (complete_storage) => {

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