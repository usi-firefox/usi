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
		
// Page Injection Helper - dort findet die Zuweisung der Userscripte für die Seiten statt		
page_injection_helper = require("./page_injection_helper").page_injection_helper;

// Prüfe das kein Speicherüberlauf stattfindet!
addon_storage.on("OverQuota", function () {
	
});



//// Sammelt alle aktiven Workers, und kann diese dann wieder ablösen...
//var all_workers = [];
//
//// hiermit werden die Worker wieder abgelöst!
//function detachWorker(worker, workerArray) {
//  var index = workerArray.indexOf(worker);
//  if(index != -1) {
//    workerArray.splice(index, 1);
//  }
//}


preferences.on("export_userscripts", function () {

//	var FileSaver = require("external_lib/FileSaver");
//	
//	saveAs("sadsadasdsadsadsad", "test.txt");
	
	// Versuche die Tabs zu laden!
	var tabs = require("sdk/tabs");

	// optionen gui starten ...
	tabs.open(self.data.url("export/export.html"));
	
});


/************************************************************************
 ************************* Options Bereich! *****************************
 ************************************************************************/

// höre auf einen Aufruf vom Options Knopf
// Einstellungen setzen
preferences.on("loadOptions", function () {

	// lade alles nötige für die Options Einstellungen
	var options_url = self.data.url("options/options.html");

	// Workaround für DESKTOP Version
//	if(options_url.indexOf("/usi/") == -1){
//		options_url = "resource://firefox-addon-usi-at-jetpack/usi/data/options/options.html";
//	}

	try {
		// Versuche die Tabs zu laden!
		var tabs = require("sdk/tabs");

		// optionen gui starten ...
		tabs.open(options_url);

	} catch (exception) {

	}

});

/************************************************************************
 ************************* Simple Prefs Bereich! ************************
 ************************************************************************/



//// zurücksetzen aller Optionen!
//preferences.on("delete-everything", function () {
//	// lösche die Kompletten Einstellungen im "addon_storage.storage"
//	// lösche jeden einzelnen Wert...
//	for (var i in addon_storage.storage) {
//		delete addon_storage.storage[i];
//	}
//});



///************************************************************************
// ************************* Basic Funktionen! *************************
// ************************************************************************/
// Lade einfach den basic_helper.js!

//************* TEST BEREICH *************//
//var greasemonkey_functions = require("./greasemonkey_functions").greasemonkey_functions;
//// es muss zunächst einmal eine Userscript ID übergeben werden, und init aufgerufen werden!
//var FFFF = greasemonkey_functions.init(1447004506283);
//
////FFFF.GM_setValue("ach","lass mal gucken");
//var bitte = FFFF.GM_getValue("ach");
//
//
//console.log("bitte ???");
//console.log(bitte);
//
