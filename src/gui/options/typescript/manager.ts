"use strict";

import userscript_overview_controller from "userscript/overview";
import userscript_list_controller from "userscript/list";
import userscript_load_external_controller from "userscript/load_external";
import userscript_edit_controller from "userscript/edit";
import userscript_config_controller from "userscript/config";
import userscript_help_controller from "userscript/help";



/**
 * Liefert für den angfragten Namen den passenden Controller zurück
 * 
 * @returns object controller
 */
export default function manager_controller() {

    var self = {

        getController: function (name?: string) {

            if (typeof name === "string") {

                switch (name) {
                    case "overview":
                        return userscript_overview_controller();
                    case "list":
                        return userscript_list_controller();
                    case "edit":
                        return userscript_edit_controller();
                    case "load_external":
                        return userscript_load_external_controller();
                    case "config":
                        return userscript_config_controller();
                    case "help":
                        return userscript_help_controller();
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

        , getControllerTitle: function (name: string) {

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
            return browser.i18n.getMessage(key);
        }

    };

    return self;

}