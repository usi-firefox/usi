"use strict"; // Strict Mode aktivieren!

/* global require */

// Einstellungsspeicher laden
var preferences = preferences || require("sdk/simple-prefs"),
// PageMod Module laden!
    page_injection = page_injection || require("sdk/page-mod"),
// Kompatibilitäts Helfer
    cfx_jpm_helper = require("lib/configuration/cfx_jpm_helper").cfx_jpm_helper,
// Übersetzungsschlüssel bestimmen
    lang = require("lib/configuration/language").lang,
// Page Injection Helfer
    page_injection_helper = require("lib/inject/page_injection_helper").page_injection_helper,
    load_resource = require("lib/load/load_resource").load_resource,
    add_userscript = require("lib/storage/add_userscript").add_userscript,
// Resource Path festlegen
    resource_path = cfx_jpm_helper.resource_path();

// Horche auf User Scripte die aufgerufen wurden!
page_injection.PageMod({
    include: /.*\.user([()\d]*)\.js$/,
    contentScriptWhen: 'end',
    attachTo: ['top'], // TODO FF: make blocking policy start before this is run on install
    contentScriptFile: resource_path + "userscript-get.js",
    // Dürfen externe UserScripte direkt importiert werden? -> preferences.prefs.enableExternalScriptLoadQuestion
    contentScriptOptions: {language: lang},
    onAttach: function (worker) {

        // sendet den Status zurück
        worker.port.emit("USI-BACKEND:active", preferences.prefs.enableExternalScriptLoadQuestion);

        //  nimm die Skript URL und verarbeite Sie weiter
        worker.port.on("USI-BACKEND:new-usi-script_url---call", function (script_content_response) {

            // Versuche das USER Skript herunterzuladen
            // übergib den Rest des Ablaufs!, da der Aufruf nicht Syncron läuft!
            load_resource.load_userscript_by_url(script_content_response.script_url,
                function (user_script_text) {
                    // Hier wird das UserScript weiterverarbeitet und gespeichert
                    add_userscript.check_for_userscript_settings_and_save_it(
                        user_script_text,
                        worker,
                        null,
                        null,
                        script_content_response.moreinformations,
                        function (userscript_handle) {
                            // das Userscript direkt aktivieren
                            page_injection_helper.init_page_injection_by_id(userscript_handle.getId());
                        });
                }
            );
        });


        // Wenn dies aufgerufen wird, überschreibe ein vorhandenes Userscript
        worker.port.on("USI-BACKEND:override-same-userscript", function (userscipt_infos) {

            // Hier wird das UserScript weiterverarbeitet und gespeichert
            add_userscript.check_for_userscript_settings_and_save_it(
                userscipt_infos.userscript,
                worker,
                userscipt_infos.id,
                null,
                userscipt_infos.moreinformations,
                function (userscript_handle) {
                    // das Userscript direkt aktivieren
                    page_injection_helper.init_page_injection_by_id(userscript_handle.getId());
                });
        });
    }
});