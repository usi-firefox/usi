"use strict"; // Strict Mode aktivieren!
/************************************************************************
 ************************* Init Bereich! ********************************
 ************************************************************************/

/* global require */

// Language
var _ = require("sdk/l10n").get,
// Lade den basic_helper
basic_helper = require("./basic_helper").basic_helper,
// Storage laden
addon_storage = require("sdk/simple-storage"),
// Einstellungsspeicher laden
preferences = require("sdk/simple-prefs"),
// hierrin werden alle Page Injections gesammelt ...
all_page_injections = [],
// PageMod Module laden!
page_injection = require("sdk/page-mod"), 
// Self init für CFX Tool
self = require("sdk/self"),

// Kompatibilitäts Helfer
cfx_jpm_helper = require("./cfx_jpm_helper").cfx_jpm_helper,
		
// Page Injection Helper - dort findet die Zuweisung der Userscripte für die Seiten statt		
page_injection_helper = require("./page_injection_helper").page_injection_helper;

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