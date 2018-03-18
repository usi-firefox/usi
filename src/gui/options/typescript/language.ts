"use strict";

declare var jQuery :any;
declare var browser :any;

/* global browser */

// verwaltet die Übersetzungen
export default function language_controller() {
    return {
        // für direkten Zugriff
        replace_in_DOM: function () {
            jQuery("[data-usi-lang]").each(function (idx: any, element: any) {
                let message = browser.i18n.getMessage(jQuery(element).attr("data-usi-lang"));
                if (jQuery(element).attr("data-usi-lang-replace") === "true") {
                    // ersetze den Inhalt
                    jQuery(element).text(message);
                    jQuery(element).removeAttr("data-usi-lang-replace");
                } else {
                    // füge die Übersetzung als ersten Textknoten ein
                    jQuery(element).prepend(message);
                }
                // entferne das Attribut
                jQuery(element).removeAttr("data-usi-lang");
            });
        }
    };

};