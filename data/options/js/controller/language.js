"use strict";

// verwaltet die Übersetzungen
function language_class(){
	var lang	=	self.options.language;
	
	return {
		get: function(name){
			return lang[name];
		}
		,replace_in_DOM: function(){
			// damit im each() ein Zugriff möglich ist
			var get_wrapper = this.get;
			
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
};

var language_controller = language_class();