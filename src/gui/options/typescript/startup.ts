"use strict";

declare var jQuery: any;
declare var browser: any;

import event_controller from "events/event_controller";
import event_manager_controller from "events/event_manager";
import template_controller from "template";
import language_controller from "language";
import config_storage from "lib/storage/config";
import userscript_config_controller from "userscript/config";



/**
 * @todo !!!! in highlight.js prüfen!
 */
var global_settings = {};

/* jQuery().ready(function () { */
// INIT

// initialisiere die globalen Events für die Kommunikation mit dem Backend
event_controller().register_global_events();

config_storage().get().then((config) => {
    // Eigenes CSS
    if (typeof config.own_css === "string") {
        let css_text = config.own_css.replace(/<\/?[^>]+>/gi, '');
        // CSS aktivieren
        userscript_config_controller().activate_css(css_text);
    }

    global_settings = config;
});

// suche nach der Klasse load_template, diese benötigt das data Attribut "usiurl" darin wird der Name des Templates angegeben
// @todo !!!
event_manager_controller().register_once(".load_template", "click", function (this: HTMLAnchorElement) {
    var name = jQuery(this).attr("data-usi-templateurl");
    if (name) {
        template_controller().load(name);
    }
});

// ersetze das Versionslabel
var manifest = browser.runtime.getManifest();

jQuery("#usi-version").loadTemplate(jQuery("#usi-version-template"), {version: manifest.version});

// Initialisiere die Frontend Events
event_controller().register.frontend_events();

// ersetze alle Language Keys!
language_controller().replace_in_DOM();

// Initial die Übersicht laden
template_controller().load("overview");
// INIT


// Toggle Menu
event_manager_controller().register_once("#menu_toggle", "click", function () {
    jQuery("body").toggleClass("sidebar-left-visible sidebar-left-in");
});
event_manager_controller().register_once(".load_template", "click", function () {
    jQuery("body").removeClass("sidebar-left-visible sidebar-left-in");
});
/* }); */