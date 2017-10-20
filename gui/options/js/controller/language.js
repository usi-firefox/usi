"use strict";

/* global browser */

// verwaltet die Übersetzungen
var language_controller = (function language_class() {
    return  {
        // für direkten Zugriff
        lang: browser.i18n,
        replace_in_DOM: function () {
            jQuery("[data-usi-lang]").each(function (idx, element) {
                let message = this.lang().getMessage(jQuery(element).attr("data-usi-lang"));
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

}());

var lang = language_controller.lang;