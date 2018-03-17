"use strict";

declare var jQuery :any;
declare var window :any;
declare var document :any;

import event_controller from "events/event_controller";
import event_manager_controller from "events/event_manager";
import bootstrap_toggle_controller from "bootstraptoggle";
import language_controller from "language";

/* global event_manager_controller, event_controller, bootstrap_toggle_controller, lang, browser */

// Userscript bearbeiten
export default function userscript_edit_controller() {

    var prefered_locale
        , textarea_default_size: any
        , load_example_by_prefered_locale
        , textarea_id: any
        , last_userscript_interval_id: any = null
        , last_userscript_text: any = []
        , script_id: any;

    // Die ID der Textarea
    textarea_id = "#usi-edit-script-textarea";

    var self = {
        // liefert die benötigten Variablen für jQuery.loadTemplate zurück
        deliver_vars: function () {
            return {
                script_id: script_id
            };
        }

        // Führe dies aus, sobald das Template geladen wurde
        , after_rendering: function () {
            prefered_locale = browser.i18n.getUILanguage();
            // setze die Standard Sprache
            textarea_default_size = jQuery(textarea_id).css("font-size").split("px")[0];

            // nur wenn die erste 'prefered_locale' -> 'de' ist, ansonsten wird die Englische Version geladen
            if (prefered_locale === "de" || prefered_locale === "de-de") {
                load_example_by_prefered_locale = "de";
            } else {
                load_example_by_prefered_locale = "en";
            }

            // Text Area anpassen bei Größen Änderung
            event_manager_controller().register_once(window, "resize", self.setTextareaHeight);

            // Button Events registieren
            event_manager_controller().register_once("#usi-edit-script-load-example", "click", self.load_example);
            event_manager_controller().register_once("#usi-edit-script-textarea-clear", "click", self.textarea_clear);
            event_manager_controller().register_once("#usi-edit-script-textarea-default-size", "click", self.defaultSize);
            event_manager_controller().register_once("#usi-edit-script-save", "click", self.save);
            event_manager_controller().register_once("#usi-edit-script-textarea-size", "change", self.changeSize);

            event_manager_controller().register_once("#usi-edit-script-utf8-to-latin1", "click", self.utf8_to_latin1);
            event_manager_controller().register_once("#usi-edit-script-latin1-to-utf8", "click", self.latin1_to_utf8);

            // automatische sicherung wiederherstellen
            event_manager_controller().register_once("#usi-edit-script-undo", "click", self.undo);

            if (last_userscript_interval_id === null) {
                last_userscript_interval_id = window.setInterval(function () {
                    // falls der letzte Wert in der Historie verschieden sein sollte
                    if (jQuery(textarea_id).val().length > 0) {
                        // Kein Wert enthalten ODER der Letzte Wert ist verschieden
                        if (last_userscript_text.length === 0 ||
                            (last_userscript_text[last_userscript_text.length - 1] !== jQuery(textarea_id).val())) {
                            // 
                            last_userscript_text.push(jQuery(textarea_id).val());
                            self.undo_length();
                        }
                    }

                    // alle 10 Sekunden durchführen
                }, 10000);
            }

            // Schalter richtig positionieren lassen ...
            self.defaultSize();
            self.setTextareaHeight();

            // Setze die Script ID in den Kopf, falls vorhanden
            self.change_userscript_id(script_id);

            // Overwrite Button stylen
            bootstrap_toggle_controller().initButton("#usi-edit-script-overwrite",
                browser.i18n.getMessage("yes"),
                browser.i18n.getMessage("no")
            );

            // Falls ein Userscript zur Editierung übergeben wurde
            event_manager_controller().register_once(document, "USI-FRONTEND:editTab-get-userscript", function (event: any, userscript: any) {
                // prüfe ob ein Userscript übergeben wurde und trage den Inhalt in die Textarea ein
                if (userscript.userscript) {
                    jQuery(textarea_id).val(userscript.userscript);
                }

                // aktuelle Userscript ID setzen
                if (userscript.id) {
                    self.change_userscript_id(userscript.id);
                }

                // nach ganz oben scrollen
                jQuery(document).scrollTop(0);
            });
        }

        // Blendet den Kopfbereich für die Userscript ID ein/aus, und setzt die "script_id"
        , change_userscript_id: function (userscrpt_id?: any) {
            // Script ID überschreiben
            script_id = userscrpt_id;
            if (script_id) {
                jQuery("#usi-edit-script-id---block").removeClass("hidden");
                jQuery("#usi-edit-script-id").html(script_id);
                // Möglichkeit anzugeben, dass ein Userscript überschrieben werden soll
                jQuery("#usi-edit-script-overwrite---block").removeClass("hidden");
            } else {
                jQuery("#usi-edit-script-id---block").addClass("hidden");
                jQuery("#usi-edit-script-id").html("");
                jQuery("#usi-edit-script-overwrite---block").addClass("hidden");
            }
        }

        /**
         * Höhe der Textarea an die Fenstergröße anpassen!
         * @returns {undefined}
         */
        , setTextareaHeight: function () {
            var window_innerHeight = parseInt(window.innerHeight),
                size_by_percent = 65 / 100;

            // Textarea höhe berechnen
            var textarea_height = Math.floor(window_innerHeight * size_by_percent);

            // Größe setzen
            jQuery(textarea_id).css("height", textarea_height + "px");
        }

        /**
         * Textarea Größe anpassen
         * @returns {undefined}
         */
        , changeSize: function () {
            // Setze die Größe der Textarea auf den Wert aus dem Range "Button"
            jQuery(textarea_id).css("font-size", jQuery("#usi-edit-script-textarea-size").val() + "px");
        }

        /**
         * Textarea auf Standard Größe zurücksetzen
         * @returns {undefined}
         */
        , defaultSize: function () {
            // Wert des ZOOM Reglers auf den Standard setzen
            // Setze die Größe der Textarea auf den Wert aus dem Range "Button"
            jQuery(textarea_id).css("font-size", textarea_default_size + "px");

            jQuery("#usi-edit-script-textarea-size").val(textarea_default_size);
        }

        , textarea_clear: function () {
            self.change_userscript_id();
            jQuery(textarea_id).val("");
        }

        , undo: function () {
            if (last_userscript_text.length > 0) {
                var undo_value = last_userscript_text.pop();

                if (undo_value === jQuery(textarea_id).val()) {
                    // Falls es der gleiche Wert sein sollte, kannst du es 1x überspringen
                    undo_value = last_userscript_text.pop();
                }

                // zuletzt gesicherten Wert wieder eintragen
                if (typeof undo_value === "string") {
                    jQuery(textarea_id).val(undo_value);
                }

                self.undo_length();
            }
        }

        , undo_length: function () {
            jQuery("#usi-edit-script-undo-length").html(last_userscript_text.length);
        }

        , load_example: function (event: any, lang_key: any) {
            let lang_local = (lang_key) ? lang_key : browser.i18n.getUILanguage();

            // Beispiel Datei laden  
            jQuery.ajax({
                url: window.location.origin + "/gui/options/example/" + lang_local + "-example.user.js"
                , dataType: "text"
                , success: function (data: any) {
                    self.textarea_clear();
                    jQuery(textarea_id).val(data);
                }
                , error: function () {
                    if (typeof lang_key === "string" && lang_key.length > 1) {
                        // @todo Fehler Message anzeigen?
                    } else {
                        // versuche es erneut mit der englischen Variante
                        self.load_example(event, "en");
                    }

                }
            });
        }

        /**
         * Userscript aus der Textarea übermitteln
         * @returns {undefined}
         */
        , save: function () {
            // Textarea nicht leer ...
            if (jQuery(textarea_id).val().length > 20) {
                // sende den Userscript Text an das Addon Skript...
                // Falls eine Userscript ID existiert und es überschrieben werden soll
                if (script_id && jQuery("#usi-edit-script-overwrite").prop("checked")) {
                    // Vorhandes Userscript überschreiben
                    event_controller().set.userscript.override({ userscript: jQuery(textarea_id).val(), id: script_id });
                } else {
                    // Keine Script ID gegeben
                    event_controller().set.userscript.create({ userscript: jQuery(textarea_id).val() });
                }

                // den Wert der Historie hinzufügen
                last_userscript_text.push(jQuery(textarea_id).val());
                self.undo_length();
            }
        }

        /**
         * Textarea in einen Vollbild Modus schalten!
         * @returns {undefined}
         */
        , textarea_to_fullscreen: function () {
            var window_innerHeight = parseInt(window.innerHeight),
                size_by_percent = 75 / 100;

            // Textarea höhe berechnen
            var textarea_height = Math.floor(window_innerHeight * size_by_percent);

            // Größe setzen
            jQuery(textarea_id).css("height", textarea_height + "px");
        }

        /**
         * Convert Funktionen, falls es Probleme mit den Charset's geben sollte
         */
        , utf8_to_latin1: function () {
            try {
                jQuery(textarea_id).val(
                    unescape(
                        encodeURIComponent(
                            jQuery(textarea_id).val())));
            } catch (e) {
            }
        }
        , latin1_to_utf8: function () {
            try {
                jQuery(textarea_id).val(
                    decodeURIComponent(
                        escape(
                            jQuery(textarea_id).val())));
            } catch (e) {
            }
        }

    };

    // da es hier keine Funktionen gibt die nicht von außen aufgerufen werden dürften kann das komplett Objekt zurückgegeben werden
    return self;
}