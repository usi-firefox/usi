"use strict";

function userscript_config_class (){
	
	// 4 Buttons --- Zusätzlich wird jedoch noch das Event "USI-BACKEND:highlightjs-style" behandelt
	var initial_requests_done = 4;
	
	// init
	var private_functions = {
	
		before_rendering : function(){
		}

		/**
		 * Registriert einen Button für sein Backend Event
		 */
		, init_button_with_data : function (event_name, id){
			backend_events_controller.api.on(event_name, function(state){
				jQuery("#" + id).prop("checked", state);
				private_functions.__change_switch_option(id);
				jQuery(document).trigger("all-intial-requests-done", --initial_requests_done);
			});
		}
		
		,after_rendering : function(){
			
			// Setze die gesetzen Einstellungen für die Buttons --- START
			private_functions.init_button_with_data("USI-BACKEND:options_always_activate_greasemonkey", "usi-config-change-options-always-activate-greasemonkey");
			private_functions.init_button_with_data("USI-BACKEND:ExternalScriptLoadQuestion", "usi-config-change-enable-external-script-load-question");
			private_functions.init_button_with_data("USI-BACKEND:OldUsiIncludeBehavior", "usi-config-change-old-usi-include-behavior");
			private_functions.init_button_with_data("USI-BACKEND:highlightjs-activation-state", "usi-config-change-options-activate-highlightjs");

			// liefere alle Daten für die States
			backend_events_controller.api.emit("USI-BACKEND:get-all-changeable-states");

			private_functions.__change_switch_option("usi-config-change-complete-export");
			
			// Setze die gesetzen Einstellungen für die Buttons --- END
			
			
			// Zusätzliche Events registrieren --- START
			/** 
			 * Erzeugt ein Download Fenster für den Fertigen Export
			 */
			backend_events_controller.api.on("USI-BACKEND:get-all-userscripts-for-export-done", function (result_export_data) {
				if (jQuery("#usi-config-change-complete-export").prop("checked") === true) {
					createDownload(result_export_data, "text/plain", "usi-export.usi.json");
				} else {
					createDownload(result_export_data, "application/octet-stream", "usi-export.usi.js");
				}
			});

			// Hört darauf ob Aktualisierungen für die Skripte zur Verfügung stehen ...
			backend_events_controller.api.on("USI-BACKEND:update-for-userscript-available", function (userscript_infos) {
				if (window.confirm(language_controller.get("userscript_update_was_found_1") + userscript_infos.id + language_controller.get("userscript_update_was_found_2"))) {
					// Nun das Skript aktualisieren!
					backend_events_controller.api.emit("USI-BACKEND:override-same-userscript", userscript_infos);

					backend_events_controller.api.emit("USI-BACKEND:request-for---list-all-scripts");
				}
			});

			// Wenn das Skript gelöscht wurde
			backend_events_controller.api.on("USI-BACKEND:delete-script-is-now-deleted", function (script_was_deleted) {
				if (script_was_deleted === true) { // script wurde erfolgreich gelöscht
					window.alert(language_controller.get("userscript_was_successful_deleted"));
				} else { // script konnte nicht gelöscht werden
					window.alert(language_controller.get("userscript_could_not_deleted"));
				}
			});

			// Zusätzliche Events registrieren --- END
			
			
			// Button Events --- START
			event_manager_controller.register_once("#usi-config-delete-all", "click", private_functions.deleteAll );
			event_manager_controller.register_once("#usi-config-check-for-updates", "click", private_functions.checkForUpdates );
			event_manager_controller.register_once("#usi-config-export-all", "click", private_functions.exportAll );
			
			// Sobald der Counter auf 0 steht, 
			jQuery(document).on("all-intial-requests-done", function(evt, counter){

				if(counter === 0){

					// Switch Events behandeln
					event_manager_controller.register_once("#usi-config-change-old-usi-include-behavior", "change", function(event){
//						private_functions.__change_switch_option(event.target.id);
						backend_events_controller.api.emit("USI-BACKEND:OldUsiIncludeBehavior-change", jQuery("#" + event.target.id).prop("checked"));
					});
					event_manager_controller.register_once("#usi-config-change-enable-external-script-load-question", "change", function(event){
//						private_functions.__change_switch_option(event.target.id);
						backend_events_controller.api.emit("USI-BACKEND:ExternalScriptLoadQuestion-change",  jQuery("#" + event.target.id).prop("checked"));
					});
					event_manager_controller.register_once("#usi-config-change-options-activate-highlightjs", "change", function(event){
						// ändert den Aktivierungs Status
//						private_functions.__change_switch_option(event.target.id);
						backend_events_controller.api.emit("USI-BACKEND:highlightjs-activation-state-change",  jQuery("#" + event.target.id).prop("checked"));
					});
					event_manager_controller.register_once("#usi-config-change-options-always-activate-greasemonkey", "change", function(event){
						// Aktiviert Greasemonkey Funktionen immer, egal ob @use-greasemonkey gesetzt wurde oder nicht
//						private_functions.__change_switch_option(event.target.id);
						backend_events_controller.api.emit("USI-BACKEND:options_always_activate_greasemonkey-change",  jQuery("#" + event.target.id).prop("checked"));
					});
				}
								
			});
			// Button Events --- END
			
			
		}
		
		, __change_switch_option : function(id){
			id = "#" + id; // für jQuery
			
			var off_text = jQuery(id + "---false").text();
			var on_text = jQuery(id + "---true").text();
			
			// init bootstrap toggle
			bootstrap_toggle_controller.initButton(id, on_text, off_text);

			// Text ausblenden
			jQuery(id + "---false").hide();
			jQuery(id + "---true").hide();
			
		}
			
		/**
		 * Alle Userscripte entfernen
		 * @returns {undefined}
		 */
		,deleteAll : function () {
			// Doppelte Sicherheitsabfrage, bevor wirklich alles gelöscht wird!
			if (window.confirm(language_controller.get("really_reset_all_settings"))) {
				if (window.confirm(language_controller.get("really_really_reset_all_settings"))) {
					backend_events_controller.api.emit("USI-BACKEND:delete-everything");
					backend_events_controller.api.emit("USI-BACKEND:request-for---list-all-scripts");
				}
			}
		}
		
		// Prüfe ob für die Skripte Updates gefunden wurden!
		,checkForUpdates : function () {
			backend_events_controller.api.emit("USI-BACKEND:check-for-userscript-updates");
		}
		
		
		// exportiere die Skripte
		,exportAll : function () {
			if (jQuery("#usi-config-change-complete-export").prop("checked") === true) {
				backend_events_controller.api.emit("USI-BACKEND:get-all-userscripts-for-export", "TRUE");
			} else {
				backend_events_controller.api.emit("USI-BACKEND:get-all-userscripts-for-export", "FALSE");
			}

		}
		
	};
	
	// gib einfach alles zurück
	return private_functions;
	
};

var userscript_config_controller = userscript_config_class();