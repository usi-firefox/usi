"use strict";

/* global self,event_manager_controller */

// Userscript bearbeiten
function userscript_edit_class(){

	var prefered_locale
	,textarea_default_size
	,load_example_by_prefered_locale
	,textarea_id
	,script_id;
	
	// nur wenn die erste 'prefered_locale' -> 'de' ist, ansonsten wird die Englische Version geladen
	if(prefered_locale === "de"){
		load_example_by_prefered_locale = "de";
	}else{
		load_example_by_prefered_locale = "en";
	}
	
	// Die ID der Textarea
	textarea_id = "#usi-edit-script-textarea";
	
	var private_functions = {
	
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
			prefered_locale			=	self.options.prefered_locales[0]; // setze die Standard Sprache
			textarea_default_size	=	jQuery(textarea_id).css("font-size").split("px")[0];

			// Text Area anpassen bei Größen Änderung
			event_manager_controller.register_once(window, "resize", private_functions.setTextareaHeight);
			
			// Button Events registieren
			event_manager_controller.register_once("#usi-edit-script-load-example", "click", private_functions.load_example );
			event_manager_controller.register_once("#usi-edit-script-textarea-clear", "click", private_functions.textarea_clear );
			event_manager_controller.register_once("#usi-edit-script-textarea-default-size", "click", private_functions.defaultSize );
			event_manager_controller.register_once("#usi-edit-script-save", "click", private_functions.save );
			event_manager_controller.register_once("#usi-edit-script-textarea-size", "change", private_functions.changeSize );
			
			event_manager_controller.register_once("#usi-edit-script-utf8-to-latin1", "click", private_functions.utf8_to_latin1 );
			event_manager_controller.register_once("#usi-edit-script-latin1-to-utf8", "click", private_functions.latin1_to_utf8 );

			// Schalter richtig positionieren lassen ...
			private_functions.defaultSize();
			private_functions.setTextareaHeight();
			
			// Setze die Script ID in den Kopf, falls vorhanden
			private_functions.change_userscript_id(script_id);

			// Falls ein Userscript zur Editierung übergeben wurde
			event_manager_controller.register_once(document, "USI-FRONTEND:editTab-get-userscript", function(event, userscript){
				// prüfe ob ein Userscript übergeben wurde und trage den Inhalt in die Textarea ein
				if(userscript.userscript){
					jQuery(textarea_id).val(userscript.userscript);
				}
				
				// aktuelle Userscript ID setzen
				if(userscript.id){
					private_functions.change_userscript_id(userscript.id);
				}
				
				// nach ganz oben scrollen
				jQuery(document).scrollTop(0);
			});
		}
		
		// Blendet den Kopfbereich für die Userscript ID ein/aus, und setzt die "script_id"
		, change_userscript_id : function(userscrpt_id){
			// Script ID überschreiben
			script_id = userscrpt_id;
			if(script_id){
				jQuery("#usi-edit-script-id---block").show();
				jQuery("#usi-edit-script-id").html(script_id);
				// Möglichkeit anzugeben, dass ein Userscript überschrieben werden soll
				jQuery("#usi-edit-script-overwrite---block").show();
			}else{
				jQuery("#usi-edit-script-id---block").hide();
				jQuery("#usi-edit-script-id").html("");
				jQuery("#usi-edit-script-overwrite---block").hide();
			}
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
			private_functions.change_userscript_id();
			jQuery(textarea_id).val("");
		}
		
		,load_example : function(){
			// Beispiel Datei laden  
			// Anfrage für das Userscript Beispiel
			backend_events_controller.api.emit("USI-BACKEND:get-userscript-example", load_example_by_prefered_locale);
			// Rückantwort sichern
			backend_events_controller.api.once("USI-BACKEND:get-userscript-example-done", function(data){
				private_functions.textarea_clear();
				jQuery(textarea_id).val(data);
			});
		}
		
		/**
		 * Userscript aus der Textarea übermitteln
		 * @returns {undefined}
		 */
		,save : function () {
			// Textarea nicht leer ...
			if (jQuery(textarea_id).val().length > 20) {
				// sende den Userscript Text an das Addon Skript...
				// Falls eine Userscript ID existiert und es überschrieben werden soll
				if(script_id && jQuery("#usi-edit-script-overwrite").prop("checked")){
					// Vorhandes Userscript überschreiben
					backend_events_controller.api.emit("USI-BACKEND:override-same-userscript", {userscript: jQuery(textarea_id).val(), id: script_id});
				}else{
					// Keine Script ID gegeben
					backend_events_controller.api.emit("USI-BACKEND:new-usi-script_content", {script: jQuery(textarea_id).val()});
				}
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
				jQuery(textarea_id).val(
						unescape(
						encodeURIComponent(
						jQuery(textarea_id).val())));
			}catch(e){}
		}
		,latin1_to_utf8 : function () {
			try{
				jQuery(textarea_id).val(
						decodeURIComponent(
						escape(
						jQuery(textarea_id).val())));
			}catch(e){}
		}
		
	};
	
	// da es hier keine Funktionen gibt die nicht von außen aufgerufen werden dürften kann das komplett Objekt zurückgegeben werden
	return private_functions;
};

var userscript_edit_controller = userscript_edit_class();