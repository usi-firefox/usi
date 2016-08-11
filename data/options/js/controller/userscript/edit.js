"use strict";

// Userscript bearbeiten
function userscript_edit_class(){

	var prefered_locale			=	self.options.PreferedLocales[0]; // setze die Standard Sprache
	var textarea_default_size	=	jQuery("#script-textarea").css("font-size").split("px")[0];
	var load_example_by_prefered_locale;
	
	// nur wenn die erste 'prefered_locale' -> 'de' ist, ansonsten wird die Englische Version geladen
	if(prefered_locale === "de"){
		load_example_by_prefered_locale = "de";
	}else{
		load_example_by_prefered_locale = "en";
	}
	
	
	return {

		init : function(){
			// Schalter richtig positionieren lassen ...
			this.defaultSize();
			this.setTextareaHeight();
			
			// Text Area anpassen bei Größen Änderung
			event_manager_controller.register_once(window, "resize", this.setTextareaHeight);
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
			jQuery("#script-textarea").css("height", textarea_height + "px");
		}
		
		/**
		 * Textarea Größe anpassen
		 * @returns {undefined}
		 */
		,changeSize : function () {
			// Setze die Größe der Textarea auf den Wert aus dem Range "Button"
			jQuery("#script-textarea").css("font-size", $scope.textarea_size + "px");
		}
		
		/**
		 * Textarea auf Standard Größe zurücksetzen
		 * @returns {undefined}
		 */
		,defaultSize : function () {
			// Wert des ZOOM Reglers auf den Standard setzen
			var textarea_size = $scope.textarea_default_size;

			// Setze die Größe der Textarea auf den Wert aus dem Range "Button"
			jQuery("#script-textarea").css("font-size", $scope.textarea_default_size + "px");
		}
		
		/**
		 * Userscript aus der Textarea übermitteln
		 * @returns {undefined}
		 */
		,save : function () {
			// Textarea nicht leer ...
			if ($scope.textarea) {
				// sende den Userscript Text an das Addon Skript...
				self.port.emit("USI-BACKEND:new-usi-script_content", {script: $scope.textarea});

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
			jQuery("#script-textarea").css("height", textarea_height + "px");
		}

		/**
		 * Convert Funktionen, falls es Probleme mit den Charset's geben sollte
		 */
		,utf8_to_latin1 : function () {
			try{
				$scope.textarea = unescape(encodeURIComponent($scope.textarea));
			}catch(e){}
		}
		,latin1_to_utf8 : function () {
			try{
				$scope.textarea = decodeURIComponent(escape($scope.textarea));
			}catch(e){}
		}
		
		
	};
};

var userscript_edit_controller = userscript_edit_class();