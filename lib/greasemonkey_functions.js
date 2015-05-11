"use strict"; // Strict Mode aktivieren!
/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

// nutze den basic_helper, oder lade den basic_helper nach mittels require()!
var basic_helper = basic_helper || require("./basic_helper.js").basic_helper;
// Storage laden
var addon_storage = addon_storage || require("sdk/simple-storage");

var greasemonkey_functions = {
	// setze die ID vom Userscript, damit es nur darauf Einfluss haben kann!
	init: function (script_id_given) {
		// Prüfe ob die ID nicht leer ist, und auch im AddonStorage vorhanden ist!
		if (!basic_helper.empty(script_id_given) && basic_helper.isset(addon_storage.storage[script_id_given])) { // Alles in Ordnung

			// Falls der Val_store noch nicht existieren sollte, lege ihn initial an!
			if (!basic_helper.isset(addon_storage.storage[script_id_given].val_store)) {
				addon_storage.storage[script_id_given].val_store = {};
			}

			// Alles okay, jetzt dürfen die Funkionen ausgeführt werden!
			return {
				GM_getValue: function (name, default_value) {
					name = name + ""; // sicherstellen dass es ein String ist!
					// hole den Wert, wenn nicht, liefere den default wert zurück
					if (basic_helper.isset(addon_storage.storage[script_id_given].val_store[name])) {
						return addon_storage.storage[script_id_given].val_store[name];
					} else {
						return default_value;
					}
				},
				GM_setValue: function (name, value) {
					name = name + ""; // sicherstellen dass es ein String ist!
					value = value + ""; // sicherstellen dass es ein String ist!

					// Schreibe den Wert in den Val_store!
					addon_storage.storage[script_id_given].val_store[name] = value;

				},
				GM_deleteValue: function (name) {
					name = name + ""; // sicherstellen dass es ein String ist!
					// Lösche den Wert aus dem Val_store!
					delete addon_storage.storage[script_id_given].val_store[name];
				},
				GM_listValues: function () {
					var result = [];
					for (var index in addon_storage.storage[script_id_given].val_store) {
						// Key => value ...
						result.push({key: index,
							value: addon_storage.storage[script_id_given].val_store[index]});
					}
					return result;
				}
			};
		} else {
			// Keine Script ID, so kann es nicht weitergehen
			return false;
		}
	}

};


// nötig damit es auch im Content Script verwendet werden kann!!!
if (typeof exports != "undefined") {
	exports.greasemonkey_functions = greasemonkey_functions;
}