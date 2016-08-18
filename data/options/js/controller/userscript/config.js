"use strict";

function userscript_config_class (){
	
	// 4 Buttons --- Zusätzlich wird jedoch noch das Event "USI-BACKEND:highlightjs-style" behandelt
	var initial_requests_done = 5;
	
	// init
	return {
	
		before_rendering : function(){
		}

			/**
			 * Registriert einen Button für sein Backend Event
			 * 
			 * @param string event_name
			 * @param string id
			 * @returns void
			 */
		, init_button_with_data : function (event_name, id){
			var __change_switch_option = this.__change_switch_option;
			
			self.port.on(event_name, function(state){
				jQuery("#" + id).prop("checked", state);
				__change_switch_option(id);
				jQuery(document).trigger("all-intial-requests-done", --initial_requests_done);
			});
		}
		
		,after_rendering : function(){
			
			var __change_switch_option = this.__change_switch_option;
			
			// Verstecke zunächst alle Labels
			// registriere alle Events für die States
			self.port.emit("USI-BACKEND:register-all-change-states");

			// Setze die gesetzen Einstellungen für die Buttons --- START
			this.init_button_with_data("USI-BACKEND:options_always_activate_greasemonkey", "usi-config-change-options-always-activate-greasemonkey");
			this.init_button_with_data("USI-BACKEND:ExternalScriptLoadQuestion", "usi-config-change-enable-external-script-load-question");
			this.init_button_with_data("USI-BACKEND:OldUsiIncludeBehavior", "usi-config-change-old-usi-include-behavior");
			this.init_button_with_data("USI-BACKEND:highlightjs-activation-state", "usi-config-change-options-activate-highlightjs");

			// Legt den Style fest
			self.port.on("USI-BACKEND:highlightjs-style", function(style){
				highlightjs_controller.set_active_style(style);
				jQuery(document).trigger("all-intial-requests-done", --initial_requests_done);
			});

			jQuery("#usi-config-change-complete-export---true").hide();
			
			// Setze die gesetzen Einstellungen für die Buttons --- END
			
			
			// Zusätzliche Events registrieren --- START
			/** 
			 * Erzeugt ein Download Fenster für den Fertigen Export
			 */
			self.port.on("USI-BACKEND:get-all-userscripts-for-export-done", function (result_export_data) {
				if (jQuery("#usi-config-change-complete-export").prop("checked") === true) {
					createDownload(result_export_data, "text/plain", "usi-export.usi.json");
				} else {
					createDownload(result_export_data, "application/octet-stream", "usi-export.usi.js");
				}
			});

			// Hört darauf ob Aktualisierungen für die Skripte zur Verfügung stehen ...
			self.port.on("USI-BACKEND:update-for-userscript-available", function (userscript_infos) {
				if (window.confirm(language_controller.get("userscript_update_was_found_1") + userscript_infos.id + language_controller.get("userscript_update_was_found_2"))) {
					// Nun das Skript aktualisieren!
					self.port.emit("USI-BACKEND:override-same-userscript", userscript_infos);

					self.port.emit("USI-BACKEND:request-for---list-all-scripts");
				}
			});

			// Wenn das Skript gelöscht wurde
			self.port.on("USI-BACKEND:delete-script-is-now-deleted", function (script_was_deleted) {
				if (script_was_deleted === true) { // script wurde erfolgreich gelöscht
					window.alert(language_controller.get("userscript_was_successful_deleted"));
				} else { // script konnte nicht gelöscht werden
					window.alert(language_controller.get("userscript_could_not_deleted"));
				}
			});

			// Zusätzliche Events registrieren --- END
			
			
			// Button Events --- START
			event_manager_controller.register_once("#usi-config-delete-all", "click", this.deleteAll );
			event_manager_controller.register_once("#usi-config-check-for-updates", "click", this.checkForUpdates );
			event_manager_controller.register_once("#usi-config-export-all", "click", this.exportAll );
			
			// Sobald der Counter auf 0 steht, 
			jQuery(document).on("all-intial-requests-done", function(evt, counter){

				if(counter === 0){
					// Die Buttons mittels switchery_controller anpassen
					switchery_controller.run();

					// Switch Events behandeln
					event_manager_controller.register_once("#usi-config-change-old-usi-include-behavior", "change", function(){
						__change_switch_option(this.id);
						self.port.emit("USI-BACKEND:OldUsiIncludeBehavior-change", jQuery(this).prop("checked"));
					});
					event_manager_controller.register_once("#usi-config-change-enable-external-script-load-question", "change", function(){
						__change_switch_option(this.id);
						self.port.emit("USI-BACKEND:ExternalScriptLoadQuestion-change",  jQuery(this).prop("checked"));
					});
					event_manager_controller.register_once("#usi-config-change-options-activate-highlightjs", "change", function(){
						// ändert den Aktivierungs Status
						__change_switch_option(this.id);
						self.port.emit("USI-BACKEND:highlightjs-activation-state-change",  jQuery(this).prop("checked"));
					});
					event_manager_controller.register_once("#usi-config-change-options-always-activate-greasemonkey", "change", function(){
						// Aktiviert Greasemonkey Funktionen immer, egal ob @use-greasemonkey gesetzt wurde oder nicht
						__change_switch_option(this.id);
						self.port.emit("USI-BACKEND:options_always_activate_greasemonkey-change",  jQuery(this).prop("checked"));
					});

					event_manager_controller.register_once("#usi-config-change-complete-export", "change", function(){
						__change_switch_option(this.id);
					});
				}
			});
			// Button Events --- END
			
			
		}
		
		, __change_switch_option : function(id){
			id = "#" + id; // für jQuery
			var state = jQuery(id).prop("checked");
			
			if(state === true){
				jQuery(id + "---false").hide();
				jQuery(id + "---true").fadeIn();
			}else{
				jQuery(id + "---true").hide();
				jQuery(id + "---false").fadeIn();
			}
			
		}
			
		/**
		 * Alle Userscripte entfernen
		 * @returns {undefined}
		 */
		,deleteAll : function () {
			// Doppelte Sicherheitsabfrage, bevor wirklich alles gelöscht wird!
			if (window.confirm(language_controller.get("really_reset_all_settings"))) {
				if (window.confirm(language_controller.get("really_really_reset_all_settings"))) {
					self.port.emit("USI-BACKEND:delete-everything");
					self.port.emit("USI-BACKEND:request-for---list-all-scripts");
				}
			}
		}
		
		// Prüfe ob für die Skripte Updates gefunden wurden!
		,checkForUpdates : function () {
			self.port.emit("USI-BACKEND:check-for-userscript-updates");
		}
		
		
		// exportiere die Skripte
		,exportAll : function () {
			if (jQuery("#usi-config-change-complete-export").prop("checked") === true) {
				self.port.emit("USI-BACKEND:get-all-userscripts-for-export", "TRUE");
			} else {
				self.port.emit("USI-BACKEND:get-all-userscripts-for-export", "FALSE");
			}

		}
		
	};
	
};

var userscript_config_controller = userscript_config_class();