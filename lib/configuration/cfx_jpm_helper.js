"use strict"; // Strict Mode aktivieren!
/************************************************************************
 ************************ Kompatibilitäts Funktionen ********************
 ************************************************************************/

/* global exports, require */

var config = require("../configuration/config").config;

var cfx_jpm_helper = {
	/*
	 * @var buildsystem_jpm legt fest ob CFX oder JPM verwendet wird
	 */ 
	init: function (buildsystem_jpm) {

		return {
			resource_path: function () {
					// Für jede Übergebene Datei, eine Registierung für die JPM und CFX Variante erstellen
				if (buildsystem_jpm === true){
					// JPM Variante
					return "resource://firefox-addon-usi-at-jetpack/data/";
				}else{
					// CFX Variante
					return "resource://firefox-addon-usi-at-jetpack/usi/data/";
				}
			}
		};
	}
};

// direkt die Konfiguration vornehmen!
cfx_jpm_helper = cfx_jpm_helper.init(config.buildsystem_jpm);

// nötig damit es auch im Content Script verwendet werden kann!!!
if (typeof exports !== "undefined") {
	exports.cfx_jpm_helper = cfx_jpm_helper;
}