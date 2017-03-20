"use strict";

/* global language_controller, event_manager_controller, self, backend_events_controller, lang */

var userscript_load_external_controller = (function userscript_load_external_class(){
	
	var id_prefix = "#usi-load-external-";
	
	var private_functions = {
		after_rendering : function(){
			
			event_manager_controller.register_once(document, "USI-FRONTEND:loadExternal-reload-from-url", function(event, reload_from_url){
				// URL eintragen!
				jQuery(id_prefix + "script-url")
                    .text(reload_from_url)
                    .val(reload_from_url)
				// kurz aufblinken
				.animate({opacity:0},500,"linear",function(){
					$(this).animate({opacity:1},500);
				});
				
			});
			
			// alle Buttons registrieren
			private_functions.register_buttons();
			
		}
		
		, register_buttons : function(){
			// Script von einer URL holen
			event_manager_controller.register_once(id_prefix + "execute-url-load" ,"click", private_functions.loadExternal);
			
			// Reset Button für URL Eingabe
			event_manager_controller.register_once(id_prefix + "reset" ,"click", private_functions.reset_url);
			// Start Button für das Laden einer lokalen Datei
			event_manager_controller.register_once(id_prefix + "execute-local-load" ,"click", private_functions.loadLocalFile);
			// alternatives Charset hinzufügen
			event_manager_controller.register_once(id_prefix + "add-custom-charset" ,"click", private_functions.addCustomCharset);
		}
		
		, reset_url : function(){
			jQuery(id_prefix + "script-url").val("");
		}
		
		,addCustomCharset : function(){
			var new_charset = window.prompt(lang["add_new_custom_charset"]);
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
					alert(lang["charset_already_exist"]);
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
			
			var script_url = jQuery(id_prefix + "script-url").val(),
                alternativeCharset = jQuery(id_prefix + "alternativeCharsets").val();
			
			if (script_url !== "undefined" && script_url.length > 0) {
				// sende die URL an das Backend Skript...
				backend_events_controller.set.userscript.load_external(
                    {script_url: script_url,
                        charset: alternativeCharset,
                        moreinformations: {url: script_url}}
                );

				backend_events_controller.request.userscript.all();
				
				backend_events_controller.register.userscript.external_load.ready(function(status){
					if(status === true){
						// Nachgeladenes Userscript ist geladen
						alert(lang["external_script_is_now_loaded"] + " -> " + script_url);
					}
				});
			} else {
				// Fehler Text anzeigen
				jQuery(id_prefix + "has-error").html(
					lang["empty_userscript_url"]
				);
			}
		}
		
	};
	
	
	return {
		// Wrapper
		after_rendering : private_functions.after_rendering
	};
	
}());