"use strict";

function template_class(){
	
	return {
		load : function(name, replaceValues, additional_callback){
			jQuery(".right_col").loadTemplate("templates/" + name + ".html", replaceValues, {

				complete: function(){
					// nach Abschluss des Nachladens ...
					// 
					// suche nun alle Tags mit data-usi-lang
					language_controller.replace_in_DOM();

					// lädt den passenden Controller
					var actual_controller = manager_controller.getController(name);
					if(actual_controller !== false){
						// falls ein gültiger Controller gerufen wurde, wird nun seine init() augeführt
						actual_controller.init();
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