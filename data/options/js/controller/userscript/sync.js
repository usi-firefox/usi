"use strict";

/* global event_manager_controller, backend_events_controller */

var userscript_sync_controller = (function userscript_sync_class () {

	// init
	var private_functions = {

		data_fields_prefix: "#usi---sync-server-"

		, data_fields: [
			"url"
			, "user"
			, "pass"
		]

		, testLogin: function () {
			var pre = private_functions.data_fields_prefix;

			var url = jQuery(pre + "url").val(),
				user = jQuery(pre + "user").val(),
				pass = jQuery(pre + "pass").val();

			// Teste den Benutzer Login
			backend_events_controller.api.emit("USI-BACKEND:sync-test-login", {url: url, user: user, pass: pass});
		}

		, createNewAccount: function () {
			var pre = private_functions.data_fields_prefix;

			var url = jQuery(pre + "url").val(),
				user = jQuery(pre + "user").val(),
				pass = jQuery(pre + "pass").val();

			// Teste den Benutzer Login
			backend_events_controller.api.emit("USI-BACKEND:sync-create-new-account", {url: url, user: user, pass: pass});
		}
		
		, checkForUpdates: function () {
			// Teste den Benutzer Login
			backend_events_controller.api.emit("USI-BACKEND:sync-check-for-updates");
		}
		
		,__logMessage: function(message){
			// Ausgabe der Server Antwort, dem Log hinzufügen
			jQuery("#sync-messages-log")
				.prepend(
					jQuery("<div>").text(message)
				);
		}
	};

	return {
		before_rendering: function () {

		}
		, after_rendering: function () {

			event_manager_controller.register_once("#usi---sync-server---test-login", "click", private_functions.testLogin);

			event_manager_controller.register_once("#usi---sync-server---create-new-account", "click", private_functions.createNewAccount);

			event_manager_controller.register_once("#usi---sync-server---check-for-updates", "click", private_functions.checkForUpdates);

			
			backend_events_controller.api.on("USI-BACKEND:sync-test-login-done", function(result){
				// Log schreiben
				private_functions.__logMessage("Status: " + result.status + ", Nachricht: " + result.text);
			});
		}

		,callback_on_complete: function(){
			var user = false;
			
			// schalte die Ansichten um
			if(user.isRegistered === true){
				jQuery("#sync-not-logged-in").addClass("hidden");
				jQuery("#sync-logged-in").removeClass("hidden");
				
			}else{
				// aktuell nicht registriert
				jQuery("#sync-not-logged-in").removeClass("hidden");
				jQuery("#sync-logged-in").addClass("hidden");
				
			}
			
		}
	};


}());