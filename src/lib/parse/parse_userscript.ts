/************************************************************************
 ********* Parse-Userscript-Konfiguration Funktionen ********************
 ************************************************************************/

import { empty, getTranslation, isset, notify } from "lib/helper/basic_helper";
import { GM_convert2RegExp } from "lib/parse/convert2RegExp";

export default class parse_userscript {

    /**
     * Metablock Konfiguration
     */
    private metablock = {
        start: /\/\/\s*==UserScript==\s*$/
        , end: /\/\/\s*==\/UserScript==\s*$/
        , start_s: "// ==UserScript=="
        , end_s: "// ==/UserScript==",
    };

    /**
     * Dem übergebenen Userscript (string) werden weitere Werte in den Metablock geschrieben
     */
    public add_option_to_userscript_metablock(userscript: string, new_entries: any) {

        const userscript_metablock = this.find_lines_with_settings(userscript);
        if (!userscript_metablock) {
            return false;
        }

        const userscript_rest = this.find_lines_with_settings(userscript, true) as any;
        if (!userscript_rest) {
            return false;
        }

        const new_userscript_metablock = this.create_metablock_from_array(userscript_metablock as string[], new_entries);

        return new_userscript_metablock + "\n" + userscript_rest.join("\n");
    }

    /**
     * Fügt den Userscript Metablock (array) wieder zusammen,
     * falls das Array new_entries gefüllt ist, wird dieses an den Anfang geschrieben
     */
    public create_metablock_from_array(userscript_metablock: string[], new_entries?: any) {
        if (isset(new_entries) && !empty(new_entries) && typeof new_entries.concat) {
            // Füge die neuen Einträge an den Anfang
            userscript_metablock = new_entries.concat(userscript_metablock);
        }

        // Zusammenfügen mittels Zeilenumbruch
        return [this.metablock.start_s, userscript_metablock.join("\n"), this.metablock.end_s].join("\n");
    }

    /**
     * Sucht im String nach der Userscript Konfiguration (Metablock)
     * und liefert als Ergebnis ein Zeilen-basiertes Array der Konfiguration zurück
     * ohne das umschließende " ... ==UserScript== ..."
     *
     * @param {string} userscript
     * @param {Boolean} getRestOfUserscript
     */
    public find_lines_with_settings(userscript: string, getRestOfUserscript?: boolean): string[] | null {
        // Teile Anhand von Zeilenumbrüchen ...
        let userscript_lines = userscript.split("\n"),
            // Start und Ende der Userscript Konfiguration
            start_regex = this.metablock.start,
            end_regex = this.metablock.end,
            // Nur zwischen diesen beiden Zeilen darf die Konfiguration zu finden sein!
            start_line: number | boolean = false,
            end_line: number | boolean = false;

        /**
         * Selbstverständlich darf nur eine Konfiguration enthalten sein, und die Erste "gültige" wird verwendet
         */

        // Durchlaufe jede Zeile!
        for (const i in userscript_lines) {

            // Suche den Beginn der Konfiguration
            if ((start_line === false) && (start_regex.test(userscript_lines[i]))) {
                start_line = parseInt(i);
            }

            // Suche das Ende der Konfiguration
            if ((end_line === false) && (end_regex.test(userscript_lines[i]))) {
                end_line = parseInt(i);

                // Ermöglicht es nur den Inhalt des Userscripts zu erhalten ohne den Metablock
                if (getRestOfUserscript === true) {
                    return userscript_lines.slice(end_line + 1);
                }

                // falls die Letzte des Metablock gefunden wurde, brauch nicht weiter gesucht zu werden ...
                break;
            }
        }

        // Es müssen beiden Werte gesetzt sein, und die start_line muss natürlich kleiner sein!
        if ((start_line !== false) && (end_line !== false) && (start_line < end_line)) {

            // Gib ein Array zurück mit den Zeilen der Konfiguration
            // Start_line + 1 => da bei Array.slice ansonsten die Start-Zeile "// ==UserScript==" auch enthalten wäre
            return userscript_lines.slice(start_line + 1, end_line);
        } else {
            // Keine gültige Konfiguration gefunden
            return null;
        }
    }

    /**
     * Meta Block Konfiguration laden
     * Bsp: keyword -> include
     * liefert
     * { m: true, keyword: "include", types: ["url", "regex"] }
     */
    public get_userscript_keyword_config_by_name(keyword: string): usi.Userscript.MetaBlock.Keyword | undefined {
        return this.userscript_keyword_config().find((ele) => {
            return ele.keyword === keyword;
        });
    }

    /**
     * Ausgelagert für mehrfache Verwendung
     * @returns {Array}
     */
    public userscript_keyword_config(): usi.Userscript.MetaBlock.Keyword[] {

        // Konfigurations-Varianten die gefunden werden können
        return [
            // m: steht für Multiple, also mehrfache Werte möglich
            { m: false, keyword: "name", types: ["string"] },
            { m: false, keyword: "namespace", types: ["string"] },
            { m: false, keyword: "author", types: ["string"] },
            { m: false, keyword: "homepageURL", types: ["url"] },
            { m: false, keyword: "date", types: ["string"] },
            { m: false, keyword: "license", types: ["string"] },
            { m: false, keyword: "icon", types: ["url", "datauri"] },
            { m: false, keyword: "description", types: ["string"] },
            { m: true, keyword: "exclude", types: ["url", "regex"] },
            { m: true, keyword: "match", types: ["url", "regex"] }, // Match und Include werden gleich behandelt!
            { m: true, keyword: "include", types: ["url", "regex"] }, // Match und Include werden gleich behandelt!
            { m: false, keyword: "info", types: ["string"] },
            { m: true, keyword: "require", types: ["url"] }, // nachladen externer JS Dateien
            { m: true, keyword: "resource", types: ["url", "datauri"] }, // Damit du andere Dinge zusätzlich herunterladen kannst
            { m: false, keyword: "run-at", types: ["string"] }, // document-end || document-start || document-ready
            { m: true, keyword: "grant", types: ["string"] },
            { m: false, keyword: "include-jquery", types: ["bool"] }, // true || false --- du brauchst zusätzlich jQuery? setze "true" || "false", keine sorge es wird vorher geprüft ob bereits jQuery auf der Seite existiert!
            { m: false, keyword: "updateURL", types: ["url"] }, // Hierüber wird später geprüft ob eine neue Version vom Skript zur Verfügung steht
            { m: false, keyword: "downloadURL", types: ["url"] }, // Hierüber wird später geprüft ob eine neue Version vom Skript zur Verfügung steht
            { m: false, keyword: "version", types: ["string"] },
            { m: false, keyword: "use-greasemonkey", types: ["bool"] }, // true || false
            /* attach-to -> attachTo  https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/page-mod
             Mögliche Werte sind "existing,top,frame", diese müssen Zeilenweise angegben werden

             Beispiel:
             @attach-to existing
             @attach-to top
             @attach-to frame

             "existing": the page-mod will be automatically applied on already opened tabs.
             "top": the page-mod will be applied to top-level tab documents
             "frame": the page-mod will be applied to all iframes inside tab documents*/
            { m: true, keyword: "attach-to", types: ["string"] },
            { m: false, keyword: "spa", types: ["bool"] }, // erzeugt eine leere Seite mit diesem Skript
            { m: true, keyword: "options", types: ["string"] },			// Damit kannst du mehrere Werte bestimmen, die dein UserScript nutzen soll!
        ];

    }

    // Suche nach Einstellungen für das UserScript
    // @todo
    public find_settings(userscript: string): null | Object {
        // setze die Zeilen die die Konfiguration beinhalten!
        const userscript_settings = this.find_lines_with_settings(userscript);

        if (!userscript_settings) {
            return null;
        }

        // Konfigurations-Varianten die gefunden werden können
        const possible_entries = this.userscript_keyword_config();

        // init
        let options = {} as any,
            option_found: RegExpExecArray | null = null;

        // Prüfe für jeden Eintrag, ob du etwas brauchbares im Userscript vorfindest
        for (const i in possible_entries) {
            // lege den aktuellen Key fest
            let key = possible_entries[i].keyword,
                // Wenn dies true ist, dürfen die Keys mehrfach vorkommen, ansonsten wird einfach nur der Erste verwendet!
                m = possible_entries[i].m,
                // der Key muss immer am Anfang zu finden sein, in der Klammer wird der Wert dann gesucht!
                search_for_key = new RegExp("^\\s*\/\/\\s*\\@" + key + "\\s+(.+)");

            /************************************************************************
             *****************************	ACHTUNG *********************************
             ************************************************************************/
            // Da Include und Match, im grunde das gleiche bedeuten, werden wir im weiteren nur Incluce nutzen
            // Trotzdem musste zuvor natürlich der passende Reguläre Ausdruck gesetzt werden
            if (key === "match") {
                key = "include";
            }
            /************************************************************************
             *****************************	ACHTUNG *********************************
             ************************************************************************/

            // Durchlaufe für jeden Key alle userscript_settings
            userscript_settings.forEach((userscript_setting) => {
                // Prüfe ob der Key in der Zeile enthalten ist
                option_found = search_for_key.exec(userscript_setting);

                // Der Key ist enthalten
                if (option_found === null) {
                    return;
                }

                // Wert festlegen
                let value = option_found[1];

                // Überflüssige Leerzeichen entfernen, wenn möglich
                if (typeof value.trim === "function") {
                    value = value.trim();
                }

                // Setze einfach nur den Wert ...
                if (m === false) {
                    options[key] = value;
                } else {

                    // "object" wird auch bei einem Array geliefert, und darauf prüfen wir nur ...
                    if (typeof options[key] !== "object") {
                        // es ist noch kein Array,deswegen erzeugen wir jetzt eins!
                        options[key] = [];
                    }

                    // füge den Wert hinzu
                    options[key].push(value);
                }
            });

        }

        // Prüfe den Inhalt des options Array
        switch (true) {
            case !isset(options.include) && !isset(options.spa):
                // Mindestens ein Include Eintrag muss vorhanden sein!
                notify(getTranslation("required_script_one_include"));
                return null;

            case !isset(options.name):
                // Du solltest schon einen Namen vergeben
                notify(getTranslation("required_script_name"));
                return null;

            default:
                // Konfiguration schein in Ordnung zu sein, gib sie zurück!
                return options;
        }

    }

    public prepare_includes_and_excludes(rules?: string[]): RegExp[] | string[] {

        if (!rules) {
            return [] as string[];
        }

        const result: any = [];

        // Durchlaufe alle Einträge
        rules.forEach(function(rule: string) {
            if (typeof rule !== "string") {
                return;
            }

            rule = rule.trim();
            if (rule === "*") {
                result.push("*");
                return;
            }

            // es gibt anscheinend einen Bug in Android, daher werden die Regeln für Android direkt an die GM_convert2RegExp() übergeben
            const reg = GM_convert2RegExp(rule);
            if (reg instanceof RegExp) {
                result.push(reg);
                return;
            }
        });

        return result;
    }

}
