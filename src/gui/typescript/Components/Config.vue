<template>
  <!--USI Konfiguration bearbeiten-->
  <v-container>
    <div>
      <h3 v-lang="'delete_all_userscripts'">
        <!--Alle Userscripts entfernen-->
      </h3>

      <v-btn color="error" @click="deleteAll(1)" v-lang="'revert_all'"></v-btn>
      <!--alles zurücksetzen-->
    </div>
    <div>
      <h3 v-lang="'check_updates_for_all_userscripts'">
        <!--Alle Userscripts auf Updates überprüfen-->
      </h3>

      <v-btn @click="checkForUpdates" color="info" v-lang="'check_now'"></v-btn>
      <!--jetzt prüfen-->
    </div>
    <div>
      <h3 v-lang="'enableExternalScriptLoadQuestion_title'">
        <!--Importiere externe Skripte-->
      </h3>
      <label>
        <span v-lang="'enableExternalScriptLoadQuestion_description'">
          <!--Möchtest du das USI dich fragt, ob ein Userscript importiert werden soll? (Beim Aufruf von UserScript Sourcen, deren URL auf `user.js` endet)-->
        </span>
      </label>
      <v-switch
        v-model="load_script_with_js_end"
        :label="load_script_with_js_end ? lang.yes : lang.no"
      ></v-switch>
    </div>

    <div>
      <h3 v-lang="'options_always_activate_greasemonkey_title'">
        <!--Greasemonkey immer aktivieren-->
      </h3>
      <v-switch
        v-model="greasemonkey_global_active"
        :label="greasemonkey_global_active ? lang.yes : lang.no"
      ></v-switch>
    </div>
    <div>
      <h3 v-lang="'global_exclude_rules'">
        <!--Globale Exclude Regeln-->
      </h3>
      <v-list>
        <v-list-item v-show="global_excludes.length > 0" v-for="(rule,index) in global_excludes" v-bind:key="index">
          <v-list-item-icon @click="deleteGlobalExlucde(rule)">
            <v-icon>delete</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title v-text="rule"></v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>
              <v-text-field @keyup.enter="addGlobalExlucde()" :placeholder="lang.add_global_exclude_rules" v-model="new_global_exclude_rule"></v-text-field>
            </v-list-item-title>
          </v-list-item-content>
          <v-list-item-icon @click="addGlobalExlucde()"><v-icon>add_circle</v-icon>
          </v-list-item-icon>
        </v-list-item>
      </v-list>
    </div>
    <div>
      <h3 v-lang="'export_all_userscripts'">
        <!--Alle Userscripts exportieren-->
      </h3>
      <label v-lang="'complete_export'">
        <!--Kompletter Export-->
      </label>
      <v-switch v-model="completeExport" :label="completeExport ? lang.yes : lang.no"></v-switch>
      <!--jetzt exportieren-->
      <v-btn @click="exportAll" color="info" v-lang="'export_all_now'"></v-btn>
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
import config_storage from "lib/storage/config";

import Vue from "vue";
import userscript_storage from "lib/storage/storage";
import { isset, download_file, getTranslation } from "lib/helper/basic_helper";
import load_resource from "lib/helper/load_resource";
import parse_userscript from "lib/parse/parse_userscript";
import page_injection_helper from "lib/inject/page_injection_helper";
import add_userscript from "lib/storage/add_userscript";

const add_userscript_instance = new add_userscript();
const parse_userscript_instance = new parse_userscript();

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
  data: function() {
    return {
      completeExport: false,
      dialogWindow: false,
      dialogWindowText: "",
      dialogStep: 0,
      new_global_exclude_rule: "",
      lang: {
        deactivated: getTranslation("deactivated"),
        add_global_exclude_rules: getTranslation("add_global_exclude_rules"),
        activated: getTranslation("activated"),
        yes: getTranslation("yes"),
        no: getTranslation("no"),
        show: getTranslation("show"),
        hide: getTranslation("hide")
      }
    };
  },
  computed: {
    load_script_with_js_end: {
      get(): boolean {
        return this.$store.getters["configuration/load_script_with_js_end"];
      },
      set(val: boolean) {
        this.$store.dispatch("configuration/load_script_with_js_end", val);
      }
    },
    global_excludes: {
      get(): string[] {
        return this.$store.getters["configuration/global_excludes"];
      }
    },
    greasemonkey_global_active: {
      get(): boolean {
        return this.$store.getters["configuration/greasemonkey_global_active"];
      },
      set(val: boolean) {
        this.$store.dispatch("configuration/greasemonkey_global_active", val);
      }
    },
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
          this.dialogWindowText = getTranslation("really_reset_all_settings");
          break;

        case 2:
          // erneute Sicherheitsabfrage
          this.dialogWindow = true;
          this.dialogWindowText = getTranslation(
            "really_really_reset_all_settings"
          );
          break;

        case 3:
          // nun werden alle Userscripte gelöscht
          userscript_storage().then(script_storage => {
            // lösche jedes einzelene Userscript...
            script_storage.deleteAll();

            // lade Page Mod neu!
            new page_injection_helper().re_init_page_injection();

            this.dialogWindow = false;
          });
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
        const { updateURL, version, name } = userscript.settings;

        try {
          const loaded_userscript = await load_resource_instance.load_userscript_by_url(
            updateURL
          );
          if (!loaded_userscript) {
            // keine antwort
            return false;
          }

          // @todo Konfig suchen und danach die Optionen Parsen...
          const loaded_userscript_settings = (
            parse_userscript_instance.find_settings(loaded_userscript)
          ) as any;

          if (loaded_userscript_settings === null) {
            return false;
          }

          // Prüfe ob die Versionen verschieden sind!
          if (loaded_userscript_settings["version"] === version) {
            return false;
          }

          const new_version = loaded_userscript_settings["version"];

          /**
           * @todo
           */
          const confirm_message = `
              ${getTranslation("same_userscript_was_found")}
              Name: ${name}
              ID: ${userscript.id}
              New Version: ${new_version}
              Old Version: ${version}
              ${getTranslation("would_you_like_to_update")}
          `;

          // Prüfe ob der Benutzer das Skript wirklich aktualisieren möchte
          const confirmed = window.confirm(confirm_message);

          if (!confirmed) {
            return false;
          }

          /**
           * @todo
           */
          const userscript_handle = await (<any>(
          add_userscript_instance.update_userscript(
              userscript.id,
              loaded_userscript
            )
          ));
          // aktualisiertes Userscript aktivieren
          new page_injection_helper().add_userscript(userscript_handle.getId());

        } catch (error) {

          console.error('error in checkForUpdates()');
          console.error(error);
          
          return false;
        }
      });
    },

    deleteGlobalExlucde(rule : string){
      if(window.confirm(rule + " -> " + getTranslation("really_delete"))){
        this.$store.dispatch("configuration/global_excludes_remove", rule);
      }
    },
    addGlobalExlucde(){
      if(!this.new_global_exclude_rule){
        return;
      }

      if(this.global_excludes.indexOf(this.new_global_exclude_rule) > -1){
        // Eintrag existiert
        return;
      }

      this.$store.dispatch("configuration/global_excludes_add", this.new_global_exclude_rule);

      this.new_global_exclude_rule = "";
    },

    // exportiere die Skripte
    exportAll: async function(): Promise<void> {
      /**
       * Erzeugt ein Download Fenster für den Fertigen Export
       */

      let script_storage = await userscript_storage();

      const date_obj = new Date();
      const export_date = [
        date_obj.getFullYear(),
        date_obj.getMonth(),
        date_obj.getDate(),
        "-",
        date_obj.getHours(),
        date_obj.getMinutes()
      ].join("-");

      const result_export_header = [
        "USI-EXPORT",
        "VERSION:0.3",
        "DATE:" + export_date,
        "COMPLETE:" + this.completeExport,
        // Trenner 5 mal hinzufügen
        ...new Array(5).fill(
          "*******************USI-EXPORT*************************//"
        )
      ].map(line => {
        return "//" + line + "\n";
      });

      let all_userscripts = script_storage.getAll();
      if (all_userscripts.length === 0) {
        // Kein Userscript für den Export vorhanden
        return;
      }

      const result_export_userscripts = all_userscripts.map((data: any) => {
        if (this.completeExport) {
          return data;
        } else {
          return (
            data.userscript +
            "\n//*******************USERSCRIPT*************************//"
          );
        }
      });

      let result_export_complete = [
        ...result_export_header,
        ...result_export_userscripts
      ];

      if (this.completeExport) {
        download_file(
          JSON.stringify(result_export_complete),
          "text/plain",
          "usi-export.usi.json"
        );
      } else {
        download_file(
          result_export_complete.join(),
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