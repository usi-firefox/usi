"use strict";

function template_class(){
	
	return {
		load : function(name, additional_callback){
			// lädt den passenden Controller
			var actual_controller = manager_controller.getController(name);
			// führt die before_rendering() Funktion aus, falls diese existiert
			if(actual_controller !== false && typeof actual_controller.before_rendering === "function"){
				// falls ein gültiger Controller gerufen wurde, wird nun seine init() augeführt
				actual_controller.before_rendering();
			}
			
			var replaceValues;
			if(actual_controller !== false && typeof actual_controller.deliver_vars === "function"){
				// falls ein gültiger Controller gerufen wurde, wird nun seine init() augeführt
				replaceValues = actual_controller.deliver_vars();
			}else{
				replaceValues = {};
			}
			
			// Lade das Template und ersetze die Variablen
			jQuery(".right_col").loadTemplate("templates/" + name + ".html", replaceValues, {

				complete: function(){
					// nach Abschluss des Nachladens ...
					// 
					// suche nun alle Tags mit data-usi-lang
					language_controller.replace_in_DOM();

					// Wenn der Controller eine after_rendering Funktion hat, führe diese nach dem Laden aus
					if(actual_controller !== false && typeof actual_controller.after_rendering === "function"){
						actual_controller.after_rendering();
					}
					
					if(typeof additional_callback === "function"){
						additional_callback();
					}
				}
			});
		}
		
	};
};

var template_controller = template_class();