"use strict"; // Strict Mode aktivieren!
/************************************************************************
 ************************* Init Bereich! ********************************
 ************************************************************************/

/* global require */

// Language
var _ = require("sdk/l10n").get,
// Einstellungsspeicher laden
		preferences = require("sdk/simple-prefs"),
// Systeminformationen
		system = require("sdk/system"),
// Kompatibilitäts Helfer
		addon_path_helper = require("./configuration/addon_path_helper").addon_path_helper,
// Page Injection Helfer
		page_injection_helper = require("./inject/page_injection_helper").page_injection_helper;

// Userscript Watcher aufrufen
require("./inject/open_userscript");
// Userscript Options Handler aufrufen
require("./inject/usi_options_handler");

// führe die Page Injection durch!
page_injection_helper.re_init_page_injection();

/************************************************************************
 ************************* Options Bereich! *****************************
 ************************************************************************/

+(function () {

	/**
	 * Simpler Funktionsrumpf zum Öffnen der Optionen
	 * @returns void
	 */
	function openUsiOptions() {
		try {
			// Versuche die Tabs zu laden!
			var tabs = require("sdk/tabs");

			// optionen gui starten ...
			tabs.open(addon_path_helper.resource_path() + "options.html");
		} catch (exception) {
		}
	}

// Initialisierung für das Native Window (Fennec)
	var utils = require('sdk/window/utils'),
	recent = utils.getMostRecentBrowserWindow();

    // nur bei Fennec
	if (system.platform === "android") {

        var menuID = recent.NativeWindow.menu.add({
			name: _("usi_options"),
			icon: null,
			//    parent: recent.NativeWindow.menu.toolsMenuID,
			callback: openUsiOptions
		});

		exports.onUnload = function () {
			recent.NativeWindow.menu.remove(menuID);
		};

	} else {
		// höre auf einen Aufruf vom Options Knopf
		// Einstellungen setzen
		preferences.on("loadOptions", function () {
			openUsiOptions();
		});
	}

})();
//************* TEST BEREICH *************//