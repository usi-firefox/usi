

declare var jQuery :any;

import event_manager_controller from "events/event_manager";
import event_controller from "events/event_controller";



export default function userscript_load_external_controller () {

    var id_prefix = "#usi-load-external-";

    var self = {
        after_rendering: function () {
            // alle Buttons registrieren
            self.register_buttons();
        }

        , register_buttons: function () {
            // Start Button für das Laden einer lokalen Datei
            event_manager_controller().register_once(id_prefix + "execute-local-load", "click", self.loadLocalFile);
            // alternatives Charset hinzufügen
            event_manager_controller().register_once(id_prefix + "add-custom-charset", "click", self.addCustomCharset);
        }

        , addCustomCharset: function () {
            var new_charset = window.prompt(browser.i18n.getMessage("add_new_custom_charset"));
            if (new_charset) {

                var found = false;

                jQuery(id_prefix + "alternativeCharsets option").each(function (i : any, element :any) {
                    if (jQuery(element).val() === new_charset) {
                        found = true;
                    }
                });

                if (found === false) {
                    jQuery(id_prefix + "alternativeCharsets").append(
                        jQuery("<option>").val(new_charset).html(new_charset)
                        );
                    jQuery(id_prefix + "alternativeCharsets option[value='" + new_charset + "']").prop("selected", true);
                } else {
                    alert(browser.i18n.getMessage("charset_already_exist"));
                }
            }
        }

        // Direkter Userscript Datei Upload
        , loadLocalFile: function () {

            var file = jQuery("#direct-userscript-upload").get(0).files[0];

            if (typeof file === "object") {
                var reader = new FileReader();

                reader.onload = function (e :any) {
                    // Daten an den EditController weiterreichen
                    jQuery(document).trigger("USI-FRONTEND:changeTab", ["edit", {userscript: e.target.result}]);
                };

                // Read in the image file as a data URL.
                reader.readAsText(file, jQuery(id_prefix + "alternativeCharsets").val());
            }

        }

    };


    return self;

}