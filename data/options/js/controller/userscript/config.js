"use strict";

function userscript_config_class (){

	// init
	var complete_export = false;

	return {
	
		init : function(){
			// Die Buttons mittels switchery_controller anpassen
			switchery_controller.run();
			
		}
	
		,change_enableExternalScriptLoadQuestion : function(){
			self.port.emit("USI-BACKEND:ExternalScriptLoadQuestion-change",$scope.enableExternalScriptLoadQuestion);
		}
		
		,change_OldUsiIncludeBehavior : function(){
			self.port.emit("USI-BACKEND:OldUsiIncludeBehavior-change",$scope.OldUsiIncludeBehavior);
		}
		
		// ändert den Aktivierungs Status
		,change_options_activate_highlightjs : function(){
			self.port.emit("USI-BACKEND:highlightjs-activation-state-change",$scope.options_activate_highlightjs);
		}

		// Aktiviert Greasemonkey Funktionen immer, egal ob @use-greasemonkey gesetzt wurde oder nicht
		,change_options_always_activate_greasemonkey : function(){
			self.port.emit("USI-BACKEND:options_always_activate_greasemonkey-change",$scope.options_always_activate_greasemonkey);
		}
		
		/**
		 * Alle Userscripte entfernen
		 * @returns {undefined}
		 */
		,deleteAll : function () {
			// Doppelte Sicherheitsabfrage, bevor wirklich alles gelöscht wird!
			if (window.confirm($scope.lang.really_reset_all_settings)) {
				if (window.confirm($scope.lang.really_really_reset_all_settings)) {
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
			if (typeof complete_export !== "undefined" && complete_export === true) {
				self.port.emit("USI-BACKEND:get-all-userscripts-for-export", "TRUE");
			} else {
				self.port.emit("USI-BACKEND:get-all-userscripts-for-export", "FALSE");
			}

		}
		
	};
	
};

var userscript_config_controller = userscript_config_class();