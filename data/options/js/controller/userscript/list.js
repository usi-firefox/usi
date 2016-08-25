"use strict";

/* global self, highlightjs_controller, event_manager_controller, language_controller, switchery_controller, backend_events_controller */

function userscript_list_class(){
	
	var currentMemoryUsage;
	// Anzahl der Userscripts - zählen mittels Object.keys
	var userscript_count	=	0;
	var all_userscripts		=	[];
	
	
	var private_functions = {
		// fragt die Userscripte ab
		refresh : function(){
			backend_events_controller.api.emit("USI-BACKEND:request-for---list-all-scripts", false);
		}
		
		,set_userscript_counter : function(counter){
			if(counter && counter > 0){
				jQuery("#usi-list-userscript-count-negative").hide();
				jQuery("#usi-list-userscript-count-positive").show();
				
				jQuery("#usi-list-userscript-count").html(counter);
			}else{
				jQuery("#usi-list-userscript-count-positive").hide();
				jQuery("#usi-list-userscript-count-negative").show();
			}
		}
	};
	
	// Active Style festlegen
	backend_events_controller.api.on("USI-BACKEND:highlightjs-style", function(style){
		highlightjs_controller.set_active_style(style);
	});

	// Speicherverbrauch anzeigen
	backend_events_controller.api.on("USI-BACKEND:storage-quota", function (quota) {
		var rounded_quota = Math.round(quota * 100) / 100 + "";

		// falls ein Komma enthalten sein sollte ...
		rounded_quota = rounded_quota.replace(".", ",");

		currentMemoryUsage = language_controller.get("actual_used_quota") + " : " + rounded_quota + "%";
		
		jQuery("#usi-list-current-memory-usage").text(currentMemoryUsage);
	});

	// Wenn Userscripts gesendet werden, packe sie in die Variable --- all_userscripts
	backend_events_controller.api.on("USI-BACKEND:list-all-scripts", function (userscripts) {
		
		var index = 0
		,userscript_entries = []
		// Anzahl der Userscripts - zählen mittels Object.keys
		,userscript_count = Object.keys(userscripts).length;

		// setze die Anzahl der Userscripts
		private_functions.set_userscript_counter(userscript_count);
		
		// leeren 
		jQuery("#usi-list-userscript-entries").html("");
		
		// Daten für alle Userscripts setzen
		for (var id in userscripts) {
			userscript_entries.push(
				// Instanziere das Userscript
				new userscript_list_entry_class(userscripts[id], index)
				);

			// falls ein Fehler auftreten sollte, ist der userscript_entry === false
			if (userscript_entries[index] !== false) {
				// führe die Funktion direkt aus
				(function (userscript_entry, idx) {
					// template laden und Variablen ersetzen
					jQuery("#usi-list-userscript-entries").
						loadTemplate("options/templates/list_entry.html",
							userscript_entry.deliver_vars(),
							{append: true, complete: function () {

									// after_rendering ausführen
									userscript_entry.after_rendering();

									// switchery_controller ausführen sobald alle Userscripts geladen wurden
//									if ((idx + 1) === userscript_count) {
//										
//									}
								}});

				}(userscript_entries[index], index));

				// index hochzählen
				++index;
			}
			
		}
		

		// Beende die Lade Animation
		if(typeof window.loading_screen !== "undefined" && typeof window.loading_screen.finish === "function"){
			window.loading_screen.finish();
		}
	});

	return {
		before_rendering : function(){
			// highlightJS Optionen einpflegen
			highlightjs_controller.fill_in_options();
			
			// EventListener für den Wechsel aktivieren
			jQuery(".selectHighlightJSStyle").on("change", function () {
				highlightjs_controller.change_style(jQuery(this).val());
			});
			
		}
		
		,after_rendering : function(){
			private_functions.set_userscript_counter();
			
			event_manager_controller.register_once("#usi-list-refresh","click", private_functions.refresh);
			
			// Direkt danach die Userscripteinträge einfordern
			private_functions.refresh();
		}
		
	};
};

var userscript_list_controller = userscript_list_class();