"use strict";

declare var jQuery: any;

export default function event_manager_controller() {

    var registered_once_events: any = [];

    var self = {

        // registriert ein neues Event
        register: function (element: string | Document | Window, eventname: string, func: Function) {
            // neues Event registrieren
            jQuery(element).on(eventname, func);
        }

        , unregister: function (element: string | Document | Window, eventname: string, func: Function) {
            // neues Event registrieren
            jQuery(element).off(eventname, func);
        }

        // Stellt sicher dass das Event nur einmal registriert ist, ansonsten wird es zunächst wieder entfernt
        , register_once: function (element: string | Document | Window, eventname: string, func: Function) {

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

    return self;

}