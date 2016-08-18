"use strict";

function userscript_load_external_class(){
	
	return {
		
		before_rendering: function(){
			
		}
	
		,after_rendering : function(){
			
			event_manager_controller.register_once(document, "USI-FRONTEND:loadExternal-reload-from-url", function(event, reload_from_url){
				
			});
			
		}
		
		,addCustomCharset : function(){
			var new_charset = window.prompt($scope.lang.add_new_custom_charset);
			if(new_charset){
				
				var found = false;
				
				jQuery("#alternativeCharsets option").each(function(i,element){
					if(jQuery(element).val() === new_charset ){
						found = true;
					}
				});
				
				if(found === false){
					jQuery("#alternativeCharsets").append(
						jQuery("<option>").val(new_charset).html(new_charset)
					);
					jQuery("#alternativeCharsets option[value='" + new_charset + "']").prop("selected",true);
				}else{
					alert($scope.lang.charset_already_exist);
				}
			}
		}
		
		// Direkter Userscript Datei Upload
		,loadLocalFile : function(){
		
			var file = jQuery("#direct-userscript-upload").get(0).files[0];

			if(typeof file === "object"){
				var reader = new FileReader();

				reader.onload = function (e) {
					// Daten an den EditController weiterreichen
					$rootScope.$emit("USI-FRONTEND:EditUserscipt_newFromFile", e.target.result);
					
					// veranlasse den Tab Wechsel!
					$rootScope.$emit("USI-FRONTEND:changeTab", "createOrEdit");
				};

				// Read in the image file as a data URL.
				reader.readAsText(file, $scope.alternativeCharset);
			}
			
		}
		
		// Userscript nachladen
		,loadExternal : function () {
			$scope.error = "";
			if (typeof $scope.url !== "undefined" && $scope.url.length > 0) {
				// sende die URL an das Backend Skript...
				self.port.emit("USI-BACKEND:loadexternal-script_url",
					{script_url: $scope.url,
						charset: $scope.alternativeCharset,
						moreinformations: {getFromUrl: true, url: $scope.url}}
				);

				self.port.emit("USI-BACKEND:request-for---list-all-scripts");
				
				self.port.once("USI-BACKEND:external-script-is-now-loaded", function(status){
					if(status === true){
						// Nachgeladenes Userscript ist geladen
						alert($scope.lang.external_script_is_now_loaded + " -> " + $scope.url);
					}
				});
			} else {
				// Fehler Text anzeigen
				$scope.error = $scope.lang.empty_userscript_url;
			}
		}
		
	};
	
};

var userscript_load_external_controller = userscript_load_external_class();