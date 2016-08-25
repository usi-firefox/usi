"use strict";

// Bootstrap Toggle
function bootstrap_toggle_class(){
	return{
		run : function(){
			if (jQuery("[data-toggle]")[0]) {
				jQuery("[data-toggle]").bootstrapToggle();
			}
		}
		,initButton : function(selector, on_text, off_text){
			var width = null;
			// ermittele die passende Breite
			if(on_text.length <= off_text.length){
				width = (off_text.length * 10);
			}
			
			// initialisiert einen Button
			jQuery(selector).bootstrapToggle({
				on: on_text
				,off : off_text
				,width : width
			});
		}
	};
};
// 

var bootstrap_toggle_controller = bootstrap_toggle_class();