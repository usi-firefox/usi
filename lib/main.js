"use strict"; // Strict Mode aktivieren!
/************************************************************************
 ************************* Init Bereich! ********************************
 ************************************************************************/

/* global require */

// Language
var _ = require("sdk/l10n").get,
// Storage laden
addon_storage = require("sdk/simple-storage"),
// Einstellungsspeicher laden
preferences = require("sdk/simple-prefs"),
// hierrin werden alle Page Injections gesammelt ...
all_page_injections = [],
// Kompatibilitäts Helfer
cfx_jpm_helper = require("./configuration/cfx_jpm_helper").cfx_jpm_helper,
// Page Injection Helfer
page_injection_helper = require("./inject/page_injection_helper").page_injection_helper;
		
// Userscript Watcher aufrufen
require("./inject/open_userscript");
// Userscript Options Handler aufrufen
require("./inject/usi_options_handler");

// führe die Page Injection durch!
page_injection_helper.re_init_page_injection();

// Prüfe das kein Speicherüberlauf stattfindet!
addon_storage.on("OverQuota", function () {
	
});

/************************************************************************
 ************************* Options Bereich! *****************************
 ************************************************************************/

/**
 * Simpler Funktionsrumpf zum Öffnen der Optionen
 * @returns void
 */
function openUsiOptions(){
		// lade alles nötige für die Options Einstellungen
	var options_url = cfx_jpm_helper.resource_path() + "options/options.html";

	try {
		// Versuche die Tabs zu laden!
		var tabs = require("sdk/tabs");

		// optionen gui starten ...
		tabs.open(options_url);

	} catch (exception) {

	}

}

// Initialisierung für das Native Window (Fennec)

var utils = require('sdk/window/utils'),
	recent = utils.getMostRecentBrowserWindow(),
	menuID;
 
function addMenuItem() {

	menuID = recent.NativeWindow.menu.add({
		name: _("usi_options"),
		icon: null,
		//    parent: recent.NativeWindow.menu.toolsMenuID,
		callback: openUsiOptions
	});
}

function removeMenuItem() {
	recent.NativeWindow.menu.remove(menuID);
}

// nur bei Fennec
if (typeof recent.NativeWindow !== "undefined") {
	addMenuItem();

	exports.onUnload = function () {
		removeMenuItem();
	};

} else { // Nur im Desktop

	// höre auf einen Aufruf vom Options Knopf
	// Einstellungen setzen
	preferences.on("loadOptions", function () {
		openUsiOptions();
	});

}

/************************************************************************
 ************************* Simple Prefs Bereich! ************************
 ************************************************************************/

//************* TEST BEREICH *************//