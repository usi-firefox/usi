"use strict";

/* global self, highlightjs_controller, event_manager_controller, language_controller, switchery_controller, event_controller, lang, Promise */

var userscript_list_controller = (function userscript_list_class() {

    var is_expanded = false;

    var self = {
        // fragt die Userscripte ab
        refresh: function () {
            // Zeige das Preload Image
            jQuery("#usi-list-preload-image").removeClass("hidden");

            event_controller.request.userscript.all(self.refresh_userscript_list);
        }
        , refresh_userscript_list: async function (userscripts) {
            // Wenn Userscripts gesendet werden, packe sie in die Variable --- all_userscripts
            // setze die Anzahl der Userscripts
            self.set_userscript_counter(userscripts.length);

            // leeren 
            jQuery("#usi-list-userscript-entries").html("");

            // es gibt keine Userscripts
            if (userscripts.length <= 0) {
                jQuery("#usi-list-preload-image").addClass("hidden");
                return false;
            }

            var promises_store = [];
            // durchlaufe alle userscripts

            if (typeof userscripts.forEach === "function") {
                userscripts.forEach(function (userscript, index) {
                    // Instanziere das Userscript
                    var userscript_entry = new userscript_list_entry_class(userscript, index);

                    // falls ein Fehler auftreten sollte, ist der userscript_entry === false
                    if (userscript_entry === false) {
                        return false;
                    }

                    if (typeof userscript_entry.deliver_vars !== "function") {
                        userscript_entry.deliver_vars = function () {};
                    }

                    // Promise Array füllen
                    promises_store.push(new Promise(function (resolve, reject) {
                        // template laden und Variablen ersetzen
                        jQuery("#usi-list-userscript-entries").
                            loadTemplate("options/templates/list_entry.html",
                                userscript_entry.deliver_vars(),
                                {append: true, complete: function () {
                                        // after_rendering ausführen
                                        userscript_entry.after_rendering();
                                        resolve();
                                    }
                                });
                    }));

                });
            }
            // Ausführen nachdem alle Promises erfüllt wurden
            Promise.all(promises_store).then(function () {

                // Nachlade Image entfernen
                jQuery("#usi-list-preload-image").addClass("hidden");

                // initialisiere die eingeklappten Userscript Übersicht
                self.set_expand_status(true);
                self.expand_or_compress();
            });

        }
        , set_userscript_counter: function (counter) {
            if (counter && counter > 0) {
                jQuery("#usi-list-userscript-count-negative").addClass("hidden");
                jQuery("#usi-list-userscript-count-positive").removeClass("hidden");

                jQuery("#usi-list-userscript-count").html(counter);
            } else {
                jQuery("#usi-list-userscript-count-positive").addClass("hidden");
                jQuery("#usi-list-userscript-count-negative").removeClass("hidden");
            }
        }
        /**
         * 
         * @param {boolean} setTo
         * @returns {void}
         */
        , set_expand_status: function (setTo) {
            // muss ein bool sein
            if (setTo === true || setTo === false) {
                is_expanded = setTo;
            }
        }
        , expand_or_compress: function () {
            if (is_expanded === false) {
                // Pfeilrichtungen anpassen
                jQuery("#usi-list-userscript-entries .usi-list-entry-toggle-options")
                    .addClass("fa-angle-double-up")
                    .removeClass("fa-angle-double-down");

                // Einblenden
                jQuery("#usi-list-userscript-entries .panel-body").removeClass("not-visible hidden");

                jQuery("#usi-list-userscript-expandOrCompress").removeClass("fa-expand").addClass("fa-compress");

            } else {
                // Pfeilrichtungen anpassen
                jQuery("#usi-list-userscript-entries .usi-list-entry-toggle-options")
                    .removeClass("fa-angle-double-up")
                    .addClass("fa-angle-double-down");

                // Ausblenden
                jQuery("#usi-list-userscript-entries .panel-body").addClass("not-visible hidden");

                // Icon anpassen
                jQuery("#usi-list-userscript-expandOrCompress").addClass("fa-expand").removeClass("fa-compress");
            }

            // Wert tauschen
            self.set_expand_status(!is_expanded);

        }
    };

    // Registriere das Event zum Neuladen der Userscripte
    event_manager_controller.register_once(document, "USI-FRONTEND:refresh-userscripts", function (event, action, param1) {
        event_controller.request.userscript.all(self.refresh_userscript_list);
    });


    return {
        after_rendering: function () {
            // Active Style festlegen
            /*  event_controller.register.highlightjs.style(function (style) {
             highlightjs_controller.set_active_style(style);
             }); */

            // Speicherverbrauch anzeigen
            event_controller.register.userscript.quota(function (quota) {

                // falls ein Komma enthalten sein sollte ...
                var rounded_quota = (Math.round(quota * 100) / 100 + "").replace(".", ","),
                    currentMemoryUsage = lang.getMessage("actual_used_quota") + " : " + rounded_quota + "%";

                jQuery("#usi-list-current-memory-usage").text(currentMemoryUsage);
            });




            self.set_userscript_counter();

            event_manager_controller.register_once("#usi-list-refresh", "click", self.refresh);

            event_manager_controller.register_once("#usi-list-userscript-expandOrCompress", "click", self.expand_or_compress);

            // Direkt danach die Userscripteinträge einfordern
            self.refresh();
        }

    };
}());