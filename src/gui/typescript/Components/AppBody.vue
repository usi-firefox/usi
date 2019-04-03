<template>
  <div id="vuetify-gui">
    <v-app>
      <v-snackbar v-model="snackbar">
        {{ snackbar_text }}
        <v-btn color="pink" flat @click="snackbar = false">Close</v-btn>
      </v-snackbar>
      <v-navigation-drawer style="background-color: #555;" :permanent="drawer_permanent" app v-model="drawer">
        <v-toolbar style="background-color: #555;">
          <v-list>
            <v-list-tile>
              <v-list-tile-title class="title white--text">USI - ({{version}})</v-list-tile-title>
            </v-list-tile>
          </v-list>
        </v-toolbar>
        <v-divider></v-divider>
        <!-- Sidebar -->
        <!-- Sidebar Eintrag -->
        <v-list-tile
          class="white"
          v-once
          v-for="(entry,index) in menuEntries"
          v-bind:key="index"
          @click="hide_side_menu_and_load(index)"
        >
          <v-list-tile-content
            :style="index < (menuEntries.length - 1) ? 'border-bottom: 1px solid grey' : ''"
          >
            <v-list-tile-title v-lang="entry.lang"></v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-navigation-drawer>
      <v-toolbar
        class="blue--text"
        app
        @click.stop="drawer = !drawer"
      >
        <v-toolbar-side-icon v-show="!drawer_permanent"></v-toolbar-side-icon>
        <v-toolbar-title>{{navTitle}}</v-toolbar-title>
      </v-toolbar>
      <v-content>
        <v-container fluid>
          <!-- App Content -->
          <!-- <keep-alive> -->
          <!-- @todo  schaltet die aktive Componente um -->
          <!-- @todo Aktuell ganz übler Workaround, da das <component> Tag nicht wie erwartet funktioniert -->
          <list-component
            v-if="activeComponent == 'list'"
            v-bind:configuration="configuration"
            v-on:change-tab="activeComponent = $event.comp; extraData = $event.extraData"
            v-on:change-tab-additional="eventsFromOtherComponents"
            v-bind:addional="extraData"
          ></list-component>
          <edit-component
            v-if="activeComponent == 'edit'"
            v-on:change-tab="activeComponent = $event.comp; extraData = $event.extraData"
            v-on:change-tab-additional="eventsFromOtherComponents"
            v-bind:addional="extraData"
          ></edit-component>
          <config-component
            v-if="activeComponent == 'config'"
            v-on:change-tab="activeComponent = $event.comp; extraData = $event.extraData"
            v-on:change-tab-additional="eventsFromOtherComponents"
            v-bind:initial-data="configuration"
            v-bind:addional="extraData"
          ></config-component>
          <loadExternal-component
            v-if="activeComponent == 'loadExternal'"
            v-on:change-tab="activeComponent = $event.comp; extraData = $event.extraData"
            v-on:change-tab-additional="eventsFromOtherComponents"
            v-bind:addional="extraData"
          ></loadExternal-component>
          <!-- </keep-alive> -->
          <!-- App Content -->
        </v-container>
      </v-content>
    </v-app>
  </div>
  <!-- Main -->
</template>

<script lang="ts">
declare const document : Document;

import config_storage from "lib/storage/config";

import Vue from "vue";

import EditComponent from "Components/Edit.vue";
import LoadExternalComponent from "Components/LoadExternal.vue";
import ConfigComponent from "Components/Config.vue";
import ListComponent from "Components/List.vue";
import HelpComponent from "Components/Help.vue";

// Versionslabel auslesen
const componentName = "appbody-component";

// AppBody Vue Instance - Verwaltet die einzelnen Components
export default Vue.component(componentName, {
  data: function() {
    return {
      navTitle: "All Userscripts",
      drawer: false,
      snackbar: false,
      snackbar_text: "",
      // Wird auf Desktop Geräten auf true gesetzt
      drawer_permanent : false,

      // legt fest, welcher Component momentan aktiv ist
      activeComponent: "list",
      extraData: {},
      configuration: <usi.Storage.Config>{},
      menuEntries: <usi.Frontend.menuEntry[]>[],
      version: browser.runtime.getManifest().version
    };
  },

  created: function() {
    /**
     * ACHTUNG Direkter Zugriff über die ID
     */
    const app_div = document.getElementById("vuetify-gui");
    if(app_div instanceof HTMLDivElement && app_div.clientWidth > 1200){
      /** 
       * Falls die clientWidth größer als "x" sein sollte
       * setzen wir den Drawer auf "permanent" damit er nicht geschloßen wird
       */ 
      this.drawer_permanent = true;
    }

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
    eventsFromOtherComponents: function(
      data: usi.Frontend.changeTabAdditionalEvent
    ): void {
      switch (data.event_name) {
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
        default:
          // nichts tun
          break;
      }
    },
    hide_side_menu_and_load: function(index: number): void {
      // Aktuelle Komponente suchen
      const menu_entry = this.menuEntries[index];
      if (!menu_entry) {
        throw "component nicht gefunden in data.menuEntries";
      }

      this.change_active_component(menu_entry);
    },

    change_active_component: function(menuEntry: usi.Frontend.menuEntry): void {
      // ersetze die Überschrift
      this.navTitle = browser.i18n.getMessage(menuEntry.lang);

      // Aktive Komponente umschalten
      this.activeComponent = menuEntry.name;

      this.drawer = false;
    }
    // Toggle Sidebar Menu
  },
  computed: {},
  watch: {
    activeComponent: function() {
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
<style>
/** Workaround/Fix **/
div.container {
  padding-left: 10px;
  padding-right: 10px;
}
</style>
