"use strict";

/* global browser, load_resource, userscript_handle */

// Holt die Userscripte aus dem Speicher (simple-storage)
var userscript_storage = (async function () {
    var all_userscripts = [], storage, storage_keys;

    let self = {
        // simple
        refresh: async function () {
            // hole alle, bis auf die "settings"
            storage = await browser.storage.local.get(null);

            storage_keys = Object.keys(storage);

            // settings entfernen, da die userscripte flach im browser.storage.local liegen
            delete storage_keys.settings;

            all_userscripts = [];
            
            for (let storage_key of storage_keys) {
                // Beispiel für einen passenden Key userscript_1241841403424
                if (/userscript_(\d+)/.test(storage_key)) {
                    // OK dies ist ein Userscript Eintrag
                    all_userscripts.push(storage[storage_key]);
                }
            }
            
            // eigene Referenz zurückgeben
            return self;
        }
        , getAll: function () {
            return all_userscripts;
        }
        , deleteAll: async function () {
            for (let storage_key of storage_keys) {
                await browser.storage.local.remove(storage_key);
            }
            return true;
        }
        , save: async function (id, userscript_data) {
            let storage_id = "userscript_" + id;

            let entry = {};
            // speichert alle Daten vom Userscript
            entry[storage_id] = userscript_data;

            await browser.storage.local.set(entry);
            return true;
        }
        , deleteUserscript: async function (id) {
            let storage_id = "userscript_" + id;
            // löscht ein Userscript aus dem Storage
            await browser.storage.local.remove(storage_id);
            return true;
        }
        , getById: function (id) {
            // ACHTUNG ID wird als Integer verarbeitet
            id = parseInt(id);

            // holt alle Userscripte, und mittels find() wird jedes Element übergeben, falls die ele.id mit der ID übereinstimmt gib diese zurück
            var found_userscript = self.getAll().find(function (ele) {
                var element_id = parseInt(ele.id);
                if (element_id === id) {
                    return true;
                } else {
                    return false;
                }
            });

            // wenn ein Userscript gefunden wurde, initialisiere es
            if (typeof found_userscript === "object") {
                return userscript_handle.initWithData(found_userscript);
            } else {
                return false;
            }
        }

        , createNew: function () {
            let new_id, userscript_found;
            // probiere es 3 Mal eine neue ID zu erzeugen
            for (let i = 0; i < 3; i++) {
                new_id = new Date().getTime();
                // prüfe ob die ID, nicht doch schon existiert
                userscript_found = self.getById(new_id);
                if (userscript_found === false) {
                    // kein Userscript mit dieser ID gefunden, gibt ein neues Handle zurück
                    return userscript_handle.initWithData(
                        // übergib ein neues Userscript
                        userscript_handle.getSkeleton(new_id)
                        );
                }
            }
            // das sollte eigentlich nicht passieren!
            return false;
        }
    };

    await self.refresh();

    return self;

}());

// stellt Funktionen für die Verarbeitung des Userscripts zur Verfügung
var userscript_handle = (function () {

    return {
        getSkeleton: function (id) {
            // für ein neu angelegtes Userscript
            return {
                id: id,
                userscript: null,
                settings: {},
                deactivated: false,
//				moreinformations: null,
                val_store: {}
            };
        }
        // initialisiert ein neues Objekt vom Typ userscript_handle
        , initWithData: function (userscript_initial_data) {
            if (typeof userscript_initial_data === "object") {
                // speichert die Daten des Userscripts
                var userscript_data = userscript_initial_data;

                // wichtig für Chaining
                var self = {
                    getData: function () {
                        return userscript_data;
                    }
                    , getId: function () {
                        return userscript_data.id;
                    }
                    , getUserscriptContent: function () {
                        return userscript_data.userscript;
                    }
                    , setUserscriptContent: function (userscript) {
                        userscript_data.userscript = userscript;
                        return self;
                    }
                    , getSettings: function () {
                        return userscript_data.settings;
                    }
                    , getAllRequireScripts: function () {
                        return userscript_data.require_scripts;
                    }
                    , setSettings: function (values) {
                        userscript_data.settings = values;
                        return self;
                    }
                    , setMoreinformations: function (values) {
                        userscript_data.moreinformations = values;
                        return self;
                    }
                    , getMoreinformations: function (values) {
                        return userscript_data.moreinformations;
                    }
                    , deleteUserscript: async function () {
                        // entfernt das Userscript!
                        let storage = await userscript_storage;

                        return storage.deleteUserscript(userscript_data.id);
                    }
                    , isDeactivated: function () {
                        // liefert true, wenn es deaktiviert ist
                        return userscript_data.deactivated;
                    }
                    , switchActiveState: function () {
                        userscript_data.deactivated = !userscript_data.deactivated;

                        return self.save();
                    }
                    , getValStore: function (key) {
                        if (typeof key === "undefined" || (typeof key === "string" && key.length === 0)) {
                            return userscript_data.val_store;
                        } else {
                            // simple wrap
                            return userscript_data.val_store[key];
                        }
                    }
                    , setValStore: function (key, value) {
                        if (typeof userscript_data.val_store === "undefined" || userscript_data.val_store === null) {
                            userscript_data.val_store = {};
                        }

                        // simple wrap
                        userscript_data.val_store[key] = value;

                        return self.save();
                    }
                    , resetValStore: function () {
                        userscript_data.val_store = {};

                        return self;
                    }
                    , deleteInValStore: function (key) {
                        delete userscript_data.val_store[key];

                        return self.save();
                    }
                    , save: async function () {
                        // speichert das Userscript
                        let storage = await userscript_storage;
                        storage.save(userscript_data.id, userscript_data);

                        return self;
                    }
                    // fügt eine Resource hinzu --- @resource resourceName http://www.example.com/example.png
                    , addResource: function (url, content, name, mime_type) {
                        if (typeof userscript_data.settings.resources_data === "undefined") {
                            // init
                            self.resetAllResources();
                        }
                        // füge die Resource hinzu
                        userscript_data.settings.resources_data.push({name: name, data: content, mime_type: mime_type, origUrl: url});

                        // danach speichern
                        return self;
                    }
                    , resetAllResources: function () {
                        userscript_data.settings.resources_data = [];
                        return self;
                    }
                    // setzt das Icon vom Userscript --- @icon http://www.example.org/icon.png
                    , addIcon: function (url, content) {

                        userscript_data.settings.icon_url = url;
                        userscript_data.settings.icon_data = content;

                        // danach speichern
                        return self;
                    }
                    , resetIcon: function () {
                        userscript_data.settings.icon_url = null;
                        userscript_data.settings.icon_data = null;
                        return self;
                    }
                    // fügt ein Skript hinzu welches für die Ausführung benötigt wird --- @require http://www.example.com/example.js
                    , addRequireScript: function (url, content) {
                        if (typeof userscript_data.require_scripts === "undefined") {
                            // init
                            self.resetAllRequiredScripts();
                        }
                        // fügt das benötigte Skript hinzu
                        userscript_data.require_scripts.push({url: url, text: content});

                        // danach speichern
                        return self;
                    }
                    , resetAllRequiredScripts: function () {
                        userscript_data.require_scripts = [];
                        return self;
                    }
                    , resetAllExternals: function () {
                        // alle Extern geladenen Daten zurücksetzen
                        return self.resetIcon().
                            resetAllResources().
                            resetAllRequiredScripts();
                    }
                    , loadAndAddExternals: function (type, url, name, charset, resolve, reject) {
                        // Lade die Resource
                        var loaded_image_or_text = load_resource.load_image_or_text(url, charset);

                        loaded_image_or_text.then(function (response_data, response_contenttype) {

                            if (type === "icon") {
                                // Icon hinzufügen
                                self.addIcon(url, response_data);
                            } else if (type === "resource") {
                                // für zusätzliche Resource Dateien (Bilder oder Texte, oder oder oder ...)
                                self.addResource(url, response_data, name, response_contenttype);
                            } else if (type === "require") {
                                // gilt für JS Dateien die benötigt und vor dem Userscript geladen werden müssen
                                self.addRequireScript(url, response_data);
                            }

                            // Alles gut gegangen resolve ausführen!
                            resolve(type + " - " + url);
                        });

                        return self;
                    }
                };

                return self;
            } else {
                // im Fehlerfall
                return false;
            }
        }
    };

}());

if (typeof exports !== "undefined") {
    exports.userscript_storage = userscript_storage;
}