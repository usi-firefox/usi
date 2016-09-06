"use strict";

/* global self */

// verwaltet die Übersetzungen
var language_controller = (function language_class(){
	var lang	=	self.options.language;
	
	var private_functions = {
        // für direkten Zugriff
		lang: function(){
			return lang;
		}
		,replace_in_DOM: function(){
			jQuery("[data-usi-lang]").each(function(idx, element){
				// füge die Übersetzung als ersten Textknoten ein
				jQuery(element).prepend(
					lang[jQuery(element).attr("data-usi-lang")]
				);
				// entferne das Attribut
				jQuery(element).removeAttr("data-usi-lang");
			});
		}
	};
	
	return private_functions;
}()),
lang = language_controller.lang();