"use strict";

/* global self,basic_helper, language_controller, highlightjs_controller, backend_events_controller, bootstrap_toggle_controller, event_manager_controller, lang */


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
		var deliver_vars = flatten_keys(script, "userscript");
		var usi_list_entry_id = "usi-list-entry-id---" + script.id;
		var usi_list_entry_id_plus_class = "#" + usi_list_entry_id + " .usi-list-entry-";
				
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
				backend_events_controller.api.emit("USI-BACKEND:export-userscript", script.id);
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
			 * @returns void
			 */
			, toggleActivation: function () {
				// aktiviere oder deaktiviere dieses Userscript!
				backend_events_controller.api.emit("USI-BACKEND:toggle-userscript-state", script.id);
				
			}

			// fragt nach den gesetzten Greasemonkey Variablen
			, getGMValues: function () {
				backend_events_controller.api.emit("USI-BACKEND:list-GMValues", script.id);
			}

			/**
			 * Userscript entfernen
			 * @returns {void}
			 */
			, delete: function () {
				// das Skript mit der ID löschen!
				if (!basic_helper.empty(script.id)) {
					//zusätzliche Abfrage
					if (window.confirm(lang["want_to_delete_this_userscript_1"] + script.id + lang["want_to_delete_this_userscript_2"])) {

						// @todo erstmal abschalten!!!
						backend_events_controller.api.emit("USI-BACKEND:delete-script-by-id", script.id);

						backend_events_controller.api.emit("USI-BACKEND:request-for---list-all-scripts");
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
			, testUrlMatch: function () {
				var url = jQuery(usi_list_entry_id_plus_class + "includes-testurl").val();
				
				// Backend anfragen
				backend_events_controller.api.emit("USI-BACKEND:test-url-match", {url: url, id: script.id});
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
				// highlightCode
				private_functions.highlightCode();
				
				jQuery(usi_list_entry_id_plus_class + "view-userscript---output").toggle();
				
				jQuery(usi_list_entry_id_plus_class + "view-userscript---show").toggle();
				jQuery(usi_list_entry_id_plus_class + "view-userscript---hide").toggle();
			}
			
			// register Button Events
			, register_buttons : function(){
				
				// Export Button
				event_manager_controller.register_once(usi_list_entry_id_plus_class + "export" ,"click", private_functions.export);
								
				// Userscript de/-aktivieren
				jQuery(usi_list_entry_id_plus_class + "deactivated").prop("checked",script.deactivated);

				// ACHTUNG hierbei müssen Aktiviert und Deaktiviert getauscht werden
				// Da -> script.deactivated === true , bedeutet dass das Skript deaktiviert ist!
				bootstrap_toggle_controller.initButton(usi_list_entry_id_plus_class + "deactivated",
					lang["deactivated"],
					lang["activated"]
				);
				// ACHTUNG hierbei müssen Aktiviert und Deaktiviert getauscht werden
				
				event_manager_controller.register_once(usi_list_entry_id_plus_class + "deactivated" ,"change", private_functions.toggleActivation);
				
				// edit
				event_manager_controller.register_once(usi_list_entry_id_plus_class + "edit" ,"click", private_functions.edit);
				// delete
				event_manager_controller.register_once(usi_list_entry_id_plus_class + "delete" ,"click", private_functions.delete);

				// Wenn das Userscript von einer URL geladen wurde
				if(!basic_helper.empty(script.moreinformations) && !basic_helper.empty(script.moreinformations.url)){
					// von der URL neuladen
					event_manager_controller.register_once(usi_list_entry_id_plus_class + "load-again" ,"click", private_functions.loadAgain);
				}else{
					// Nicht vorhanden daher ausblenden
					jQuery(usi_list_entry_id_plus_class + "load-again---block").hide();
				}
				
				// GM-Values holen
				event_manager_controller.register_once(usi_list_entry_id_plus_class + "get-gm-values" ,"click", private_functions.getGMValues);
                
                // Event zum Daten erhalten einmalig registrieren
         		backend_events_controller.api.on("USI-BACKEND:list-GMValues-done-" + script.id, function (GMValues) {
					jQuery(usi_list_entry_id_plus_class + "get-gm-values---output").
                        html(""). // leeren
                        html(GMValues);
				});

                // Bootstrap Toggle
				bootstrap_toggle_controller.initButton(usi_list_entry_id_plus_class + "view-userscript", 
					lang["show"],  
					lang["hide"]
				);
				
				// Userscript Inhalt anzeigen/ausblenden
				event_manager_controller.register_once(usi_list_entry_id_plus_class + "view-userscript" ,"change", private_functions.showUserscript);
				
				// Ergebnis des URL Tests empfangen --- START
				var last_state = false;

				backend_events_controller.api.on("USI-BACKEND:test-url-match-" + script.id, function (state) {
					// Treffer => true
					if (last_state !== state) {
						// sichern
						last_state = state;
						// Symbol ändern
						jQuery(usi_list_entry_id_plus_class + "includes-testurl-state" ).toggleClass("fa-close").toggleClass("fa-check");
					}
				});
				// Ergebnis des URL Tests empfangen --- END
				
				// URL Test gegen die Includes
				event_manager_controller.register_once(usi_list_entry_id_plus_class + "includes-testurl" ,"keyup", private_functions.testUrlMatch);
				
				
				// Ausgabe jedoch zunächst ausblenden
				jQuery(usi_list_entry_id_plus_class + "view-userscript---output").hide();
				jQuery(usi_list_entry_id_plus_class + "view-userscript---hide").hide();

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
