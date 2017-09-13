"use strict";

/* global language_controller, basic_helper, lang */

// Bootstrap Toggle
var bootstrap_toggle_controller = (function bootstrap_toggle_class() {
    var self = {
        initButton: function (selector, on_text, off_text) {
            var width = null;
            if (basic_helper.empty(on_text)) {
                on_text = lang.getMessage("activated");
            }
            if (basic_helper.empty(off_text)) {
                off_text = lang.getMessage("deactivated");
            }

            // ermittele die passende Breite
            if (on_text.length <= off_text.length) {
                width = (off_text.length * 12);
            } else {
                width = (on_text.length * 12);
            }

            // initialisiert einen Button
            jQuery(selector).bootstrapToggle({
                on: on_text
                , off: off_text
                , width: width
            });
        }
    };

    return self;
}());