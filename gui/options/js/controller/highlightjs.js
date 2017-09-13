"use strict";

/* global event_controller, event_manager_controller, hljs, global_settings, config_storage */

var highlightjs_controller = (function highlightjs_class() {

    var active_style,
        highlight_styles_path = "libs/highlight/styles/",
        // enthält alle verfügbaren highlight js styles
        hightlightjsstyles = [
            "agate"
                , "androidstudio"
                , "arduino-light"
                , "arta"
                , "ascetic"
                , "atelier-cave-dark"
                , "atelier-cave-light"
                , "atelier-dune-dark"
                , "atelier-dune-light"
                , "atelier-estuary-dark"
                , "atelier-estuary-light"
                , "atelier-forest-dark"
                , "atelier-forest-light"
                , "atelier-heath-dark"
                , "atelier-heath-light"
                , "atelier-lakeside-dark"
                , "atelier-lakeside-light"
                , "atelier-plateau-dark"
                , "atelier-plateau-light"
                , "atelier-savanna-dark"
                , "atelier-savanna-light"
                , "atelier-seaside-dark"
                , "atelier-seaside-light"
                , "atelier-sulphurpool-dark"
                , "atelier-sulphurpool-light"
                , "atom-one-dark"
                , "atom-one-light"
                , "brown-paper"
                , "codepen-embed"
                , "color-brewer"
                , "darcula"
                , "dark"
                , "darkula"
                , "default"
                , "docco"
                , "dracula"
                , "far"
                , "foundation"
                , "github-gist"
                , "github"
                , "googlecode"
                , "grayscale"
                , "gruvbox-dark"
                , "gruvbox-light"
                , "hopscotch"
                , "hybrid"
                , "idea"
                , "ir-black"
                , "kimbie.dark"
                , "kimbie.light"
                , "magula"
                , "mono-blue"
                , "monokai-sublime"
                , "monokai"
                , "obsidian"
                , "ocean"
                , "paraiso-dark"
                , "paraiso-light"
                , "pojoaque"
                , "purebasic"
                , "qtcreator_dark"
                , "qtcreator_light"
                , "railscasts"
                , "rainbow"
                , "school-book"
                , "solarized-dark"
                , "solarized-light"
                , "sunburst"
                , "tomorrow-night-blue"
                , "tomorrow-night-bright"
                , "tomorrow-night-eighties"
                , "tomorrow-night"
                , "tomorrow"
                , "vs"
                , "xcode"
                , "xt256"
                , "zenburn"
        ];



    // lass dir alle Events States nochmal schicken 
    /* 	event_controller.request.config.all();
     */
    var self = {

        fill_in_options: function (id) {

            // alle möglichen Styles als Option Tags hinzufügen
            for (var i in hightlightjsstyles) {
                var option = jQuery("<option>").val(hightlightjsstyles[i]).text(hightlightjsstyles[i]);

                if (active_style === hightlightjsstyles[i]) {
                    jQuery(option).prop("selected", true);
                }

                // Option hinzufügen
                jQuery(id + " .selectHighlightJSStyle").append(
                    jQuery(option)
                    );
            }

            if (global_settings.hightlightjs.active === true) {
                // register Event
                // übergib die aufgerufene ID
                jQuery(id + " .selectHighlightJSStyle").prop("disabled", false);

                event_manager_controller.register_once(id + " .selectHighlightJSStyle", "change", function () {
                    self.change_style(id + " .selectHighlightJSStyle");
                });
            } else {
                jQuery(id + " .selectHighlightJSStyle").prop("disabled", true);
            }
        }

        , run: function (id) {
            // HighlightJS ausführen
            if (global_settings.hightlightjs.active === true) {
                jQuery(id + " pre code").each(function (i, html) {
                    hljs.highlightBlock(html);
                });
            }
        }

        , select_active_style_in_buttons: function (style) {
            jQuery(".selectHighlightJSStyle").val(style);
        }

        // Funktion zum Laden der nötigen CSS Datei
        , change_style: function (called_id) {
            // Beispiel:  called_id -> #usi-list-entry-id---1471351232788 .selectHighlightJSStyle
            var style = jQuery(called_id).val();

            // neuen Style setzen
            self.set_active_style(style);

            // Auswahl Buttons --- aktiven Style selektieren
            self.select_active_style_in_buttons(style);

            // Style speichern
            event_controller.set.highlightjs.style(style);
        }

        , set_active_style: function (style) {
            active_style = style;
            // CSS Datei tauschen
            self.change_css_file(style);
        }

        , change_css_file: function (style) {
            // Pfad zur CSS Datei festlegen
            var style_filepath = highlight_styles_path + style + ".css";
            // Link auf die neue CSS Datei ändern
            jQuery("#HighlightJSStyle").attr("href", style_filepath);
        }
    };
    
    // Standard CSS laden
    self.change_css_file("default");
    
    config_storage.get().then((config) => {
        // holt den festgelegten Style
        if (typeof config.hightlightjs.style === "string") {
            self.set_active_style(config.hightlightjs.style);
        }
    });
    
    return {

        activate: function (change) {
            if (typeof change === "boolean") {
                global_settings.hightlightjs.active = change;
                return global_settings.hightlightjs.active;
            }
        }

        // Wrapper
        , fill_in_options: self.fill_in_options

            // Wrapper
        , set_active_style: self.set_active_style

            // Wrapper
        , run: self.run
    };

}());