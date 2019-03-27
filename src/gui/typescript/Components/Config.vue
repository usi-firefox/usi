<template>
  <!--USI Konfiguration bearbeiten-->
  <v-container grid-list-md>
    <div>
      <h3 data-usi-lang="delete_all_userscripts">
        <!--Alle Userscripts entfernen-->
      </h3>

      <v-btn color="error" @click="deleteAll(1)" data-usi-lang="revert_all"></v-btn>
      <!--alles zurücksetzen-->
    </div>
    <div>
      <h3 data-usi-lang="check_updates_for_all_userscripts">
        <!--Alle Userscripts auf Updates überprüfen-->
      </h3>

      <v-btn @click="checkForUpdates" color="info" data-usi-lang="check_now"></v-btn>
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
      <v-switch
        v-model="load_script_with_js_end"
        :label="load_script_with_js_end ? lang.yes : lang.no"
      ></v-switch>
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
      <v-switch
        v-model="greasemonkey_global_active"
        :label="greasemonkey_global_active ? lang.yes : lang.no"
      ></v-switch>
    </div>
    <div>
      <h3 data-usi-lang="export_all_userscripts">
        <!--Alle Userscripts exportieren-->
      </h3>
      <label data-usi-lang="complete_export">
        <!--Kompletter Export-->
      </label>
      <v-switch v-model="completeExport" :label="completeExport ? lang.yes : lang.no"></v-switch>
      <!--jetzt exportieren-->
      <v-btn @click="exportAll" color="info" data-usi-lang="export_all_now"></v-btn>
    </div>

    <v-dialog v-model="dialogWindow" width="500">
      <v-card>
        <v-card-text>{{dialogWindowText}}</v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <!-- erneute Sicherheitsabfrage -->
          <v-btn v-if="dialogStep == 1" color="info" @click="deleteAll(2)">OK</v-btn>

          <!-- Abbruch Button -->
          <v-btn color="success" @click="dialogWindow = false;dialogStep = 0;">Cancel</v-btn>

          <!-- endgültig löschen | die Position getauscht -->
          <v-btn v-if="dialogStep == 2" color="error" @click="deleteAll(3)">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts">
declare var jQuery: any;

import config_storage from "lib/storage/config";
import event_controller from "../events/event_controller";

import Vue from "vue";
import userscript_storage from "lib/storage/storage";
import { isset, download_file } from "lib/helper/basic_helper";
import load_resource from "lib/helper/load_resource";
import parse_userscript from "lib/parse/parse_userscript";

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
.container {
    color: red;
}
#usi-edit-script-textarea {
    font-family: 'Roboto Mono', monospace;
}`;

export default Vue.component(componentName, {
  data: function() {
    return {
      load_script_with_js_end: false,
      greasemonkey_global_active: false,
      hightlightjs_active: false,
      config: <usi.Storage.Config>{},
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
  created: async function() {
    this.config = await config_storage().get();

    this.load_script_with_js_end = this.config.load_script_with_js_end;
    this.greasemonkey_global_active = this.config.greasemonkey.global_active;
    this.hightlightjs_active = this.config.hightlightjs.active;
  },
  watch: {
    /** @todo */
    // Schreibe die Neue Konfiguration
    load_script_with_js_end: function(newValue: boolean) {
      this.config.load_script_with_js_end = newValue;
      config_storage().set(this.config);
    },
    greasemonkey_global_active: function(newValue: boolean) {
      this.config.greasemonkey.global_active = newValue;
      config_storage().set(this.config);
    },
    hightlightjs_active: function(newValue: boolean) {
      this.config.hightlightjs.active = newValue;
      config_storage().set(this.config);
    }
  },
  methods: {
    /**
     * Alle Userscripte entfernen
     * @returns {undefined}
     */
    deleteAll: function(step: number): void {
      this.dialogStep = step;

      // Doppelte Sicherheitsabfrage, bevor wirklich alles gelöscht wird!
      switch (this.dialogStep) {
        case 1:
          // Sicherheitsabfrage
          this.dialogWindow = true;
          this.dialogWindowText = browser.i18n.getMessage(
            "really_reset_all_settings"
          );
          break;

        case 2:
          // erneute Sicherheitsabfrage
          this.dialogWindow = true;
          this.dialogWindowText = browser.i18n.getMessage(
            "really_really_reset_all_settings"
          );
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
    checkForUpdates: async function() {
      // durchlaufe alle Einträge und suche nach einer UpdateURL
      let script_storage = await userscript_storage();
      let all_userscripts = script_storage.getAll();

      debugger;

      if (all_userscripts.length === 0) {
        return "no Userscripts available";
      }

      const check_this_userscripts = all_userscripts.filter(
        (userscript: any) => {
          return isset(userscript.settings["updateURL"]);
        }
      );

      const load_resource_instance = new load_resource();

      check_this_userscripts.forEach(async (userscript: any) => {
        const { updateURL, version } = userscript.settings;
        const userscript_id = userscript.id;

        try {
          const loaded_userscript = await (<any>(
            load_resource_instance.load_userscript_by_url(updateURL)
          ));
          if (!loaded_userscript.target.responseText) {
            // keine antwort
            return false;
          }

          const loaded_userscript_text = loaded_userscript.target.responseText;

          // @todo Konfig suchen und danach die Optionen Parsen...
          const loaded_userscript_settings = <any>(
            parse_userscript().find_settings(loaded_userscript_text)
          );

          if (loaded_userscript_settings === null) {
            return false;
          }

          // Prüfe ob die Versionen verschieden sind!
          if (loaded_userscript_settings["version"] === version) {
            return false;
          }

          //wurde gefunden, möchtest du es aktualisieren?")){
          let confirmed = window.confirm(
            browser.i18n.getMessage(
              "same_userscript_was_found_ask_update_it_1"
            ) +
              userscript_id +
              browser.i18n.getMessage(
                "same_userscript_was_found_ask_update_it_2"
              )
          );

          if (!confirmed) {
            return false;
          }

          // Dieses Skript wird nun aktualisiert
          event_controller().set.userscript.override(loaded_userscript_text);
        } catch {
          // keine Userscript erhalten
          return false;
        }
      });
    },

    // exportiere die Skripte
    exportAll: async function(): Promise<void> {
      /**
       * Erzeugt ein Download Fenster für den Fertigen Export
       */

      let script_storage = await userscript_storage();

      let result_export = "",
        result_export_tmp = [],
        separator = "//*******************USI-EXPORT*************************//\n",
        date_obj = new Date();

      let export_date = [
        date_obj.getFullYear(),
        date_obj.getMonth(),
        date_obj.getDate(),
        "-",
        date_obj.getHours(),
        date_obj.getMinutes()
      ].join("-");
      // Hinweis darauf ob alles exportiert wurde und lediglich die Userscripte
      // ---> complete_export

      let infos = [
        "USI-EXPORT",
        "VERSION:0.2",
        "DATE:" + export_date,
        "COMPLETE:" + this.completeExport
      ];
      // infos hinzufügen
      for (var i in infos) {
        result_export += "//" + infos[i] + "\n";
      }

      // Trenner hinzufügen
      result_export += separator + separator + separator;
      let all_userscripts = script_storage.getAll();
      // Userscript aus dem script_storage holen
      for (var j in all_userscripts) {
        if (this.completeExport === false) {
          result_export_tmp.push(all_userscripts[j].userscript);
        } else {
          result_export_tmp.push(all_userscripts[j]);
        }
      }

      if (result_export_tmp.length === 0) {
        // Kein Userscript für den Export vorhanden
        return;
      }

      if (this.completeExport === false) {
        result_export += result_export_tmp.join("\n" + separator);
      } else {
        result_export += JSON.stringify(result_export_tmp);
      }

      if (this.completeExport === true) {
        download_file(result_export, "text/plain", "usi-export.usi.json");
      } else {
        download_file(
          result_export,
          "application/octet-stream",
          "usi-export.usi.js"
        );
      }
    }
  }
});
</script>

<style>
</style>