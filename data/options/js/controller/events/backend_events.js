"use strict";

/* global language_controller, self, lang, download_controller */

var backend_events_controller = (function backend_events_class () {

    if (typeof self.port !== "undefined") {

        // Abstraktions Möglichkeit
        var api = self.port,
            private_functions = {
                // erlaubt einen direkten Zugriff auf die API
                api: api

                    // Daten vom Backend erhalten
                , get: {
                    userscript: {
                        example: function (c) {
                            api.emit("USI-BACKEND:get-userscript-example", c);
                        }
                        , export: {
                            all: function (val) {
                                api.emit("USI-BACKEND:get-all-userscripts-for-export", val);
                            }
                            , single: function (id) {
                                api.emit("USI-BACKEND:export-userscript", id);
                            }
                        }

                    }
                }

                // Registriert ein Event 
                , register: {
                    // highlightjs
                    highlightjs: {
                        style: function (c) {
                            api.on("USI-BACKEND:highlightjs-style", c);
                        }
                        , activation_state: function (c) {
                            api.on("USI-BACKEND:highlightjs-activation-state", c);
                        }
                    }
                    , userscript: {
                        quota: function (c) {
                            api.on("USI-BACKEND:storage-quota", c);
                        }
                        , list: function (c) {
                            api.on("USI-BACKEND:list-all-scripts", c);
                        }
                        , deleted: function (c) {
                            api.on("USI-BACKEND:delete-script-is-now-deleted", c);
                        }
                        , external_load: {
                            ready: function (c) {
                                api.once("USI-BACKEND:external-script-is-now-loaded", c);
                            }
                        }
                        , example: {
                            ready: function (c) {
                                api.once("USI-BACKEND:get-userscript-example-done", c);
                            }
                        }
                        , export: {
                            ready: function (c) {
                                api.on("USI-BACKEND:get-all-userscripts-for-export-done", c);
                            }
                        }
                        , update: {
                            available: function (c) {
                                api.on("USI-BACKEND:update-for-userscript-available", c);
                            }
                        }
                        , url_test: function (id, c) {
                            api.on("USI-BACKEND:test-url-match-" + id, c);
                        }
                        , gm_values: function (id, c) {
                            api.on("USI-BACKEND:list-GMValues-done-" + id, c);
                        }
                    }
                }

                // löst eine Aktion im Backend aus, ohne direkt Daten zurück zu erhalten
                , request: {
                    config: {
                        all: function () {
                            api.emit("USI-BACKEND:get-all-changeable-states");
                        }
                    }
                    , userscript: {
                        all: function () {
                            api.emit("USI-BACKEND:request-for---list-all-scripts");
                        }
                        /**
                         * löscht alle gespeicherten Userskripte
                         */
                        , delete_all: function () {
                            api.emit("USI-BACKEND:delete-everything");
                        }
                        , delete: function (id) {
                            api.emit("USI-BACKEND:delete-script-by-id", id);
                        }
                        , update_check: function () {
                            api.emit("USI-BACKEND:check-for-userscript-updates");
                        }
                        , gm_values: function (id) {
                            api.emit("USI-BACKEND:list-GMValues", id);
                        }
                        , url_test: function (data) {
                            api.emit("USI-BACKEND:test-url-match", data);
                        }
                        , syntax_test: function (id) {
                            api.emit("USI-BACKEND:syntax-error-test", id);
                        }
                    }

                }
                // Daten zum Backend senden
                , set: {
                    config: {
                        load_external_script: function (bool) {
                            api.emit("USI-BACKEND:ExternalScriptLoadQuestion-change", bool);
                        }
                        , highlightjs_state: function (bool) {
                            api.emit("USI-BACKEND:highlightjs-activation-state-change", bool);
                        }
                        , gm_funcs_always_on: function (bool) {
                            api.emit("USI-BACKEND:options_always_activate_greasemonkey-change", bool);
                        }
                        , own_css: function (bool) {
                            api.emit("USI-BACKEND:config_add_css-change", bool);
                        }
                    }
                    // highlightjs
                    , highlightjs: {
                        style: function (data) {
                            api.emit("USI-BACKEND:highlightjs-style-change", data);
                        }
                    }
                    , userscript: {
                        create: function (data) {
                            api.emit("USI-BACKEND:new-usi-script_content", data);
                        }
                        , override: function (data) {
                            api.emit("USI-BACKEND:override-same-userscript", data);
                        }
                        , load_external: function (data) {
                            api.emit("USI-BACKEND:loadexternal-script_url", data);
                        }
                        , toogle_state: function (id) {
                            api.emit("USI-BACKEND:toggle-userscript-state", id);
                        }
                        , gm_values: {
                            delete_all: function (id) {
                                api.emit("USI-BACKEND:delete-reset-GM-Values-userscript", id);
                            }
                        }
                    }
                }
                // Registiert die globalen Events
                , register_global_events: function () {
                    // Eigenes CSS
                    api.on("USI-BACKEND:config_add_css", function (css) {
                        if(typeof css === "string"){
                            jQuery("#usi-additional-css").text(css.replace(/<\/?[^>]+>/gi, ''));
                        }
                    });
                    
                    api.on("USI-BACKEND:get-alert", function (text) {
                        window.alert(text);
                    });

                    /**
                     * Wenn das Userscript schon existiert und überschrieben werden kann
                     */
                    api.on("USI-BACKEND:same-userscript-was-found",
                        /**
                         * 
                         * @param {object} userscript_infos
                         * @returns {void}
                         */
                            function (userscript_infos) {

                                //wurde gefunden, möchtest du es aktualisieren?")){
                                if (window.confirm(lang["same_userscript_was_found_ask_update_it_1"] + userscript_infos.id + lang["same_userscript_was_found_ask_update_it_2"])) {
                                    // Dieses Skript wird nun aktualisiert! userscript_infos = {id : id , userscript: userscript}
                                    private_functions.set.userscript.override(userscript_infos);
                                    private_functions.request.userscript.all();
                                }
                            });

                        // Bietet das Userscript zur lokalen Speicherung an!
                        api.on("USI-BACKEND:export-userscript-done", function (result) {
                            download_controller.download(result.userscript, "text/plain", encodeURI(result.filename + ".user.js"));
                        });

                        // Event Weiterleitung vom Backend
                        api.on("USI-BACKEND:To-Frontend-Document-Event-Forwarder", function (data) {
                            jQuery(document).trigger(data.event_name, [data.action, data.param1]);
                        });

                    }

            };


            return private_functions;
        } else {
            return false;
        }

    }());