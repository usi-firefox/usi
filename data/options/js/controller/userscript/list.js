"use strict";
/* global self, highlightjs_controller, event_manager_controller, language_controller */

function userscript_list_class(){
	
	var currentMemoryUsage;
	// Anzahl der Userscripts - zählen mittels Object.keys
	var userscript_count	=	0;
	var all_userscripts		=	[];
	
	// Active Style festlegen
	self.port.on("USI-BACKEND:highlightjs-style", function(style){
		highlightjs_controller.set_active_style(style);
	});

	// Speicherverbrauch anzeigen
	self.port.on("USI-BACKEND:storage-quota", function (quota) {
		var rounded_quota = Math.round(quota * 100) / 100 + "";

		// falls ein Komma enthalten sein sollte ...
		rounded_quota = rounded_quota.replace(".", ",");

		currentMemoryUsage = language_controller.get("actual_used_quota") + " : " + rounded_quota + "%";
		
		jQuery("#usi-list-current-memory-usage").text(currentMemoryUsage);
	});

	// Wenn Userscripts gesendet werden, packe sie in die Variable --- all_userscripts
	self.port.on("USI-BACKEND:list-all-scripts", function (userscripts) {
		
		var userscript_entries = [];
		var index = 0;
		// leeren 
		jQuery("#usi-list-userscript-entries").html("");
		
		// Daten für alle Userscripts setzen
		for(var id in userscripts){
			userscript_entries.push(
					// Instanziere das Userscript
				new userscript_list_entry_class(userscripts[id], index)
			);
			
			// falls ein Fehler auftreten sollte, ist der userscript_entry === false
			if(userscript_entries[index] !== false){
				// template laden und Variablen ersetzen
				jQuery("#usi-list-userscript-entries").
						loadTemplate("templates/list_entry.html",
								userscript_entries[index].deliver_vars(),
								{append: true, complete: userscript_entries[index].after_rendering});
				
				++index;
			}
			
		}
		
		// Anzahl der Userscripts - zählen mittels Object.keys
		userscript_count = Object.keys(userscripts).length;

		// Beende die Lade Animation
		if(typeof window.loading_screen !== "undefined" && typeof window.loading_screen.finish === "function"){
			window.loading_screen.finish();
		}
	});


	var private_functions = {
		// fragt die Userscripte ab
		refresh : function(){
			self.port.emit("USI-BACKEND:request-for---list-all-scripts", false);
		}
	};

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
			
			event_manager_controller.register_once("#usi-list-refresh","click", private_functions.refresh);
			
			// Direkt danach die Userscripteinträge einfordern
			private_functions.refresh();
		}
		
	};
};

var userscript_list_controller = userscript_list_class();