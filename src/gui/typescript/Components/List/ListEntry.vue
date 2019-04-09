<template>
  <v-container>
    <v-card :class="[{'strike-through': markedAsDeleted}, localScriptDeactivated ? 'grey' : '']  ">
      <v-card-title>
        <v-flex xs11 @click="toggleOverview" class="pointer title">
          <img :src="icon">
          Index: {{index}} | {{script.settings.name}} | {{script.settings.author}} | {{script.settings.version}}
          <span
            v-if="script.isSpa"
          >| SPA</span>
          <v-btn icon>
            <v-icon
              v-html="showUserscriptEntry ? 'expand_less' : 'expand_more'"
              title="expand or compress overview"
            ></v-icon>
          </v-btn>
        </v-flex>
        <v-flex xs1>
          <v-layout justify-end>
            <v-menu offset-y allow-overflow class="pointer">
              <!-- Options Menü -->
              <v-btn icon slot="activator">
                <v-icon>more_vert</v-icon>
              </v-btn>

              <v-list>
                <!--Userscript anzeigen/ausblenden-->
                <v-list-tile @click="showUserscript">
                  <v-list-tile-action>
                    <v-icon>pageview</v-icon>
                  </v-list-tile-action>
                  <v-list-tile-title>
                    <span v-html="!showUserscriptContent ? lang.show: lang.hide"></span>
                  </v-list-tile-title>
                </v-list-tile>

                <!--Userscript bearbeiten-->
                <v-divider></v-divider>
                <v-list-tile @click="edit">
                  <v-list-tile-action>
                    <v-icon>edit</v-icon>
                  </v-list-tile-action>
                  <v-list-tile-title>
                    <span v-lang="'change'"></span>
                  </v-list-tile-title>
                </v-list-tile>

                <!--Userscript entfernen-->
                <v-divider></v-divider>
                <v-list-tile @click="deleteUserscript">
                  <v-list-tile-action>
                    <v-icon>delete</v-icon>
                  </v-list-tile-action>
                  <v-list-tile-title>
                    <span v-lang="'delete_x'"></span>
                  </v-list-tile-title>
                </v-list-tile>
                <!-- Userscript Exportieren -->
                <v-divider></v-divider>
                <v-list-tile @click="export_script">
                  <v-list-tile-action>
                    <v-icon>import_export</v-icon>
                  </v-list-tile-action>
                  <v-list-tile-title>export</v-list-tile-title>
                </v-list-tile>
                <!-- SPA Starten -->
                <span v-if="script.isSpa">
                  <v-divider></v-divider>
                  <v-list-tile @click="start_spa">
                    <v-list-tile-action>
                      <v-icon>play_arrow</v-icon>
                    </v-list-tile-action>
                    <v-list-tile-title>Start SPA</v-list-tile-title>
                  </v-list-tile>
                </span>
                <!--Neuladen von der Quelle-->
                <span v-if="script.moreinformations && script.moreinformations.url">
                  <v-divider></v-divider>
                  <v-list-tile @click="loadAgain">
                    <v-list-tile-action>
                      <v-icon>repeat</v-icon>
                    </v-list-tile-action>
                    <v-list-tile-title>
                      <span v-lang="'reload_from_source'"></span>
                    </v-list-tile-title>
                  </v-list-tile>
                </span>
                <!-- Gespeicherte Variablen anzeigen-->
                <span v-if="script.val_store">
                  <v-divider></v-divider>
                  <v-list-tile @click="GMValuesGet">
                    <v-list-tile-action>
                      <v-icon>get_app</v-icon>
                    </v-list-tile-action>
                    <v-list-tile-title>GM Values show</v-list-tile-title>
                  </v-list-tile>
                  <!-- Gespeicherte Variablen entfernen-->
                  <v-divider></v-divider>
                  <v-list-tile @click="GMValuesDelete">
                    <v-list-tile-action>
                      <v-icon>delete</v-icon>
                    </v-list-tile-action>
                    <v-list-tile-title>GM Values delete</v-list-tile-title>
                  </v-list-tile>
                </span>
              </v-list>
            </v-menu>
          </v-layout>
        </v-flex>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text v-if="showUserscriptEntry">
        <v-list>
          <v-list-tile>
            <v-list-tile-content>{{localScriptDeactivated ? lang.deactivated : lang.activated}}</v-list-tile-content>
            <v-list-tile-content class="align-end">
              <!--Userscript aktivieren oder deaktivieren-->
              <v-switch v-model="localScriptDeactivated"></v-switch>
            </v-list-tile-content>
          </v-list-tile>

          <!-- Restliche Userscript Informationen -->
          <v-list-tile v-for="(info,i) in infos" v-bind:key="i">
            <v-list-tile-content v-if="info.vlang !== true">{{info.text}}</v-list-tile-content>
            <v-list-tile-content v-else v-lang="info.text"></v-list-tile-content>

            <v-list-tile-content v-if="info.value" class="align-end">{{info.value}}</v-list-tile-content>
            <div v-else class="align-end">
              <ol>
                <li v-for="(ele,j) in info.values" v-bind:key="j">{{ele}}</li>
              </ol>
            </div>
          </v-list-tile>
        </v-list>

        <v-card-actions>
          <v-btn @click="showUserscript"><v-icon>pageview</v-icon>{{!showUserscriptContent ? lang.show: lang.hide}}</v-btn>
          <v-btn @click="edit" v-lang:append="'change'"><v-icon>edit</v-icon></v-btn>
          <v-btn @click="deleteUserscript" v-lang:append="'delete_x'"><v-icon>delete</v-icon></v-btn>
        </v-card-actions>

        <!--Greasemonkey Variablen-->
        <div class="row" v-if="GMValues.length > 0">
          <label v-lang="'GMValues'">
            <!--Zeige die gespeicherten GM Variablen-->
          </label>
          <div class="col-xs-12">
            <table class="col-xs-12">
              <thead>
                <th>Name</th>
                <th>Value</th>
              </thead>
              <tbody>
                <tr v-for="(item,i) in GMValues" :key="i">
                  <td>{{item.key}}</td>
                  <td>{{item.value}}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <v-card v-show="showUserscriptContent">
          <!--Userscript Inhalt-->
          <highlightjs-component
            v-if="hightlightsjsActive"
            :code="this.script.userscript"
            :astyle="hightlightsjsStyle"
          />
          <!-- Es dürfen keine Leerzeichen dazwischen sein -->
          <pre v-else><code class="width-100">{{this.script.userscript}}</code></pre>
        </v-card>
      </v-card-text>
    </v-card>
  </v-container>
</template>
<script lang="ts">
import {
  empty,
  notify,
  download_file,
  getExtId
} from "lib/helper/basic_helper";

import HighlightjsComponent from "./Highlight.vue";

import Vue from "vue";
import SPA from "lib/spa/handler";
import userscript_storage from "lib/storage/storage";
import page_injection_helper from "lib/inject/page_injection_helper";

/**
 * legt den Component Namen fest, damit dieser als HTML Tag
 * genutzt werden kann ->
 *
 * const componentName = "list-entry-component";
 * --->
 * <html>... <list-entry-component> ... </html>
 */
const componentName = "list-entry-component";
export default Vue.component(componentName, {
  props: {
    script: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      required: true
    },
    configuration: {
      type: Object as () => usi.Storage.Config,
      required: true
    },
    expanded: {
      required: false,
      type: Boolean
    }
  },
  data: function() {
    return {
      showUserscriptEntry: true,
      showUserscriptContent: false,
      markedAsDeleted: false,
      icon: "/gui/icon/usi.png",
      localScriptDeactivated: false,
      hightlightsjsActive: false,
      infos: <usi.Frontend.UserscriptInfoElement[]>[],
      hightlightsjsStyle: "",
      GMValues: [],
      lang: {
        deactivated: browser.i18n.getMessage("deactivated"),
        activated: browser.i18n.getMessage("activated"),
        delete_x: browser.i18n.getMessage("delete_x"),
        change: browser.i18n.getMessage("change"),
        show: browser.i18n.getMessage("show"),
        hide: browser.i18n.getMessage("hide")
      }
    };
  },
  created: function() {
    // Workaround
    this.localScriptDeactivated = this.script.deactivated;
    if (this.configuration && this.configuration.hightlightjs) {
      if (this.configuration.hightlightjs.active) {
        this.hightlightsjsActive = this.configuration.hightlightjs.active;
      }
      if (this.configuration.hightlightjs.style) {
        this.hightlightsjsStyle = this.configuration.hightlightjs.style;
      }
    }

    // Usersceript Informationen vorbereiten
    this.build_infos_array();
  },
  methods: {
    build_infos_array: function() {
      // Zurücksetzen
      this.infos = [];

      if (this.script.id) {
        this.infos.push({ text: "usi-id", value: this.script.id });
      }
      if (this.script.settings.name) {
        this.infos.push({ text: "Name", value: this.script.settings.name });
      }
      if (this.script.settings.author) {
        this.infos.push({ text: "Author", value: this.script.settings.author });
      }
      if (this.script.settings.version) {
        this.infos.push({
          text: "Version",
          value: this.script.settings.version
        });
      }
      if (this.script.settings.include) {
        this.infos.push({
          text: "Includes",
          values: this.script.settings.include
        });
      }
      if (this.script.settings.description) {
        this.infos.push({
          text: "description",
          value: this.script.settings.description,
          vlang: true
        });
      }

      if (
        this.script.require_scripts instanceof Array &&
        this.script.require_scripts.length > 0
      ) {
        // nur die URL ausgeben
        const values = this.script.require_scripts.map((ele: any) => {
          return ele.url;
        });

        this.infos.push({
          text: "Require Scripts",
          values: values
        });
      }
    },

    export_script: async function(): Promise<void> {
      const script_storage = await userscript_storage();
      const userscript_handler = <any>script_storage.getById(this.script.id);

      if (userscript_handler !== false) {
        // Bietet das Userscript zur lokalen Speicherung an!
        download_file(
          userscript_handler.getUserscriptContent(),
          "text/plain",
          encodeURI(userscript_handler.getSettings()["name"] + ".user.js")
        );
      }
    },
    add_icon: function(): void {
      // Icon mit usi logo füllen, falls leer
      // @todo -- ICON
      if (this.script.settings.icon_data) {
        this.icon = this.script.settings.icon_data;
      }
    },
    /**
     * Userscript aktivieren, bzw deaktivieren
     * @returns void
     */
    toggleActivation: async function(): Promise<void> {
      // aktiviere oder deaktiviere dieses Userscript!
      const id = this.script.id;
      var script_storage = await userscript_storage();
      var userscript_handle = <any>script_storage.getById(id);
      if (userscript_handle !== false) {
        // wechsele den Status ob das Userscript aktiviert oder deaktiviert ist
        userscript_handle.switchActiveState();
      }

      if (userscript_handle.isDeactivated()) {
        // deaktivieren
        new page_injection_helper()
          .remove_userscript(this.script.id)
          .then((check: boolean) => {
            if (check) {
              this.$emit("showSnack", `Userscript ID ${id} deaktiviert`);
            }
          });
      } else {
        // aktivieren
        new page_injection_helper()
          .add_userscript(this.script.id)
          .then((check: boolean) => {
            if (check) {
              this.$emit("showSnack", `Userscript ID ${id} aktiviert`);
            }
          });
      }
    },

    // fragt nach den gesetzten Greasemonkey Variablen
    GMValuesGet: async function(): Promise<void> {
      let script_storage = await userscript_storage();

      let userscript = <any>script_storage.getById(this.script.id);

      var result = [],
        completeValStore = userscript.getValStore();
      for (var name in completeValStore) {
        // Key => value ...
        result.push({ key: name, value: completeValStore[name] });
      }
      this.GMValues = result as any;
    },

    toggleOverview: function(force: any): void {
      if (force === true || force === false) {
        this.showUserscriptEntry = force;
      } else {
        // toggle
        this.showUserscriptEntry = !this.showUserscriptEntry;
      }
    },

    /**
     * Userscript entfernen
     * @returns {void}
     */
    deleteUserscript: function(): void {
      // das Skript mit der ID löschen!
      if (!empty(this.script.id)) {
        // Frage zusammensetzen
        const question_text =
          browser.i18n.getMessage("want_to_delete_this_userscript_1") +
          this.script.id +
          browser.i18n.getMessage("want_to_delete_this_userscript_2");

        //zusätzliche Abfrage
        if (window.confirm(question_text)) {
          (async () => {
            let script_storage = await userscript_storage();
            let userscript_handle = script_storage.getById(this.script.id);
            // userscript_handle darf nicht false sein
            if (userscript_handle !== false) {
              // lösche dieses Element
              await userscript_handle.deleteUserscript();

              notify(
                browser.i18n.getMessage("userscript_was_successful_deleted") +
                  " (ID " +
                  this.script.id +
                  ")"
              );

              // Userscript entfernen lassen
              new page_injection_helper().remove_userscript(this.script.id);
            } else {
              // konnte nicht gefunden und daher auch nicht gelöscht werden
              notify(browser.i18n.getMessage("userscript_could_not_deleted"));
            }
            // Text nur durchstreichen, nicht direkt neuladen
            this.markedAsDeleted = true;
          })();
        }
      }
    },

    // entfernt alle gesetzten GM_Values
    GMValuesDelete: async function(): Promise<any> {
      // Frage den Benutzer nochmals ob er wirklich alle gesetzten Werte entfernen möchte
      const confirmed = window.confirm(
        browser.i18n.getMessage("confirm_delete_all_GMValues")
      );

      if (confirmed === false) {
        return;
      }
      // Wenn dies aufgerufen wird, werden die vorhanden Variablen des Userscripts entfernt (val_store)

      let script_storage = await userscript_storage();
      let userscript_handle = script_storage.getById(this.script.id);
      if (userscript_handle !== false) {
        // entfernen aller zuvor gesetzten Variablen
        userscript_handle.resetValStore().save();
      }
    },

    // Sende es an den Editierungs Controller
    edit: function(): void {
      // veranlasse den Tab Wechsel!
      this.$parent.$emit("change-tab", <usi.Frontend.changeTabEvent>{
        comp: "edit",
        extraData: {
          userscript: this.script.userscript,
          id: this.script.id
        }
      });
    },

    start_spa: function(): void {
      /**
       * Startet ein SPA, in einem neuen Tab
       */
      const spa_instance = new SPA();
      spa_instance.createPage(this.script.id);
    },

    // Übergibt die URL an die Nachlade Funktion
    loadAgain: function(): void {
      if (/^http/.test(this.script.moreinformations.url)) {
        // URL muss mit http beginnen
        /**
         * @todo
         * Zunächst einmal nur einen neuen Tab öffnen
         * Skript später wieder richtig laden
         */
        browser.tabs.create({ url: this.script.moreinformations.url });
      } else {
        notify(
          "only source from http:// or https:// are allowed at the moment"
        );
      }
    },

    showUserscript: function(): void {
      this.showUserscriptContent = !this.showUserscriptContent;
    }
  },
  watch: {
    localScriptDeactivated: function(): void {
      this.toggleActivation();
    },
    expanded: function(): void {
      // auf oder zu klappen, definiert durch List.vue
      this.toggleOverview(this.expanded);
    }
  },
  components: {
    HighlightjsComponent
  }
});
</script>

<style scoped>
.strike-through {
  text-decoration: line-through;
}
.pointer {
  cursor: pointer;
}
.width-100 {
  width: 100%;
  padding: 5px;
}
</style>