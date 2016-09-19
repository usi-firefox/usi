"use strict";

/* global basic_helper, parse_userscript, lang, userscript_storage, type_guess, Promise, page_injection_helper */

// Lade den basic_helper
var basic_helper = basic_helper || require("data/helper/basic_helper").basic_helper,
// PageMod Module laden!
    page_injection_helper = require("lib/inject/page_injection_helper").page_injection_helper,
// Userscript Parser laden!
    parse_userscript = parse_userscript || require("lib/parse/parse_userscript").parse_userscript,
// Übersetzungsschlüssel bestimmen
    lang = require("lib/configuration/language").lang,
    type_guess = require("lib/testing/type_guess").type_guess,
// Ermöglicht einen vereinfachten Umgang mit den gespeicherten Userscripts
    userscript_storage = require("lib/storage/userscript").userscript_storage;

var add_userscript = (function () {

    var private_functions = {
        /**
         * Prüft ob es für das Userscript eine Aktualisierung gibt, und überschreibt es bei Bedarf
         * @param {string} userscript
         * @param {object} worker
         * @param {string} override_userscript_id
         * @param {string} charset
         * @param {object} moreinformations
         * @returns {boolean}
         */
        check_for_userscript_settings_and_save_it: function (userscript, worker, override_userscript_id, charset, moreinformations) {
            var alternative_name, userscript_handle;

            // Falls im Userscript kein Name vorhanden ist, setze den Dateinamen als @name
            if (basic_helper.isset(moreinformations) && !basic_helper.empty(moreinformations.url)) {
                alternative_name = basic_helper.getFilenameFromURL(moreinformations.url);
            }

            // Konfig suchen und danach die Optionen Parsen...
            // us als Shortcur für userscript_settings
            var us = parse_userscript.find_settings(userscript);

            // Falls kein @name gefunden werden konnte, und ein alternativer Name vorhanden ist
            // versuche es
            if (us.error_code === 101 && !basic_helper.empty(alternative_name)) {
                // setze den @name in den Metablock des Userscripts ein
                var modified_userscript = parse_userscript.add_option_to_userscript_metablock(userscript, ["// @name     " + alternative_name]);

                // @todo
                // übler Workaround ...
                worker.port.emit("USI-BACKEND:To-Frontend-Document-Event-Forwarder", {event_name: "USI-FRONTEND:changeTab", action: "edit", param1: {userscript: modified_userscript}});

                // Benachrichtige den Nutzer, dass das Userscript verändert wurde!
                worker.port.emit("USI-BACKEND:get-alert", lang.userscript_was_modified_by_usi___reason_missing_name);

                // Prüfe ob kein Fehler enthalten ist!
            } else if (basic_helper.isset(us.error_message)) {
                // es wurde ein Fehler in der Konfiguration gefunden, melde es nun dem Benutzer!
                worker.port.emit("USI-BACKEND:get-alert", lang.error_userscript_settings + us.error_message);

                return false;
            } else {

                // für den späteren Check notwendig
                var old_userscript_was_found = 0;

                // Wenn keine Override ID angegeben wurde, suche nach gleichem Skript
                if (override_userscript_id === null || !basic_helper.isset(override_userscript_id)) {

                    /********************************************************************************************************************************************
                     * Dieser Weg wird für neue Skripte verwendet, aber gleichzeitig wird auch geprüft ob schon gleiche Skripte existieren! *********************
                     *********************************************************************************************************************************************/

                    // Shortcuts, für mehr Übersichtlichkeit
                    var as = userscript_storage.getAll();

                    var found_id = false;
                    // Prüfe ob das Skript bereits existiert, und wenn ja frage ob es aktualisiert werden soll!
                    for (var i in as) {
                        if (as[i].settings.name === us.name // Namen sind identisch
                            && as[i].settings.namespace === us.namespace // Namespace ist identisch
                            && as[i].settings.author === us.author // Author ist identisch
                            && as[i].settings.updateURL === us.updateURL // updateURL ist identisch
                            && as[i].settings.downloadURL === us.downloadURL) { // downloadURL ist identisch
                            // zuletzt gefundene ID
                            found_id = as[i].id;
                            // Erhöhe den Zähler! theoretisch könnten mehrere gleiche skripte vorhanden sein
                            old_userscript_was_found++;
                        }
                    }

                    if (old_userscript_was_found === 0) {
                        // Erzeuge ein neues Userscipt
                        userscript_handle = userscript_storage.createNew();

                        return private_functions.update_userscript(userscript_handle, userscript, us, moreinformations, worker);

                    } else {

                        // Es wurde ein Userscript gefunden, soll es aktualisiert werden?
                        worker.port.emit("USI-BACKEND:same-userscript-was-found", {id: found_id, userscript: userscript, moreinformations: moreinformations});

                        return false;
                    }

                } else {
                    /****************************************************************************************************************
                     * Dieser Weg wird nur für Skripte genutzt, die aktualisiert werden und bereits existieren! *********************
                     ****************************************************************************************************************/
                    // es wurde eine ID zum überschreiben mitgelierfert!

                    if (typeof override_userscript_id !== "undefined" && override_userscript_id > 0) {
                        // Userscript gefunden, es soll überschrieben werden
                        userscript_handle = userscript_storage.getById(override_userscript_id);

                        if (userscript_handle === false) {

                            // Darf niemalas passieren
                            return false;
                        } else {
                            return private_functions.update_userscript(userscript_handle, userscript, us, moreinformations, worker);
                        }

                    }
                }
            }
        }

        , update_userscript: function (userscript_handle, userscript, settings, moreinformations, worker) {
            var running_promises = [],
                // Diese Funktion wird genutzt, falls beim Nachladen ein Fehler auftritt
                error_function = function (message) {
                    // Default Text
                    var alert_text = lang.userscript_couldnt_saved + " -> ID " + userscript_handle.getId();

                    if (message.code === 404) {
                        // Datei Anfrage lieferte ein 404
                        alert_text += "\n\n" + lang.error_couldnt_load_url + " -> code:'" + message.code + "' url:'" + message.url + "'";
                    }

                    worker.port.emit("USI-BACKEND:get-alert", alert_text);
                };

            // setze und speichere die gefundenen Einstellungen
            userscript_handle.
                setSettings(settings).
                setUserscriptContent(userscript).
                setMoreinformations(moreinformations).
                // alle Extern geladenen Daten zurücksetzen
                resetAllExternals();

            // lade die @resource angaben
            if (!basic_helper.empty(settings.resource)) {
                var one_resource, resource_name, resource_url, resource_charset,
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
            if (!basic_helper.empty(settings.icon)) {
                var icon_allowed_types = parse_userscript.get_userscript_keyword_config_by_name("icon");

                // icon URL
                var icon_url = type_guess.typeGuess(settings.icon, icon_allowed_types.types);

                // icon nachladen
                running_promises.push(new Promise(function (resolve) {
                    userscript_handle.loadAndAddExternals("icon", icon_url, null, null, resolve, error_function);
                }));
            }

            // Lade externe Skripte nach, falls vorhanden
            if (!basic_helper.empty(settings.require)) {
                var one_require, require_url,
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
            Promise.all(running_promises).then(function (answers) {
                // erst jetzt darf es gespeichert werden
                userscript_handle.save();

                // füge das Skript gleich hinzu, damit es ausgeführt werden kann!
                page_injection_helper.add_userscript_to_page(userscript_handle);

                // Benachrichtige den Benutzer über die Speicherung!
                worker.port.emit("USI-BACKEND:get-alert", lang.userscript_was_saved + " -> ID " + userscript_handle.getId());

                // erneuere die Ausgabe!
                worker.port.emit("USI-BACKEND:list-all-scripts", userscript_storage.getAll());

            });

            return true;
        }
    };

    return private_functions;
}());

if (typeof exports !== "undefined") {
    exports.add_userscript = add_userscript;
}