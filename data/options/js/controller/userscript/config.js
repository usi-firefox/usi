"use strict";

function userscript_config_class (){
	
	// init
	return {
	
		before_rendering : function(){
		}
		
		,after_rendering : function(){
			
			var __change_switch_option = this.__change_switch_option;
			
			var initial_requests_done = 4;
				// Verstecke zunächst alle Labels
				// registriere alle Events für die States
				self.port.emit("USI-BACKEND:register-all-change-states");
				
				// Setze die gesetzen Einstellungen für die Buttons --- START
				self.port.on("USI-BACKEND:options_always_activate_greasemonkey",function(state){
					jQuery("#usi-config-change-options-always-activate-greasemonkey").prop("checked", state);
					__change_switch_option("usi-config-change-options-always-activate-greasemonkey");
					jQuery(document).trigger("all-intial-requests-done",--initial_requests_done);
				});
				self.port.on("USI-BACKEND:ExternalScriptLoadQuestion",function(state){
					jQuery("#usi-config-change-enable-external-script-load-question").prop("checked", state);
					__change_switch_option("usi-config-change-enable-external-script-load-question");
					jQuery(document).trigger("all-intial-requests-done",--initial_requests_done);
				});
				self.port.on("USI-BACKEND:OldUsiIncludeBehavior",function(state){
					jQuery("#usi-config-change-old-usi-include-behavior").prop("checked", state);
					__change_switch_option("usi-config-change-old-usi-include-behavior");
					jQuery(document).trigger("all-intial-requests-done",--initial_requests_done);
				});
				self.port.on("USI-BACKEND:highlightjs-activation-state",function(state){
					jQuery("#usi-config-change-options-activate-highlightjs").prop("checked", state);
					__change_switch_option("usi-config-change-options-activate-highlightjs");

					jQuery(document).trigger("all-intial-requests-done",--initial_requests_done);
				});

				jQuery("#usi-config-change-complete-export---true").hide();
			
			// Setze die gesetzen Einstellungen für die Buttons --- END
			
			
			// Button Events --- START
			jQuery("#usi-config-delete-all").on("click", this.deleteAll );
			jQuery("#usi-config-check-for-updates").on("click", this.checkForUpdates );
			jQuery("#usi-config-export-all").on("click", this.exportAll );
			
			// Sobald der Counter auf 0 steht, 
			jQuery(document).on("all-intial-requests-done", function(evt, counter){

				if(counter === 0){
					// Die Buttons mittels switchery_controller anpassen
					switchery_controller.run();

					// Switch Events behandeln
					jQuery("#usi-config-change-old-usi-include-behavior").on("change", function(){
						__change_switch_option(this.id);
						self.port.emit("USI-BACKEND:OldUsiIncludeBehavior-change", jQuery(this).prop("checked"));
					});
					jQuery("#usi-config-change-enable-external-script-load-question").on("change", function(){
						__change_switch_option(this.id);
						self.port.emit("USI-BACKEND:ExternalScriptLoadQuestion-change",  jQuery(this).prop("checked"));
					});
					jQuery("#usi-config-change-options-activate-highlightjs").on("change", function(){
						// ändert den Aktivierungs Status
						__change_switch_option(this.id);
						self.port.emit("USI-BACKEND:highlightjs-activation-state-change",  jQuery(this).prop("checked"));
					});
					jQuery("#usi-config-change-options-always-activate-greasemonkey").on("change", function(){
						// Aktiviert Greasemonkey Funktionen immer, egal ob @use-greasemonkey gesetzt wurde oder nicht
						__change_switch_option(this.id);
						self.port.emit("USI-BACKEND:options_always_activate_greasemonkey-change",  jQuery(this).prop("checked"));
					});

					jQuery("#usi-config-change-complete-export").on("change", function(){
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