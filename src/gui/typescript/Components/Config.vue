<template>
    <!--USI Konfiguration bearbeiten-->
    <div>
        <div>
            <h3 data-usi-lang="delete_all_userscripts">
                <!--Alle Userscripts entfernen-->
            </h3>

            <v-btn color="error" @click="deleteAll(1)" data-usi-lang="revert_all">
            </v-btn>
            <!--alles zurücksetzen-->
        </div>
        <div>

            <h3 data-usi-lang="check_updates_for_all_userscripts">
                <!--Alle Userscripts auf Updates überprüfen-->
            </h3>

            <v-btn @click="checkForUpdates" color="info" data-usi-lang="check_now">
            </v-btn>
            <!--jetzt prüfen-->
        </div>
        <div>
            <h3 data-usi-lang="enableExternalScriptLoadQuestion_title">
                <!--Importiere externe Skripte-->
            </h3>
            <label>
                <span data-usi-lang="enableExternalScriptLoadQuestion_description">
                    <!--Möchtest du das USI dich fragt, ob ein Userscript importiert werden soll? (Beim Aufruf von UserScript Sourcen, deren URL auf `user.js` endet)-->
                </span>
            </label>
            <v-switch v-model="load_script_with_js_end" :label="load_script_with_js_end ? lang.yes : lang.no"></v-switch>
        </div>

        <div>
            
            <h3 data-usi-lang="options_activate_highlightjs_title">
                <!--HighlightJS aktiv-->
            </h3>
            <v-switch v-model="hightlightjs_active" :label="hightlightjs_active ? lang.yes : lang.no"></v-switch>
        </div>
        <div>
            <h3 data-usi-lang="options_always_activate_greasemonkey_title">
                <!--Greasemonkey immer aktivieren-->
            </h3>
            <v-switch v-model="greasemonkey_global_active" :label="greasemonkey_global_active ? lang.yes : lang.no"></v-switch>
        </div>
        <div>
            <h3 data-usi-lang="export_all_userscripts">
                <!--Alle Userscripts exportieren-->
            </h3>
            <label>
                <span data-usi-lang="complete_export">
                    <!--Kompletter Export-->
                </span>
            </label>
            <v-switch v-model="completeExport" :label="completeExport ? lang.yes : lang.no"></v-switch>
        </div>

        <div>
            <v-btn @click="exportAll" color="info" data-usi-lang="export_all_now">
            </v-btn>
        </div>
        <!--jetzt exportieren-->
        <div>
            <h3 data-usi-lang="config_add_css">
                <!--Extra CSS Anpassungen-->
            </h3>
        </div>
        <div>

            <v-textarea v-model="AddCSS" rows="20" cols="32" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" :placeholder="exampleAddCSS"></v-textarea>

        </div>
        <div>
            <v-btn @click="css_refresh(false)" color="info" data-usi-lang="config_add_css_refresh">
            </v-btn>
            <v-btn @click="css_undo">
                <i class="material-icons">undo</i>
            </v-btn>
        </div>

        <v-dialog v-model="dialogWindow" width="500">
            <v-card>
                <v-card-text>
                    {{dialogWindowText}}
                </v-card-text>
                <v-divider></v-divider>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <!-- erneute Sicherheitsabfrage -->
                    <v-btn v-if="dialogStep == 1" color="info" @click="deleteAll(2)">OK</v-btn>
                    <!-- endgültig löschen -->
                    <v-btn v-if="dialogStep == 2" color="error" @click="deleteAll(3)">OK</v-btn>

                    <v-btn color="success" @click="dialogWindow = false;dialogStep = 0;">Cancel</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>

</template>

<script lang="ts">
declare var jQuery: any;

import config_storage from "lib/storage/config";
import event_controller from "../events/event_controller";

import Vue from "vue";
import basic_helper from "lib/helper/basic_helper";

/**
 * legt den Component Namen fest, damit dieser als HTML Tag
 * genutzt werden kann ->
 *
 * const componentName = "config-component";
 * --->
 * <html>... <config-component> ... </html>
 */
const componentName = "config-component";

const placeholderAddCss = `@import url('https://fonts.googleapis.com/css?family=Roboto+Mono');

#usi-edit-script-textarea {
    font-family: 'Roboto Mono', monospace;
}`;

export default Vue.component(componentName, {
    props: {
        initialData: {
            type: Object as () => usi.Storage.Config
        }
    },
    data: function () {
        return {
            LastCSS: <string[]>[],
            load_script_with_js_end: this.initialData.load_script_with_js_end,
            greasemonkey_global_active: this.initialData.greasemonkey.global_active,
            hightlightjs_active: this.initialData.hightlightjs.active,
            AddCSS: this.initialData.own_css,
            exampleAddCSS: placeholderAddCss,
            completeExport: false,
            dialogWindow: false,
            dialogWindowText: "",
            dialogStep: 0,
            lang: {
                deactivated: browser.i18n.getMessage("deactivated"),
                activated: browser.i18n.getMessage("activated"),
                yes: browser.i18n.getMessage("yes"),
                no: browser.i18n.getMessage("no"),
                show: browser.i18n.getMessage("show"),
                hide: browser.i18n.getMessage("hide")
            }
        };
    },
    created: function () { },
    watch: {
        /** @todo */
        // Schreibe die Neue Konfiguration
        load_script_with_js_end: async function (newValue, oldValue): Promise<void> {
            await event_controller().set.config.load_external_script(newValue);
            this.$emit("change-tab-additional", { event_name: "usi:refresh-config" });
        },
        greasemonkey_global_active: async function (newValue, oldValue): Promise<void> {
            await event_controller().set.config.gm_funcs_always_on(newValue);
            this.$emit("change-tab-additional", { event_name: "usi:refresh-config" });
        },
        hightlightjs_active: async function (newValue, oldValue): Promise<void> {
            await event_controller().set.config.highlightjs_state(newValue);
            this.$emit("change-tab-additional", { event_name: "usi:refresh-config" });
        }
    },
    methods: {
        css_undo: function (): void {
            if (this.LastCSS.length > 0) {
                // Letzten Wert wieder eintragen
                this.AddCSS = String(this.LastCSS.pop()).toString();
            } else {
                // leeren
                this.AddCSS = "";
            }

            // danach den Refresh Prozess antriggern
            this.css_refresh(true);
        },
        activate_css: async function (new_css: string): Promise<void> {
            // CSS eintragen und aktivieren
            // @todo --- ruft die Haupt Vue Instanz
            await event_controller().set.config.own_css(new_css);
            this.$emit("change-tab-additional", {
                event_name: "usi:change-additional-css",
                data: new_css
            });
            this.$emit("change-tab-additional", { event_name: "usi:refresh-config" });
        },
        css_refresh: function (is_reset?: boolean): void | boolean {
            // CSS eintragen und aktivieren
            this.activate_css(this.AddCSS);

            if (is_reset === true) {
                // nichts weiter unternehmen
                return true;
            } else {
                // Reset anbieten, für den fall das etwas schief gegangen ist
                window.setTimeout(() => {
                    if (
                        window.confirm(
                            browser.i18n.getMessage("config_add_css_reset_question")
                        )
                    ) {
                        // reset
                        this.css_undo();
                    } else {
                        // CSS in den Stack packen
                        this.LastCSS.push(this.AddCSS);
                    }
                }, 5000);
            }
        },

        /* ifUpdatesAreFoundForUserscripts : function(){
        // Hört darauf ob Aktualisierungen für die Skripte zur Verfügung stehen ...
          event_controller().register.userscript.update.available(function(
            userscript_infos: any
          ) {
            if (
              window.confirm(
                browser.i18n.getMessage("userscript_update_was_found_1") +
                  userscript_infos.id +
                  browser.i18n.getMessage("userscript_update_was_found_2")
              )
            ) {
              // Nun das Skript aktualisieren!
              event_controller().set.userscript.override(userscript_infos);
    
              event_controller().request.userscript.refresh();
            }
          });
    
        }, */

        /**
         * Alle Userscripte entfernen
         * @returns {undefined}
         */
        deleteAll: function (step: number): void {
            this.dialogStep = step;

            // Doppelte Sicherheitsabfrage, bevor wirklich alles gelöscht wird!
            switch (this.dialogStep) {
                case 1:
                    // Sicherheitsabfrage
                    this.dialogWindow = true;
                    this.dialogWindowText = browser.i18n.getMessage("really_reset_all_settings");
                    break;

                case 2:
                    // erneute Sicherheitsabfrage
                    this.dialogWindow = true;
                    this.dialogWindowText = browser.i18n.getMessage("really_really_reset_all_settings");
                    break;

                case 3:
                    // nun werden alle Userscripte gelöscht
                    event_controller().request.userscript.delete_all();

                    this.dialogWindow = false;
                    break;
                default:
                    throw "Unbekannter Step : " + step;
            }
        },

        // Prüfe ob für die Skripte Updates gefunden wurden!
        checkForUpdates: event_controller().request.userscript.update_check,

        // exportiere die Skripte
        exportAll: function (): void {
            if (this.completeExport === true) {
                event_controller().get.userscript.export.all(true);
            } else {
                event_controller().get.userscript.export.all(false);
            }
        }
    }
});
</script>

<style>
</style>