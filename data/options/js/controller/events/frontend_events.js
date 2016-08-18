"use strict";

function frontend_events_class(){
	
	var private_functions = {
	
		init : function(){
			// Initialisiere die Tab übergreifenden Events im Frontend

			// Tab Wechsel Event
			event_manager_controller.register_once(document, "USI-FRONTEND:changeTab", function(event, action, param1){
				switch(action){
					case "edit":
						template_controller.load(action, {callback_on_complete : function(){
							jQuery(document).trigger("USI-FRONTEND:editTab-get-userscript", param1);
						}});
						break;
					case "load_external":
						template_controller.load(action, {callback_on_complete : function(){
							jQuery(document).trigger("USI-FRONTEND:loadExternal-reload-from-url", param1);
						}});
						break;
				}
			});
			
		}
		
	};
	
	return {
		init : private_functions.init
	};
	
}

var frontend_events_controller = frontend_events_class();