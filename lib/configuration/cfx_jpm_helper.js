"use strict"; // Strict Mode aktivieren!
/************************************************************************
 ************************ Kompatibilitäts Funktionen ********************
 ************************************************************************/

/* global exports, require */

var cfx_jpm_helper = {
	resource_path: function () {
        // JPM Variante
        return "resource://firefox-addon-usi-at-jetpack/data/";
    }
	,chrome_path: function(){
        return "chrome://usi/content/";
    }
};

// nötig damit es auch im Content Script verwendet werden kann!!!
if (typeof exports !== "undefined") {
	exports.cfx_jpm_helper = cfx_jpm_helper;
}