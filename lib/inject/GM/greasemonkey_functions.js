"use strict"; // Strict Mode aktivieren!
/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
/* global require,exports */

// nutze den basic_helper, oder lade den basic_helper nach mittels require()!
var basic_helper = basic_helper || require("data/helper/basic_helper").basic_helper,
// Userscript Storage laden
userscript_storage = userscript_storage || require("lib/storage/userscript").userscript_storage;

var greasemonkey_functions = {
	// setze die ID vom Userscript, damit es nur darauf Einfluss haben kann!
	init: function (userscript_id) {
		var userscript_handle = userscript_storage.getById(userscript_id);
		
		// Prüfe ob die ID nicht leer ist, und auch im AddonStorage vorhanden ist!
		if (!basic_helper.empty(userscript_id) && (userscript_handle !== false)) { // Alles in Ordnung
			
			// Falls der Val_store noch nicht existieren sollte, lege ihn initial an!
			if (!basic_helper.isset(userscript_handle.getValStore())) {
				// entfernen aller zuvor gesetzten Variablen
				userscript_handle.changeValues("val_store", {}).save();
			}

			// Alles okay, jetzt dürfen die Funkionen ausgeführt werden!
			return {
				GM_getValue: function (name, default_value) {
					name = name + ""; // sicherstellen dass es ein String ist!
					// hole den Wert, wenn nicht, liefere den default wert zurück
					if (basic_helper.isset(userscript_handle.getValStore(name))) {
						return userscript_handle.getValStore(name);
					} else {
						return default_value;
					}
				},
				GM_setValue: function (name, value) {
					name = name + ""; // sicherstellen dass es ein String ist!

					// Schreibe den Wert in den Val_store!
					userscript_handle.setValStore(name, value);
				},
				GM_deleteValue: function (name) {
					name = name + ""; // sicherstellen dass es ein String ist!
					// Lösche den Wert aus dem Val_store!
					userscript_handle.deleteInValStore(name);
				},
				GM_listValues: function () {
					var result = [], completeValStore = userscript_handle.getValStore();
					for (var name in completeValStore) {
						// Key => value ...
						result.push({
										key: name,
										value: completeValStore[name]
									});
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
if (typeof exports !== "undefined") {
	exports.greasemonkey_functions = greasemonkey_functions;
}