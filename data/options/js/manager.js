"use strict";

/**
 * Liefert für den angfragten Namen den passenden Controller zurück
 * 
 * @returns object controller
 */
function manager_class(){
	
	return {

		getController : function(name){
			
			if(typeof name === "string"){
				
				switch(name){
					case "list":
						return userscript_list_controller();
					case "edit":
						return userscript_edit_controller();
					case "load_external":
						return userscript_load_external_controller();
					case "config":
						return userscript_config_controller();
					default:
						// unbekannter Controller!
						console.error("unbekannter Controller! im 'manager' angefragt ### " + name + " ###");
						return false;
				}
				
			}else{
				// kein String übergeben
				return false;
			}
			
		}
		
	};
	
}

var manager_controller = manager_class();