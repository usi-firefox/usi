"use strict";

function userscript_list_class(){

	return {
		before_rendering : function(){
			// highlightJS Optionen einpflegen
			highlightjs_controller.fill_in_options();
			
			// EventListener für den Wechsel aktivieren
			jQuery(".selectHighlightJSStyle").on("change", function () {
				highlightjs_controller.change_style(jQuery(this).val());
			});
			
		}
		
		// fragt die Userscripte ab
		,refresh : function(){
			self.port.emit("USI-BACKEND:request-for---list-all-scripts", false);
		}
		
		/**
		 * Userscript aktivieren, bzw deaktivieren
		 * @param {type} userscript
		 * @returns void
		 */
		,toggleActivation : function (userscript) {
			// aktiviere oder deaktiviere dieses Userscript!
			self.port.emit("USI-BACKEND:toggle-userscript-state", userscript.id);
		}
		
		,export : function (userscript_id) {
			// aktiviere oder deaktiviere dieses Userscript!
			self.port.emit("USI-BACKEND:export-userscript", userscript_id);
		}
		
		// fragt nach den gesetzten Greasemonkey Variablen
		,getGMValues : function(userscript_id){
			self.port.emit("USI-BACKEND:list-GMValues", userscript_id);

			self.port.once("USI-BACKEND:list-GMValues-done-" + userscript_id, function(GMValues){
				GMValues[userscript_id] = GMValues;
			});
		}
		
		
		/**
		 * Userscript entfernen
		 * @param {type} userscript
		 * @returns {undefined}
		 */
		,delete : function (userscript) {
			// das Skript mit der ID löschen!
			if (!basic_helper.empty(userscript.id)) {
				//zusätzliche Abfrage
				if (window.confirm(language_controller().get("want_to_delete_this_userscript_1") + userscript.id + language_controller().get("want_to_delete_this_userscript_2"))) {

					// @todo erstmal abschalten!!!
					self.port.emit("USI-BACKEND:delete-script-by-id", userscript.id);

					self.port.emit("USI-BACKEND:request-for---list-all-scripts");
				}
			}
		}
		
		// Sende es an den Editierungs Controller
		,edit : function (userscript) {
			/**
			 * 
			 * 
			 * 
			 * 
			 * 
			 * 
			 * 
			 * TODO
			 * 
			 * 
			 * 
			 * 
			 * 
			 * 
			 */
			$rootScope.$emit("USI-FRONTEND:EditUserscipt_edit", userscript);

			// veranlasse den Tab Wechsel!
			$scope.$emit("USI-FRONTEND:changeTab", "createOrEdit");

		}
		
		// Übergibt die URL an die Nachlade Funktion
		,loadAgain : function(url){
			$rootScope.$emit("USI-FRONTEND:LoadExternalUserScript_reload_from_source", url);

			// veranlasse den Tab Wechsel!
			$scope.$emit("USI-FRONTEND:changeTab", "loadExternal");
		}
		
		// testet die eingebene URL ob ein Include darauf greifen(matchen) würde
		,testUrlMatch : function (userscript){
			// Backend anfragen
			self.port.emit("USI-BACKEND:test-url-match", {url: userscript.testurl, id: userscript.id});
			
			// Ergebnis zustand zurückschreiben
			self.port.once("USI-BACKEND:test-url-match-" + userscript.id, function(state){
				// Treffer => true
				if(userscript.testurlstate !== state){
					// Zustand sichern
					userscript.testurlstate = state;

					// Symbol ändern
					jQuery("#testurlstate-" + userscript.id).toggleClass("fa-close").toggleClass("fa-check");
					
				}
			});
		}
	
		// Code highlight
		,highlightCode : function(index){
			
			// Nur ausführen wenn es global aktiviert wurde
			if($scope.options_activate_highlightjs === true){
				
				// Zur Sicherheit nochmal den aktuellen Style laden!
				$scope.changeHighlightJSStyle($scope.highlightjsActiveStyleGlobal);

				// damit die Funktion nicht zu oft aufgerufen wird!
				if (typeof $scope.already_highlighted[index] === "undefined" ) {

					$scope.already_highlighted[index] = true;

					jQuery("#formatted-userscript-" + index).each(function (i, block) {
						// highlight ausführen!
						hljs.highlightBlock(block);
					});
				}

				// setze die Option noch auf das richtige Feld
				jQuery('select[id^="selectHighlightJSStyle"] option').each(function(index,element){
					if(jQuery(element).text() === $scope.highlightjsActiveStyleGlobal){
						jQuery(element).prop("selected", true);
					}
				});
			
			}
		}
		
	};
};

var userscript_list_controller = userscript_list_class();