"use strict";

/* global self */

// verwaltet die Übersetzungen
function language_class(){
	var lang	=	self.options.language;
	
	var private_functions = {
		get: function(name){
			return lang[name];
		}
		,replace_in_DOM: function(){
			// damit im each() ein Zugriff möglich ist
			var get_wrapper = private_functions.get;
			
			jQuery("[data-usi-lang]").each(function(idx, element){
				// füge die Übersetzung als ersten Textknoten ein
				jQuery(element).prepend(
					get_wrapper(jQuery(element).attr("data-usi-lang"))
				);
				// entferne das Attribut
				jQuery(element).removeAttr("data-usi-lang");
			});
		}
	};
	
	return private_functions;
};

var language_controller = language_class();