"use strict";

/* global self,basic_helper, language_controller, highlightjs_controller */


function flatten_keys(obj, prepend_key, result) {
	var key;
	if (typeof result === "undefined") {
		result = {};
	}
	for (var i in obj) {
		key = prepend_key + "-" + i;
		if (typeof obj[i] === "object") {
			flatten_keys(obj[i], key, result);
		} else {
			result[key] = obj[i];
		}
	}

	return result;
}

function userscript_list_entry_class(script, index) {

	if (!basic_helper.empty(script.userscript) && !basic_helper.empty(script.id)) {

		/**
		 * erstellt die Variablen die im Template ersetzt werden sollen
		 * START
		 */
		var deliver_vars = flatten_keys(script, "userscript"),
		usi_list_entry_id = "usi-list-entry-id---" + script.id,
		usi_list_entry_id_plus_class = "#" + usi_list_entry_id + " .usi-list-entry-";
				
		// Index hinzufügen
		deliver_vars["index"] = index;

		// Userscript ID hinterlegen
		deliver_vars["usi-list-entry-id"] = usi_list_entry_id;

		// Icon ID hinzufügen
		deliver_vars["icon_data_id"] = "usi-list-userscript-settings-icon_data---" + script.id;

		/**
		 * erstellt die Variablen die im Template ersetzt werden sollen
		 * END
		 */

		 var highlightjs_already_done = false;

		var private_functions = {
			export: function () {
				// aktiviere oder deaktiviere dieses Userscript!
				self.port.emit("USI-BACKEND:export-userscript", script.id);
			}
			, add_icon: function () {
				// Icon mit usi logo füllen, falls leer
				var icon_path;
				if (basic_helper.empty(deliver_vars["userscript-settings-icon_data"])) {
					icon_path = "/data/icon/usi.png";
				} else {
					icon_path = deliver_vars["userscript-settings-icon_data"];
				}

				// Icon hinzufügen
				jQuery("<img>").
						attr("id", deliver_vars["icon_data_id"]).
						attr("src", icon_path).
						appendTo("#" + deliver_vars["icon_data_id"]);
			}
			/**
			 * Userscript aktivieren, bzw deaktivieren
			 * @param {type} userscript
			 * @returns void
			 */
			, toggleActivation: function () {
				// aktiviere oder deaktiviere dieses Userscript!
				self.port.emit("USI-BACKEND:toggle-userscript-state", script.id);
				
			}



			// fragt nach den gesetzten Greasemonkey Variablen
			, getGMValues: function () {
				self.port.emit("USI-BACKEND:list-GMValues", script.id);

				self.port.once("USI-BACKEND:list-GMValues-done-" + script.id, function (GMValues) {
					jQuery(usi_list_entry_id_plus_class + "get-gm-values---output").html(GMValues);
				});
			}


			/**
			 * Userscript entfernen
			 * @param {type} userscript
			 * @returns {undefined}
			 */
			, delete: function () {
				// das Skript mit der ID löschen!
				if (!basic_helper.empty(script.id)) {
					//zusätzliche Abfrage
					if (window.confirm(language_controller().get("want_to_delete_this_userscript_1") + script.id + language_controller().get("want_to_delete_this_userscript_2"))) {

						// @todo erstmal abschalten!!!
						self.port.emit("USI-BACKEND:delete-script-by-id", script.id);

						self.port.emit("USI-BACKEND:request-for---list-all-scripts");
					}
				}
			}

			// Sende es an den Editierungs Controller
			, edit: function () {
				// veranlasse den Tab Wechsel!
				jQuery(document).trigger("USI-FRONTEND:changeTab", ["edit", script]);
			}

			// Übergibt die URL an die Nachlade Funktion
			, loadAgain: function () {
				// veranlasse den Tab Wechsel!
				jQuery(document).trigger("USI-FRONTEND:changeTab", ["load_external", script.moreinformations.url]);
			}

			// testet die eingebene URL ob ein Include darauf greifen(matchen) würde
			, testUrlMatch: function (evt) {
				var url = jQuery(usi_list_entry_id_plus_class + "includes-testurl").val();
				
				// Backend anfragen
				self.port.emit("USI-BACKEND:test-url-match", {url: url, id: script.id});
				
				var last_state = false;

				// Ergebnis zustand zurückschreiben
				self.port.once("USI-BACKEND:test-url-match-" + script.id, function (state) {
					// Treffer => true
					if (last_state !== state) {
						// sichern
						last_state = state;

						// Symbol ändern
						jQuery(usi_list_entry_id_plus_class + "includes-testurl-state" ).toggleClass("fa-close").toggleClass("fa-check");

					}
				});
			}

			// Code highlight
			, highlightCode: function () {

				if(highlightjs_already_done === false){
					highlightjs_controller.fill_in_options("#" + usi_list_entry_id);

					highlightjs_controller.run("#" + usi_list_entry_id);
					
					// damit es nicht ein weiteres mal durchgeführt werden muss
					highlightjs_already_done = true;
				}

			}
			
			, showUserscript : function(){
//				var state = jQuery(usi_list_entry_id_plus_class + "view-userscript").prop("checked");
				
				// highlightCode
				private_functions.highlightCode();
				
				jQuery(usi_list_entry_id_plus_class + "view-userscript---output").toggle();
			}
			
			// register Button Events
			, register_buttons : function(){
				
				// Export Button
				jQuery(usi_list_entry_id_plus_class + "export").on("click", private_functions.export);
								
				// Userscript de/-aktivieren
				jQuery(usi_list_entry_id_plus_class + "deactivated").prop("checked",script.deactivated);
				jQuery(usi_list_entry_id_plus_class + "deactivated").on("change", private_functions.toggleActivation);
				
				// edit
				jQuery(usi_list_entry_id_plus_class + "edit").on("click", private_functions.edit);
				// delete
				jQuery(usi_list_entry_id_plus_class + "delete").on("click", private_functions.delete);

				// Wenn das Userscript von einer URL geladen wurde
				if(!basic_helper.empty(script.moreinformations) && !basic_helper.empty(script.moreinformations.url)){
					// von der URL neuladen
					jQuery(usi_list_entry_id_plus_class + "load-again").on("click", private_functions.loadAgain);
				}else{
					// Nicht vorhanden daher ausblenden
					jQuery(usi_list_entry_id_plus_class + "load-again---block").hide();
				}
				
				// GM-Values holen
				jQuery(usi_list_entry_id_plus_class + "get-gm-values").on("click", private_functions.getGMValues);
				
				// Userscript Inhalt anzeigen/ausblenden
				jQuery(usi_list_entry_id_plus_class + "view-userscript").on("change", private_functions.showUserscript);
				
				// URL Test gegen die Includes
				jQuery(usi_list_entry_id_plus_class + "includes-testurl").on("keyup", private_functions.testUrlMatch);
				
				
				// Ausgabe jedoch zunächst ausblenden
				jQuery(usi_list_entry_id_plus_class + "view-userscript---output").hide();

				// Required Scripts
				if(!basic_helper.empty(script.require_scripts)){
					for(var i in script.require_scripts){
						jQuery(usi_list_entry_id_plus_class + "required-scripts---output").append(
							jQuery("<li>").html(script.require_scripts[i].url)
						);
					}
				}else{
					jQuery(usi_list_entry_id_plus_class + "required-scripts").hide();
				}
				
				// Include Regeln
				if(!basic_helper.empty(script.settings.include)){
					for(var i in script.settings.include){
						jQuery(usi_list_entry_id_plus_class + "includes---output").append(
							jQuery("<li>").html(script.settings.include[i])
						);
					}
				}else{
					// Das darf eigentlich nicht passieren ...
				}
				
				
			}
			
		};



		return {
			// liefert die benötigten Variablen für jQuery.loadTemplate zurück
			deliver_vars: function () {
				return deliver_vars;
			}

			, after_rendering: function () {

				// Icon hinzufügen
				private_functions.add_icon();
				
				// Button Events registieren
				private_functions.register_buttons();

				// Sprachspezifische Variablen ersetzen
				language_controller.replace_in_DOM();
			}

		};

	} else {
		return false;
	}
}
