"use strict"; // Strict Mode aktivieren!

/* global exports,require, browser, userscript_storage, parse_userscript, basic_helper, lang, userscript_handle, config_storage, GM_xhrHandler, grease_handler, usi_main, load_resource */

var page_injection_helper = (function () {

    var self = {
        // Sammel Objekt
        all_page_injections: []

            /**
             * 
             * @param {integer} tabId
             * @param {object} changeInfo
             * @param {object} tabInfo
             * @returns {Boolean}
             */
        , userscriptInjection_onUpdate: function (tabId, changeInfo, tabInfo) {
            if (parseInt(tabId) < 1 || typeof changeInfo !== "object") {
                return false;
            }

            if (changeInfo.status && changeInfo.status === "loading" && changeInfo.url) {
                // falls der Status = loading ist, und eine URL verfügbar ist kann checkUserscriptInjection() aufgerufen werden
                return self.checkUserscriptInjection(tabId, changeInfo.url);
            } else {
                // nichts zu tun
                return false;
            }
        }
        /**
         * 
         * @param {integer} tabId
         * @param {string} tabUrl
         * @returns {Boolean}
         */
        , checkUserscriptInjection: function (tabId, tabUrl) {
            if (self.all_page_injections.length > 0) {
                self.all_page_injections.forEach((ele) => {
                    if (!ele || !ele.filter_urls) {
                        return false;
                    }

                    let includes = ele.filter_urls.include;
                    let excludes = ele.filter_urls.exclude;

                    for (var i in excludes) {
                        if (excludes[i].test(tabUrl)) {
                            // treffer, Script nicht ausführen
                            return false;
                        }
                    }

                    // falls ein * gesetzt ist, brauchen wir nicht alle "includes" prüfen
                    if (includes.indexOf("*") > -1) {
                        // treffer, Script ausführen
                        self._startTabExecution(tabId, ele);
                        return true;
                    }

                    // restlichen Include Regeln prüfen
                    for (var j in includes) {
                        if (includes[j].test(tabUrl)) {
                            // treffer, Script ausführen
                            self._startTabExecution(tabId, ele);
                            return true;
                        }
                    }

                });
            } else {
                return false;
            }
        }
        /**
         * 
         * @param {integer} tabId
         * @param {object} page_injection
         * @returns {undefined}
         */
        , _startTabExecution: async function (tabId, page_injection) {
            if (typeof page_injection.gm.preparedScript === "string" ) {
                await browser.tabs.executeScript(tabId, {code: page_injection.gm.preparedScript});
            }

            // treffer, Script ausführen
            await browser.tabs.executeScript(tabId, page_injection.exec_details);

        }
        /**
         * 
         * @param {type} userscript_handle
         * @returns {undefined}
         */
        , add_userscript: async function (userscript_id) {
            // @todo
            self.re_init_page_injection();
        }
        /**
         * 
         * @param {type} userscript_handle
         * @returns {undefined}
         */
        , remove_userscript: async function (userscript_id) {
            // @todo
            self.re_init_page_injection();
        }
        /**
         * 
         * @returns {undefined}
         */
        , register_re_init_page_injection_event: function () {

            browser.runtime.onConnect.addListener(function (port) {
                if (port.name !== "page-injection-helper") {
                    return false;
                }
                port.onMessage.addListener(async (response) => {

                    if (!response.data || !response.data.userscript_id) {
                        return false;
                    }

                    switch (response.name) {

                        case "add_userscript":
                            self.add_userscript(response.data.userscript_id);
                            break;

                        case "remove_userscript":
                            self.remove_userscript(response.data.userscript_id);
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
        , re_init_page_injection: function (first_run) {

            // zurücksetzen vom Sammler Objekt!
            self.all_page_injections = [];

            // hole alle Userscripts aus dem Speicher
            userscript_storage.then(async (storage) => {

                storage = await storage.refresh();

                let all_userscripts = storage.getAll();

                // Registriere alle Userscripte!
                //
                // durchlaufe alle Einträge im Storage
                if (all_userscripts.length > 0) {

                    for (var userscript of all_userscripts) {
                        // baue aus dem Userscript ein Objekt für tabs.executeScript
                        let userscript_init = userscript_handle.initWithData(userscript);
                        let page_injection = await self.get_rules_and_exec_object(userscript_init);
                        if (page_injection) {
                            self.all_page_injections.push(page_injection);
                        }
                    }

                    if (first_run === true) {
                        /**
                         * Userscripte ausführen
                         * falls USI gestartet wurde, nachdem bereits die Tabs geöffnet wurden
                         */
                        let actual_tabs = await browser.tabs.query({});
                        for (var tab of actual_tabs) {
                            self.checkUserscriptInjection(tab.id, tab.url);
                        }
                    } else {
                        if (browser.tabs.onUpdated.hasListener(self.userscriptInjection_onUpdate)) {
                            browser.tabs.onUpdated.removeListener(self.userscriptInjection_onUpdate);
                        }
                    }

                    /**
                     * Standard: USI fügt die Userscripte nur bei einer Veränderung an einem Tab durch
                     */
                    browser.tabs.onUpdated.addListener(self.userscriptInjection_onUpdate);

                }

            });

        }

        /**
         * 
         * liefert die Userscript Include und Exclude Regeln und das fertige Exec Object für browser.tabs.executeScript
         * @param {object} userscript_handle
         */
        , get_rules_and_exec_object: async function (userscript_handle) {

            if (typeof userscript_handle === "undefined" || typeof userscript_handle.getSettings !== "function" || userscript_handle.getSettings() === null) {
                return false;
            }

            let script_settings = userscript_handle.getSettings();
            let exec_details = {};

            // URL/Includes darf natürlich nicht leer sein
            if ((typeof script_settings["include"] === "undefined") 
                || (script_settings["include"].length < 1) 
                || (userscript_handle.isDeactivated() === true)) {
                // Keine weitere Prüfung nötig
                return false;
            }

            // die Includes könnten auch nur aus einem Aufruf bestehen
            if (basic_helper.is_string(script_settings["include"])) {
                //Wandle den String in ein einfaches Array um....
                script_settings["include"] = [script_settings["include"]];
            }

            var result_includes = [];
            // Prüfung ob es ein Array ist
            if (script_settings["include"].length > 0) {
                // ausgelagert, für Wiederverwendung
                result_includes = parse_userscript.prepare_includes_and_excludes(script_settings["include"], script_settings, "include");
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
            var result_excludes = [/resource:\/\/firefox-addon-usi-at-jetpack\/.*/, new RegExp("moz-extension://.*")];
//            var result_excludes = [/resource:\/\/firefox-addon-usi-at-jetpack\/.*/, new RegExp(browser.extension.getURL("") + ".*")];

            if (typeof script_settings["exclude"] !== "undefined" && script_settings["exclude"].length > 0) {
                // Exclude Regeln hinzufügen
                var prepared_result_excludes = parse_userscript.prepare_includes_and_excludes(script_settings["exclude"], script_settings, "exclude");

                // Sicherheitscheck
                if (typeof prepared_result_excludes !== "undefined" && prepared_result_excludes.length > 0) {
                    for (var i in prepared_result_excludes) {
                        result_excludes.push(prepared_result_excludes[i]);
                    }
                }
            }

            // Default ist nun "document_idle", da es zu oft zu Problemen kam, dass das "document" nicht verfügbar war
            var runAt = "document_idle";

            if (typeof script_settings["run-at"] === "string") {

                // Entscheide wann das Userscript geladen werden soll, anhand von @run-at
                switch (script_settings["run-at"]) {

                    case "document-start":
                    case "start":
                        /**
                         * SDK:
                         * "start": load content scripts immediately after the document element for the page is inserted into the DOM, but before the DOM content itself has been loaded
                         */

                        /**
                         * WEBEXT:
                         * "document_start": corresponds to loading. The DOM is still loading.
                         */
                        runAt = "document_start";
                        break;

                        //
                    case "document-ready":
                    case "ready":
                        /**
                         * SDK:
                         * "ready": load content scripts once DOM content has been loaded, corresponding to the DOMContentLoaded event
                         */

                        /**
                         * WEBEXT:
                         * "document_end": corresponds to 'interactive'. The DOM has finished loading, but resources such as scripts and images may still be loading.
                         */
                        runAt = "document_end";
                        break;

                    case "document-end":
                    case "document-idle":
                    case "end":
                    default:
                        /**
                         * SDK:
                         * "end": load content scripts once all the content (DOM, JS, CSS, images) for the page has been loaded, at the time the window.onload event fires
                         */

                        /**
                         * WEBEXT:
                         * "document_idle": corresponds to complete. The document and all its resources have finished loading.
                         */
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

            if(typeof script_settings["include-jquery"] !== "undefined"){
                // Wenn jQuery gefordert ist muss das page_injection_object angepasst werden
                if (script_settings["include-jquery"] === "true" || script_settings["include-jquery"] === true) {
                    contentScript += await load_resource.load_internal_file("/gui/libs/jquery/jquery-3.2.1.min.js");
                }
            }

            let config_data = await config_storage.get();

            // Enthält die nötigen Funktionen für den GM Bereich
            let gm = {};

            // Wenn Greasemonkey Funktionen benötigt werden, muss das page_injection_object angepasst werden
            if (config_data.greasemonkey.global_active === true ||
                script_settings["use-greasemonkey"] === "true" ||
                script_settings["use-greasemonkey"] === true) {

                // inklusive der require skripte, jedoch ohne den GM Teil von USI
                let contentScript_without_GM = contentScript;


                // füge die nötigen Einstellung für die Nutzung von GM hinzu
                gm = self.add_GM_Functions(userscript_handle);

                // scriptSource hinzufügen
                gm.prefilled_data.scriptSource = contentScript_without_GM;

                // Übler Workaround, da keine Dateien direkt gelesen werden können ...
                let script_extra_data = "var prefilled_data = " + JSON.stringify(gm.prefilled_data) + "; \n\n";
                let gm_content_script = await load_resource.load_internal_file("/gui/helper/GM_Frontend.js");

                // ermögliche der Webseite den Zugriff auf die Greasemonkey-Frontend Funktionen
                /*
                 *  dieses muss per browser.tabs.executeScript ausgeführt werden
                 *  bevor das eigentliche Userscript geladen wird
                 */
                gm.preparedScript = script_extra_data + gm_content_script;
            }

            // letztendlich die Require Skripte und das Userscript anhängen
            contentScript += self.createUserscriptContent(userscript_handle);

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
            };
        }

        , createUserscriptContent: function (userscript_handle) {
            // sammelt alle Skripte die auf der Seite eingebunden werden sollen
            var contentScript = new Array();

            // Füge @require Skripte hinzu
            if (!basic_helper.empty(userscript_handle.getAllRequireScripts())) {
                var req_scripts = userscript_handle.getAllRequireScripts();
                for (var i in req_scripts) {
                    contentScript.push(req_scripts[i].text);
                }

            }

            // Das Userscript erst nach den @require Skripten einbinden!
            contentScript.push(userscript_handle.getUserscriptContent());

            // aus den einzelnen Skripten nur einen String bauen, damit Referenzierungen möglich bleiben
            contentScript = contentScript.join("\n\n\n");

            // alle ungültigen Zeichen entfernen!
            return contentScript.replace(/\uFFFD/g, '');
        }

        , add_GM_Functions: function (userscript_handle) {

            // init JSON
            let gm = {};
            gm.prefilled_data = {};

            // übergibt den val_store in die Storage Variable
            gm.prefilled_data.storage = userscript_handle.getValStore();
            gm.prefilled_data.id = userscript_handle.getId();

            // Werte für die Variable GM_info
            gm.prefilled_data.scriptSettings = userscript_handle.getSettings(); // enthält die Settings
            gm.prefilled_data.scriptMetaStr = parse_userscript.find_lines_with_settings(userscript_handle.getUserscriptContent()).join("\n");
            gm.prefilled_data.usiVersion = browser.runtime.getManifest().version; // übergibt die USI Version
            gm.prefilled_data.systemPlatform = browser.runtime.PlatformOs; // BSP: Android

            // Enthält nun alle speziellen Einstellungen für die Nutzung der GM Funktionen
            return gm;

        }

    };

    return self;

})();

if (typeof exports !== "undefined") {
    exports.page_injection_helper = page_injection_helper;
}