"use strict"; // Strict Mode aktivieren!

/************************************************************************
 ************************* Page Injection Funktionen! *******************
 ************************************************************************/

/* global exports,require, Promise */

// Lade den basic_helper
var basic_helper = basic_helper || require("data/helper/basic_helper").basic_helper,
// Einstellungsspeicher laden
    preferences = preferences || require("sdk/simple-prefs"),
// hierrin werden alle Page Injections gesammelt ...
    all_page_injections = all_page_injections || [],
// PageMod Module laden!
    page_injection = page_injection || require("sdk/page-mod"),
// Userscript Parser laden!
    parse_userscript = parse_userscript || require("lib/parse/parse_userscript").parse_userscript,
// Self init für CFX Tool
    self = self || require("sdk/self"),
// Kompatibilitäts Helfer
    cfx_jpm_helper = require("lib/configuration/cfx_jpm_helper").cfx_jpm_helper,
// Sichert alle Registrierten Menü Kommandos
    last_menuCommands = last_menuCommands || [],
// Übersetzungsschlüssel bestimmen
    lang = require("lib/configuration/language").lang,
// Url Check		
    url_c = require("sdk/url"),
// Resource Path festlegen
    resource_path = cfx_jpm_helper.resource_path(),
// Ermöglicht einen vereinfachten Umgang mit den gespeicherten Userscripts
    userscript_storage = require("lib/storage/userscript").userscript_storage;

/************************************************************************
 ************************* Injection Bereich! ***************************
 ************************************************************************/


var page_injection_helper = {
    /**
     * Führe diese Funktion aus damit der Injection Bereich neu geladen werden kann!
     * @returns {void}
     */
    re_init_page_injection: function () {
        // entferne alle Userscripts die zuvor geladen wurden!
        for (var userscript_id in all_page_injections) {
			// zerstöre die PageMods mithilfe der Destroy Funktion!
			page_injection_helper.destroy_page_mod_by_id(userscript_id);
        }
		
        // zurücksetzen vom Sammler Objekt!
        all_page_injections = [];

        // hole alle Userscripts aus dem Speicher
        var all_userscripts = userscript_storage.getAndInitAll();

        // Registriere alle Userscripte!
        //
        // durchlaufe alle Einträge im Storage
        for (var userscript_id in all_userscripts) {

            // führe für jedes Userscript die einfüge Funktion aus!
            page_injection_helper.add_userscript_to_page(all_userscripts[userscript_id]);

        }
    }
	
	// Zerstört einen PageMod
	, destroy_page_mod_by_id(userscript_id){
		// prüfe ob das Userscript bereits geladen wurde, und zerstöre den PageMod wenn ja
		if (typeof all_page_injections[userscript_id] === "object" &&
				typeof all_page_injections[userscript_id].destroy === "function") {
			
			all_page_injections[userscript_id].destroy();
			delete all_page_injections[userscript_id];
			
			return true;
		}else{
			
			return false;
		}
		
	}
	
    ,init_page_injection_by_id: function (userscript_id) {
		// userscript_id muss existieren
		if(typeof userscript_id === "undefined"){
			return false;
		}
		
		// prüfe ob das Userscript bereits geladen wurde, und zerstöre den PageMod wenn ja
		page_injection_helper.destroy_page_mod_by_id(userscript_id);
			
        // hole alle Userscripts aus dem Speicher
        var userscript_handle = userscript_storage.getById(userscript_id);

        // Registriere alle Userscripte!
        //
        // durchlaufe alle Einträge im Storage
        if(typeof userscript_handle === "object"){
            // führe für jedes Userscript die einfüge Funktion aus!
            page_injection_helper.add_userscript_to_page(userscript_handle);
        }else{
			return false;
		}
    }

    /**
     * 
     * Fügt ein Userscript in eine Seite ein!
     * @param {object} userscript_handle
     * @returns {void}
     */
    , add_userscript_to_page: function (userscript_handle) {

        if (typeof userscript_handle === "undefined" || userscript_handle.getSettings() === null) {
            return false;
        }

        var script_settings = userscript_handle.getSettings();

        // URL/Includes darf natürlich nicht leer sein!
        if (!basic_helper.empty(script_settings["include"]) &&
            (typeof userscript_handle.isDeactivated() === "undefined" || userscript_handle.isDeactivated() === false)) { // nur wenn das skript nicht deaktiviert wurde!

            // die Includes könnten auch nur aus einem Aufruf bestehen!
            if (basic_helper.is_string(script_settings["include"])) {
                //Wandle den String in ein einfaches Array um....
                script_settings["include"] = [script_settings["include"]];
            }

            // Prüfung ob es ein Array ist
            if (script_settings["include"].length > 0) {

                // ausgelagert, für Wiederverwendung
                var result_includes = parse_userscript.prepare_includes_and_excludes(script_settings["include"], script_settings, "include");

            } else {

                // das dürfte nie auftreten!
                throw new {code: 100, text: lang.exception_100, content: script_settings["include"]};
            }

            // Die include dürfen nicht leer sein!
            if (result_includes.length === 0) {
                return false;
            }

            // die Excludes könnten auch nur aus einem Aufruf bestehen!
            if (basic_helper.is_string(script_settings["exclude"])) {
                //Wandle den String in ein einfaches Array um....
                script_settings["exclude"] = [script_settings["exclude"]];
            }

            // Wichtig damit die Konfigurations Oberfläche von USI nicht unbrauchbar gemacht werden kann!
            var result_excludes = [/resource:\/\/firefox-addon-usi-at-jetpack\/.*/];

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

            // Default ist nun "ready", da es zu oft zu Problemen kam, dass das "document" nicht verfügbar war
            var userscript_load_when = "ready";

            // Entscheide wann das Userscript geladen werden soll, anhand von @run-at
            switch (script_settings["run-at"]) {

                case "document-start":
                case "start":
                    // "start": load content scripts immediately after the document element for the page is inserted into the DOM, but before the DOM content itself has been loaded
                    userscript_load_when = "start";
                    break;

                    //
                case "document-ready":
                case "ready":
                    // "ready": load content scripts once DOM content has been loaded, corresponding to the DOMContentLoaded event
                    userscript_load_when = "ready";
                    break;

                case "document-end": // eigentlich überflüssig, aber zu Dokumentationszwecken vielleicht nicht unnötig
                case "end":
                default:
                    // "end": load content scripts once all the content (DOM, JS, CSS, images) for the page has been loaded, at the time the window.onload event fires
                    userscript_load_when = "end";
                    break;

            }

            // sammelt alle Skripte die auf der Seite eingebunden werden sollen
            var contentScript_result = new Array();

            // Füge @require Skripte hinzu
            if (!basic_helper.empty(userscript_handle.getAllRequireScripts())) {
                var req_scripts = userscript_handle.getAllRequireScripts();
                for (var i in req_scripts) {
                    contentScript_result.push(req_scripts[i].text);
                }

            }

            // Das Userscript erst nach den @require Skripten einbinden!
            contentScript_result.push(userscript_handle.getUserscriptContent());

            // aus den einzelnen Skripten nur einen String bauen, damit Referenzierungen möglich bleiben
            contentScript_result = contentScript_result.join("\n\n\n");

            // alle ungültigen Zeichen entfernen!
            contentScript_result = contentScript_result.replace(/\uFFFD/g, '');

            // Setze die Einstellungen für den PageMod Aufruf!
            var page_injection_object = {
                include: result_includes,
                contentScriptWhen: userscript_load_when,
                // @todo: mit 'existing' gab es zu viele Fehler, dennoch sollte es in der Zukunft wieder konfigurierbar sein
                attachTo: ['top'],
                exclude: result_excludes,
                contentScript: contentScript_result
            };

            // init array
            page_injection_object.contentScriptFile = [];
            // Wenn jQuery gefordert ist muss das page_injection_object angepasst werden!
            if (script_settings["include-jquery"] === "true" || script_settings["include-jquery"] === true) {
                page_injection_object.contentScriptFile.push(resource_path + "libs/jquery/jquery-2.2.4.min.js");
            }

            // Wenn Greasemonkey Funktionen benötigt werden, muss das page_injection_object angepasst werden!
            if (preferences.prefs.options_always_activate_greasemonkey === true ||
                script_settings["use-greasemonkey"] === "true" ||
                script_settings["use-greasemonkey"] === true) {
                // füge die nötigen Einstellung für die Nutzung von GM hinzu
                page_injection_object = page_injection_helper.add_GM_Functions(page_injection_object, userscript_handle, contentScript_result);
            }

            // aktuelles PageMod Objekt dem Sammler Objekt hinzufügen (id => PageMod Objekt)
            all_page_injections[userscript_handle.getId()] = page_injection.PageMod(page_injection_object);

        }

    }

    , add_GM_Functions: function (page_injection_object, userscript_handle, contentScript_result) {

        // init JSON
        page_injection_object.contentScriptOptions = {};

        // übergibt den val_store in die Storage Variable
        page_injection_object.contentScriptOptions.storage = userscript_handle.getValStore();
        page_injection_object.contentScriptOptions.id = userscript_handle.getId();

        // Werte für die Variable GM_info
        page_injection_object.contentScriptOptions.scriptsettings = JSON.stringify(userscript_handle.getSettings()); // enthält die Settings
        page_injection_object.contentScriptOptions.scriptSource = contentScript_result; // inklusive der require skripte
        page_injection_object.contentScriptOptions.scriptMetaStr = parse_userscript.find_lines_with_settings(userscript_handle.getUserscriptContent()).join("\n");
        page_injection_object.contentScriptOptions.usiversion = self.version; // übergibt die USI Version


        // ermögliche der Webseite den Zugriff auf die Greasemonkey-Frontend Funktionen
        page_injection_object.contentScriptFile.push(resource_path + "helper/GM_Frontend.js");

        // Init Greasemonkey-Backend API
        var grease = require("lib/inject/GM/greasemonkey_functions").greasemonkey_functions;
        // Handler für dieses Skript
        var grease_handler = grease.init(userscript_handle.getId());

        // Registriere die Events für die entgegennahme aus dem Content-Script
        page_injection_object.onAttach = function (worker) {

            // Variable speichern
            worker.port.on("USI-BACKEND:GM_setValue", function (value_pair) {
                grease_handler.GM_setValue(value_pair.name, value_pair.value);
            });

            // Variable löschen
            worker.port.on("USI-BACKEND:GM_deleteValue", function (value_pair) {
                grease_handler.GM_deleteValue(value_pair.name);
            });

            // neuen Tab öffnen
            worker.port.on("USI-BACKEND:GM_openInTab", function (value_pair) {

                // Prüft ob value_pair.url wirklich valide ist!
                if (url_c.isValidURI(value_pair.url) === true) {

                    // Prüf-Variable damit es nicht zu einer "unendlichen" Rekursion kommt
                    var not_wildcard_pagemod = true;
                    for (var i in userscript_handle["include"]) {
                        if (userscript_handle["include"][i] === "*") {
                            // Wildcard Eintrag gefunden, open in Tab ist nicht möglich!
                            not_wildcard_pagemod = false;
                        }
                    }
                    // im neuen Tab öffnen, aber nur wenn das Userscript nicht für Wildcard Aufrufe genutzt wird!!!!
                    if (not_wildcard_pagemod === true) {
                        try {
                            var open_in_background;
                            if (value_pair.open_in_background === "true" || value_pair.open_in_background === true) {
                                open_in_background = true;
                            } else {
                                open_in_background = false;
                            }
                            require("sdk/tabs").open({url: value_pair.url, inBackground: open_in_background});
                        } catch (ex) {
                            worker.port.emit("GM-FRONTEND-ERROR",
                                {
                                    func: "GM_openInTab",
                                    reason: "Unknown Error",
                                    object: {Exception: ex, GivenValues: value_pair}
                                });
                        }
                    }

                } else {
                    // Schicke den Fehler zurück zum Aufrufenden Skript
                    worker.port.emit("GM-FRONTEND-ERROR",
                        {
                            func: "GM_openInTab",
                            reason: "url is not valid!",
                            object: value_pair
                        });
                }
            });

            // xmlhttpRequest call
            worker.port.on("USI-BACKEND:GM_xmlhttpRequest", function (details) {
                // ausgelagert in eigene Datei
                var GM_xhrHandler = require("lib/inject/GM/GM_xhrHandler").GM_xhrHandler;

                GM_xhrHandler.init(details.data, details.counter, worker);

            });

            // GM_registerMenuCommand -> Kommando im Menü Registrieren
            worker.port.on("USI-BACKEND:GM_registerMenuCommand", function (data) {
                // als JSON lässt es sich natürlich nicht simpel vergleichen, daher die Umwandlung in einen String
                var stringified_data = JSON.stringify(data);

                // Prüfe ob data nicht schon bereits gesetzt wurde!
                // Schutz Abfrage, falls das Kommando auf mehreren Seiten greifen würde (zu lockere Inlcude/Match Anweisung)
                if (last_menuCommands.indexOf(stringified_data) === -1) {
                    // setze data in das Array wo du MenuCommands gesammelt werden
                    last_menuCommands.push(stringified_data);

                    // init
                    var utils = require('sdk/window/utils'),
                        recentWindow = utils.getMostRecentBrowserWindow(),
                        /**
                         * WICHTIGER Workaround, nur so kann eine Funktion vom Frontend ans Backend übergeben und ausgeführt werden!
                         */
                        // Funktions-String zurück in eine Funktion wandeln...
                        commandFunction = new Function("return " + data.commandFunc + "();");

                    // nur bei Fennec
                    if (typeof recentWindow.NativeWindow !== "undefined") {
                        recentWindow.NativeWindow.menu.add({
                            name: data.caption,
                            icon: {
                                "16": "./icon/usi.png"
//								,"32": "./icon/icon-32.png"
//								,"64": "./icon/icon-64.png"
                            },
                            //    parent: recent.NativeWindow.menu.toolsMenuID,
                            callback: commandFunction
                        });

                    } else { // Nur im Desktop
                        // Desktop Variante mit Action Button
                        require('sdk/ui/button/action').ActionButton({
                            id: "usi-menu-" + last_menuCommands.length,
                            label: data.caption,
                            icon: {
                                "16": "./icon/usi.png"
//								,"32": "./icon/icon-32.png"
//								,"64": "./icon/icon-64.png"
                            },
                            onClick: commandFunction
                        });

                    }

                }
            });

            // in die Zwischenablage schreiben!
            worker.port.on("USI-BACKEND:GM_setClipboard", function (text) {
                try {
                    var clipboard = require("sdk/clipboard");

                    // Android - Fennec unterstützt dies wohl bisher nicht ...
                    if (typeof clipboard.set === "function") {
                        // falls es kein String ist, versuche es umzuwandeln
                        if (typeof text !== "string" && typeof text.toString === "function") {
                            text = text.toString();
                        }
                        // setze es nur in die Zwischenablage wenn es wirklich ein String ist...
                        if (typeof text === "string") {
                            clipboard.set(text);
                        }
                    }
                    // nichts...
                } catch (ex) {
                }
            });

        };
        
        // Enthält nun alle speziellen Einstellungen für die Nutzung der GM Funktionen
        return page_injection_object;

    }

};

if (typeof exports !== "undefined") {
    exports.page_injection_helper = page_injection_helper;
}