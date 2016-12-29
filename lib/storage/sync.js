"use strict";

var preferences = require("sdk/simple-prefs"),
		// b -> shortcut für basic_helper
		b = require("data/helper/basic_helper").basic_helper,
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
		 * @param {boolean} with_auth true -> setzt automatisch die user_id und den auth_key, sowie falls vorhanden den device_key und die device_id
		 * @param {object} request_content enthält zusätzliche Werte die dem Request mitgegeben werden sollen
		 * @param {function} success_callback wird aufgerufen (status < 400), sobald der Request durchlaufen wurde
		 * @param {function} error_callback wird aufgerufen (status > 400), sobald der Request durchlaufen wurde
		 */
		, __doServerRequest: function (url_suffix, method, with_auth, request_content, success_callback, error_callback) {
			// check 
			if (!b.is_string(url_suffix)) {
				return false;
			}

			// Vars initialisieren
			var server_url = self.data.getServerUrlWithSuffix(),
					request_object, request_data;

			// check
			if (!b.is_string(server_url)) {
				return false;
			}

			// darf nur ein Object sein, ansonsten wird es als Object überschrieben
			if (b.is_null(request_content) || !b.isset(request_content)) {
				request_content = {};
			}

			// setze die Standard USER Authentifizierung
			if (with_auth === true) {
				request_content.user_id = self.data.getUserId();
				request_content.auth_key = self.data.getAuthKey();

				if (b.isset(self.data.getDeviceId())) {
					request_content.device_id = self.data.getDeviceId();
				}
				if (b.isset(self.data.getDeviceKey())) {
					request_content.device_key = self.data.getDeviceKey();
				}

			}

			// Vorbereitung des Übergabe Objekts
			request_data = {
				url: server_url + url_suffix,
				contentType: "application/x-www-form-urlencoded;charset=UTF-8",
				content: request_content,
				onComplete: function (response) {
					if (response.status >= 400 && b.is_func(error_callback)) {
						return error_callback(response);
					} else {
						// Falls response.json kein Objekt sein sollte ...
						if (!b.is_obj(response.json) && b.is_func(error_callback)) {
							return error_callback(response);
						}

						// Es sollte alles in Ordnung sein
						if (b.is_func(success_callback)) {
							return success_callback(response);
						}
					}

					return true;
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
		 * Methoden für die Server Requests
		 */
		, request: {
			device: {
				/**
				 * Erstellt ein neues Gerät auf dem Server
				 */
				"create": function (success_callback, error_callback) {
					return self.__doServerRequest("user/device", "post", true, null, function (response) {
						if (response.status === 201) {
							if (!b.is_string(response.json.message) || !b.is_number(response.json.data.device_id) || !b.is_string(response.json.data.device_key)) {
								// FEHLER
								return error_callback(response);
							}
							// Device wurde erstellt
							self.data.setDeviceId(response.json.data.device_id);
							self.data.setDeviceKey(response.json.data.device_key);

							return success_callback(response);
						} else {
							return error_callback(response);
						}
					}, error_callback);
				}
				/**
				 * Gerät löschen
				 */
				, "delete": function (success_callback, error_callback) {
					return self.__doServerRequest("user/device", "delete", true, null, function (response) {
						if (response.status === 200) {
							// Gerät löschen
							self.data.setDeviceId("");
							self.data.getDeviceKey("");

							return success_callback(response);
						} else {
							return error_callback(response);
						}
					}, error_callback);
				}
				/**
				 * Geräte des Benutzers holen
				 */
				, "getAll": function (success_callback, error_callback) {
					return self.__doServerRequest("user/devices", "get", true, null, function (response) {
						if (response.status === 200) {
							// Alle Geräte des Benutzers erhalten
							return success_callback(response);
						} else {
							return error_callback(response);
						}
					}, error_callback);
				}
				/**
				 * Liefert alle Userscripte die zuletzt von diesem Gerät verändert worden
				 */
				, "lastupdated": function (success_callback, error_callback) {
					return self.__doServerRequest("user/device/userscripts", "get", true, null, function (response) {
						if (response.status === 200) {
							// Alle Geräte des Benutzers erhalten
							return success_callback(response);
						} else {
							return error_callback(response);
						}
					}, error_callback);
				}
			}
			, log: {
				/**
				 * Log Nachrichten vom Server holen
				 */
				"get": function (success_callback, error_callback) {
					return self.__doServerRequest("user/log", "get", true, null, function (response) {
						if (response.status === 200) {
							// Log Daten erhalten 
							return success_callback(response);
						} else {
							return error_callback(response);
						}
					}, error_callback);
				}
			}
			, user: {
				/**
				 * Erstellt auf dem Sync Server einen neuen Benutzer
				 */
				"create": function (username, success_callback, error_callback) {
					var request_content;
					// Optional ist die Angabe eines Benutzer Namens möglich
					if (b.is_string(username)) {
						request_content.username = username;
					} else {
						request_content = null;
					}

					return self.__doServerRequest("user", "post", false, request_content, function (response) {
						if (response.status === 201) {
							if (!b.is_obj(response.json.data) || !b.is_number(response.json.data.user_id) || !b.is_string(response.json.data.auth_key)) {
								// FEHLER, da Pflichtangaben
								return error_callback(response);
							}

							// User wurde erstellt
							self.data.setUserId(response.json.data.user_id);
							self.data.setAuthKey(response.json.data.auth_key);

							if (b.is_string(response.json.data.username)) {
								// optional
								self.data.setUsername(response.json.data.username);
							}

							// Response JSON Objekt übergeben
							return success_callback(response);

						} else {
							// Fehler aufgetreten
							return error_callback(response);
						}
					}, error_callback);
				}

				/**
				 * Benutzer löschen
				 */
				, "delete": function (success_callback, error_callback) {
					return self.__doServerRequest("user", "delete", true, null, function (response) {
						if (response.status === 200) {
							// User wurde gelöscht
							return success_callback(response);
						} else {
							return error_callback(response);
						}
					}, error_callback);
				}
				/**
				 * Testet ob ein Benutzer Authentifiziert ist (testAccess)
				 */
				, "test": function (success_callback, error_callback) {
					return self.__doServerRequest("user/test", "get", true, null, function (response) {
						if (response.status === 200) {
							if (!b.is_string(response.json.message) || response.json.message !== "OK") {
								// FEHLER
								return error_callback(response);
							}
							// User hat Zugang
							return success_callback(response);
						} else {
							return error_callback(response);
						}
					}, error_callback);
				}
			}
			, userscript: {
				/**
				 * alle Userscripte vom Server holen
				 */
				"getAll": function (success_callback, error_callback) {
					return self.__doServerRequest("user/userscripts", "get", true, null, function (response) {
						if (response.status === 200) {
							// alle Userscripte des Benutzers wurden geholt
							return success_callback(response);
						} else {
							return error_callback(response);
						}
					}, error_callback);
				}
				/**
				 * ein Userscript vom Server holen
				 */
				, "get": function (userscript_id, success_callback, error_callback) {
					return self.__doServerRequest("user/userscript", "get", true, {"userscript_id": userscript_id}, function (response) {
						if (response.status === 200) {
							// Userscript wurde geholt
							return success_callback(response);
						} else {
							return error_callback(response);
						}
					}, error_callback);
				}
				/**
				 * Userscript auf dem Server aktualisieren
				 */
				, "update": function (userscript, success_callback, error_callback) {
					return self.__doServerRequest("user/userscript", "put", true, userscript, function (response) {
						if (response.status === 200) {
							// Userscript wurde aktualisiert
							return success_callback(response);
						} else {
							return error_callback(response);
						}
					}, error_callback);
				}
				/**
				 * Userscript auf dem Server entfernen
				 */
				, "delete": function (userscript, success_callback, error_callback) {
					return self.__doServerRequest("user/userscript", "delete", true, userscript, function (response) {
						if (response.status === 200) {
							// Userscript wurde aktualisiert
							return success_callback(response);
						} else {
							return error_callback(response);
						}
					}, error_callback);
				}
				/**
				 * Neues Userscript auf dem Server erstellen
				 */
				, "create": function (userscript, success_callback, error_callback) {
					return self.__doServerRequest("user/userscript", "post", true, userscript, function (response) {
						if (response.status === 201) {
							// Userscript wurde erstellt, Rückgabe der Userscript ID
							return success_callback(response);
						} else {
							return error_callback(response);
						}
					}, error_callback);
				}
				/**
				 * Veränderte Userscripte 
				 */
				, "changedsince": function (last_change, success_callback, error_callback) {
					return self.__doServerRequest("user/userscript/changedsince", "get", true, {"last_change" : last_change}, function (response) {
						if (response.status === 200) {
							// Userscript wurde erstellt, Rückgabe der Userscript ID
							return success_callback(response);
						} else {
							return error_callback(response);
						}
					}, error_callback);
				}
			}
		}
	};

	return self;
}());

if (typeof exports !== "undefined") {
	exports.sync_handler = sync_handler;
}