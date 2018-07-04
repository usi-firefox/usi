<template>
    <!--USI Konfiguration bearbeiten-->
    <div class="container-fluid">
        <div class="container">
            <div class="row">
                <h3 data-usi-lang="delete_all_userscripts">
                    <!--Alle Userscripts entfernen-->
                </h3>

                <button class="btn btn-danger" @click="deleteAll" data-usi-lang="revert_all">
                </button>
                <!--alles zurücksetzen-->
            </div>
        </div>
        <hr />
        <div class="container">
            <div class="row">

                <h3 data-usi-lang="check_updates_for_all_userscripts">
                    <!--Alle Userscripts auf Updates überprüfen-->
                </h3>

                <button @click="checkForUpdates" class="btn btn-primary" data-usi-lang="check_now">
                </button>
                <!--jetzt prüfen-->
            </div>
        </div>
        <hr />
        <div class="container">
            <div class="row">
                <h3 data-usi-lang="enableExternalScriptLoadQuestion_title">
                    <!--Importiere externe Skripte-->
                </h3>
                <label>
                    <span data-usi-lang="enableExternalScriptLoadQuestion_description">
                        <!--Möchtest du das USI dich fragt, ob ein Userscript importiert werden soll? (Beim Aufruf von UserScript Sourcen, deren URL auf `user.js` endet)-->
                    </span>
                </label>
            </div>
            <div class="row">
                <button class="btn btn-default" @click="load_script_with_js_end = !load_script_with_js_end">
                    <span v-show="load_script_with_js_end">{{lang.yes}}</span>
                    <span v-show="!load_script_with_js_end">{{lang.no}}</span>
                </button>
            </div>
        </div>
        <hr />
        <div class="container">
            <div class="row">
                <h3 data-usi-lang="options_activate_highlightjs_title">
                    <!--HighlightJS aktiv-->
                </h3>
            </div>

            <div class="row">
                <button class="btn btn-default" @click="hightlightjs_active = !hightlightjs_active">
                    <span v-show="hightlightjs_active">{{lang.yes}}</span>
                    <span v-show="!hightlightjs_active">{{lang.no}}</span>
                </button>
            </div>
        </div>
        <hr />
        <div class="container">
            <div class="row">
                <h3 data-usi-lang="options_always_activate_greasemonkey_title">
                    <!--Greasemonkey immer aktivieren-->
                </h3>
            </div>
            <div class="row">
                <button class="btn btn-default" @click="greasemonkey_global_active = !greasemonkey_global_active">
                    <span v-show="greasemonkey_global_active">{{lang.yes}}</span>
                    <span v-show="!greasemonkey_global_active">{{lang.no}}</span>
                </button>
            </div>
        </div>
        <hr />
        <div class="container">
            <div class="row">
                <h3 data-usi-lang="export_all_userscripts">
                    <!--Alle Userscripts exportieren-->
                </h3>
                <label>
                    <span data-usi-lang="complete_export">
                        <!--Kompletter Export-->
                    </span>
                </label>
            </div>
            <div class="row">
                <button class="btn btn-default" @click="completeExport = !completeExport">
                    <span v-show="completeExport">{{lang.yes}}</span>
                    <span v-show="!completeExport">{{lang.no}}</span>
                </button>
            </div>
            <br />

            <div class="row">
                <button @click="exportAll" class="btn btn-primary" data-usi-lang="export_all_now">
                </button>
            </div>
            <!--jetzt exportieren-->
        </div>

        <hr />

        <div class="container">
            <div class="row">
                <h3 data-usi-lang="config_add_css">
                    <!--Extra CSS Anpassungen-->
                </h3>
            </div>
            <div class="row">

                <textarea class="col-xs-12" v-model="AddCSS" rows="20" cols="32" autocomplete="off" autocorrect="off" autocapitalize="off"
                    spellcheck="false" placeholder="@import url('https://fonts.googleapis.com/css?family=Roboto+Mono');    
        #usi-edit-script-textarea { 
        font-family: 'Roboto Mono', monospace;
        }"></textarea>

            </div>
            <br />
            <div class="row">
                <button @click="css_refresh(false)" class="btn btn-primary col-xs-6 col-md-2" data-usi-lang="config_add_css_refresh">
                </button>
                <button @click="css_undo" class="btn btn-default col-xs-6 col-md-push-1 col-md-2">
                    <i class="fa fa-undo fa-2x" aria-hidden="true"></i>
                </button>
            </div>
        </div>
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

export default Vue.component(componentName, {
  props: {
    initialData: {
      type: Object as () => usi.Storage.Config
    }
  },
  data: function() {
    return {
      LastCSS: [],
      load_script_with_js_end: this.initialData.load_script_with_js_end,
      greasemonkey_global_active: this.initialData.greasemonkey.global_active,
      hightlightjs_active: this.initialData.hightlightjs.active,
      AddCSS: this.initialData.own_css,
      completeExport: false,
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
  created: function() {},
  watch: {
    /** @todo */
    // Schreibe die Neue Konfiguration
    load_script_with_js_end: async function(newValue, oldValue) : Promise<void> {
      await event_controller().set.config.load_external_script(newValue);
      this.$emit("change-tab-additional", { event_name: "usi:refresh-config" });
    },
    greasemonkey_global_active: async function(newValue, oldValue) : Promise<void> {
      await event_controller().set.config.gm_funcs_always_on(newValue);
      this.$emit("change-tab-additional", { event_name: "usi:refresh-config" });
    },
    hightlightjs_active: async function(newValue, oldValue) : Promise<void> {
      await event_controller().set.config.highlightjs_state(newValue);
      this.$emit("change-tab-additional", { event_name: "usi:refresh-config" });
    }
  },
  methods: {
    css_undo: function(): void {
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
    activate_css: async function(new_css: string): Promise<void> {
      // CSS eintragen und aktivieren
      // @todo --- ruft die Haupt Vue Instanz
      await event_controller().set.config.own_css(new_css);
      this.$emit("change-tab-additional", {
        event_name: "usi:change-additional-css",
        data: new_css
      });
      this.$emit("change-tab-additional", { event_name: "usi:refresh-config" });
    },
    css_refresh: function(is_reset?: boolean): void | boolean {
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
    deleteAll: function(): void {
      // Doppelte Sicherheitsabfrage, bevor wirklich alles gelöscht wird!
      if (
        window.confirm(browser.i18n.getMessage("really_reset_all_settings"))
      ) {
        if (
          window.confirm(
            browser.i18n.getMessage("really_really_reset_all_settings")
          )
        ) {
          event_controller().request.userscript.delete_all();
        }
      }
    },

    // Prüfe ob für die Skripte Updates gefunden wurden!
    checkForUpdates: event_controller().request.userscript.update_check,

    // exportiere die Skripte
    exportAll: function(): void {
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