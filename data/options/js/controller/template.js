"use strict";

function template_class(){
	
	var last_used_controller = false
	,last_used_controller_container_id = false
	,actual_controller_container_id = false
	,controllers_already_started = [];
	
	return {
		load : function(name, additional_callback){
		
			var controller_already_started = false;
		
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
			
			actual_controller_container_id = "usi-controller-container-" + name;
			
			// lädt den passenden Controller
			var actual_controller = manager_controller.getController(name);
			
			// führt die before_rendering() Funktion aus, falls diese existiert
			if(actual_controller !== false && typeof actual_controller.before_rendering === "function" && controller_already_started === false){
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

			if(actual_controller !== false){
				last_used_controller = actual_controller;
			}
			if(last_used_controller_container_id !== false){
				jQuery(".usi-controller-container").hide();
			}
			
			if(controller_already_started === false){
				var block = jQuery("<div>").attr("id", actual_controller_container_id);
				jQuery(block).attr("class", "usi-controller-container");
				
				jQuery(".right_col").append(block);
			
				// Lade das Template und ersetze die Variablen
				jQuery("#" + actual_controller_container_id).loadTemplate("templates/" + name + ".html", replaceValues, {

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

						if(typeof additional_callback === "function"){
							additional_callback();
						}
					}
				});
				
			}else{
				jQuery("#" + actual_controller_container_id).show();
			}
			
		}
		
	};
};

var template_controller = template_class();