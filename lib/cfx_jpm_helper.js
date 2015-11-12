"use strict"; // Strict Mode aktivieren!
/************************************************************************
 ************************ Kompatibilitäts Funktionen ********************
 ************************************************************************/

/* global exports */


var cfx_jpm_helper = {

	resource_path : function(files){
		var result = [];
		for (var i in files){
			// Für jede Übergebene Datei, eine Registierung für die JPM und CFX Variante erstellen
			result.push("resource://firefox-addon-usi-at-jetpack/data/"		+	files[i]);
			result.push("resource://firefox-addon-usi-at-jetpack/usi/data/"	+	files[i]);
		}
		
		return result;
	}
	
};


// nötig damit es auch im Content Script verwendet werden kann!!!
if(typeof cfx_jpm_helper !== "undefined"){
	exports.cfx_jpm_helper = cfx_jpm_helper;
}