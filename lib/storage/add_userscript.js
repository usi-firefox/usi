"use strict";

/* global basic_helper, parse_userscript, lang, userscript_storage, type_guess, Promise, page_injection_helper, browser */

var add_userscript = (function () {

    var self = {
        /**
         * Prüft ob es für das Userscript Konfiguration korrekt ist
         * @param {string} userscript
         * @param {object} moreinformations
         * @returns {object}
         */
        check_for_valid_userscript_settings: function (userscript, moreinformations) {
            let alternative_name,
                // Konfig suchen und danach die Optionen Parsen...
                userscript_settings = parse_userscript.find_settings(userscript);

            // Falls im Userscript kein Name vorhanden ist, setze den Dateinamen als @name
            if (moreinformations !== null && basic_helper.isset(moreinformations) && !basic_helper.empty(moreinformations.url)) {
                alternative_name = basic_helper.getFilenameFromURL(moreinformations.url);
            }

            // Rückgabe eines Promise Objects
            if (typeof userscript_settings.error_code === "number" && userscript_settings.error_code === 101 && !basic_helper.empty(alternative_name)) {
                // setze den @name in den Metablock des Userscripts ein
                var modified_userscript = parse_userscript.add_option_to_userscript_metablock(userscript, ["// @name     " + alternative_name]);
                // Benachrichtige den Nutzer, dass das Userscript verändert wurde
                return {valid: false, reason: "userscript_configuration_error___no_name", possible_solution: alternative_name};

            } else if (typeof userscript_settings.error_message !== "undefined") {
                // es wurde ein Fehler in der Konfiguration gefunden, melde es nun dem Benutzer!
                return {valid: false, reason: "userscript_configuration_error", message: browser.i18n.getMessage("error_userscript_settings") + userscript_settings.error_message};
            } else {
                // Userscript kann gespeichert werden
                return {valid: true};
            }
        }
        /**
         * 
         * @param {string} userscript
         * @param {object} moreinformations
         * @returns {userscript_handle}
         */
        , save_new_userscript: async function (userscript, moreinformations) {
            // Erzeuge ein neues Userscript
            let userscript_settings = parse_userscript.find_settings(userscript),
                userscripts = await userscript_storage;

            let userscript_handle = userscripts.createNew();

            // Userscript verarbeiten und speichern
            await self._save_userscript(userscript_handle, userscript, userscript_settings, moreinformations);

            return userscript_handle;
        }

        /**
         * 
         * @param {integer} userscript_id
         * @param {string} userscript
         * @param {object} moreinformations
         * @returns {userscript_handle}
         */
        , update_userscript: async function (userscript_id, userscript, moreinformations) {
            // aktualisiert ein vorhandenes Userscript
            let userscript_settings = parse_userscript.find_settings(userscript),
                userscripts = await userscript_storage;

            let userscript_handle = userscripts.getById(userscript_id);

            // Userscript verarbeiten und speichern
            await self._save_userscript(userscript_handle, userscript, userscript_settings, moreinformations);

            return userscript_handle;
        }

        /*
         * 
         * @param {string} userscript
         * @returns {integer|Boolean}
         */
        , exist_userscript_already: async function (userscript) {
            // Konfig suchen und danach die Optionen Parsen...
            let userscript_settings = parse_userscript.find_settings(userscript);

            // as => alle userscripte
            let storage = await userscript_storage;
            let as = storage.getAll();

            // Prüfe ob das Skript bereits existiert, und wenn ja frage ob es aktualisiert werden soll!
            for (var userscript_1 of as) {
                let possible_id = self.compare2Userscripts(userscript_1.settings, userscript_settings, userscript_1.id);
                
                if(possible_id){
                    // liefere gefundene ID
                    return possible_id;
                }
            }

            // Falls keins gefunden wurde
            return false;
        }

        , compare2Userscripts: function(u_1, u_2, id){
            let test_userscript_settings = ["name","namespace","author","updateURL","downloadURL"];
            
            for (var set of test_userscript_settings){
                if(typeof u_1[set] === "undefined" && typeof u_2[set] === "undefined"){
                    continue;
                }
                
                if(typeof u_1[set] !== "string" || typeof u_2[set] !== "string" || u_1[set] !== u_2[set]){
                    return false;
                }
            }
            
            return id;
        }
        /**
         * 
         * @param {object} userscript_handle
         * @param {string} userscript
         * @param {object} settings
         * @param {object} moreinformations
         * @returns {void}
         */
        , _save_userscript: async function (userscript_handle, userscript, settings, moreinformations) { 
            var running_promises = [],
                // Diese Funktion wird genutzt, falls beim Nachladen ein Fehler auftritt
                error_function = function (message) {
                    // Default Text
                    let alert_text = browser.i18n.getMessage("userscript_couldnt_saved") + " -> ID " + userscript_handle.getId();

                    if (message.code !== 200 && message.code !== 304) {
                        // Datei Anfrage lieferte kein 200 -> Success und kein 304 -> Not Modified
                        alert_text += "\n\n" + browser.i18n.getMessage("error_couldnt_load_url") + " -> code:'" + message.code + "' url:'" + message.url + "'";
                    }
                };

            // setze und speichere die gefundenen Einstellungen
            userscript_handle.
                setSettings(settings).
                setUserscriptContent(userscript).
                setMoreinformations(moreinformations).
                // alle Extern geladenen Daten zurücksetzen
                resetAllExternals();

            // lade die @resource angaben
            if (typeof settings.resource !== "undefined") {
                let one_resource, resource_name, resource_url, resource_charset,
                    resource_allowed_types = parse_userscript.get_userscript_keyword_config_by_name("resource");

                for (var j in settings.resource) {
                    // in [0] => name , [1] => url
                    one_resource = settings.resource[j].split(/\s+/);
                    resource_name = one_resource[0].trim();
                    resource_url = one_resource[1].trim();
                    // ermöglicht es ein eigenes Charset zu definieren, falls es Probleme gibt
                    if (typeof one_resource[2] !== "undefined") {
                        resource_charset = one_resource[2].trim();
                    }

                    // resource überschreiben! und setzt es auf Null falls nicht genutzt werden kann
                    resource_url = type_guess.typeGuess(resource_url, resource_allowed_types.types);

                    // Resource nachladen!
                    running_promises.push(new Promise(function (resolve) {
                        userscript_handle.loadAndAddExternals("resource", resource_url, resource_name, resource_charset, resolve, error_function);
                    }));
                }
            }

            // Verarbeite das @icon
            if (typeof settings.icon !== "undefined") {
                let icon_allowed_types = parse_userscript.get_userscript_keyword_config_by_name("icon");

                // icon URL
                let icon_url = type_guess.typeGuess(settings.icon, icon_allowed_types.types);

                // icon nachladen
                running_promises.push(new Promise(function (resolve) {
                    userscript_handle.loadAndAddExternals("icon", icon_url, null, null, resolve, error_function);
                }));
            }

            // Lade externe Skripte nach, falls vorhanden
            if (typeof settings.require !== "undefined") {
                let one_require, require_url,
                    require_allowed_types = parse_userscript.get_userscript_keyword_config_by_name("require");

                // da mehrere require Anweisungen erhalten sein können
                for (var require_index in settings.require) {
                    one_require = settings.require[require_index];

                    // Überprüfe die URL
                    require_url = type_guess.typeGuess(one_require, require_allowed_types.types);

                    // Nachladen des benötigten Skripts
                    running_promises.push(new Promise(function (resolve) {
                        userscript_handle.loadAndAddExternals("require", require_url, null, null, resolve, error_function);
                    }));

                }
            }

            // alle Promises abarbeiten, es darf kein Fehler aufgetreten sein!
            return Promise.all(running_promises).then(function (answers) {
                // erst jetzt darf es gespeichert werden
                return userscript_handle.save();
            });
        }
    };

    return self;
}());