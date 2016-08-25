"use strict";

/* global language_controller, basic_helper */

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
			if(basic_helper.empty(on_text)){
				on_text = language_controller.get("activated");
			}
			if(basic_helper.empty(off_text)){
				off_text = language_controller.get("deactivated");
			}
			
			// ermittele die passende Breite
			if(on_text.length <= off_text.length){
				width = (off_text.length * 12);
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