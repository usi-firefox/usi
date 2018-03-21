// Strict Mode aktivieren!

import basic_helper from "lib/helper/basic_helper";
import parse_userscript from "lib/parse/parse_userscript";
import userscript_handle from "lib/storage/userscript";
import userscript_storage from "lib/storage/storage";
import config_storage from "lib/storage/config";
import load_resource from "lib/load/load_resource";

export default class page_injection_helper {

    // Sammel Objekt
    private static all_page_injections: Array<any> = [];

    /**
     * Listener Funktion
     * @param {object} details
     * @returns {Boolean}
     */
    userscriptInjection_onUpdate(details: any): boolean {
        if (parseInt(details.tabId) < 0) {
            return false;
        }

        if (details.url) {
            let what = new page_injection_helper;

            // falls der Status = loading ist, und eine URL verfügbar ist kann checkUserscriptInjection() aufgerufen werden
            return what.checkUserscriptInjection(details.tabId, details.url, details.transitionType);
        } else {
            // nichts zu tun
            return false;
        }
    }
    /**
     * Prüft ob es passende Include Regeln innerhalb eines Page Injection Objekts gibt
     * und übergibt führt dieses dann aus
     * 
     * @param {integer} tabId
     * @param {string} tabUrl
     * @param {string} transitionType
     * @returns {Boolean}
     */
    checkUserscriptInjection(tabId: number, tabUrl: string, transitionType?: string): boolean {
        if (page_injection_helper.all_page_injections.length > 0) {
            page_injection_helper.all_page_injections.forEach((ele) => {
                if (!ele || ele.spa || !ele.filter_urls) {
                    return false;
                }

                /**
                 * Exclude Regeln prüfen
                 */
                const excludes = ele.filter_urls.exclude;
                for (let i in excludes) {
                    if (typeof excludes[i].test === "function" && excludes[i].test(tabUrl)) {
                        // Script NICHT ausführen
                        return false;
                    }
                }

                /**
                 * Prüfung des transitionType auf Frames
                 */
                // Falls allFrames nicht gesetzt wurd, wird nun abgebrochen
                if (transitionType === "auto_subframe" && ele.exec_details.allFrames !== true) {
                    return false;
                }

                const includes = ele.filter_urls.include;

                // falls ein * gesetzt ist, brauchen wir nicht alle "includes" prüfen
                if (includes.indexOf("*") > -1) {
                    // Script ausführen
                    this._startTabExecution(tabId, ele);
                    return true;
                }

                // restlichen Include Regeln prüfen
                for (let i in includes) {
                    if (typeof includes[i].test === "function" && includes[i].test(tabUrl)) {
                        // Script ausführen
                        this._startTabExecution(tabId, ele);
                        return true;
                    }
                }
            });

            return true;
        } else {
            return false;
        }
    }

    /**
     * Führt das Userscript im Tab aus
     * 
     * @param {integer} tabId
     * @param {object} page_injection
     * @returns {boolean}
     */
    async _startTabExecution(tabId: number, page_injection: any): Promise<boolean> {
        if (typeof page_injection.gm.preparedScript === "string") {
            // GM Funktionen hinzufügen
            try {
                await browser.tabs.executeScript(tabId, { code: page_injection.gm.preparedScript });
            } catch (gm_err) {
                console.error("USI:GM Error Message");
                console.error(gm_err);
            }
        }

        // UserScript ausführen
        try {
            await browser.tabs.executeScript(tabId, page_injection.exec_details);
        } catch (u_err) {
            console.error("USI:Userscript(ID: " + page_injection.userscript_id + " ) Error Message");
            console.error(u_err);
        }

        return true;
    }

    /**
     * 
     * @param {type} userscript_handle
     * @returns {undefined}
     */
    async add_userscript(userscript_id: number) : Promise<void>{
        // @todo
        this.re_init_page_injection();
    }
    /**
     * 
     * @param {type} userscript_handle
     * @returns {undefined}
     */
    async remove_userscript(userscript_id: number): Promise<void> {
        // @todo
        this.re_init_page_injection();
    }

    /**
     * Öffnet einen Port, damit Skripte zur Laufzeit (de-)aktiviert werden können
     * @returns {undefined}
     */
    register_re_init_page_injection_event() : void {

        browser.runtime.onConnect.addListener((port) => {
            if (port.name !== "page-injection-helper") {
                return false;
            }
            port.onMessage.addListener(async (response: any) => {

                if (!response.data || !response.data.userscript_id) {
                    return false;
                }

                switch (response.name) {

                    case "add_userscript":
                        this.add_userscript(response.data.userscript_id);
                        break;

                    case "remove_userscript":
                        this.remove_userscript(response.data.userscript_id);
                        break;
                }
            });
        });
    }

    /**
     * Führe diese Funktion aus damit der Injection Bereich neu geladen werden kann
     * @param {boolean} first_run
     * @returns {undefined}
     */
    re_init_page_injection() {

        // zurücksetzen vom Sammler Objekt!
        page_injection_helper.all_page_injections = [];

        if (!userscript_storage || !userscript_handle) {
            return false;
        }

        // hole alle Userscripts aus dem Speicher
        userscript_storage().then(async (storage) => {

            storage = await storage.refresh();

            const all_userscripts = <any>storage.getAll();

            // Registriere alle Userscripte!
            //
            // durchlaufe alle Einträge im Storage
            if (all_userscripts.length > 0) {

                for (let userscript of all_userscripts) {
                    // baue aus dem Userscript ein Objekt für tabs.executeScript
                    let userscript_init = userscript_handle().initWithData(userscript);
                    let page_injection = await this.get_rules_and_exec_object(userscript_init);
                    if (page_injection) {
                        page_injection_helper.all_page_injections.push(page_injection);
                    }
                }

                /**
                 * Standard: USI fügt die Userscripte nur bei einer Veränderung an einem Tab durch
                 */
                if (!browser.webNavigation.onCommitted.hasListener(this.userscriptInjection_onUpdate)) {
                    browser.webNavigation.onCommitted.addListener(this.userscriptInjection_onUpdate);
                }

            }

        });

    }

    /**
     * liefert die Userscript Include und Exclude Regeln und das fertige Exec Object für browser.tabs.executeScript
     * 
     * @param {object} userscript_handle
     * @returns {object} page_injection 
     */
    async get_rules_and_exec_object(userscript_handle: any) {

        if (typeof userscript_handle === "undefined" || typeof userscript_handle.getSettings !== "function" || userscript_handle.getSettings() === null) {
            return false;
        }

        if (userscript_handle.getSettings().spa === true) {
            // SPA Userscripte
            return await this.create_spa_userscript_exec_object(userscript_handle);
        } else {
            // Normale Userscripte
            return await this.create_normal_userscript_exec_object(userscript_handle);
        }

    }

    /**
     * Erzeugt ein Exec Objekt für SPA Skripte
     */
    async create_spa_userscript_exec_object(userscript_handle: any) {

        const script_settings = userscript_handle.getSettings(),
            userscript_id = userscript_handle.getId(),
            original_userscript = this.add_require_scripts(userscript_handle);

        if (!script_settings.spa) {
            // check
            return false;
        }

        // Enthält die nötigen Funktionen für den GM Bereich
        const gm = await this.add_GM_Functions(userscript_handle);

        let contentScript = "";
        // Wenn jQuery gefordert ist 
        if (typeof script_settings["include-jquery"] !== "undefined") {
            contentScript += await this.add_jQuery_Functions(script_settings["include-jquery"]);
        }

        // letztendlich die Require Skripte und das Userscript anhängen
        contentScript += this.add_require_scripts(userscript_handle);

        // exec_details werden direkt an tabs.executeScript übergeben
        let exec_details: browser.extensionTypes.InjectDetails = {
            code: contentScript
        };

        return {
            gm
            , exec_details
            , userscript_id
        };

    }

    async create_normal_userscript_exec_object(userscript_handle: any) {
        let script_settings = userscript_handle.getSettings();
        let exec_details: any = {};
        const userscript_id = userscript_handle.getId();

        // URL/Includes darf natürlich nicht leer sein
        if ((typeof script_settings["include"] === "undefined")
            || (script_settings["include"].length < 1)
            || (userscript_handle.isDeactivated() === true)) {
            // Keine weitere Prüfung nötig
            return false;
        }

        // die Includes könnten auch nur aus einem Aufruf bestehen
        if (typeof script_settings["include"] === "string") {
            //Wandle den String in ein einfaches Array um....
            script_settings["include"] = [script_settings["include"]];
        }

        let result_includes = [];
        // Prüfung ob es ein Array ist
        if (script_settings["include"].length > 0) {
            // ausgelagert, für Wiederverwendung
            result_includes = parse_userscript().prepare_includes_and_excludes(script_settings["include"]);
        }

        // Die include dürfen nicht leer sein
        if (result_includes.length === 0) {
            return false;
        }

        // die Excludes könnten auch nur aus einem Aufruf bestehen
        if (typeof script_settings["exclude"] === "string") {
            //Wandle den String in ein einfaches Array um....
            script_settings["exclude"] = [script_settings["exclude"]];
        }

        // Wichtig damit die Konfigurations Oberfläche von USI nicht unbrauchbar gemacht werden kann
        let result_excludes = [/resource:\/\/firefox-addon-usi-at-jetpack\/.*/, new RegExp("moz-extension://.*")];

        /**
         *  Zusätzliche Exclude Regeln
         */
        if (typeof script_settings["exclude"] !== "undefined" && script_settings["exclude"].length > 0) {
            // Exclude Regeln hinzufügen
            let prepared_result_excludes = parse_userscript().prepare_includes_and_excludes(script_settings["exclude"]);

            // Sicherheitscheck
            if (typeof prepared_result_excludes !== "undefined" && prepared_result_excludes.length > 0) {
                for (let i in prepared_result_excludes) {
                    result_excludes.push(prepared_result_excludes[i]);
                }
            }
        }

        // Default ist nun "document_idle", da es zu oft zu Problemen kam, dass das "document" nicht verfügbar war
        let runAt = "document_idle";

        if (typeof script_settings["run-at"] === "string") {

            // Entscheide wann das Userscript geladen werden soll, anhand von @run-at
            switch (script_settings["run-at"]) {
                /**
                 * "document_start": corresponds to loading. The DOM is still loading.
                 * "document_end": corresponds to 'interactive'. The DOM has finished loading, but resources such as scripts and images may still be loading.
                 * "document_idle": corresponds to complete. The document and all its resources have finished loading.
                */
                case "document-start":
                case "start":
                    runAt = "document_start";
                    break;
                case "document-ready":
                case "ready":
                    runAt = "document_end";
                    break;

                case "document-end":
                case "document-idle":
                case "end":
                default:
                    runAt = "document_idle";
                    break;

            }

        }
        // runAt setzen
        exec_details.runAt = runAt;


        // https://bitbucket.org/usi-dev/usi/issues/2/add-support-for-userscripts-in-iframes

        if (typeof script_settings["attach-to"] === "object") {
            if (script_settings["attach-to"].indexOf("frame") > -1) {
                // Userscript in Frames ausführen
                exec_details.allFrames = true;
            }
        }

        // sammelt alle Skripte die auf der Seite eingebunden werden sollen
        let contentScript = "";

        // füge bei Bedarf jQuery hinzu
        if (typeof script_settings["include-jquery"] !== "undefined") {
            contentScript += await this.add_jQuery_Functions(script_settings["include-jquery"]);
        }

        // Globale Konfiguration auslesen
        let config_data = await config_storage().get();

        // Enthält die nötigen Funktionen für den GM Bereich
        let gm = {};

        // Wenn Greasemonkey Funktionen benötigt werden, muss das page_injection_object angepasst werden
        if (config_data.greasemonkey.global_active === true ||
            script_settings["use-greasemonkey"] === "true" ||
            typeof script_settings["grant"] === "object" ||
            script_settings["use-greasemonkey"] === true) {

            // füge die nötigen Einstellung für die Nutzung von GM hinzu
            gm = await this.add_GM_Functions(userscript_handle);

        }

        // letztendlich die Require Skripte und das Userscript anhängen
        contentScript += this.add_require_scripts(userscript_handle);

        // fertig zusammengestelltes JS in das Objekt für browser.tabs.executeScript() eintragen
        exec_details.code = contentScript;

        /**
         * exec_details: wird direkt von browser.tabs.executeScript verwendet
         */
        return {
            filter_urls: {
                include: result_includes,
                exclude: result_excludes
            }
            , gm
            , exec_details
            , userscript_id
        };
    }

    /**
     * Erzeugt den Userscript Inhalt, inklusive der require Skripte
     * @param {object} userscript_handle
     * @returns {string}
     */
    add_require_scripts(userscript_handle: any) {
        // sammelt alle Skripte die auf der Seite eingebunden werden sollen
        let contentScript = [];

        // Füge @require Skripte hinzu
        if (!basic_helper().empty(userscript_handle.getAllRequireScripts())) {
            let req_scripts = userscript_handle.getAllRequireScripts();
            for (let i in req_scripts) {
                contentScript.push(req_scripts[i].text);
            }
        }

        // Das Userscript erst nach den @require Skripten einbinden!
        contentScript.push(userscript_handle.getUserscriptContent());

        // aus den einzelnen Skripten nur einen String bauen, damit Referenzierungen möglich bleiben
        const contentScript_str = contentScript.join("\n\n\n");

        // alle ungültigen Zeichen entfernen!
        return contentScript_str.replace(/\uFFFD/g, '');
    }

    /**
     * Liefert jQuery als String zurück
     * @param {bool|string} include_jQuery
     * @returns {String}
     */
    async add_jQuery_Functions(include_jQuery: boolean | string): Promise<string> {
        // Wenn jQuery gefordert ist muss das page_injection_object angepasst werden
        if (include_jQuery === "true" || include_jQuery === true) {
            return await load_resource().load_internal_file("/gui/libs/jquery/jquery-3.3.1.min.js");
        }

        return "";
    }

    /**
     * Erstellt das GM Objekt für das Page Injection Objekt
     * @param {object} userscript_handle
     * @returns {object}
     */
    async add_GM_Functions(userscript_handle: any): Promise<usi.tabExecData> {

        // init JSON
        let gm: any = {};
        gm.prefilled_data = {};

        // übergibt den val_store in die Storage Variable
        gm.prefilled_data.storage = userscript_handle.getValStore();
        gm.prefilled_data.id = userscript_handle.getId();

        // Werte für die Variable GM_info
        gm.prefilled_data.scriptSettings = userscript_handle.getSettings(); // enthält die Settings

        const getUserscriptContent = <any>parse_userscript().find_lines_with_settings(userscript_handle.getUserscriptContent());
        gm.prefilled_data.scriptMetaStr = getUserscriptContent.join("\n");

        const browser_runtime = <any>browser.runtime;
        gm.prefilled_data.usiVersion = browser_runtime.getManifest().version; // übergibt die USI Version
        gm.prefilled_data.systemPlatform = browser_runtime.PlatformOs; // BSP: Android

        // scriptSource hinzufügen
        gm.prefilled_data.scriptSource = userscript_handle.getUserscriptContent();

        // @todo Übler Workaround, da keine Dateien direkt gelesen werden können ...
        let script_extra_data = "var prefilled_data = " + JSON.stringify(gm.prefilled_data) + "; \n\n";
        let gm_content_script = await load_resource().load_internal_file("/gui/helper/GM_Frontend.js");

        /*
         *  dieses muss per browser.tabs.executeScript ausgeführt werden
         *  bevor das eigentliche Userscript geladen wird
         */
        gm.preparedScript = script_extra_data + gm_content_script;

        // Stellt sicher, dass der Inhalt vom Typ 'tabExecData' ist
        const gm_result: usi.tabExecData = gm;
        return gm_result;

    }

}