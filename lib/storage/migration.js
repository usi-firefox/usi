"use strict";

// Holt die Userscripte aus dem Speicher (simple-storage)
var migration = (function () {
    var simple_storage = require("sdk/simple-storage"),
        storage = simple_storage.storage,
        self = {
            run: function () {
                // Durchlaufe alle Migrationsschritte
                self.steps.forEach(function (migration_step) {
                    if (typeof migration_step === "function") {
                        migration_step();
                    }
                });
            }

            /**
             * Enthält alle nötigen Migrations Schritte nach einem Update
             * @returns 
             */
            , steps: [
                /**
                 * 
                 * @returns {void}
                 */
                function upgradeFromVersion047to050() {
                    // Teste ob es bereits im Storage einen Wert für die USI Settings gibt
                    if(typeof storage.usiSettings !== "undefined"){
                        // übernehme alle bisher eingepflegten Userscripts in den Userscript Speicher
                        for(var i in storage){
//                            if(storage[i])
                        }
                        
                    }
                },
                function () {
                    console.error("Anonymous Funktion");

                }
            ]
        };

    return self;
}());

if (typeof exports !== "undefined") {
    exports.migration = migration;
}