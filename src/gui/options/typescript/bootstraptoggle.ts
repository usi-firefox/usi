"use strict";

declare var jQuery :any;

import basic_helper from "lib/helper/basic_helper";



// Bootstrap Toggle
export default function bootstrap_toggle_controller() {
    var self = {
        initButton: function (selector : string, on_text?: string, off_text?: string) {
            var width = null;
            if (basic_helper().empty(on_text)) {
                on_text = browser.i18n.getMessage("activated");
            }
            const on_text_l = <string> on_text;

            if (basic_helper().empty(off_text)) {
                off_text = browser.i18n.getMessage("deactivated");
            }
            const off_text_l = <string> off_text;

            // ermittele die passende Breite
            if (on_text_l.length <= off_text_l.length) {
                width = (off_text_l.length * 12);
            } else {
                width = (on_text_l.length * 12);
            }

            // initialisiert einen Button
            jQuery(selector).bootstrapToggle({
                on: on_text_l
                , off: off_text_l
                , width: width
            });
        }
    };

    return self;
}