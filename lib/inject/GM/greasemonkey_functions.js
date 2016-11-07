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
	init: function (userscript_id, worker_object) {
		var userscript_handle = userscript_storage.getById(userscript_id);
		
		// Prüfe ob die ID nicht leer ist, und auch im AddonStorage vorhanden ist!
		if (!basic_helper.empty(userscript_id) && (userscript_handle !== false)) { // Alles in Ordnung
			
			// Falls der Val_store noch nicht existieren sollte, lege ihn initial an!
			if (!basic_helper.isset(userscript_handle.getValStore())) {
				// entfernen aller zuvor gesetzten Variablen
				userscript_handle.resetValStore().save();
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
				},
                GM_openInTab: function (url, open_in_background) {
                    var url_c = require("sdk/url");
                    // Prüft ob value_pair.url wirklich valide ist!
                    if (url_c.isValidURI(url) === true) {

                        // Prüf-Variable damit es nicht zu einer "unendlichen" Rekursion kommt
                        var not_wildcard_pagemod = true,
                            includes = userscript_handle.getSettings()["include"];
                        for (var i in includes) {
                            if (includes[i] === "*") {
                                // Wildcard Eintrag gefunden, open in Tab ist nicht möglich!
                                not_wildcard_pagemod = false;
                            }
                        }
                        // im neuen Tab öffnen, aber nur wenn das Userscript nicht für Wildcard Aufrufe genutzt wird!!!!
                        if (not_wildcard_pagemod === true) {
                            try {
                                if (open_in_background === "true" || open_in_background === true) {
                                    open_in_background = true;
                                } else {
                                    open_in_background = false;
                                }
                                // neuen Tab öffnen
                                require("sdk/tabs").open({url: url, inBackground: open_in_background});

                            } catch (ex) {
                                worker_object.port.emit("GM-FRONTEND-ERROR",
                                    {
                                        func: "GM_openInTab",
                                        reason: "Unknown Error",
                                        object: {Exception: ex, GivenValues: {url: url, inBackground: open_in_background}}
                                    });
                            }
                        }

                    } else {
                        // Schicke den Fehler zurück zum Aufrufenden Skript
                        worker_object.port.emit("GM-FRONTEND-ERROR",
                            {
                                func: "GM_openInTab",
                                reason: "url is not valid!",
                                object: {url: url, inBackground: open_in_background}
                            });
                    }
                },
                GM_registerMenuCommand: function (caption, commandFunc, last_menuCommands) {
                    // als JSON lässt es sich natürlich nicht simpel vergleichen, daher die Umwandlung in einen String
                    var stringified_data = JSON.stringify({caption: caption, commandFunction: commandFunc});

                    // Prüfe ob data nicht schon bereits gesetzt wurde!
                    // Schutz Abfrage, falls das Kommando auf mehreren Seiten greifen würde (zu lockere Inlcude/Match Anweisung)
                    if (last_menuCommands.indexOf(stringified_data) === -1) {
                        var utils = require('sdk/window/utils'),
                            recentWindow = utils.getMostRecentBrowserWindow(),
                            /**
                             * WICHTIGER Workaround, nur so kann eine Funktion vom Frontend ans Backend übergeben und ausgeführt werden!
                             */
                            // Funktions-String zurück in eine Funktion wandeln...
                            commandFunction = new Function("return " + commandFunc + "();");

                        // nur bei Fennec
                        if (typeof recentWindow.NativeWindow !== "undefined") {
                            recentWindow.NativeWindow.menu.add({
                                name: caption,
                                icon: {
                                    "16": "./icon/usi.png"
                                },
                                callback: commandFunction
                            });
                        } else { // Nur im Desktop
                            // Desktop Variante mit Action Button
                            require('sdk/ui/button/action').ActionButton({
                                id: "usi-menu-" + last_menuCommands.length,
                                label: caption,
                                icon: {
                                    "16": "./icon/usi.png"
                                },
                                onClick: commandFunction
                            });
                        }

                        // setze es in das Array wo die MenuCommands gesammelt werden
                        return stringified_data;
                    }
                },
                GM_setClipboard : function (text){
                    try {
                        var clipboard = require("sdk/clipboard");

                        // Android - Fennec unterstützt dies wohl bisher nicht ...
                        if (typeof clipboard.set === "function") {
                            // falls es kein String ist, versuche es umzuwandeln
                            if (typeof text !== "string" && typeof text.toString === "function") {
                                text = text.toString();
                            }
                            // setze es nur in die Zwischenablage wenn es wirklich ein String ist...
                            if (typeof text === "string") {
                                clipboard.set(text);
                            }
                        }
                        // nichts...
                    } catch (ex) {
                    }
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