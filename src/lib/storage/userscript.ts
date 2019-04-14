import userscript_storage from "lib/storage/storage";
import load_resource from "lib/helper/load_resource";

// stellt Funktionen für die Verarbeitung des Userscripts zur Verfügung
export default function userscript_handle(initial_data: usi.Storage.Userscript) {
    if (typeof initial_data === "object") {
        // speichert die Daten des Userscripts
        let userscript_data = initial_data;

        // wichtig für Chaining
        const self = {
            getId: function () {
                return userscript_data.id;
            }
            , getUserscriptContent: function () {
                return userscript_data.userscript;
            }
            , setUserscriptContent: function (userscript: string) {
                userscript_data.userscript = userscript;
                return self;
            }
            , getSettings: function () {
                return userscript_data.settings;
            }
            , getAllRequireScripts: function () {
                return userscript_data.require_scripts;
            }
            , setSettings: function (values: object) {
                userscript_data.settings = values;
                return self;
            }
            , setMoreinformations: function (values: usi.Userscript.AddionalData.Moreinformations) {
                userscript_data.moreinformations = values;
                return self;
            }
            , getMoreinformations: function (values: usi.Userscript.AddionalData.Moreinformations) {
                return userscript_data.moreinformations;
            }
            , deleteUserscript: async function () {
                // entfernt das Userscript!
                let storage = await userscript_storage();

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
            , getValStore: function (key?: string) {
                if (typeof key === "undefined" || (typeof key === "string" && key.length === 0)) {
                    return userscript_data.val_store;
                } else {
                    // simple wrap
                    return userscript_data.val_store[key];
                }
            }
            , setValStore: function (key: string, value: any) {
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
            , deleteInValStore: function (key: string) {
                delete userscript_data.val_store[key];

                return self.save();
            }
            , save: async function () {
                // speichert das Userscript
                let storage = await userscript_storage();
                storage.save(userscript_data.id, userscript_data);

                return self;
            }
            // fügt eine Resource hinzu --- @resource resourceName http://www.example.com/example.png
            , addResource: function (url: string, content: string, name: string) {
                if (typeof userscript_data.settings.resources_data === "undefined") {
                    // init
                    self.resetAllResources();
                }
                // füge die Resource hinzu
                userscript_data.settings.resources_data.push({ name: name, data: content, origUrl: url });

                // danach speichern
                return self;
            }
            , resetAllResources: function () {
                userscript_data.settings.resources_data = [];
                return self;
            }
            // setzt das Icon vom Userscript --- @icon http://www.example.org/icon.png
            , addIcon: function (url: string, content: string) {

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
            , addRequireScript: function (url: string, content: string) {
                if (typeof userscript_data.require_scripts === "undefined") {
                    // init
                    self.resetAllRequiredScripts();
                }
                // fügt das benötigte Skript hinzu
                userscript_data.require_scripts.push({ url: url, text: content });

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
            , loadAndAddExternals: async function (type: string, url: any, name: string | undefined) {
                // Lade die Resource
                const load_resource_instance = new load_resource();
                try {
                    switch (type) {
                        case "icon":
                        case "resource":
                            const response_data = await load_resource_instance.loadImage(url);

                            if (type === "icon") {
                                // Icon hinzufügen
                                self.addIcon(url, response_data);
                            } else {
                                if(!name){
                                    throw "Kein Name vergeben!";
                                }
                                // für zusätzliche Resource Dateien (Bilder oder Texte, oder oder oder ...)
                                self.addResource(url, response_data, name);
                            }
                            break;
                        case "require":
                            // TEXT
                            const response_text = await load_resource_instance.loadText(url);
                            // gilt für JS Dateien die benötigt und vor dem Userscript geladen werden müssen
                            self.addRequireScript(url, response_text);
                            break
                    }

                } catch (exception) {
                    console.error('exception in loadAndAddExternals()');
                    console.error(`params: type: ${type}, url: ${url}, name: ${name}`);
                    console.error(exception);
                }
                return self;
            }
        };

        return self;
    } else {
        // im Fehlerfall
        return false;
    }
}