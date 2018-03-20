

declare var jQuery: any;

import language_controller from "language";
import manager_controller from "manager";



export default function template_controller() {

    var last_used_controller: any = false
        , last_used_controller_container_id :any = false
        , actual_controller_container_id: any = false
        , controllers_already_started: any = [];

    var self = {
        load: function (name: string, additional?: any) {

            var controller_already_started = false,
                replaceValues = {}, actual_controller: any;

            // Ruft die Destroy Funktion des letzten Controllers auf
            if (last_used_controller !== false && typeof last_used_controller.destroy === "function") {
                last_used_controller.destroy();
            }

            // prüft ob der Controller bereits geladen wurde
            for (var i in controllers_already_started) {
                if (name === controllers_already_started[i]) {
                    controller_already_started = true;
                }
            }

            // Controller ID festlegen
            actual_controller_container_id = "usi-controller-container-" + name;

            // lädt den passenden Controller
            actual_controller = manager_controller().getController(name);

            // ersetze die Überschrift
            jQuery("#nav_title").html(manager_controller().getControllerTitle(name));

            if (actual_controller !== false && typeof actual_controller.deliver_vars === "function") {
                // falls ein gültiger Controller gerufen wurde, wird nun seine deliver_vars() augeführt
                replaceValues = actual_controller.deliver_vars();
            }

            if (actual_controller !== false) {
                last_used_controller = actual_controller;
            }

            /* if (last_used_controller_container_id !== false) {
                jQuery(".usi-controller-container").addClass("hidden");
            } */
            
            jQuery(".usi-controller-container").addClass("hidden");
            

            if (controller_already_started === false) {
                // Controller Container hinzufügen
                jQuery("#app-body-content").append(
                    jQuery("<div>").
                        attr("id", actual_controller_container_id).
                        attr("class", "usi-controller-container").
                        addClass("hidden")
                );

                // Lade das Template und ersetze die Variablen
                jQuery("#" + actual_controller_container_id).
                    loadTemplate("options/templates/" + name + ".html", replaceValues, {

                        complete: function () {
                            // nach Abschluss des Nachladens ...
                            // 
                            // suche nun alle Tags mit data-usi-lang
                            language_controller().replace_in_DOM();

                            // Wenn der Controller eine after_rendering Funktion hat, führe diese nach dem Laden aus
                            if (actual_controller !== false && typeof actual_controller.after_rendering === "function") {
                                actual_controller.after_rendering();
                            }

                            controllers_already_started.push(name);
                            last_used_controller_container_id = actual_controller_container_id;

                            // Ausführen nachdem das Template fertig geladen wurde
                            if (additional && typeof additional.callback_on_complete === "function") {
                                additional.callback_on_complete();
                            }

                            // Sobald alles abgearbeitet wurde, kann der gesamte Container angezeigt werden
                            jQuery("#" + actual_controller_container_id).removeClass("hidden");
                        }
                    });

            } else {
                // !!!ACHTUNG!!!
                // Dies wird auch ausgeführt, wenn der Controller bereits 1x geladen wurde!
                if (additional && typeof additional.callback_on_complete === "function") {
                    additional.callback_on_complete();
                }

                // Controller wurde bereits geladen, daher wird dieser nun wieder eingeblendet!
                jQuery("#" + actual_controller_container_id).removeClass("hidden");
            }
        }

    };

    return self;
}