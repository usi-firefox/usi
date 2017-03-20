"use strict"; // Strict Mode aktivieren!
/************************************************************************
 ************************ Kompatibilitäts Funktionen ********************
 ************************************************************************/

/* global exports, require */

var addon_path_helper = {
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
	exports.addon_path_helper = addon_path_helper;
}