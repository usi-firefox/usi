"use strict";

/* global basic_helper */

/**
 * erzeugt einen Download (Datei Speichern Dialog)
 * @param {string} data
 * @param {string} type
 * @param {string} filename
 * @returns {void}
 */
function createDownload(data, type, filename){
	var link = document.createElement("a");
	// Dateinamen angeben
	if(!basic_helper.empty(filename)){
		link.download = filename;
	}
	
	// data type festlegen
	link.href = "data:";
	if(!basic_helper.empty(type)){
		link.href += type;
	}else{
		link.href += "text/plain";
	}
	
	// Datenanhängen
	link.href += ";base64," + btoa(unescape(encodeURIComponent(data)));

	// Workaround, muss erst im DOM sein damit der click() getriggert werden kann m(
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}