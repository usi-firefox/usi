"use strict";

function highlightjs_class(){
	
	var is_active = false;
	
	// enthält alle möglich highlight js styles
	var hightlightjsstyles = ["agate" ,"androidstudio" ,"arduino-light" ,"arta" ,"ascetic" ,"atelier-cave-dark" ,"atelier-cave-light" ,"atelier-dune-dark" ,"atelier-dune-light" ,"atelier-estuary-dark" ,"atelier-estuary-light" ,"atelier-forest-dark" ,"atelier-forest-light" ,"atelier-heath-dark" ,"atelier-heath-light" ,"atelier-lakeside-dark" ,"atelier-lakeside-light" ,"atelier-plateau-dark" ,"atelier-plateau-light" ,"atelier-savanna-dark" ,"atelier-savanna-light" ,"atelier-seaside-dark" ,"atelier-seaside-light" ,"atelier-sulphurpool-dark" ,"atelier-sulphurpool-light" ,"brown-paper" ,"codepen-embed" ,"color-brewer" ,"dark" ,"darkula" ,"default" ,"docco" ,"dracula" ,"far" ,"foundation" ,"github-gist" ,"github" ,"googlecode" ,"grayscale" ,"gruvbox-dark" ,"gruvbox-light" ,"hopscotch" ,"hybrid" ,"idea" ,"ir-black" ,"kimbie.dark" ,"kimbie.light" ,"magula" ,"mono-blue" ,"monokai-sublime" ,"monokai" ,"obsidian" ,"paraiso-dark" ,"paraiso-light" ,"pojoaque" ,"purebasic" ,"qtcreator_dark" ,"qtcreator_light" ,"railscasts" ,"rainbow" ,"school-book" ,"solarized-dark" ,"solarized-light" ,"sunburst" ,"tomorrow-night-blue" ,"tomorrow-night-bright" ,"tomorrow-night-eighties" ,"tomorrow-night" ,"tomorrow" ,"vs" ,"xcode" ,"xt256" ,"zenburn"];

	var active_style = hightlightjsstyles[0];

	return {
		activate : function(change){
			if(typeof change === "boolean"){
				is_active = change;
			}else{
				return is_active;
			}
		}

		,fill_in_options: function(){
			// alle möglichen Styles als Option Tags hinzufügen
			jQuery(".selectHighlightJSStyle").each(function(){
				for(var i in hightlightjsstyles){
					var option = jQuery("<option>").val(hightlightjsstyles[i]);
					jQuery(option).text(hightlightjsstyles[i]);
					// Option hinzufügen
					jQuery(this).append(
						jQuery(option)
					);
				}
			});
			
		}
		
		,set_active_style : function(style){
			active_style = style;
		}
		
		,get_active_style : function(){
			return active_style;
		}
		
		// Funktion zum Laden der nötigen CSS Datei
		,change_style : function(style){
			
			this.set_active_style(style);
			
			alert("STYLE changed");
			
			// Pfad zur CSS Datei festlegen
			var style_filepath	=	"../libs/highlight/styles/" + style + ".css";
			// Link auf die neue CSS Datei ändern
			jQuery("#HighlightJSStyle").attr("href", style_filepath);
			
//			var style_opt	=	jQuery("#selectHighlightJSStyle-" + index).val();
//			// Style speichern
			self.port.emit("USI-BACKEND:highlightjs-style-set", style);
		}
	};
	
}

var highlightjs_controller = highlightjs_class();