"use strict";

/* global userscript_overview_controller, userscript_list_controller, userscript_load_external_controller, userscript_edit_controller, userscript_config_controller, lang, userscript_help_controller */

/**
 * Liefert für den angfragten Namen den passenden Controller zurück
 * 
 * @returns object controller
 */
var manager_controller = (function manager_class() {

    var self = {

        getController: function (name) {

            if (typeof name === "string") {

                switch (name) {
                    case "overview":
                        return userscript_overview_controller;
                    case "list":
                        return userscript_list_controller;
                    case "edit":
                        return userscript_edit_controller;
                    case "load_external":
                        return userscript_load_external_controller;
                    case "config":
                        return userscript_config_controller;
                    case "help":
                        return userscript_help_controller;
                    default:
                        // unbekannter Controller!
                        console.error("unbekannter Controller! im 'manager' angefragt ### " + name + " ###");
                        return false;
                }

            } else {
                // kein String übergeben
                return false;
            }

        }

        , getControllerTitle: function (name) {

            var key;

            switch (name) {
                case "overview":
                    key = "overview";
                    break;
                case "list":
                    key = "all_userscripts";
                    break;
                case "edit":
                    key = "create_new_userscript";
                    break;
                case "load_external":
                    key = "userscript_after_load";
                    break;
                case "config":
                    key = "loadOptions_title";
                    break;
                case "help":
                    key = "help";
                    break;
                default:
                    // unbekannter Controller!
                    console.error("unbekannter Controller! im 'manager' angefragt ### " + name + " ###");
                    return false;
            }
            // Rückgabe des Controller Titels
            return lang.getMessage(key);
        }

    };

    return self;

}());