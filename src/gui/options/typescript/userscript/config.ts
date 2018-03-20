

declare var jQuery :any;

import config_storage from "lib/storage/config";
import highlightjs_controller from "highlightjs";
import event_controller from "events/event_controller";
import event_manager_controller from "events/event_manager";
import bootstrap_toggle_controller from "bootstraptoggle";

export default function userscript_config_controller() {

    var last_css :any = [],
        // init
        self = {

            css_undo: function () {
                if (last_css.length > 0) {
                    // Letzten Wert wieder eintragen
                    jQuery("#usi-config-add-css").val(last_css.pop());

                } else {
                    // leeren
                    jQuery("#usi-config-add-css").val("");
                }

                // danach den Refresh Prozess antriggern
                self.css_refresh(true, true);
            }
            , activate_css: function (new_css : any) {
                // CSS eintragen und aktivieren
                return jQuery("#usi-additional-css").html(new_css);
            }
            , css_refresh: function (no_reset?: any, no_undo?: any) {
                if (jQuery("#usi-config-add-css").val().length > 0) {
                    var new_css = jQuery("#usi-config-add-css").val().replace(/<\/?[^>]+>/gi, '');
                    // CSS eintragen und aktivieren
                    self.activate_css(new_css);

                    // Speichern
                    event_controller().set.config.own_css(new_css);

                    if (no_undo !== true) {
                        // in die historie packen
                        last_css.push(new_css);
                    }

                    // Reset anbieten, für den fall das etwas schief gegangen ist
                    if (no_reset !== true) {
                        window.setTimeout(function () {
                            if (window.confirm(browser.i18n.getMessage("config_add_css_reset_question"))) {
                                // reset 
                                self.activate_css("");
                            }
                        }, 5000);
                    }
                }else{
                    // CSS zurücksetzen
                    self.activate_css("");
                }
            }

            , after_rendering: function () {

                // lade die Einstellungen
                config_storage().get().then((config: any) => {

                    // Setze die gesetzen Einstellungen für die Buttons --- START
                    jQuery("#usi-config-change-options-always-activate-greasemonkey").prop("checked", config.greasemonkey.global_active);
                    self.__change_switch_option("#usi-config-change-options-always-activate-greasemonkey");

                    jQuery("#usi-config-change-enable-external-script-load-question").prop("checked", config.load_script_with_js_end);
                    self.__change_switch_option("#usi-config-change-enable-external-script-load-question");

                    jQuery("#usi-config-change-options-activate-highlightjs").prop("checked", config.hightlightjs.active);
                    self.__change_switch_option("#usi-config-change-options-activate-highlightjs");

                    jQuery("#usi-config-add-css").val(config.own_css);
                    self.css_refresh(true);
                });

                self.__change_switch_option("usi-config-change-complete-export");

                // Setze die gesetzen Einstellungen für die Buttons --- END


                // Zusätzliche Events registrieren --- START

                // Hört darauf ob Aktualisierungen für die Skripte zur Verfügung stehen ...
                event_controller().register.userscript.update.available(function (userscript_infos : any) {
                    if (window.confirm(browser.i18n.getMessage("userscript_update_was_found_1") + userscript_infos.id + browser.i18n.getMessage("userscript_update_was_found_2"))) {
                        // Nun das Skript aktualisieren!
                        event_controller().set.userscript.override(userscript_infos);

                        event_controller().request.userscript.refresh();
                    }
                });

                // Zusätzliche Events registrieren --- END


                // Button Events --- START
                event_manager_controller().register_once("#usi-config-delete-all", "click", self.deleteAll);
                event_manager_controller().register_once("#usi-config-check-for-updates", "click", self.checkForUpdates);
                event_manager_controller().register_once("#usi-config-export-all", "click", self.exportAll);


                event_manager_controller().register_once("#usi-config-add-css-refresh", "click", self.css_refresh);
                event_manager_controller().register_once("#usi-config-add-css-undo", "click", self.css_undo);


                // Switch Events behandeln
                event_manager_controller().register_once("#usi-config-change-enable-external-script-load-question", "change", function (event: any) {
                    event_controller().set.config.load_external_script(jQuery("#" + event.target.id).prop("checked"));
                });
                event_manager_controller().register_once("#usi-config-change-options-activate-highlightjs", "change", function (event: any) {
                    // ändert den Aktivierungs Status
                    event_controller().set.config.highlightjs_state(jQuery("#" + event.target.id).prop("checked"));

                    highlightjs_controller().activate(jQuery("#" + event.target.id).prop("checked"));
                });
                event_manager_controller().register_once("#usi-config-change-options-always-activate-greasemonkey", "change", function (event: any) {
                    // Aktiviert Greasemonkey Funktionen immer, egal ob @use-greasemonkey gesetzt wurde oder nicht
                    event_controller().set.config.gm_funcs_always_on(jQuery("#" + event.target.id).prop("checked"));
                });


            }

            , __change_switch_option: function (id : any) {
                var off_text = jQuery(id + "---false").text(),
                    on_text = jQuery(id + "---true").text();

                // init bootstrap toggle
                bootstrap_toggle_controller().initButton(id, on_text, off_text);

                // Text ausblenden
                jQuery(id + "---false," + id + "---true").addClass("hidden");
            }

            /**
             * Alle Userscripte entfernen
             * @returns {undefined}
             */
            , deleteAll: function () {
                // Doppelte Sicherheitsabfrage, bevor wirklich alles gelöscht wird!
                if (window.confirm(browser.i18n.getMessage("really_reset_all_settings"))) {
                    if (window.confirm(browser.i18n.getMessage("really_really_reset_all_settings"))) {
                        event_controller().request.userscript.delete_all();
                        event_controller().request.userscript.refresh();
                    }
                }
            }

            // Prüfe ob für die Skripte Updates gefunden wurden!
            , checkForUpdates: event_controller().request.userscript.update_check


                // exportiere die Skripte
            , exportAll: function () {
                if (jQuery("#usi-config-change-complete-export").prop("checked") === true) {
                    event_controller().get.userscript.export.all(true);
                } else {
                    event_controller().get.userscript.export.all(false);
                }

            }

        };

    // gib einfach alles zurück
    return self;

}