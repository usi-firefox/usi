"use strict";

/* global language_controller,manager_controller */

var template_controller = (function template_class(){
	
	var last_used_controller = false
	,last_used_controller_container_id = false
	,actual_controller_container_id = false
	,controllers_already_started = [];
	
	return {
		load : function(name, additional){
		
			var controller_already_started = false,
            actual_controller,replaceValues;
		
			// Ruft die Destroy Funktion des letzten Controllers auf
			if(last_used_controller !== false && typeof last_used_controller.destroy === "function"){
				last_used_controller.destroy();
			}
			
			// prüft ob der Controller bereits geladen wurde
			for(var i in controllers_already_started){
				if(name === controllers_already_started[i]){
					controller_already_started = true;
				}
			}
			
			// Controller ID festlegen
			actual_controller_container_id = "usi-controller-container-" + name;
			
			// lädt den passenden Controller
			actual_controller = manager_controller.getController(name);
			
			// ersetze die Überschrift
			jQuery("#nav_title").html(manager_controller.getControllerTitle(name));
			
			// führt die before_rendering() Funktion aus, falls diese existiert
			if(actual_controller !== false && typeof actual_controller.before_rendering === "function" && controller_already_started === false){
				// falls ein gültiger Controller gerufen wurde, wird nun seine before_rendering_data() augeführt
				if(additional && typeof additional.before_rendering_data !== "undefined"){
					// Extra Übergabe Daten
					actual_controller.before_rendering(additional.before_rendering_data);
				}else{
					// Ohne zusätzliche Parameter before_rendering aufrufen
					actual_controller.before_rendering();
				}
			}
			
			if(actual_controller !== false && typeof actual_controller.deliver_vars === "function"){
				// falls ein gültiger Controller gerufen wurde, wird nun seine deliver_vars() augeführt
				replaceValues = actual_controller.deliver_vars();
			}else{
				replaceValues = {};
			}

			if(actual_controller !== false){
				last_used_controller = actual_controller;
			}
			if(last_used_controller_container_id !== false){
				jQuery(".usi-controller-container").addClass("hidden");
			}
			
			if(controller_already_started === false){
				// Controller Container hinzufügen
				jQuery("#app-body-content").append(
					jQuery("<div>").attr("id", actual_controller_container_id).attr("class", "usi-controller-container").addClass("hidden")
				);
			
				// Lade das Template und ersetze die Variablen
				jQuery("#" + actual_controller_container_id).loadTemplate("options/templates/" + name + ".html", replaceValues, {

					complete: function(){
						// nach Abschluss des Nachladens ...
						// 
						// suche nun alle Tags mit data-usi-lang
						language_controller.replace_in_DOM();

						// Wenn der Controller eine after_rendering Funktion hat, führe diese nach dem Laden aus
						if(actual_controller !== false && typeof actual_controller.after_rendering === "function"){
							actual_controller.after_rendering();
						}

						controllers_already_started.push(name);
						last_used_controller_container_id = actual_controller_container_id;
						
						// Ausführen nachdem das Template fertig geladen wurde
						if(additional && typeof additional.callback_on_complete === "function"){
							additional.callback_on_complete();
						}
						
						// Sobald alles abgearbeitet wurde, kann der gesamte Container angezeigt werden
						jQuery("#" + actual_controller_container_id).removeClass("hidden");
					}
				});
				
			}else{
				// !!!ACHTUNG!!!
				// Dies wird auch ausgeführt, wenn der Controller bereits 1x geladen wurde!
				if(additional && typeof additional.callback_on_complete === "function"){
					additional.callback_on_complete();
				}
				
				// Controller wurde bereits geladen, daher wird dieser nun wieder eingeblendet!
				jQuery("#" + actual_controller_container_id).removeClass("hidden");
			}
		}
		
	};
}());