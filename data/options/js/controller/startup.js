"use strict";

/* global backend_events_controller, frontend_events_controller, template_controller, language_controller, event_manager_controller, self */

var global_settings = {};

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

    // HighlightJS Default CSS
    jQuery("head").append(
        jQuery("<link>").attr("id", "HighlightJSStyle" ).attr("href", self.options.baseurl + "libs/highlight/styles/default.css").attr("type", "text/css").attr("rel", "stylesheet")
    );

    // Eigenes CSS hinzufügen
    jQuery("head").append(
        jQuery("<style>").attr("id", "usi-additional-css").attr("type", "text/css")
    );

	// initialisiere die globalen Events für die Kommunikation mit dem Backend
	backend_events_controller.register_global_events();
	
    backend_events_controller.request.config.all();

	// suche nach der Klasse load_template, diese benötigt das data Attribut "usiurl" darin wird der Name des Templates angegeben
	event_manager_controller.register_once(".load_template" ,"click", function () {
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
    
    
	// Toggle Menu
    event_manager_controller.register_once("#menu_toggle" ,"click", function() {
        jQuery("body").toggleClass("sidebar-left-visible sidebar-left-in");
    });
    event_manager_controller.register_once(".load_template" ,"click", function() {
        jQuery("body").removeClass("sidebar-left-visible sidebar-left-in");
    });
});