"use strict"; // Strict Mode aktivieren!

/* global require */

// Lade den basic_helper
var basic_helper = basic_helper || require("../core/basic_helper").basic_helper,
// Storage laden
addon_storage = addon_storage || require("sdk/simple-storage"),
// Einstellungsspeicher laden
preferences = preferences || require("sdk/simple-prefs"),
// PageMod Module laden!
page_injection = page_injection || require("sdk/page-mod"),
// Page Injection Helfer
page_injection_helper = require("../inject/page_injection_helper").page_injection_helper,
// Userscript Parser laden!
parse_userscript = parse_userscript || require("../parse/parse_userscript").parse_userscript,
// Kompatibilitäts Helfer
cfx_jpm_helper = require("../configuration/cfx_jpm_helper").cfx_jpm_helper,
// Übersetzungsschlüssel bestimmen
lang = require("../configuration/language").lang,
// Resource Path festlegen
resource_path = cfx_jpm_helper.resource_path();
	
// Horche auf User Scripte die aufgerufen wurden!
page_injection.PageMod({
	include: /.*\.user\.js/,
	contentScriptWhen: 'end',
	attachTo: ['existing', 'top'], // TODO FF: make blocking policy start before this is run on install
	contentScriptFile: resource_path + "userscript-get.js",
	// Dürfen externe UserScripte direkt importiert werden? -> preferences.prefs.enableExternalScriptLoadQuestion
	contentScriptOptions: {language: lang},
	onAttach: function (worker) {

		// sendet den Status zurück
		worker.port.emit("USI-BACKEND:active", preferences.prefs.enableExternalScriptLoadQuestion);

		//  nimm die Skript URL und verarbeite Sie weiter
		worker.port.on("USI-BACKEND:new-usi-script_url---call", function (script_content_response) {

			// Versuche das USER Skript herunterzuladen
			// übergib den Rest des Ablaufs!, da der Aufruf nicht Syncron läuft!
			page_injection_helper.load_userscript_by_url(script_content_response.script_url,
					function (user_script_text) {
						// Hier wird das UserScript weiterverarbeitet und gespeichert
						page_injection_helper.check_for_userscript_settings_and_save_it(user_script_text, worker);
					}
			);
		});


		// Wenn dies aufgerufen wird, überschreibe ein vorhandenes Userscript
		worker.port.on("USI-BACKEND:override-same-userscript", function (userscipt_infos) {

			// Hier wird das UserScript weiterverarbeitet und gespeichert
			page_injection_helper.check_for_userscript_settings_and_save_it(userscipt_infos.userscript, worker, userscipt_infos.id);

		});

	}
});