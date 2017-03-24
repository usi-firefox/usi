"use strict";

/* global self */

// verwaltet die Übersetzungen
var language_controller = (function language_class(){
	return  {
        // für direkten Zugriff
		lang: self.options.language
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

}()),
lang = language_controller.lang;