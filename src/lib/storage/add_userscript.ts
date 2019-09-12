import { empty, getFilenameFromURL, getTranslation, is_datauri, notify, valid_url } from "lib/helper/basic_helper";
import parse_userscript from "lib/parse/parse_userscript";
import userscript_storage from "lib/storage/storage";

const parse_userscript_instance = new parse_userscript();

function type_guess(val: string, allowed_types: string[]): string | null {
    const known_types_priotity = ["datauri", "url"];

    // Leerzeichen entfernen
    val = val.trim();

    if (val.length === 0) {
        return null;
    }

    // Prüfe die nutzbaren Datentypen
    for (const actual_type of known_types_priotity) {

        /**
         *  wenn der Aktuelle Wert von "known_types_priotity" in "allowed_types"
         *  zu finden ist, versuche damit ALS ERSTES den Datentyp zu testen
         */
        if (allowed_types.indexOf(actual_type) !== -1) {
            // Prüfe nun die Variable ob der Datentyp übereinstimmt
            switch (actual_type) {
                case "datauri":
                    // wenn zu beginn, data: steht -> dann sollte es sich auch um eine DataURI handeln?!
                    if (is_datauri(val)) {
                        return val;
                    }
                case "url":
                    // Sollte es eine gültige URL sein, gib sie direkt zurück
                    // Falls es nur ein * ist -> gib auch dies zurück
                    if (val === "*" || valid_url(val) === true) {
                        return val;
                    }
            }

        }

    }

    return null;

}

export default class add_userscript {

    /**
     * Prüft ob es für das Userscript Konfiguration korrekt ist
     * @param {string} userscript
     * @param {object} moreinformations
     * @returns {object}
     */
    public check_for_valid_userscript_settings(userscript: string, moreinformations?: usi.Userscript.AddionalData.Moreinformations) {
        let alternative_name,
            // Konfig suchen und danach die Optionen Parsen...
            userscript_settings = parse_userscript_instance.find_settings(userscript) as any;

        // Falls im Userscript kein Name vorhanden ist, setze den Dateinamen als @name
        if (moreinformations && !empty(moreinformations.url)) {
            alternative_name = getFilenameFromURL(moreinformations.url);
        }

        // Rückgabe eines Promise Objects
        if (typeof userscript_settings.error_code === "number" && userscript_settings.error_code === 101 && !empty(alternative_name)) {
            // setze den @name in den Metablock des Userscripts ein
            const modified_userscript = parse_userscript_instance.add_option_to_userscript_metablock(userscript, ["// @name     " + alternative_name]);
            // Benachrichtige den Nutzer, dass das Userscript verändert wurde
            return { valid: false, reason: "userscript_configuration_error___no_name", possible_solution: alternative_name };

        } else if (typeof userscript_settings.error_message !== "undefined") {
            // es wurde ein Fehler in der Konfiguration gefunden, melde es nun dem Benutzer!
            return { valid: false, reason: "userscript_configuration_error", message: getTranslation("error_userscript_settings") + userscript_settings.error_message };
        } else {
            // Userscript kann gespeichert werden
            return { valid: true };
        }
    }
    /**
     *
     * @param {string} userscript
     * @param {object} moreinformations
     * @returns {userscript_handle}
     */
    public async save_new_userscript(userscript: string, moreinformations?: usi.Userscript.AddionalData.Moreinformations) {
        // Erzeuge ein neues Userscript
        const userscript_settings = parse_userscript_instance.find_settings(userscript),
            userscripts = await userscript_storage();

        const userscript_handle = userscripts.createNew();

        // Userscript verarbeiten und speichern
        await this._save_userscript(userscript_handle, userscript, userscript_settings, moreinformations);

        return userscript_handle;
    }

    public async update_userscript(userscript_id: number, userscript: string, moreinformations?: usi.Userscript.AddionalData.Moreinformations) {
        // aktualisiert ein vorhandenes Userscript
        const userscript_settings = parse_userscript_instance.find_settings(userscript),
            userscripts = await userscript_storage();

        const userscript_handle = userscripts.getById(userscript_id);

        // Userscript verarbeiten und speichern
        await this._save_userscript(userscript_handle, userscript, userscript_settings, moreinformations);

        return userscript_handle;
    }

    /*
     *
     * @param {string} userscript
     * @returns {integer|Boolean}
     */
    public async exist_userscript_already(userscript: any): Promise<number> {
        // Konfig suchen und danach die Optionen Parsen...
        const userscript_settings = parse_userscript_instance.find_settings(userscript);

        // as => alle userscripte
        const storage = await userscript_storage();
        const as = storage.getAll();

        // Prüfe ob das Skript bereits existiert, und wenn ja frage ob es aktualisiert werden soll!
        for (const userscript_1 of as) {
            const possible_id = this.compare2Userscripts(userscript_1.settings, userscript_settings, userscript_1.id) as number;

            if (possible_id) {
                // liefere gefundene ID
                return possible_id;
            }
        }

        // Falls keins gefunden wurde
        return 0;
    }

    public compare2Userscripts(u_1: any, u_2: any, id: any) {
        const test_userscript_settings = ["name", "namespace", "author", "updateURL", "downloadURL"];

        for (const set of test_userscript_settings) {
            if (typeof u_1[set] === "undefined" && typeof u_2[set] === "undefined") {
                continue;
            }

            if (typeof u_1[set] !== "string" || typeof u_2[set] !== "string" || u_1[set] !== u_2[set]) {
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
    public async _save_userscript(userscript_handle: any, userscript: any, settings: any, moreinformations?: usi.Userscript.AddionalData.Moreinformations) {

        // setze und speichere die gefundenen Einstellungen
        userscript_handle.
            setSettings(settings).
            setUserscriptContent(userscript).
            setMoreinformations(moreinformations).
            // alle Extern geladenen Daten zurücksetzen
            resetAllExternals();

        // lade die @resource angaben
        if (typeof settings.resource !== "undefined") {
            let one_resource, resource_name: any, resource_url: any, resource_charset: any,
                resource_allowed_types = parse_userscript_instance.get_userscript_keyword_config_by_name("resource");

            for (const j in settings.resource) {
                // in [0] => name , [1] => url
                one_resource = settings.resource[j].split(/\s+/);
                resource_name = one_resource[0].trim();
                resource_url = one_resource[1].trim();
                // ermöglicht es ein eigenes Charset zu definieren, falls es Probleme gibt
                if (typeof one_resource[2] !== "undefined") {
                    resource_charset = one_resource[2].trim();
                }

                // resource überschreiben! und setzt es auf Null falls nicht genutzt werden kann
                if (resource_allowed_types) {

                    resource_url = type_guess(resource_url, resource_allowed_types.types);

                    if (resource_url) {
                        // Resource nachladen!
                        await userscript_handle.loadAndAddExternals("resource", resource_url, resource_name);
                    }
                }
            }
        }

        // Verarbeite das @icon
        if (typeof settings.icon !== "undefined") {
            const icon_allowed_types = parse_userscript_instance.get_userscript_keyword_config_by_name("icon");

            // icon URL
            if (icon_allowed_types) {
                const icon_url = type_guess(settings.icon, icon_allowed_types.types);

                if (icon_url) {
                    // icon nachladen
                    await userscript_handle.loadAndAddExternals("icon", icon_url);
                }
            }
        }

        // Lade externe Skripte nach, falls vorhanden
        if (typeof settings.require !== "undefined") {
            let one_require, require_url: any,
                require_allowed_types = parse_userscript_instance.get_userscript_keyword_config_by_name("require");

            // da mehrere require Anweisungen erhalten sein können
            for (const require_index in settings.require) {
                one_require = settings.require[require_index];

                if (require_allowed_types) {
                    // Überprüfe die URL
                    require_url = type_guess(one_require, require_allowed_types.types);

                    // Nachladen des benötigten Skripts
                    if (require_url) {
                        await userscript_handle.loadAndAddExternals("require", require_url);
                    }
                }
            }
        }

        return userscript_handle.save();
    }
}
