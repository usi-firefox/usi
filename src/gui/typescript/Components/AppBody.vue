<template>
  <div id="gui" class="scrollable-content">
    <v-app>
      <v-navigation-drawer app v-model="drawer">
        <v-toolbar>
          <v-list>
            <v-list-tile>
              <v-list-tile-title class="title">
                USI - ({{version}})
              </v-list-tile-title>
            </v-list-tile>
          </v-list>
        </v-toolbar>
        <v-divider></v-divider>
        <!-- Sidebar -->
        <!-- Sidebar Eintrag -->
        <v-list-tile v-once v-for="(entry,index) in menuEntries" v-bind:key="index" @click="hide_side_menu_and_load(index)">
          <v-list-tile-content>
            <v-list-tile-title v-bind:data-usi-lang="entry.lang"></v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-navigation-drawer>
      <v-toolbar app>
        <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
        <v-toolbar-title>{{navTitle}}</v-toolbar-title>
        </v-toolbar>
      <v-content>
        <v-container fluid>
          <!-- App Content -->
          <!-- <keep-alive> -->
          <!-- @todo  schaltet die aktive Componente um -->
          <!-- @todo Aktuell ganz übler Workaround, da das <component> Tag nicht wie erwartet funktioniert -->
          <list-component v-if="activeComponent == 'list'" v-bind:configuration="configuration" v-on:change-tab="activeComponent = $event.comp; extraData = $event.extraData" v-on:change-tab-additional="eventsFromOtherComponents" v-bind:addional="extraData"></list-component>
          <edit-component v-if="activeComponent == 'edit'" v-on:change-tab="activeComponent = $event.comp; extraData = $event.extraData" v-on:change-tab-additional="eventsFromOtherComponents" v-bind:addional="extraData"></edit-component>
          <config-component v-if="activeComponent == 'config'" v-on:change-tab="activeComponent = $event.comp; extraData = $event.extraData" v-on:change-tab-additional="eventsFromOtherComponents" v-bind:initial-data="configuration" v-bind:addional="extraData"></config-component>
          <loadExternal-component v-if="activeComponent == 'loadExternal'" v-on:change-tab="activeComponent = $event.comp; extraData = $event.extraData" v-on:change-tab-additional="eventsFromOtherComponents" v-bind:addional="extraData"></loadExternal-component>
          <!-- </keep-alive> -->
          <!-- App Content -->
        </v-container>
      </v-content>
    </v-app>
  </div>
  <!-- Main -->
</template>

<script lang="ts">
declare var jQuery: any;

import event_controller from "../events/event_controller";

import language_replace_in_DOM from "../Language";
import config_storage from "lib/storage/config";

import Vue from "vue";

import EditComponent from "Components/Edit.vue";
import LoadExternalComponent from "Components/LoadExternal.vue";
import ConfigComponent from "Components/Config.vue";
import ListComponent from "Components/List.vue";
import HelpComponent from "Components/Help.vue";

const class_names_for_sidebar = "sidebar-left-visible sidebar-left-in";
// Versionslabel auslesen
const manifest = <any>browser.runtime.getManifest();

const componentName = "appbody-component";

// AppBody Vue Instance - Verwaltet die einzelnen Components
export default Vue.component(componentName, {
  data: function () {
    return {
      navTitle: "All Userscripts",
      drawer : false,

      // legt fest, welcher Component momentan aktiv ist
      activeComponent: "list",
      extraData: {},
      configuration: <usi.Storage.Config>{},
      menuEntries: <any>[],
      version: ""
    };
  },

  created: function () {
    this.version = manifest.version;

    this.menuEntries = [
      { name: "list", lang: "all_userscripts" },
      { name: "edit", lang: "create_new_userscript" },
      { name: "loadExternal", lang: "userscript_after_load" },
      { name: "config", lang: "loadOptions_title" }
      /* { name: "help", lang: "help" } */
    ];

    /**
     * Zunächst die Konfiguration laden
     */
    config_storage()
      .get()
      .then((config: usi.Storage.Config) => {
        this.configuration = config;

        // initialisiere die globalen Events für die Kommunikation mit dem Backend
        event_controller().register_global_events();

        // Eigenes CSS
        if (this.configuration.own_css.length > 0) {
          // CSS aktivieren
          this.change_css(this.configuration.own_css);
        }

        // initial die overview Komponente laden
        this.hide_side_menu_and_load(0);
      })
      .catch((message: any) => {
        /** Fehler beim Laden der Konfiguration */
        console.error("Error in loading usi:config_storage");
        console.error(message);
        alert(message);
      });
  },
  methods: {
    eventsFromOtherComponents: function (data: any): void {
      switch (data.event_name) {
        case "usi:lang":
          Vue.nextTick().then(function () {
            /**
             * nachdem die create() ausgeführt wurde,
             * müssen noch die Attribute data-usi-lang ersetzt werden
             */
            language_replace_in_DOM();
          });
          break;
        case "usi:reset-extraData":
          this.extraData = {};
          break;
        case "usi:refresh-config":
          config_storage()
            .get()
            .then((config: usi.Storage.Config) => {
              this.configuration = config;
            });
          break;
        case "usi:change-additional-css":
          this.change_css(data.data);
          break;
        default:
          // nichts tun
          break;
      }
    },
    change_css: function (cssContent: string): void {
      let css_text = cssContent.replace(/<\/?[^>]+>/gi, "");
      // CSS aktivieren
      jQuery("#usiAdditionalCss").text(css_text);
    },
    hide_side_menu_and_load: function (index: number): void {
      // Aktuelle Komponente suchen
      const menu_entry = this.menuEntries[index];
      if (!menu_entry) {
        throw "component nicht gefunden in data.menuEntries";
      }

      this.change_active_component(menu_entry);
    },

    change_active_component: function (menuEntry: {
      name: string;
      lang: string;
    }): void {
      // @todo
      jQuery("body").removeClass(class_names_for_sidebar);

      // ersetze die Überschrift
      this.navTitle = browser.i18n.getMessage(menuEntry.lang);

      // Aktive Komponente umschalten
      this.activeComponent = menuEntry.name;

      this.replace_language_attributes();

      this.drawer = false;
    },

    replace_language_attributes: function (): void {
      Vue.nextTick().then(function () {
        /**
         * nachdem die create() ausgeführt wurde,
         * müssen noch die Attribute data-usi-lang ersetzt werden
         */
        language_replace_in_DOM();
      });
    },

    // Toggle Sidebar Menu
  },
  computed: {},
  watch: {
    activeComponent: function () {
      // passenden Eintrag suchen
      // und change_active_component() aufrufen
      for (let comp of this.menuEntries) {
        if (comp.name === this.activeComponent) {
          this.change_active_component(comp);
          // erledigt
          return;
        }
      }

      // Es wurde kein passender Component gefunden, Fehler
      throw "Kein passender Component gefunden (AppBody.watch.activeComponent())";
    }
  },
  components: {
    // Komponenten manuell hinzufügen
    EditComponent,
    ConfigComponent,
    ListComponent,
    LoadExternalComponent
    /* , HelpComponent */
  }
});
</script>