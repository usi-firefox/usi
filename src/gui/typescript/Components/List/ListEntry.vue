<template>
  <v-container>
    <v-card :class="[{'strike-through': markedAsDeleted}, localScriptDeactivated ? 'grey' : '']  ">
      <v-card-title>
        <v-flex xs11 @click="toggleOverview" class="pointer headline ">
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
                    <i class="material-icons">pageview</i>
                  </v-list-tile-action>
                  <v-list-tile-title>
                    <span v-html="!showUserscriptContent ? lang.show: lang.hide"></span>
                  </v-list-tile-title>
                </v-list-tile>

                <!--Userscript bearbeiten-->
                <v-divider></v-divider>
                <v-list-tile @click="edit">
                  <v-list-tile-action>
                    <i class="material-icons">edit</i>
                  </v-list-tile-action>
                  <v-list-tile-title>
                    <span v-html="lang.change"></span>
                  </v-list-tile-title>
                </v-list-tile>

                <!--Userscript entfernen-->
                <v-divider></v-divider>
                <v-list-tile @click="deleteUserscript">
                  <v-list-tile-action>
                    <i class="material-icons">delete</i>
                  </v-list-tile-action>
                  <v-list-tile-title>
                    <span v-html="lang.delete_x"></span>
                  </v-list-tile-title>
                </v-list-tile>
                <!-- Userscript Exportieren -->
                <v-divider></v-divider>
                <v-list-tile @click="export_script">
                  <v-list-tile-action>
                    <i class="material-icons">import_export</i>
                  </v-list-tile-action>
                  <v-list-tile-title>export</v-list-tile-title>
                </v-list-tile>
                <!-- SPA Starten -->
                <span v-if="script.isSpa">
                  <v-divider></v-divider>
                  <v-list-tile @click="start_spa">
                    <v-list-tile-action>
                      <i class="material-icons">play_arrow</i>
                    </v-list-tile-action>
                    <v-list-tile-title>Start SPA</v-list-tile-title>
                  </v-list-tile>
                </span>
                <!--Neuladen von der Quelle-->
                <span v-if="script.moreinformations && script.moreinformations.url">
                  <v-divider></v-divider>
                  <v-list-tile @click="loadAgain">
                    <v-list-tile-action>
                      <i class="material-icons">repeat</i>
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
                      <i class="material-icons">get_app</i>
                    </v-list-tile-action>
                    <v-list-tile-title>GM Values show</v-list-tile-title>
                  </v-list-tile>
                  <!-- Gespeicherte Variablen entfernen-->
                  <v-divider></v-divider>
                  <v-list-tile @click="GMValuesDelete">
                    <v-list-tile-action>
                      <i class="material-icons">delete</i>
                    </v-list-tile-action>
                    <v-list-tile-title>GM Values delete</v-list-tile-title>
                  </v-list-tile>
                </span>
              </v-list>
            </v-menu>
          </v-layout>
        </v-flex>
      </v-card-title>
      <v-card-text v-if="this.showUserscriptEntry">
        <!--Userscript aktivieren oder deaktivieren-->
        <v-switch
          v-model="localScriptDeactivated"
          :label="localScriptDeactivated ? lang.deactivated : lang.activated"
        ></v-switch>

        <p v-if="script.id">
          <strong>usi-id</strong>
          : {{script.id}}
        </p>
        <p v-if="script.settings.name">
          <strong>Name</strong>
          : {{script.settings.name}}
        </p>
        <p v-if="script.settings.author">
          <strong>Author</strong>
          : {{script.settings.author}}
        </p>
        <p v-if="script.settings.version">
          <strong>Version</strong>
          : {{script.settings.version}}
        </p>
        <p v-if="script.settings.description">
          <strong v-lang="'description'"></strong>
          :{{script.settings.description}}
        </p>

        <!--Require Skripte-->
        <div v-if="script.require_scripts.length > 0">
          <p>
            <strong>Require Scripts</strong>
          </p>
          <ol class="usi-list-entry-required-scripts---output">
            <li v-for="entry in script.require_scripts" :key="entry.url">{{entry.url}}</li>
          </ol>
        </div>

        <div v-if="script.settings && script.settings.include">
          <!--gültige Include Regeln-->
          <p>
            <strong>Includes</strong>
          </p>
          <ol>
            <li v-for="(entry,idx) in script.settings.include" :key="idx">{{entry}}</li>
          </ol>
        </div>

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
                <tr v-for="(item,index) in GMValues" :key="index">
                  <td>{{item.key}}</td>
                  <td>{{item.value}}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <!--Userscript Inhalt-->

        <div v-if="showUserscriptContent" class="usi-list-entry-view-userscript---output row">
          <span v-if="hightlightsjsActive">
            <highlightjs-component :code="this.script.userscript" :astyle="hightlightsjsStyle"/>
          </span>
          <span v-else>
            <!-- Es dürfen keine Leerzeichen dazwischen sein -->
            <pre><code class="border-black">{{this.script.userscript}}</code></pre>
          </span>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>
<script lang="ts">
declare var global_settings: any;

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
      localScriptDeactivated: this.$props.script.deactivated,
      hightlightsjsActive: this.configuration.hightlightjs.active,
      hightlightsjsStyle: this.configuration.hightlightjs.style,
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
  created: function() {},
  methods: {
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

<style>
.strike-through {
  text-decoration: line-through;
}
.pointer {
  cursor: pointer;
}
</style>