"use strict";

/* global self, highlightjs_controller, event_manager_controller, language_controller, switchery_controller, backend_events_controller, lang, Promise */

var userscript_list_controller = (function userscript_list_class(){
	
	var is_expanded = false;
	
	var private_functions = {
		// fragt die Userscripte ab
		refresh : function(){
			// Zeige das Preload Image
			jQuery("#usi-list-preload-image").removeClass("hidden");
			
			backend_events_controller.api.emit("USI-BACKEND:request-for---list-all-scripts", false);
		}
		
		,set_userscript_counter : function(counter){
			if(counter && counter > 0){
				jQuery("#usi-list-userscript-count-negative").addClass("hidden");
				jQuery("#usi-list-userscript-count-positive").removeClass("hidden");
				
				jQuery("#usi-list-userscript-count").html(counter);
			}else{
				jQuery("#usi-list-userscript-count-positive").addClass("hidden");
				jQuery("#usi-list-userscript-count-negative").removeClass("hidden");
			}
		}
        /**
         * 
         * @param {boolean} setTo
         * @returns {void}
         */
		, set_expand_status : function(setTo){
            // muss ein bool sein
            if(setTo === true || setTo === false){
                is_expanded = setTo;
            }
        }
		, expand_or_compress : function(){
			if(is_expanded === false){
				// Pfeilrichtungen anpassen
				jQuery("#usi-list-userscript-entries .usi-list-entry-toggle-options")
					.addClass("fa-angle-double-up")
					.removeClass("fa-angle-double-down");
				
				// Einblenden
				jQuery("#usi-list-userscript-entries .panel-body").removeClass("not-visible hidden");
                
                jQuery("#usi-list-userscript-expandOrCompress").removeClass("fa-expand").addClass("fa-compress");

			}else{
				// Pfeilrichtungen anpassen
				jQuery("#usi-list-userscript-entries .usi-list-entry-toggle-options")
					.removeClass("fa-angle-double-up")
					.addClass("fa-angle-double-down");
				
				// Ausblenden
				jQuery("#usi-list-userscript-entries .panel-body").addClass("not-visible hidden");
                
                // Icon anpassen
                jQuery("#usi-list-userscript-expandOrCompress").addClass("fa-expand").removeClass("fa-compress");
			}
			
			// Wert tauschen
			private_functions.set_expand_status(!is_expanded);
            
		}
	};
	
	// Active Style festlegen
	backend_events_controller.api.on("USI-BACKEND:highlightjs-style", function(style){
		highlightjs_controller.set_active_style(style);
	});

	// Speicherverbrauch anzeigen
	backend_events_controller.api.on("USI-BACKEND:storage-quota", function (quota) {
        
		// falls ein Komma enthalten sein sollte ...
		var rounded_quota = (Math.round(quota * 100) / 100 + "").replace(".", ","),

		currentMemoryUsage = lang["actual_used_quota"] + " : " + rounded_quota + "%";
		
		jQuery("#usi-list-current-memory-usage").text(currentMemoryUsage);
	});

	// Wenn Userscripts gesendet werden, packe sie in die Variable --- all_userscripts
	backend_events_controller.api.on("USI-BACKEND:list-all-scripts", function (userscripts) {

		// setze die Anzahl der Userscripts
		private_functions.set_userscript_counter(userscripts.length);
		
		// leeren 
		jQuery("#usi-list-userscript-entries").html("");
		
        // es gibt keine Userscripts
		if(userscripts.length <= 0) {
            jQuery("#usi-list-preload-image").addClass("hidden");
            return false;
        }

        var promises_store = [];
        // durchlaufe alle userscripts
        userscripts.forEach(function(userscript, index){
            // Instanziere das Userscript
            var userscript_entry = new userscript_list_entry_class(userscript, index);
            
            // falls ein Fehler auftreten sollte, ist der userscript_entry === false
            if(userscript_entry === false){
                return false;
            }
            
            // Promise Array füllen
            promises_store.push(new Promise(function (resolve, reject) {
                // template laden und Variablen ersetzen
                jQuery("#usi-list-userscript-entries").
                    loadTemplate("options/templates/list_entry.html",
                        userscript_entry.deliver_vars(),
                        {append: true, complete: function () {
                                // after_rendering ausführen
                                userscript_entry.after_rendering();
                                resolve();
                    }
                });

            }));
            
        });
        
        // Ausführen nachdem alle Promises erfüllt wurden
        Promise.all(promises_store).then(function(){

            // Nachlade Image entfernen
            jQuery("#usi-list-preload-image").addClass("hidden");

            // initialisiere die eingeklappten Userscript Übersicht
            private_functions.set_expand_status(true);
            private_functions.expand_or_compress();
        });
    });

	return {
		before_rendering : function(){
		}
		
		,after_rendering : function(){
			private_functions.set_userscript_counter();
			
			event_manager_controller.register_once("#usi-list-refresh","click", private_functions.refresh);
			
			event_manager_controller.register_once("#usi-list-userscript-expandOrCompress","click", private_functions.expand_or_compress);
			
			// Direkt danach die Userscripteinträge einfordern
			private_functions.refresh();
		}
		
	};
}());