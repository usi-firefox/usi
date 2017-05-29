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
// Systeminformationen
    system = require("sdk/system"),
// Kompatibilitäts Helfer
    addon_path_helper = require("lib/configuration/addon_path_helper").addon_path_helper,
// Sichert alle Registrierten Menü Kommandos
    last_menuCommands = last_menuCommands || [],
// Übersetzungsschlüssel bestimmen
    lang = require("lib/configuration/language").lang,
// Resource Path festlegen
    resource_path = addon_path_helper.resource_path(),
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
        // zerstöre die ALLE PageMods mithilfe der Destroy Funktion!
        page_injection_helper.destroy_all_page_mods();
		
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
	, destroy_all_page_mods: function(){
        // prüfe ob das Userscript bereits geladen wurde, und zerstöre den PageMod wenn ja
		if (typeof all_page_injections === "object"){           
            all_page_injections.forEach(function(element,index){
                if(typeof element.pagemod.destroy === "function"){
                    element.pagemod.destroy();
                    delete all_page_injections[index];
                }
            });
			return true;
		}else{
			return false;
		}
    }
	// Zerstört einen PageMod
	, destroy_page_mod_by_id : function (userscript_id){
		// prüfe ob das Userscript bereits geladen wurde, und zerstöre den PageMod wenn ja
		if (typeof all_page_injections === "object"){
            all_page_injections.forEach(function(element,index){
                if(userscript_id === element.id && typeof element.pagemod.destroy === "function"){
                    element.pagemod.destroy();
                    delete all_page_injections[index];
                }
            });
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
            var contentScript_result = page_injection_helper.createUserscriptContent(userscript_handle);

            // https://bitbucket.org/usi-dev/usi/issues/2/add-support-for-userscripts-in-iframes
            // default : ["top"]
            var attachTo_setting = ["top"];
            
            if(typeof script_settings["attach-to"] === "object" ){
                
                // erlaubte "attach-to" werte
                let attachTo_setting_check = ["existing", "top", "frame"].filter(function(allowed){
                    if(script_settings["attach-to"].indexOf(allowed) > -1){
                        return true;
                    }
                });

                if(attachTo_setting_check.length > 0){
                    attachTo_setting = attachTo_setting_check;
                }
            }

            // Setze die Einstellungen für den PageMod Aufruf!
            var page_injection_object = {
                include: result_includes,
                contentScriptWhen: userscript_load_when,
                attachTo: attachTo_setting,
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
            all_page_injections.push({
                    pagemod: page_injection.PageMod(page_injection_object)
                    ,id: userscript_handle.getId()
                });

        }

    }

    , createUserscriptContent : function(userscript_handle){
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
    , add_GM_Functions: function (page_injection_object, userscript_handle, contentScript_result) {

        // init JSON
        page_injection_object.contentScriptOptions = {};

        // übergibt den val_store in die Storage Variable
        page_injection_object.contentScriptOptions.storage = userscript_handle.getValStore();
        page_injection_object.contentScriptOptions.id = userscript_handle.getId();

        // Werte für die Variable GM_info
        page_injection_object.contentScriptOptions.scriptSettings = JSON.stringify(userscript_handle.getSettings()); // enthält die Settings
        page_injection_object.contentScriptOptions.scriptSource = contentScript_result; // inklusive der require skripte
        page_injection_object.contentScriptOptions.scriptMetaStr = parse_userscript.find_lines_with_settings(userscript_handle.getUserscriptContent()).join("\n");
        page_injection_object.contentScriptOptions.usiVersion = self.version; // übergibt die USI Version
        
        page_injection_object.contentScriptOptions.systemPlatform = system.platform; // übergibt die USI Version

        // ermögliche der Webseite den Zugriff auf die Greasemonkey-Frontend Funktionen
        page_injection_object.contentScriptFile.push(resource_path + "helper/GM_Frontend.js");

        // Registriere die Events für die entgegennahme aus dem Content-Script
        page_injection_object.onAttach = function (worker) {
            
            // Init Greasemonkey-Backend API
            var grease = require("lib/inject/GM/GM_funcs").GM_funcs,
            // Handler für dieses Skript
            grease_handler = grease.init(userscript_handle.getId(), worker);


            // Variable speichern
            worker.port.on("USI-BACKEND:GM_setValue", function (value_pair) {
                grease_handler.GM_setValue(value_pair.name, value_pair.value);
            });
            
            // für Asynchronen abruf
            worker.port.on("USI-BACKEND:GM_getValue", function (value_pair) {
                let GM_value = grease_handler.GM_getValue(value_pair.name, value_pair.default);
                
                worker.port.emit("USI-BACKEND:GM_getValue_done_"+ value_pair.base64, {name: value_pair.name, value: GM_value});
            });

            // Variable löschen
            worker.port.on("USI-BACKEND:GM_deleteValue", function (value_pair) {
                grease_handler.GM_deleteValue(value_pair.name);
            });

            // neuen Tab öffnen
            worker.port.on("USI-BACKEND:GM_openInTab", function (value_pair) {
                grease_handler.GM_openInTab(value_pair.url, value_pair.open_in_background);
            });

            // xmlhttpRequest call
            worker.port.on("USI-BACKEND:GM_xmlhttpRequest", function (details) {
                // ausgelagert in eigene Datei
                var GM_xhrHandler = require("lib/inject/GM/GM_xhrHandler").GM_xhrHandler;

                GM_xhrHandler.init(details.data, details.counter, worker);

            });

            // GM_registerMenuCommand -> Kommando im Menü Registrieren
            worker.port.on("USI-BACKEND:GM_registerMenuCommand", function (data) {
                last_menuCommands.push(grease_handler.GM_registerMenuCommand(data.caption, data.commandFunc, last_menuCommands));
            });

            // in die Zwischenablage schreiben!
            worker.port.on("USI-BACKEND:GM_setClipboard", function (text) {
                grease_handler.GM_setClipboard(text);
            });

        };
        
        // Enthält nun alle speziellen Einstellungen für die Nutzung der GM Funktionen
        return page_injection_object;

    }

};

if (typeof exports !== "undefined") {
    exports.page_injection_helper = page_injection_helper;
}