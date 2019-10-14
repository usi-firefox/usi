import load_resource from "lib/helper/load_resource";
import userscript_storage from "lib/storage/storage";

// stellt Funktionen für die Verarbeitung des Userscripts zur Verfügung
export default function userscript_handle(initial_data: usi.Storage.Userscript) {
    if (typeof initial_data === "object") {
        // speichert die Daten des Userscripts
        const userscript_data = initial_data;

        // wichtig für Chaining
        const self = {
            getId() {
                return userscript_data.id;
            }
            , getUserscriptContent() {
                return userscript_data.userscript;
            }
            , setUserscriptContent(userscript: string) {
                userscript_data.userscript = userscript;
                return self;
            }
            , getSettings() {
                return userscript_data.settings;
            }
            , getAllRequireScripts() {
                return userscript_data.require_scripts;
            }
            , setSettings(values: object) {
                userscript_data.settings = values;
                return self;
            }
            , setMoreinformations(values: usi.Userscript.AddionalData.Moreinformations) {
                userscript_data.moreinformations = values;
                return self;
            }
            , getMoreinformations(values: usi.Userscript.AddionalData.Moreinformations) {
                return userscript_data.moreinformations;
            }
            , async deleteUserscript() {
                // entfernt das Userscript!
                const storage = await userscript_storage();

                return storage.deleteUserscript(userscript_data.id);
            }
            , isDeactivated() {
                // liefert true, wenn es deaktiviert ist
                return userscript_data.deactivated;
            }
            , switchActiveState() {
                userscript_data.deactivated = !userscript_data.deactivated;

                return self.save();
            }
            , getValStore(key?: string) {
                if (typeof key === "undefined" || (typeof key === "string" && key.length === 0)) {
                    return userscript_data.val_store;
                } else {
                    // simple wrap
                    return userscript_data.val_store[key];
                }
            }
            , setValStore(key: string, value: any) {
                if (typeof userscript_data.val_store === "undefined" || userscript_data.val_store === null) {
                    userscript_data.val_store = {};
                }

                // simple wrap
                userscript_data.val_store[key] = value;

                return self.save();
            }
            , resetValStore() {
                userscript_data.val_store = {};

                return self;
            }
            , deleteInValStore(key: string) {
                delete userscript_data.val_store[key];

                return self.save();
            }
            , async save() {
                // speichert das Userscript
                const storage = await userscript_storage();
                storage.save(userscript_data.id, userscript_data);

                return self;
            }
            // fügt eine Resource hinzu --- @resource resourceName http://www.example.com/example.png
            , addResource(url: string, content: string, name: string) {
                if (typeof userscript_data.settings.resources_data === "undefined") {
                    // init
                    self.resetAllResources();
                }
                // füge die Resource hinzu
                userscript_data.settings.resources_data.push({ name, data: content, origUrl: url });

                // danach speichern
                return self;
            }
            , resetAllResources() {
                userscript_data.settings.resources_data = [];
                return self;
            }
            // setzt das Icon vom Userscript --- @icon http://www.example.org/icon.png
            , addIcon(url: string, content: string) {

                userscript_data.settings.icon_url = url;
                userscript_data.settings.icon_data = content;

                // danach speichern
                return self;
            }
            , resetIcon() {
                userscript_data.settings.icon_url = null;
                userscript_data.settings.icon_data = null;
                return self;
            }
            // fügt ein Skript hinzu welches für die Ausführung benötigt wird --- @require http://www.example.com/example.js
            , addRequireScript(url: string, content: string) {
                if (typeof userscript_data.require_scripts === "undefined") {
                    // init
                    self.resetAllRequiredScripts();
                }
                // fügt das benötigte Skript hinzu
                userscript_data.require_scripts.push({ url, text: content });

                // danach speichern
                return self;
            }
            , resetAllRequiredScripts() {
                userscript_data.require_scripts = [];
                return self;
            }
            , resetAllExternals() {
                // alle Extern geladenen Daten zurücksetzen
                return self.resetIcon().
                    resetAllResources().
                    resetAllRequiredScripts();
            }
            , async loadAndAddExternals(type: string, url: any, name: string | undefined): Promise<boolean> {
                try {
                    // Lade die Resource
                    const load_resource_instance = new load_resource();
                    switch (type) {
                        case "icon":
                        case "resource":
                            const response_data = await load_resource_instance.loadImage(url);

                            if (type === "icon") {
                                // Icon hinzufügen
                                self.addIcon(url, response_data);
                            } else {
                                if (!name) {
                                    throw new Error("Kein Name vergeben!");
                                }
                                // für zusätzliche Resource Dateien (Bilder oder Texte, oder oder oder ...)
                                self.addResource(url, response_data, name);
                            }
                            return true;

                        case "require":
                            // TEXT
                            const response_text = await load_resource_instance.loadText(url);
                            // gilt für JS Dateien die benötigt und vor dem Userscript geladen werden müssen
                            self.addRequireScript(url, response_text);
                            return true;

                        default:
                            throw new Error("Not supported 'type' in userscript_handle.loadAndAddExternals()")
                    }

                } catch (exception) {
                    const message = `couldn't load from url: '${url}'`;

                    // Bekannte Exception - Daten konnten nicht geladen werden
                    if (exception.message === "NetworkError when attempting to fetch resource.") {
                        throw new Error(message);
                    }

                    console.error("unknown exception in userscript_handle.loadAndAddExternals()");
                    console.error(exception);

                    throw new Error(message);
                }
            },
        };

        return self;
    } else {
        // im Fehlerfall
        return false;
    }
}
