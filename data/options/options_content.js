/* global self, basic_helper */

/************************************************************************
 ************************* neue skripte anlegen *************************
 ************************************************************************/


// Absende Button für Skript Link
jQuery("#new-script-url-button").click(function () {

	var userscript_url = jQuery("#new-script-url").val();

	// es muss eine URL geben, wo das Skript geladen werden kann 
	// @Todo Überprüfung muss noch verbessert werden
	if (!basic_helper.empty(userscript_url) && basic_helper.is_user_script_ending(userscript_url)) {

		// sende die URL an das Addon Skript...
		self.port.emit("new-usi-script_url", {script_url: userscript_url});

		// prüfe ob es neue Skripte gibt, wahrscheinlich schon...
		reload_scripts();
	} else {
		// Fehler zeigen
		show_error("Du musst eine Url angeben wo dein User Script zu finden ist, ansonsten kannst du nicht weitermachen.",
				"#new-script-url");
	}

});

// Absende Button für Skript Textarea
jQuery("#new-script-textarea-button").click(function () {

	var userscript_text = jQuery("#new-script-textarea").val();

	// sende den Userscript Text an das Addon Skript...
	self.port.emit("new-usi-script_content", {script: userscript_text});

	// prüfe ob es neue Skripte gibt, wahrscheinlich schon...
	reload_scripts();
});

// leere die Textbox
jQuery("#clear-textarea-button").click(function (){
	// zunächst den focus entfernen und dann alles leeren
	focusAndResetTextarea();
});

function focusAndResetTextarea(){
	// zunächst den focus entfernen und dann alles leeren
	jQuery("#new-script-textarea").blur();
	jQuery("#new-script-textarea").html(" ");
	jQuery("#new-script-textarea").text(" ");
	jQuery("#new-script-textarea").val(" ");
}

// Beispiel für die Textbox laden
jQuery("#load-example-textarea-button").click(function (){
	// zunächst den focus entfernen und dann alles leeren
	focusAndResetTextarea();
	var example = jQuery("#example-textarea").clone().text();
	// jetzt den Beispiel Code einfügen!
	// setze dies als Beispiel ein
	jQuery("#new-script-textarea").text(example).val(example);
});

self.port.on("same-userscript-was-found",function (userscript_infos){
	
	if(window.confirm("Ein Userscript mit den gleichen Einstellungen (usi-id: '" + userscript_infos.id + "') \n\
wurde gefunden, möchtest du es aktualisieren?")){
		// Dieses Skript wird nun aktualisiert! userscript_infos = {id : id , userscript: userscript}
		self.port.emit("override-same-userscript", userscript_infos);
	}
});

/************************************************************************
 ************************* bisherige skripte ansehen ********************
 ************************************************************************/

// Liste alle verfügbaren Skripte auf
self.port.on("list-all-scripts", function (all_scripts) {

	// Prüfe ob überhaupt etwas gekommen ist!
	if (basic_helper.isset(all_scripts)) {
		
		// zurücksetzen der aktuellen Anzeige!
		jQuery("#loadedUserscripts").html(" ");

		var counter = 0;
		// Durchlaufe alle übergebenen Skripte
		for (var i in all_scripts) {
			// führe ein geladenes Skript auf
			show_script_entry(all_scripts[i]);
			
			counter++;
		}
		
		// Schreibe die Anzahl der Userscripts ins Template!
		jQuery("#currentCountUserscripts").html(counter);
	}
});

// führe ein geladenes Skript auf
function show_script_entry(script) {

	// Ersetze die Platzhalter ...
	var script_options_template = jQuery("#loadedUserscripts_template").html();

	// Schneller workaround ... es wird irgendwie aufgerufen, obwohl die Seite nicht geladen wird ?!?!?
	if (basic_helper.is_string(script_options_template)) {

		// durchlaufe jeden Punkt des Skripts...
		for (var key in script) {
			var search = new RegExp("###" + key + "###", "g");

			// die einzelnen Bestandteile müssen, gesondert behandelt werden
			switch (key) {
				case "deactivated":
					// Wenn deactivated auf true steht, ist das Skript natürlich deaktiviert...
					var value_for_replace = (script[key]) ? "<span style=\"color:red;\">Ja</span>" : "Nein";
					break;
				case "script":
					// escape auf jeden Fall das Skript!
					var value_for_replace = basic_helper.escapeHTMLEntities(script[key]);
					break;
				case "settings":
					
					// @TODO Dies müssen wir später noch ändern! ...
					var search = new RegExp("###" + key + "\.include###", "g");
					
					//durchlaufe die einzelnen Settings ...
					for(var script_key in script.settings){
						
						var search = new RegExp("###settings\." + script_key + "###", "g");
						
						switch (script_key){
							case "include":
								// Damit die Includes ausgelesen werden können
								var value_for_replace = basic_helper.arrayWrap(script.settings[script_key],"<li>","</li>");
								break;
							default:
								var value_for_replace = script.settings[script_key];
								break;
							
						}
						
						// einsetzen!
						script_options_template = script_options_template.replace(search, value_for_replace);
					}
					
					// @todo ACHTUNG!!! 
					// hier wird die Schleife übersprungen, da es direkt ins script_options_template zurückgeschrieben wird!
					continue;
					
				default:
					var value_for_replace = script[key];
					break;
			}

			// einsetzen!
			script_options_template = script_options_template.replace(search, value_for_replace);

		}

		// nicht gesetzte Platzhalter mit "--nicht gesetzt--" ersetzen
		script_options_template = script_options_template.replace(/###(.*)###/g, "--nicht gesetzt--");


		// Löschen Button hinzufügen
		var del_button = jQuery("<button>").click(function () {

			// das Skript mit der ID löschen!
			if (!basic_helper.empty(script.id)) {
				//zusätzliche Abfrage
				if(window.confirm("Möchtest du dieses Userscript (usi-id: '"+script.id+"') wirklich löschen?")){
					self.port.emit("delete-script-by-id", script.id);
				}
			}

		}).html("löschen (X)").addClass("delete");
		
		// Bearbeiten Button hinzufügen
		var edit_button = jQuery("<button>").click(function () {
			jQuery("#new-script-textarea").html(" ");
			// füge das Userscript in die Texteingabe
			jQuery("#new-script-textarea").text(script.userscript);
			
			// scrolle gleich zur Texteingabe! .. und setze den Focus
			scrollto("#new-script-textarea"); 
			jQuery("#new-script-textarea").focus();
			
		}).html("bearbeiten");
		
		// Anzeige Button hinzufügen
		var toggle_button = jQuery("<button>").click(function () {
			// zeige das aktuelle Element an, oder verstecke es!
			jQuery("#userscript-" + script.id).toggle();
			
		}).html("zeigen/ausblenden");
		
		// De-/aktivieren Button hinzufügen
		var activate_button = jQuery("<button>").click(function () {
			// aktiviere oder deaktiviere dieses Userscript!
			self.port.emit("toggle-userscript-state", script.id);
			
			// lade alle Skripte erneut nach!
			reload_scripts();
		}).html("aktivieren/deaktivieren");
		
		// Elemente hinzufügen!
		jQuery("#loadedUserscripts")
				.append(jQuery("<hr />"))
				.append(toggle_button)
				.append(edit_button)
				.append(activate_button)
				.append(del_button)
				.append(script_options_template);

	}
}

// zeige den aktuellen Speicherverbrauch
self.port.on("storage-quota", function (quota) {
	var rounded_quota = Math.round(quota * 100) / 100 + "";

	// falls ein Komma enthalten sein sollte ...
	rounded_quota = rounded_quota.replace(".", ",");

	jQuery("#currentMemoryUsage").html("Aktueller Belegter Speicherverbauch : " + rounded_quota + "%");
});

/************************************************************************
 ************************* bisherige skripte löschen ********************
 ************************************************************************/

// Wenn das skript gelöscht wurde
self.port.on("delete-script-is-now-deleted", function (script_was_deleted) {
	if (script_was_deleted == true) { // script wurde erfolgreich gelöscht
		
		window.alert("Userscript wurde erfolgreich gelöscht");
		
		// Schicke alle bisher verfügbaren Skripte! Erneut!!!
		reload_scripts();
	} else { // script konnte nicht gelöscht werden

		window.alert("Userscript konnte nicht erfolgreich gelöscht werden");

	}
});


// zeige alle Skripte an
function reload_scripts() {
	self.port.emit("request-for---list-all-scripts", false);
}

/************************************************************************
 ************************* UI Funktionen ********************************
 ************************************************************************/

//verkleinere oder vergrößere die Textarea
jQuery("#bigger-textarea-button").click(function(){
	inOrDecreaseTextarea(0.1);
});
jQuery("#smaller-textarea-button").click(function(){
	inOrDecreaseTextarea(-0.1);
});

function inOrDecreaseTextarea(difference){
	var font_size = jQuery("textarea").css("font-size");
	// entferne "px" suffix
	font_size = parseFloat(font_size.split("px").join());
	
	// sinnvoll wäre + oder - 0,1
	font_size = font_size + difference;
	jQuery("textarea").css("font-size", font_size + "px");	
}

// Zeige einen Fehler an! Wenn es das Addon Skript sagt...
self.port.on("show-error", function (text) {
	show_error(text);
});


function show_error(text, jump_to_element) {
	// schnelle Variante zur Fehler Darstellung
	window.alert(text);

	// Wenn es gesetzt ist springe zu diesem Element
	if (basic_helper.isset(jump_to_element)) {
		// speichere letzten Zustand
		var last_css = jQuery(jump_to_element).css("border");

		// Setze den Focus auf das URL Feld
		jQuery(jump_to_element).css("border", "2px dotted red").focus();

		// zurücksetzen der Markierung
		window.setTimeout(function () {
			jQuery(jump_to_element).css("border", last_css);
		}, 2500);
	}
}



// Alles Löschen Button
jQuery("#deleteAll").click(function (){
	if(window.confirm("Möchtest du wirklich sämtliche Einstellungen zurücksetzen?")){
		if(window.confirm("Bist du dir absolut sicher? Es wird keine weitere Sicherheistabfrage geben!")){
			// Doppelte Sicherheitsabfrage, bevor wirklich alles gelöscht wird!
			self.port.emit("delete-everything");
			
			reload_scripts();
		}
	}
});

// damit zu einem Element hingescrollt werden kann ...
function scrollto(element){ $('html, body').animate({ scrollTop: ($(element).offset().top)}, 'slow'); };



// Prüfe ob für die Skripte Updates gefunden wurden!
jQuery("#checkForUserscriptUpdates").click(function (){
	self.port.emit("check-for-userscript-updates");
});

// Es wurde eine andere Version vom Skript gefunden
// Frage ob der Benutzer das Skript aktualisieren möchte
self.port.on("update-for-userscript-available", function (userscript_infos){
	if(window.confirm("Für das Skript (usi-id: '" + userscript_infos.id + "' ) wurde eine Aktualisierung gefunden\nmöchtest du es aktualisieren?")){
		
		// Nun das Skript aktualisieren!
		self.port.emit("override-same-userscript", userscript_infos);
	}
});


/************************************************************************
 ************************* Init Bereich *********************************
 ************************************************************************/


jQuery(document).ready(function (){
	// lade alle Skripte nach!
	reload_scripts();
});






