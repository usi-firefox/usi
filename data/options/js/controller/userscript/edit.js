"use strict";

// Userscript bearbeiten
function userscript_edit_class(){

	var prefered_locale
	,textarea_default_size
	,load_example_by_prefered_locale
	,textarea_id
	,script_id = 3123213213;
	
	// nur wenn die erste 'prefered_locale' -> 'de' ist, ansonsten wird die Englische Version geladen
	if(prefered_locale === "de"){
		load_example_by_prefered_locale = "de";
	}else{
		load_example_by_prefered_locale = "en";
	}
	
	// Die ID der Textarea
	textarea_id = "#usi-edit-script-textarea";
	
	return {

		// Führe dies aus wenn der Controller zum ersten Mal geladen wurde
		before_rendering : function(){

		}
		
		// liefert die benötigten Variablen für jQuery.loadTemplate zurück
		,deliver_vars : function(){
			return {
				script_id : script_id
			};
		}
		
		// Führe dies aus, sobald das Template geladen wurde
		,after_rendering : function (){
			prefered_locale			=	self.options.PreferedLocales[0]; // setze die Standard Sprache
			textarea_default_size	=	jQuery(textarea_id).css("font-size").split("px")[0];

			// Text Area anpassen bei Größen Änderung
			jQuery(window).on("resize", this.setTextareaHeight);
			
			// Button Events registieren
			jQuery("#usi-edit-script-load-example").on("click", this.load_example );
			jQuery("#usi-edit-script-textarea-clear").on("click", this.textarea_clear );
			jQuery("#usi-edit-script-textarea-default-size").on("click", this.defaultSize );
			jQuery("#usi-edit-script-save").on("click", this.save );
			jQuery("#usi-edit-script-textarea-size").on("change", this.changeSize );
			
			jQuery("#usi-edit-script-utf8-to-latin1").on("click", this.utf8_to_latin1 );
			jQuery("#usi-edit-script-latin1-to-utf8").on("click", this.latin1_to_utf8 );

			// Schalter richtig positionieren lassen ...
			this.defaultSize();
			this.setTextareaHeight();
		}
		
		/**
		 * Höhe der Textarea an die Fenstergröße anpassen!
		 * @returns {undefined}
		 */
		,setTextareaHeight : function () {
			var window_innerHeight = parseInt(window.innerHeight),
					size_by_percent = 65 / 100;

			// Textarea höhe berechnen
			var textarea_height = Math.floor(window_innerHeight * size_by_percent);

			// Größe setzen
			jQuery(textarea_id).css("height", textarea_height + "px");
		}
		
		/**
		 * Textarea Größe anpassen
		 * @returns {undefined}
		 */
		,changeSize : function () {
			// Setze die Größe der Textarea auf den Wert aus dem Range "Button"
			jQuery(textarea_id).css("font-size", jQuery("#usi-edit-script-textarea-size").val() + "px");
		}
		
		/**
		 * Textarea auf Standard Größe zurücksetzen
		 * @returns {undefined}
		 */
		,defaultSize : function () {
			// Wert des ZOOM Reglers auf den Standard setzen
			// Setze die Größe der Textarea auf den Wert aus dem Range "Button"
			jQuery(textarea_id).css("font-size", textarea_default_size + "px");
			
			jQuery("#usi-edit-script-textarea-size").val(textarea_default_size);
		}
		
		,textarea_clear : function(){
			jQuery(textarea_id).text(null);
		}
		
		,load_example : function(){
			// Beispiel Datei laden  
			// Anfrage für das Userscript Beispiel
			self.port.emit("USI-BACKEND:get-userscript-example", load_example_by_prefered_locale);
			// Rückantwort sichern
			self.port.once("USI-BACKEND:get-userscript-example-done", function(data){
				jQuery(textarea_id).text(data);
			});
			
		}
		
		/**
		 * Userscript aus der Textarea übermitteln
		 * @returns {undefined}
		 */
		,save : function () {
			// Textarea nicht leer ...
			if (jQuery(textarea_id).text().length > 20) {
				// sende den Userscript Text an das Addon Skript...
				self.port.emit("USI-BACKEND:new-usi-script_content", {script: jQuery(textarea_id).text()});

				self.port.emit("USI-BACKEND:request-for---list-all-scripts");
			}
		}

		/**
		 * Textarea in einen Vollbild Modus schalten!
		 * @returns {undefined}
		 */
		,textarea_to_fullscreen : function () {
			var window_innerHeight = parseInt(window.innerHeight),
					size_by_percent = 75 / 100;

			// Textarea höhe berechnen
			var textarea_height = Math.floor(window_innerHeight * size_by_percent);

			// Größe setzen
			jQuery(textarea_id).css("height", textarea_height + "px");
		}

		/**
		 * Convert Funktionen, falls es Probleme mit den Charset's geben sollte
		 */
		,utf8_to_latin1 : function () {
			try{
				jQuery(textarea_id).text(
						unescape(
						encodeURIComponent(
						jQuery(textarea_id).text())));
			}catch(e){}
		}
		,latin1_to_utf8 : function () {
			try{
				jQuery(textarea_id).text(
						decodeURIComponent(
						escape(
						jQuery(textarea_id).text())));
			}catch(e){}
		}
		
	};
};

var userscript_edit_controller = userscript_edit_class();