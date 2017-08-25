"use strict";

var event_manager_controller = (function event_manager_class() {

    var registered_once_events = [];

    var self = {

        // registriert ein neues Event
        register: function (element, eventname, func) {
            // neues Event registrieren
            jQuery(element).on(eventname, func);
        }

        , unregister: function (element, eventname, func) {
            // neues Event registrieren
            jQuery(element).off(eventname, func);
        }

        // Stellt sicher dass das Event nur einmal registriert ist, ansonsten wird es zunächst wieder entfernt
        , register_once: function (element, eventname, func) {

            for (var i in registered_once_events) {
                if (registered_once_events[i].element === element
                    && registered_once_events[i].eventname === eventname
                    && registered_once_events[i].func_s === func.toString()) {

                    // aktuelles Element entfernen - ACHTUNG "sPlice" nicht "slice"!
                    registered_once_events.splice(i, 1);

                    // Event wurde bereits registriert
                    self.unregister(element, eventname, func);
                }
            }

            // neues Event registrieren
            self.register(element, eventname, func);

            // neuen eintrag im sichern
            var entry = {
                element: element
                , eventname: eventname
                , func_s: func.toString()
            };

            registered_once_events.push(entry);

            // alles in ordnung
            return true;
        }
    };

    return {

        register: self.register

        , unregister: self.unregister

            // Stellt sicher dass 
        , register_once: self.register_once

    };

}());