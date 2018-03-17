"use strict";

declare var jQuery :any;
declare var global_settings:any;

import basic_helper from "lib/helper/basic_helper";
import highlightjs_controller from "highlightjs";
import event_controller from "events/event_controller";
import event_manager_controller from "events/event_manager";
import bootstrap_toggle_controller from "bootstraptoggle";
import language_controller from "language";

/* global basic_helper, language_controller, highlightjs_controller, event_controller, bootstrap_toggle_controller, event_manager_controller, lang, global_settings */


function flatten_keys(obj: any, prepend_key: any, result?: any) {
    var key;
    if (typeof result === "undefined") {
        result = {};
    }
    for (var i in obj) {
        key = prepend_key + "-" + i;
        if (typeof obj[i] === "object") {
            flatten_keys(obj[i], key, result);
        } else {
            result[key] = obj[i];
        }
    }

    return result;
}

export default function userscript_list_entry_class(script: any, index: any) {

    if (!basic_helper().empty(script.userscript) && !basic_helper().empty(script.id)) {

        /**
         * erstellt die Variablen die im Template ersetzt werden sollen
         * START
         */
        var deliver_vars = flatten_keys(script, "userscript"),
            usi_list_entry_id = "usi-list-entry-id---" + script.id,
            usi_list_entry_id_plus_class = "#" + usi_list_entry_id + " .usi-list-entry-";

        // Index hinzufügen
        deliver_vars["index"] = index;

        // Userscript ID hinterlegen
        deliver_vars["usi-list-entry-id"] = usi_list_entry_id;

        // Icon ID hinzufügen
        deliver_vars["icon_data_id"] = "usi-list-userscript-settings-icon_data---" + script.id;

        /**
         * erstellt die Variablen die im Template ersetzt werden sollen
         * END
         */

        var highlightjs_already_done = false;

        var self = {
            export: function () {
                event_controller().get.userscript.export.single(script.id);
            }
            , add_icon: function () {
                // Icon mit usi logo füllen, falls leer
                var icon_path, height = 16;
                if (typeof deliver_vars["userscript-settings-icon_data"] === "string" && !basic_helper().empty(deliver_vars["userscript-settings-icon_data"])) {
                    icon_path = deliver_vars["userscript-settings-icon_data"];
                    height = height * 2;
                } else {
                    icon_path = "/gui/icon/usi.png";
                }

                // Icon hinzufügen
                jQuery("<img>").
                    attr("id", deliver_vars["icon_data_id"]).
                    attr("height", height).
                    attr("src", icon_path).
                    appendTo("#" + deliver_vars["icon_data_id"]);
            }
            /**
             * Userscript aktivieren, bzw deaktivieren
             * @returns void
             */
            , toggleActivation: function () {
                // aktiviere oder deaktiviere dieses Userscript!
                event_controller().set.userscript.toogle_state(script.id);

                jQuery("#" + usi_list_entry_id).toggleClass("grey");
            }


            // fragt nach den gesetzten Greasemonkey Variablen
            , getGMValues: function () {
                event_controller().request.userscript.gm_values(script.id).then((GMValues: any) => {
                    jQuery(usi_list_entry_id_plus_class + "get-gm-values---output").
                        html("").// leeren
                        html(GMValues);
                });
            }

            , toggleOverview: function () {
                jQuery(usi_list_entry_id_plus_class + "toggle-options").toggleClass("fa-angle-double-down fa-angle-double-up");
                // Ein und Ausblenden
                jQuery("#" + usi_list_entry_id + " .panel-body").toggleClass("not-visible hidden");

            }

            /**
             * Userscript entfernen
             * @returns {void}
             */
            , delete: function () {
                // das Skript mit der ID löschen!
                if (!basic_helper().empty(script.id)) {
                    //zusätzliche Abfrage
                    if (window.confirm(browser.i18n.getMessage("want_to_delete_this_userscript_1") + script.id + browser.i18n.getMessage("want_to_delete_this_userscript_2"))) {
                        event_controller().request.userscript.delete(script.id);

                        // Text nur durchstreichen, nicht direkt neuladen
                        jQuery("#" + usi_list_entry_id).css("text-decoration", "line-through");
                    }
                }
            }

            // entfernt alle gesetzten GM_Values
            , delete_GM_Values: function () {
                // Frage den Benutzer nochmals ob er wirklich alle gesetzten Werte entfernen möchte
                if (window.confirm(browser.i18n.getMessage("confirm_delete_all_GMValues"))) {
                    event_controller().set.userscript.gm_values.delete_all(script.id);
                }
            }

            // Sende es an den Editierungs Controller
            , edit: function () {
                // veranlasse den Tab Wechsel!
                jQuery(document).trigger("USI-FRONTEND:changeTab", ["edit", script]);
            }

            , start_spa: function () {
                event_controller().request.userscript.start_spa(script);
            }

            // Übergibt die URL an die Nachlade Funktion
            , loadAgain: function () {

                if (/^http/.test(script.moreinformations.url)) {
                    // URL muss mit http beginnen
                    event_controller().request.userscript.reload_from_source(script.moreinformations.url);
                } else {
                    basic_helper().notify("only source from http:// or https:// are allowed at the moment");
                }

            }
            // Code highlight
            , highlightCode: function () {

                if (global_settings.hightlightjs.active && highlightjs_already_done === false) {
                    highlightjs_controller().fill_in_options("#" + usi_list_entry_id);

                    // lass das userscript von hljs verarbeiten und in jQuery("#" + usi_list_entry_id) eintragen
                    highlightjs_controller().run("#" + usi_list_entry_id);

                    // damit es nicht ein weiteres mal durchgeführt werden muss
                    highlightjs_already_done = true;

                    jQuery("#" + usi_list_entry_id + " .selectHighlightJSStyleLabel, #" + usi_list_entry_id + " .selectHighlightJSStyle").removeClass("not-visible hidden");
                    jQuery("#" + usi_list_entry_id + " pre code").addClass("jscode hljs lang-javascript");
                } else if (global_settings.hightlightjs.active === false) {
                    // Unverändertes Userscript
                    jQuery("#" + usi_list_entry_id + " pre code").text(script.userscript).removeClass("jscode hljs lang-javascript");
                    jQuery("#" + usi_list_entry_id + " .selectHighlightJSStyleLabel, #" + usi_list_entry_id + " .selectHighlightJSStyle").addClass("not-visible hidden");
                }

            }

            , showUserscript: function () {
                // highlightCode
                self.highlightCode();
                // shortcut
                var sel = usi_list_entry_id_plus_class + "view-userscript---";
                jQuery(sel + "output," + sel + "show," + sel + "hide").toggleClass("hidden");
            }

            // register Button Events
            , register_buttons: function () {

                // Export Button
                event_manager_controller().register_once(usi_list_entry_id_plus_class + "export", "click", self.export);

                // Userscript de/-aktivieren
                jQuery(usi_list_entry_id_plus_class + "deactivated").prop("checked", script.deactivated);

                if (script.deactivated === true) {
                    jQuery("#" + usi_list_entry_id).addClass("grey");
                }

                // ACHTUNG hierbei müssen Aktiviert und Deaktiviert getauscht werden
                // Da -> script.deactivated === true , bedeutet dass das Skript deaktiviert ist!
                bootstrap_toggle_controller().initButton(usi_list_entry_id_plus_class + "deactivated",
                    browser.i18n.getMessage("deactivated"),
                    browser.i18n.getMessage("activated")
                );
                // ACHTUNG hierbei müssen Aktiviert und Deaktiviert getauscht werden

                event_manager_controller().register_once(usi_list_entry_id_plus_class + "deactivated", "change", self.toggleActivation);

                // edit
                event_manager_controller().register_once(usi_list_entry_id_plus_class + "edit", "click", self.edit);
                // delete
                event_manager_controller().register_once(usi_list_entry_id_plus_class + "delete", "click", self.delete);


                // Userscript ein und Ausblenden
                event_manager_controller().register_once("#" + usi_list_entry_id + " .panel-heading", "click", self.toggleOverview);

                // Wenn das Userscript von einer URL geladen wurde
                if (typeof script.moreinformations !== "undefined" && !basic_helper().empty(script.moreinformations) && !basic_helper().empty(script.moreinformations.url)) {
                    // von der URL neuladen
                    event_manager_controller().register_once(usi_list_entry_id_plus_class + "load-again", "click", self.loadAgain);
                } else {
                    // Nicht vorhanden daher ausblenden
                    jQuery(usi_list_entry_id_plus_class + "load-again---block").toggleClass("hidden");
                }

                // falls es bisher keine gespeicherten GM_Values gibt blende diesen Block aus
                if (basic_helper().empty(script.val_store) || Object.keys(script.val_store).length === 0) {
                    jQuery(usi_list_entry_id_plus_class + "gm-values").toggleClass("hidden");
                } else {
                    // GM-Values holen
                    event_manager_controller().register_once(usi_list_entry_id_plus_class + "get-gm-values", "click", self.getGMValues);

                    // GM-Values Löschen
                    event_manager_controller().register_once(usi_list_entry_id_plus_class + "delete-gm-values", "click", self.delete_GM_Values);

                }

                // Bootstrap Toggle
                bootstrap_toggle_controller().initButton(usi_list_entry_id_plus_class + "view-userscript",
                    browser.i18n.getMessage("show"),
                    browser.i18n.getMessage("hide")
                );

                // Userscript Inhalt anzeigen/ausblenden
                event_manager_controller().register_once(usi_list_entry_id_plus_class + "view-userscript", "change", self.showUserscript);

                // Ausgabe jedoch zunächst ausblenden
                jQuery(usi_list_entry_id_plus_class + "view-userscript---output").toggleClass("hidden");
                jQuery(usi_list_entry_id_plus_class + "view-userscript---hide").toggleClass("hidden");

                // Required Scripts
                if (!basic_helper().empty(script.require_scripts) && script.require_scripts.length > 0) {
                    for (var i in script.require_scripts) {
                        jQuery(usi_list_entry_id_plus_class + "required-scripts---output").append(
                            jQuery("<li>").html(script.require_scripts[i].url)
                        );
                    }
                } else {
                    jQuery(usi_list_entry_id_plus_class + "required-scripts").addClass("hidden");
                }

                // SPA Button
                if (script.settings.spa) {
                    event_manager_controller().register_once(usi_list_entry_id_plus_class + "start-spa-button", "click", self.start_spa);
                    jQuery(usi_list_entry_id_plus_class + "start-spa-div").removeClass("hidden");
                    jQuery(usi_list_entry_id_plus_class + "is-spa").removeClass("hidden");

                    jQuery(usi_list_entry_id_plus_class + "includes").addClass("hidden");
                } else {
                    // Include Regeln
                    if (!basic_helper().empty(script.settings.include)) {
                        for (var i in script.settings.include) {
                            jQuery(usi_list_entry_id_plus_class + "includes---output").append(
                                jQuery("<li>").html(script.settings.include[i])
                            );
                        }
                    } else {
                        // Das darf eigentlich nicht passieren ...
                    }
                }
            }
        };

        return {
            // liefert die benötigten Variablen für jQuery.loadTemplate zurück
            deliver_vars: function () {
                return deliver_vars;
            }

            , after_rendering: function () {

                // Icon hinzufügen
                self.add_icon();

                // Button Events registieren
                self.register_buttons();

                // Sprachspezifische Variablen ersetzen
                language_controller().replace_in_DOM();
            }

        };

    } else {
        return false;
    }
}
