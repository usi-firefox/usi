"use strict";

function highlightjs_class(){
	
	var is_active = false;
	
	// enthält alle möglich highlight js styles
	var hightlightjsstyles = ["agate" ,"androidstudio" ,"arduino-light" ,"arta" ,"ascetic" ,"atelier-cave-dark" ,"atelier-cave-light" ,"atelier-dune-dark" ,"atelier-dune-light" ,"atelier-estuary-dark" ,"atelier-estuary-light" ,"atelier-forest-dark" ,"atelier-forest-light" ,"atelier-heath-dark" ,"atelier-heath-light" ,"atelier-lakeside-dark" ,"atelier-lakeside-light" ,"atelier-plateau-dark" ,"atelier-plateau-light" ,"atelier-savanna-dark" ,"atelier-savanna-light" ,"atelier-seaside-dark" ,"atelier-seaside-light" ,"atelier-sulphurpool-dark" ,"atelier-sulphurpool-light" ,"brown-paper" ,"codepen-embed" ,"color-brewer" ,"dark" ,"darkula" ,"default" ,"docco" ,"dracula" ,"far" ,"foundation" ,"github-gist" ,"github" ,"googlecode" ,"grayscale" ,"gruvbox-dark" ,"gruvbox-light" ,"hopscotch" ,"hybrid" ,"idea" ,"ir-black" ,"kimbie.dark" ,"kimbie.light" ,"magula" ,"mono-blue" ,"monokai-sublime" ,"monokai" ,"obsidian" ,"paraiso-dark" ,"paraiso-light" ,"pojoaque" ,"purebasic" ,"qtcreator_dark" ,"qtcreator_light" ,"railscasts" ,"rainbow" ,"school-book" ,"solarized-dark" ,"solarized-light" ,"sunburst" ,"tomorrow-night-blue" ,"tomorrow-night-bright" ,"tomorrow-night-eighties" ,"tomorrow-night" ,"tomorrow" ,"vs" ,"xcode" ,"xt256" ,"zenburn"];

	var active_style;
	
	var private_functions = {
		
		fill_in_options: function(id){

			// alle möglichen Styles als Option Tags hinzufügen
			for(var i in hightlightjsstyles){
				var option = jQuery("<option>").val(hightlightjsstyles[i]).text(hightlightjsstyles[i]);

				if(active_style === hightlightjsstyles[i]){
					jQuery(option).prop("selected", true);
				}

				// Option hinzufügen
				jQuery(id + " .selectHighlightJSStyle").append(
					jQuery(option)
				);
			}
			
			// register Event
			// übergib die aufgerufene ID
			jQuery(id + " .selectHighlightJSStyle").on("change", {called_id : id + " .selectHighlightJSStyle"}, private_functions.change_style);
			
		}
		
		, run : function(id){
			// HighlightJS ausführen
			jQuery(id + " pre code").each(function(i, html){
				hljs.highlightBlock(html);
			});
		}
		
		// Funktion zum Laden der nötigen CSS Datei
		,change_style : function(evt){
			// Beispiel:  evt.data.called_id -> #usi-list-entry-id---1471351232788 .selectHighlightJSStyle
			var style = jQuery(evt.data.called_id).val();
			
			// neuen Style setzen
			private_functions.set_active_style(style);
			
			// Pfad zur CSS Datei festlegen
			var style_filepath	=	"../libs/highlight/styles/" + style + ".css";
			// Link auf die neue CSS Datei ändern
			jQuery("#HighlightJSStyle").attr("href", style_filepath);

			// Style speichern
			self.port.emit("USI-BACKEND:highlightjs-style-change", style);
		}
		
		,set_active_style : function(style){
			active_style = style;
		}
	};

	return {
		
		activate : function(change){
			if(typeof change === "boolean"){
				is_active = change;
			}else{
				return is_active;
			}
		}

		// Wrapper
		,fill_in_options: private_functions.fill_in_options
		
		// Wrapper
		,set_active_style : private_functions.set_active_style
		
		// Wrapper
		,run : private_functions.run
	};
	
}

var highlightjs_controller = highlightjs_class();