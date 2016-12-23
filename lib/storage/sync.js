"use strict";

var preferences = require("sdk/simple-prefs"),
		request = require("sdk/request").Request;

// Managed den gesamten Sync
var sync_handler = (function sync_handler() {
	var self = {
		data: {
			getServerURLApiVersion: function () {
				return "sync/api/v1/";
			}
			, getServerUrl: function () {
				return preferences.prefs.sync_server_url;
			}
			, getServerUrlWithSuffix: function () {
				// Prüfe ob das letzte Zeichen ein / ist
				if (/\/$/.test(preferences.prefs.sync_server_url) === true) {
					return preferences.prefs.sync_server_url + self.data.getServerURLApiVersion();
				} else {
					return preferences.prefs.sync_server_url + "/" + self.data.getServerURLApiVersion();
				}
			}
			, getUsername: function () {
				return preferences.prefs.sync_username;
			}
			, getUserId: function () {
				return preferences.prefs.sync_user_id;
			}
			, getAuthKey: function () {
				return preferences.prefs.sync_auth_key;
			}
			, getDeviceId: function () {
				return preferences.prefs.sync_device_id;
			}
			, getDeviceKey: function () {
				return preferences.prefs.sync_device_key;
			}
			, setServerUrl: function (url) {
				preferences.prefs.sync_server_url = url;
				return self.data;
			}
			, setUsername: function (username) {
				preferences.prefs.sync_username = username;
				return self.data;
			}
			, setUserId: function (user_id) {
				preferences.prefs.sync_user_id = user_id;
				return self.data;
			}
			, setAuthKey: function (auth_key) {
				preferences.prefs.sync_auth_key = auth_key;
				return self.data;
			}
			, setDeviceId: function (device_id) {
				preferences.prefs.sync_device_id = device_id;
				return self.data;
			}
			, setDeviceKey: function (device_key) {
				preferences.prefs.sync_device_key = device_key;
				return self.data;
			}
		}
		, setServerUrl: function (url) {
			// Wrapper Funktion!
			return self.data.setServerUrl(url);
		}

		/**
		 * generalisierte Funktion für die Server Abfragen
		 * 
		 * @param {string} url_suffix Beispiel -> "user/test"
		 * @param {string} method post|get|head|delete|put
		 * @param {boolean} with_user_auth true -> setzt automatisch die user_id und den auth_key
		 * @param {object} request_content enthält zusätzliche Werte die dem Request mitgegeben werden sollen
		 * @param {function} success_callback wird aufgerufen (status < 400), sobald der Request durchlaufen wurde
		 * @param {function} error_callback wird aufgerufen (status > 400), sobald der Request durchlaufen wurde
		 */
		, __doServerRequest: function (url_suffix, method, with_user_auth, request_content, success_callback, error_callback) {
			// check 
			if (typeof url_suffix !== "string") {
				return false;
			}
			// check
			if (typeof success_callback !== "function" || typeof error_callback !== "function") {
				// Callback's müssen Funktionen sein
				return false;
			}

			// Vars initialisieren
			var server_url = self.data.getServerUrlWithSuffix(),
					request_object, request_data;

			// check
			if (typeof server_url !== "string") {
				return false;
			}

			// darf nur ein Object sein, ansonsten wird es als Object überschrieben
			if (typeof request_content !== "object") {
				request_content = {};
			}

			// setze die Standard USER Authentifizierung
			if (with_user_auth === true) {
				request_content.user_id = self.data.getUserId();
				request_content.auth_key = self.data.getAuthKey();
			}

			// Vorbereitung des Übergabe Objekts
			request_data = {
				url: server_url + url_suffix,
				contentType: "application/json",
				content: request_content,
				onComplete: function (response) {
					if (response.status >= 400) {
						return error_callback(response);
					} else {
						// Falls response.json kein Objekt sein sollte ...
						if (typeof response.json !== "object") {
							return error_callback(response);
						}

						// Es sollte alles in Ordnung sein
						return success_callback(response);
					}
				}
			};

			// erlaubte Methoden
			switch (method) {
				case "post":
					return request(request_data).post();
				case "get":
					return request(request_data).get();
				case "put":
					return request(request_data).put();
				case "delete":
					return request(request_data).delete();
				case "head":
					return request(request_data).head();
				default:
					// Fehler, Method muss angegeben werden
					return false;
			}

		}

		/**
		 * ein Userscript vom Server holen
		 */
		, getAllUserscripts: function (success_callback, error_callback) {
			return self.__doServerRequest("user/userscripts", "get", true, null, function (success_response) {
				if (response.status === 200) {
					// alle Userscripte des Benutzers wurden geholt
					return success_callback(response.json);
				} else {
					return error_callback(response);
				}
			}, error_callback);
		}
		/**
		 * ein Userscript vom Server holen
		 */
		, getUserscript: function (userscript_id, success_callback, error_callback) {
			return self.__doServerRequest("user/userscript", "get", true, {"userscript_id": userscript_id}, function (success_response) {
				if (response.status === 200) {
					// Userscript wurde geholt
					return success_callback(response.json);
				} else {
					return error_callback(response);
				}
			}, error_callback);
		}
		/**
		 * Userscript auf dem Server aktualisieren
		 */
		, updateUserscript: function (userscript, success_callback, error_callback) {
			return self.__doServerRequest("user/userscript", "put", true, userscript, function (success_response) {
				if (response.status === 200) {
					// Userscript wurde aktualisiert
					return success_callback(response.json);
				} else {
					return error_callback(response);
				}
			}, error_callback);
		}
		/**
		 * Neues Userscript auf dem Server erstellen
		 */
		, postNewUserscript: function (userscript, success_callback, error_callback) {
			return self.__doServerRequest("user/userscript", "post", true, userscript, function (success_response) {
				if (response.status === 201) {
					// Userscript wurde erstellt, Rückgabe der Userscript ID
					return success_callback(response.json.data.userscript_id);
				} else {
					return error_callback(response);
				}
			}, error_callback);
		}
		/**
		 * Log Nachrichten vom Server holen
		 */
		, getLogFromServer: function (success_callback, error_callback) {
			return self.__doServerRequest("user/log", "get", true, null, function (success_response) {
				if (response.status === 200) {
					// Log Daten erhalten 
					return success_callback(response.json.data);
				} else {
					return error_callback(response);
				}
			}, error_callback);
		}
		/**
		 * Geräte des Benutzers holen
		 */
		, getDevices: function (success_callback, error_callback) {
			return self.__doServerRequest("user/devices", "get", true, null, function (success_response) {
				if (response.status === 200) {
					// Alle Geräte des Benutzers erhalten
					return success_callback(response);
				} else {
					return error_callback(response);
				}
			}, error_callback);
		}
		/**
		 * Erstellt ein neues Gerät auf dem Server
		 */
		, createDevice: function (success_callback, error_callback) {
			return self.__doServerRequest("user/device", "post", true, null, function (success_response) {
				if (response.status === 201) {
					if (typeof response.json.message !== "string" || typeof response.json.data.device_id !== "number" || typeof response.json.data.device_key !== "string") {
						// FEHLER
						return error_callback(response);
					}

					// Device wurde erstellt
					self.data.setDeviceId(response.json.data.device_id);
					self.data.getDeviceKey(response.json.data.device_key);

					return success_callback(response.json);
				} else {
					return error_callback(response);
				}
			}, error_callback);
		}
		/**
		 * Testet ob ein Benutzer Authentifiziert ist
		 */
		, testAccess: function (success_callback, error_callback) {
			return self.__doServerRequest("user/test", "get", true, null, function (success_response) {
				if (response.status === 200) {
					if (typeof response.json.message !== "string" || response.json.message !== "OK") {
						// FEHLER
						return error_callback(response);
					}
					// User hat Zugang
					return success_callback(response.json);
				} else {
					return error_callback(response);
				}
			}, error_callback);
		}
		/**
		 * Benutzer löschen
		 */
		, deleteUser: function (success_callback, error_callback) {
			return self.__doServerRequest("user", "delete", true, null, function (success_response) {
				if (response.status === 200) {
					// User wurde gelöscht
					return success_callback(response.json);
				} else {
					return error_callback(response);
				}
			}, error_callback);
		}
		/**
		 * Erstellt auf dem Sync Server einen neuen Benutzer
		 */
		, createUser: function (username, success_callback, error_callback) {
			var request_content;
			if (typeof username === "string") {
				request_content.username = username;
			} else {
				request_content = null;
			}

			return self.__doServerRequest("user", "post", false, request_content, function (success_response) {
				if (response.status === 201) {
					if (typeof response.json.data !== "object" || typeof response.json.data.user_id !== "number" || typeof response.json.data.auth_key !== "string") {
						// FEHLER, da Pflichtangaben
						return error_callback(response);
					}

					// User wurde erstellt
					self.data.setUserId(response.json.data.user_id);
					self.data.setAuthKey(response.json.data.auth_key);

					if (typeof response.json.data.username === "string") {
						// optional
						self.data.setUsername(response.json.data.username);
					}

					// Response JSON Objekt übergeben
					return success_callback(response.json);

				} else {
					// Fehler aufgetreten
					console.error("User konnte nicht erstellt werden ->");
					return error_callback(response);
				}
			}, error_callback);
		}
	};

	return self;
}());

if (typeof exports !== "undefined") {
	exports.sync_handler = sync_handler;
}