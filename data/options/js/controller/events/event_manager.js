"use strict";

function event_manager_class(){
	
	var registered_once_events = [];
	
	return {
		
		// registriert ein neues Event
		register : function(element, eventname, func){
			// neues Event registrieren
			jQuery(element).on(eventname, func);
		}
		
		// Stellt sicher dass 
		,register_once : function(element, eventname, func){
			
			for (var i in registered_once_events){
				
				if(registered_once_events[i].element === element
					&& registered_once_events[i].eventname === eventname 
					&& registered_once_events[i].func_s === func.toString()){
					
					// Event wurde bereits registriert
					return false;
				}
				
			}
			
			// neues Event registrieren
			this.register(element, eventname, func);
			
			// neuen eintrag im sichern
			var entry = {
				element: element
				,eventname: eventname
				,func_s: func.toString()
			};
			
			registered_once_events.push(entry);
			
			// alles in ordnung
			return true;
		}
		
	};
	
}

var event_manager_controller = event_manager_class();