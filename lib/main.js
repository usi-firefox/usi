"use strict"; // Strict Mode aktivieren!

/* global browser, page_injection_helper, options_backend, sdk_to_webext, GM_Backend */

/************************************************************************
 ************************* Options Bereich! *****************************
 ************************************************************************/

var usi_main = (function () {

    var self = {
        createGui: function () {
            // Konfigurations Button erstellen - START
            if (browser.runtime.PlatformOs === "android") {
                // nur bei Fennec

                // Obtain commonly used services : Services.jsm
                // https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Services.jsm
                const {Services} = require("resource://gre/modules/Services.jsm");

                function getNativeWindow() {
                    // Initialisierung für das Native Window (Fennec)
                    let window = Services.wm.getMostRecentWindow("navigator:browser");
                    return window.NativeWindow;
                }

                var menuID = getNativeWindow().menu.add({
                    name: _("usi_options"),
                    icon: null,
                    //    parent: recent.NativeWindow.menu.toolsMenuID,
                    callback: function () {
                        browser.tabs.create({
                            url: "/gui/options.html"
                        });
                    }
                });

                exports.onUnload = function () {
                    getNativeWindow().menu.remove(menuID);
                };

            } else {
                try {
                    browser.browserAction.onClicked.addListener(function () {
                        // optionen gui starten ...
                        browser.tabs.create({
                            url: "/gui/options.html"
                        });
                    });
                } catch (exception) {
                }
            }
            // Konfigurations Button erstellen - END
        }
        , startPageInjection: function(){
            page_injection_helper.re_init_page_injection(true);
            page_injection_helper.register_re_init_page_injection_event();
        }
        , startOptionsBackend: function(){
            options_backend.start();
        }
        , startGMBackend: function(){
            GM_Backend.register_listener();
        }
        , doUpdateFromSDKToWebext: function(){
            sdk_to_webext.do_update();
        }
        , GM_last_menuCommands : []
    };
    
    return self;
})();

// Konfigurations Button erstellen
usi_main.createGui();
usi_main.startOptionsBackend();

// GM Backend Listener starten
usi_main.startGMBackend();

// PageInjection starten
usi_main.startPageInjection();