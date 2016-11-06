"use strict";

/* global language_controller, self, lang, download_controller */

var backend_events_controller = (function backend_events_class() {

	if (typeof self.port !== "undefined") {

		// Abstraktions Möglichkeit
		var api = self.port;

		return {
			// erlaubt einen direkten Zugriff auf die API
			api : api
			
			// Registiert die globalen Events
			,register_global_events: function () {

				api.on("USI-BACKEND:get-alert", function (text) {
					window.alert(text);
				});

				/**
				 * Wenn das Userscript schon existiert und überschrieben werden kann
				 */
				api.on("USI-BACKEND:same-userscript-was-found",
					/**
					 * 
					 * @param {object} userscript_infos
					 * @returns {void}
					 */
					function (userscript_infos) {

						//wurde gefunden, möchtest du es aktualisieren?")){
						if (window.confirm(lang["same_userscript_was_found_ask_update_it_1"] + userscript_infos.id + lang["same_userscript_was_found_ask_update_it_2"])) {
							// Dieses Skript wird nun aktualisiert! userscript_infos = {id : id , userscript: userscript}
							api.emit("USI-BACKEND:override-same-userscript", userscript_infos);
							api.emit("USI-BACKEND:request-for---list-all-scripts");
						}
					});
	
				// Bietet das Userscript zur lokalen Speicherung an!
				api.on("USI-BACKEND:export-userscript-done", function (result) {
					download_controller.download(result.userscript, "text/plain", encodeURI(result.filename + ".user.js"));
				});
	
                // Event Weiterleitung vom Backend
				api.on("USI-BACKEND:To-Frontend-Document-Event-Forwarder", function (data) {
                    jQuery(document).trigger(data.event_name, [data.action, data.param1]);
				});
	
			}

		};

	} else {
		return false;
	}

}());