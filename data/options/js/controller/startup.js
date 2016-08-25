"use strict";

/* global backend_events_controller, frontend_events_controller, template_controller, language_controller */

jQuery().ready(function () {
	// INIT

	// Lade alle CSS Dateien nach!
	// cssFiles => self.options.cssFiles
	(function load_required_css_files() {
		var css_files = self.options.css_files;
		for (var i in css_files) {
			jQuery("head").append(jQuery("<link>").attr("href", css_files[i]).attr("type", "text/css").attr("rel", "stylesheet"));
		}
	}());

	// initialisiere die globalen Events für die Kommunikation mit dem Backend
	backend_events_controller.register_global_events();

	// suche nach der Klasse load_template, diese benötigt das data Attribut "usiurl" darin wird der Name des Templates angegeben
	jQuery(".load_template").on("click", function () {
		var name = jQuery(this).attr("data-usi-templateurl");
		if (name) {
			template_controller.load(name);
		}
	});

	// ersetze das Versionslabel
	jQuery("#usi-version").loadTemplate(jQuery("#usi-version-template"),{version : self.options.version});
	
	// Initialisiere die Frontend Events
	frontend_events_controller.init();

	// ersetze alle Language Keys!
	language_controller.replace_in_DOM();

	// Initial die Übersicht laden
	template_controller.load("overview");
	// INIT


	// toggle small or large menu
	// taken from gentelella
    jQuery('#menu_toggle').on('click', function() {
        jQuery('body').toggleClass('nav-md nav-sm');
    });
});