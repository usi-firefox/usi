"use strict";

/* global language_controller, event_manager_controller, self, backend_events_controller */

function userscript_load_external_class(){
	
	var id_prefix = "#usi-load-external-";
	
	var private_functions = {
		
		before_rendering: function(){
			
		}
	
		,after_rendering : function(){
			
			event_manager_controller.register_once(document, "USI-FRONTEND:loadExternal-reload-from-url", function(event, reload_from_url){
				
			});
			
			// alle Buttons registrieren
			private_functions.register_buttons();
			
		}
		
		, register_buttons : function(){
			// Script von einer URL holen
			jQuery(id_prefix + "execute-url-load").on("click", private_functions.loadExternal);
			
			// Reset Button für URL Eingabe
			jQuery(id_prefix + "reset").on("click", private_functions.reset_url);
			// Start Button für das Laden einer lokalen Datei
			jQuery(id_prefix + "execute-local-load").on("click", private_functions.loadLocalFile);
			// alternatives Charset hinzufügen
			jQuery(id_prefix + "add-custom-charset").on("click", private_functions.addCustomCharset);
		}
		
		, reset_url : function(){
			jQuery(id_prefix + "script-url").val("");
		}
		
		,addCustomCharset : function(){
			var new_charset = window.prompt(language_controller.get("add_new_custom_charset"));
			if(new_charset){
				
				var found = false;
				
				jQuery(id_prefix + "alternativeCharsets option").each(function(i,element){
					if(jQuery(element).val() === new_charset ){
						found = true;
					}
				});
				
				if(found === false){
					jQuery(id_prefix + "alternativeCharsets").append(
						jQuery("<option>").val(new_charset).html(new_charset)
					);
					jQuery(id_prefix + "alternativeCharsets option[value='" + new_charset + "']").prop("selected",true);
				}else{
					alert(language_controller.get("charset_already_exist"));
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
					jQuery(document).trigger("USI-FRONTEND:changeTab", ["edit", {userscript : e.target.result}]);
				};

				// Read in the image file as a data URL.
				reader.readAsText(file, jQuery(id_prefix + "alternativeCharsets").val());
			}
			
		}

		// Userscript nachladen
		,loadExternal : function () {
			// Fehlertext entfernen
			jQuery(id_prefix + "has-error").html("");
			
			var script_url = jQuery(id_prefix + "script-url").val();
			var alternativeCharset = jQuery(id_prefix + "alternativeCharsets").val();
			
			if (script_url !== "undefined" && script_url.length > 0) {
				// sende die URL an das Backend Skript...
				backend_events_controller.api.emit("USI-BACKEND:loadexternal-script_url",
					{script_url: script_url,
						charset: alternativeCharset,
						moreinformations: {getFromUrl: true, url: script_url}}
				);

				backend_events_controller.api.emit("USI-BACKEND:request-for---list-all-scripts");
				
				backend_events_controller.api.once("USI-BACKEND:external-script-is-now-loaded", function(status){
					if(status === true){
						// Nachgeladenes Userscript ist geladen
						alert(language_controller.get("external_script_is_now_loaded") + " -> " + script_url);
					}
				});
			} else {
				// Fehler Text anzeigen
				jQuery(id_prefix + "has-error").html(
					language_controller.get("empty_userscript_url")
				);
			}
		}
		
	};
	
	
	return {
		// Wrapper
		before_rendering: private_functions.before_rendering
	
		// Wrapper
		,after_rendering : private_functions.after_rendering
	};
	
};

var userscript_load_external_controller = userscript_load_external_class();