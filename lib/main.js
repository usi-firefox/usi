"use strict"; // Strict Mode aktivieren!

/* global browser, page_injection_helper, options_backend, sdk_to_webext, GM_Backend, basic_helper */

/************************************************************************
 ************************* Options Bereich! *****************************
 ************************************************************************/

var usi_main = (function () {

    var self = {
        active_tab: false,

        createGui: function () {
           try {
                browser.browserAction.onClicked.addListener(function () {

                    if (self.active_tab !== false) {
                        let possible_tab = browser.tabs.update(self.active_tab, {active: true});

                        possible_tab.then((ok) => {
                            if(ok.url !== browser.extension.getURL("/gui/options.html")){
                                self._create_new_options_tab(self);
                            }
                        },
                            (error) => {
                            // Aktiven Tab entfernen
                            self.active_tab = false;
                            self._create_new_options_tab(self);
                        }
                        );
                    } else {
                        self._create_new_options_tab(self);
                    }

                });
            } catch (exception) {
            }
        }
        , _create_new_options_tab: function (main) {
            // optionen gui starten ...
            let creating_options_tab = browser.tabs.create({
                url: "/gui/options.html"
            });
            creating_options_tab.then((success) => {
                // Damit nicht unnötig viele Tabs geöffnet werden
                main.active_tab = success.id;
            });
        }
        , startPageInjection: function () {
            page_injection_helper.re_init_page_injection();
            page_injection_helper.register_re_init_page_injection_event();
        }
        , startOptionsBackend: function(){
            options_backend.start();
        }
        , startGMBackend: function(){
            GM_Backend.register_listener();
        }
        , doUpdateFromSDKToWebext: function(details){
            switch (details.reason) {
                case "install":
                case "update":
                    let after_update = sdk_to_webext.do_update();
                    after_update.then(() => {
                       if(details.reason === "install"){
                           // Fehler beim ersten Start m(
                           page_injection_helper.re_init_page_injection();
                       }
                    });
                    break;
            }
            
        }
        , GM_last_menuCommands : []
    };
    
    return self;
})();

// führt ein Daten Update (Addon-SDK => Webextension) durch
if(!browser.runtime.onInstalled.hasListener(usi_main.doUpdateFromSDKToWebext)){
    browser.runtime.onInstalled.addListener(usi_main.doUpdateFromSDKToWebext);
}

// Konfigurations Button erstellen
usi_main.createGui();
usi_main.startOptionsBackend();

// GM Backend Listener starten
usi_main.startGMBackend();

// PageInjection starten
usi_main.startPageInjection();
