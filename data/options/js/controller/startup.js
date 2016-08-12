"use strict";

jQuery().ready(function () {

	// Lade alle CSS Dateien nach!
	// cssFiles => self.options.cssFiles
	function load_required_css_files(cssFiles) {
		var css_files = cssFiles;
		for (var i in css_files) {
			jQuery("head").append(jQuery("<link>").attr("href", css_files[i]).attr("type", "text/css").attr("rel", "stylesheet"));
		}
	}
	// Lade alle CSS Dateien nach! -> Start
	load_required_css_files(self.options.cssFiles);


	// suche nach der Klasse load_template, diese benötigt das data Attribut "usiurl" darin wird der Name des Templates angegeben
	jQuery(".load_template").on("click", function () {
		var name = jQuery(this).attr("data-usi-templateurl");
		if (name) {
			template_controller.load(name);
		}
	});

	// ersetze das Versionslabel
	jQuery("#usi-version").loadTemplate(jQuery("#usi-version-template"),{version : self.options.version});
	

	// INIT

	// ersetze alle Language Keys!
	language_controller.replace_in_DOM();

	// Initial die Übersicht laden
	template_controller.load("overview");
	// INIT

});