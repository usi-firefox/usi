"use strict"; // Strict Mode aktivieren!

/* global exports, basic_helper */

var type_guess = {
    typeGuess: function(val, allowed_types, types_priotity){
		var known_types_priotity = types_priotity || ["regex","datauri","url","bool","string"];

		if(!basic_helper.empty(val)){
			// Variable darf natürlich nicht leer sein
			
			// führende und nachfolgende Leerzeichen entfernen
			if (typeof val.trim === "function") {
				val = val.trim();
			}
			
			var actual_type;
			// Prüfe die nutzbaren Datentypen
			for(var i in known_types_priotity){
				
				actual_type = known_types_priotity[i];
				
				/**
				 *  wenn der Aktuelle Wert von "known_types_priotity" in "allowed_types"
				 *  zu finden ist, versuche damit ALS ERSTES den Datentyp zu testen
				 */
				if(allowed_types.indexOf(actual_type) !== -1){
					// Prüfe nun die Variable ob der Datentyp übereinstimmt
					switch(actual_type){
						case "regex":
							// Sollte mindestens ein Slash enthalten und muss mindestens aus 3 Zeichen bestehen
							if (val.indexOf("/") !== -1 && val.length >= 3) {
                                var begin = val.charAt(0),
                                    last = val.charAt(val.length - 1);
                                if(begin === "/" && last === "/"){
									// Entferne das erste und das letzte Zeichen!
                                    return new RegExp(val.substr(1, val.length - 1));
                                }
							}
							
							break;
						case "datauri":
							// wenn zu beginn, data: steht -> dann sollte es sich auch um eine DataURI handeln?!
							if(/^data:(.*)/.test(val)){
								return val;
							}
							break;
						case "url":
							// Sollte es eine gültige URL sein, gib sie direkt zurück
							// Falls es nur ein * ist -> gib auch dies zurück
							if(basic_helper.valid_url(val) === true || val === "*"){
								return val;
							}
							
							break;
						case "bool":
							if(val === "true"){
								return true; 
							}else if(val === "false"){
								return false;
							}
							break;
						case "string":
						default:
							return val;
							break;
					}
					
				}
			
			}
			
			return null;
		}else{
			return null;
		}
		
	}
};

// nötig damit es auch im Content Script verwendet werden kann!!!
if(typeof exports !== "undefined"){
	exports.type_guess = type_guess;
}