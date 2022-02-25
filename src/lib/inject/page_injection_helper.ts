import { empty } from "lib/helper/basic_helper";
import load_resource from "lib/helper/load_resource";
import parse_userscript from "lib/parse/parse_userscript";
import config_storage from "lib/storage/config";
import userscript_storage from "lib/storage/storage";
import userscript_handle from "lib/storage/userscript";

const parse_userscript_instance = new parse_userscript();

export default class page_injection_helper {

    // Sammel Objekt
    private static all_page_injections: any[] = [];

    // Konfigurationen
    private static configuration = null as null|usi.Storage.Config;

    /**
     * Listener Funktion
     * @param {object} details
     * @returns {boolean}
     */
    public userscriptInjection_onUpdate(details: any): boolean {
        if (parseInt(details.tabId, 0) < 0) {
            return false;
        }

        if (!details.url) {
            // nichts zu tun
            return false;
        }

        // falls der Status = loading ist, und eine URL verfügbar ist kann checkUserscriptInjection() aufgerufen werden
        return (new page_injection_helper()).checkUserscriptInjection(details.tabId, details.url, details.transitionType);
    }

    /**
     * Prüft ob es passende Include Regeln innerhalb eines Page Injection Objekts gibt
     * und übergibt führt dieses dann aus
     *
     * @param {integer} tabId
     * @param {string} tabUrl
     * @param {string} transitionType
     * @returns {boolean}
     */
    public checkUserscriptInjection(tabId: number, tabUrl: string, transitionType?: string): boolean {
        if (page_injection_helper.all_page_injections.length === 0) {
            return false;
        }

        // Gültige Userscripte heraussuchen
        const valid_userscripts = page_injection_helper.all_page_injections.filter((ele) => {
            // Kein SPA prüfen
            if (!ele || ele.spa || !ele.filter_urls) {
                return false;
            }

            /**
             * @todo
             * Globale Exclude Regeln prüfen
             */
            if (page_injection_helper.configuration !== null) {
                const global_excludes = parse_userscript_instance.prepare_includes_and_excludes(page_injection_helper.configuration.global_excludes);

                for (const exclude of global_excludes) {
                    if (exclude instanceof RegExp && typeof exclude.test === "function" && exclude.test(tabUrl)) {
                        // Script NICHT ausführen
                        return false;
                    }
                }
            }

            /**
             * Exclude Regeln prüfen
             */
            const excludes = ele.filter_urls.exclude;
            for (const i in excludes) {
                if (typeof excludes[i].test === "function" && excludes[i].test(tabUrl)) {
                    // Script NICHT ausführen
                    return false;
                }
            }

            /**
             * Prüfung des transitionType auf Frames
             */
            // Falls allFrames nicht gesetzt wurde, wird nun abgebrochen
            if (transitionType === "auto_subframe" && ele.exec_details.allFrames !== true) {
                return false;
            }

            const includes = ele.filter_urls.include;

            // falls ein * gesetzt ist, brauchen wir nicht alle "includes" prüfen
            if (includes.indexOf("*") > -1) {
                return true;
            }

            // restlichen Include Regeln prüfen
            for (const i in includes) {
                if (typeof includes[i].test === "function" && includes[i].test(tabUrl)) {
                    return true;
                }
            }
        });

        // alle Gültigen Userscripte starten
        valid_userscripts.forEach((userscript: any) => {
            // Script ausführen
            this._startTabExecution(tabId, userscript);
        });

        return true;
    }

    /**
     * Führt das Userscript im Tab aus
     *
     * @param {integer} tabId
     * @param {object} page_injection
     * @returns {Promise<boolean>}
     */
    public async _startTabExecution(tabId: number, page_injection: any): Promise<boolean> {
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

    public async add_userscript(userscript_id: number): Promise<boolean> {
        // @todo
        return await this.re_init_page_injection();
    }
    public async remove_userscript(userscript_id: number): Promise<boolean> {
        // @todo
        return await this.re_init_page_injection();
    }

    /**
     * Öffnet einen Port, damit Skripte zur Laufzeit (de-)aktiviert werden können
     * @returns {undefined}
     */
    public register_re_init_page_injection_event(): void {

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
     * @returns {Promise<boolean>}
     */
    public async re_init_page_injection() : Promise<boolean> {

        // zurücksetzen vom Sammler Objekt!
        page_injection_helper.all_page_injections = [];

        if (!userscript_storage || !userscript_handle) {
            return false;
        }

        // hole alle Userscripts aus dem Speicher
        const storage_t = await userscript_storage();
        const storage = await storage_t.refresh();
        const all_userscripts = storage.getAll() as any;

        // Konfiguration neu setzen
        page_injection_helper.configuration = await new config_storage().get();

        // Registriere alle Userscripte!
        //
        // durchlaufe alle Einträge im Storage
        if (all_userscripts.length === 0) {
            return false;
        }

        for (const userscript of all_userscripts) {
            // baue aus dem Userscript ein Objekt für tabs.executeScript
            const userscript_init = userscript_handle(userscript);
            const page_injection = await this.get_rules_and_exec_object(userscript_init);
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

        return true;
    }

    /**
     * liefert die Userscript Include und Exclude Regeln und das fertige Exec Object für browser.tabs.executeScript
     * @returns {Promise<any>}
     */
    public async get_rules_and_exec_object(userscript_instance: any) : Promise<any> {

        if (typeof userscript_instance === "undefined" || typeof userscript_instance.getSettings !== "function" || userscript_instance.getSettings() === null) {
            return false;
        }

        if (userscript_instance.getSettings().spa === true) {
            // SPA Userscripte
            return await this.create_spa_userscript_exec_object(userscript_instance);
        } else {
            // Normale Userscripte
            return await this.create_normal_userscript_exec_object(userscript_instance);
        }

    }

    /**
     * Erzeugt ein Exec Objekt für SPA Skripte
     * @returns {Promise<any>}
     */
    public async create_spa_userscript_exec_object(userscript_instance: any) : Promise<any> {

        const script_settings = userscript_instance.getSettings();
        const userscript_id = userscript_instance.getId();
        /* const original_userscript = this.add_require_scripts(userscript_instance); */

        if (!script_settings.spa) {
            // check
            return false;
        }

        // Enthält die nötigen Funktionen für den GM Bereich
        const gm = await this.add_GM_Functions(userscript_instance);

        let contentScript = "";
        // Wenn jQuery gefordert ist
        if (typeof script_settings["include-jquery"] !== "undefined") {
            contentScript += await this.add_jQuery_Functions(script_settings["include-jquery"]);
        }

        // letztendlich die Require Skripte und das Userscript anhängen
        contentScript += this.add_require_scripts(userscript_instance);

        // exec_details werden direkt an tabs.executeScript übergeben
        const exec_details: browser.extensionTypes.InjectDetails = {
            code: contentScript,
        };

        return {
            exec_details
            , gm
            , userscript_id,
        };

    }

    /**
     * 
     * @param {any} userscript_instance 
     * @returns {Promise<any>}
     */
    public async create_normal_userscript_exec_object(userscript_instance: any) : Promise<any> {
        const script_settings = userscript_instance.getSettings();
        const exec_details: any = {};
        const userscript_id = userscript_instance.getId();

        // URL/Includes darf natürlich nicht leer sein
        if ((typeof script_settings.include === "undefined")
            || (script_settings.include.length < 1)
            || (userscript_instance.isDeactivated() === true)) {
            // Keine weitere Prüfung nötig
            return false;
        }

        // die Includes könnten auch nur aus einem Aufruf bestehen
        if (typeof script_settings.include === "string") {
            // Wandle den String in ein einfaches Array um....
            script_settings.include = [script_settings.include];
        }

        let result_includes;
        // Prüfung ob es ein Array ist
        if (script_settings.include.length > 0) {
            // ausgelagert, für Wiederverwendung
            result_includes = parse_userscript_instance.prepare_includes_and_excludes(script_settings.include);
        }

        // Die include dürfen nicht leer sein
        if (!result_includes || result_includes.length === 0) {
            return false;
        }

        // die Excludes könnten auch nur aus einem Aufruf bestehen
        if (typeof script_settings.exclude === "string") {
            // Wandle den String in ein einfaches Array um....
            script_settings.exclude = [script_settings.exclude];
        }

        // Wichtig damit die Konfigurations Oberfläche von USI nicht unbrauchbar gemacht werden kann
        const result_excludes = [new RegExp("moz-extension://.*")] as string[] | RegExp[];

        /**
         *  Zusätzliche Exclude Regeln
         */
        if (typeof script_settings.exclude !== "undefined" && script_settings.exclude.length > 0) {
            // Exclude Regeln hinzufügen
            const prepared_result_excludes = parse_userscript_instance.prepare_includes_and_excludes(script_settings.exclude);

            // Sicherheitscheck
            if (prepared_result_excludes && prepared_result_excludes.length > 0) {
                /*  prepared_result_excludes.forEach((rule : RegExp[] | string[]) => {
                     result_excludes.push(rule);
                 }); */
            }
        }

        // Default ist nun "document_idle", da es zu oft zu Problemen kam, dass das "document" nicht verfügbar war
        let runAt = "document_idle";

        if (typeof script_settings["run-at"] === "string") {

            // Entscheide wann das Userscript geladen werden soll, anhand von @run-at
            switch (script_settings["run-at"]) {
                /**
                 * "document_start": corresponds to loading. The DOM is still loading.
                 * "document_end": corresponds to 'interactive'. The DOM has finished loading, but resources such as scripts and images may * still be loading.
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
        const config_data = await new config_storage().get();

        // Enthält die nötigen Funktionen für den GM Bereich
        let gm = {};

        // Wenn Greasemonkey Funktionen benötigt werden, muss das page_injection_object angepasst werden
        if (config_data.greasemonkey && config_data.greasemonkey.global_active === true ||
            script_settings["use-greasemonkey"] === "true" ||
            typeof script_settings.grant === "object" ||
            script_settings["use-greasemonkey"] === true) {

            // füge die nötigen Einstellung für die Nutzung von GM hinzu
            gm = await this.add_GM_Functions(userscript_instance);

        }

        // letztendlich die Require Skripte und das Userscript anhängen
        contentScript += this.add_require_scripts(userscript_instance);

        // fertig zusammengestelltes JS in das Objekt für browser.tabs.executeScript() eintragen
        exec_details.code = contentScript;

        /**
         * exec_details: wird direkt von browser.tabs.executeScript verwendet
         */
        return {
            exec_details
            , filter_urls: {
                exclude: result_excludes,
                include: result_includes,
            }
            , gm
            , userscript_id,
        };
    }

    /**
     * Erzeugt den Userscript Inhalt, inklusive der require Skripte
     * @param {any} userscript_instance 
     * @returns {string}
     */
    public add_require_scripts(userscript_instance: any) : string {
        // sammelt alle Skripte die auf der Seite eingebunden werden sollen
        const contentScript = [];

        // Füge @require Skripte hinzu
        if (!empty(userscript_instance.getAllRequireScripts())) {
            const req_scripts = userscript_instance.getAllRequireScripts();
            for (const i in req_scripts) {
                if (!req_scripts[i]) {
                    continue;
                }
                contentScript.push(req_scripts[i].text);
            }
        }

        // Das Userscript erst nach den @require Skripten einbinden!
        contentScript.push(userscript_instance.getUserscriptContent());

        // aus den einzelnen Skripten nur einen String bauen, damit Referenzierungen möglich bleiben
        const contentScript_str = contentScript.join("\n\n\n");

        // alle ungültigen Zeichen entfernen!
        return contentScript_str.replace(/\uFFFD/g, "");
    }

    /**
     * Liefert jQuery als String zurück
     * @param {bool|string} include_jQuery
     * @returns {Promise<string>}
     */
    public async add_jQuery_Functions(include_jQuery: boolean | string): Promise<string> {
        // Wenn jQuery gefordert ist muss das page_injection_object angepasst werden
        if (include_jQuery === "true" || include_jQuery === true) {
            const load_resource_instance = new load_resource();
            return await load_resource_instance.load_internal_file("/gui/libs/jquery/jQuery-3.6.0.min.js");
        }

        return "";
    }

    /**
     * Erstellt das GM Objekt für das Page Injection Objekt
     */
    public async add_GM_Functions(userscript_instance: any): Promise<usi.Tabs.execData> {

        // init JSON
        const gm: any = {};
        gm.prefilled_data = {};

        // übergibt den val_store in die Storage Variable
        gm.prefilled_data.storage = userscript_instance.getValStore();
        gm.prefilled_data.id = userscript_instance.getId();

        // Werte für die Variable GM_info
        gm.prefilled_data.scriptSettings = userscript_instance.getSettings(); // enthält die Settings

        const getUserscriptContent = parse_userscript_instance.find_lines_with_settings(userscript_instance.getUserscriptContent()) as any;
        gm.prefilled_data.scriptMetaStr = getUserscriptContent.join("\n");

        const browser_runtime = browser.runtime as any;
        gm.prefilled_data.usiVersion = browser_runtime.getManifest().version; // übergibt die USI Version
        gm.prefilled_data.systemPlatform = browser_runtime.PlatformOs; // BSP: Android

        // scriptSource hinzufügen
        gm.prefilled_data.scriptSource = userscript_instance.getUserscriptContent();

        // @todo Übler Workaround, da keine Dateien direkt gelesen werden können ...
        const script_extra_data = "var prefilled_data = " + JSON.stringify(gm.prefilled_data) + "; \n\n";
        // GM_Frontend wird auf die Root Ebene kopiert
        const load_resource_instance = new load_resource();
        const gm_content_script = await load_resource_instance.load_internal_file("/js/GM_Frontend.js");

        /*
         *  dieses muss per browser.tabs.executeScript ausgeführt werden
         *  bevor das eigentliche Userscript geladen wird
         */
        gm.preparedScript = script_extra_data + gm_content_script;

        // Stellt sicher, dass der Inhalt vom Typ 'usi.Tabs.execData' ist
        const gm_result: usi.Tabs.execData = gm;
        return gm_result;

    }

}
