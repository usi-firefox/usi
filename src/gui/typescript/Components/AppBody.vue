<template>
  <div id="vuetify-gui">
    <v-app>
      <v-snackbar v-model="snackbar">
        {{ snackbar_text }}
        <v-btn color="red" flat @click="snackbar = false">X</v-btn>
      </v-snackbar>
      <v-navigation-drawer style="background-color: #555;" :permanent="drawer_permanent" app v-model="drawer">
        <v-toolbar style="background-color: #555;">
          <v-list>
            <v-list-item>
              <v-list-item-title class="title white--text">USI - ({{version}})</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-toolbar>
        <v-divider></v-divider>
        <!-- Sidebar -->
        <!-- Sidebar Eintrag -->
        <v-list-item
          class="white"
          v-once
          v-for="(entry,index) in menuEntries"
          v-bind:key="index"
          @click="hide_side_menu_and_load(index)"
        >
          <v-list-item-content
            :style="index < (menuEntries.length - 1) ? 'border-bottom: 1px solid grey' : ''"
          >
            <v-list-item-title v-lang="entry.lang"></v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-navigation-drawer>
      <v-app-bar
        class="blue--text"
        app
        @click.stop="drawer = !drawer"
      >
        <v-app-bar-nav-icon v-show="!drawer_permanent"></v-app-bar-nav-icon>
        <v-toolbar-title>{{navTitle}}</v-toolbar-title>
      </v-app-bar>
      <v-content>
          <!-- App Content -->
          <!-- <keep-alive> -->
          <!-- @todo  schaltet die aktive Componente um -->
          <!-- @todo Aktuell ganz übler Workaround, da das <component> Tag nicht wie erwartet funktioniert -->
          <list-component
            v-if="activeView == 'list'"
            v-bind:configuration="configuration"
          ></list-component>
          <edit-component
            v-if="activeView == 'edit'"
          ></edit-component>
          <config-component
            v-if="activeView == 'config'"
            v-bind:initial-data="configuration"
          ></config-component>
          <loadExternal-component
            v-if="activeView == 'loadExternal'"
          ></loadExternal-component>
          <!-- </keep-alive> -->
          <!-- App Content -->
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
import { getTranslation } from "../../../lib/helper/basic_helper";

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

      // Register Global Events
      this.$root.$on("snackbar",(text:string) => {
        this.snackbar = true;
        this.snackbar_text = text;
      });
  },
  methods: {
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
      this.navTitle = getTranslation(menuEntry.lang);

      // Aktive Komponente umschalten
      this.activeView = menuEntry.name;

      this.drawer = false;
    }
    // Toggle Sidebar Menu
  },
  computed: {
    // legt fest, welcher Component momentan aktiv ist
    activeView :{
      get(){
        return (this as any).$store.getters.activeView;
      },
      set(viewName: string){
        this.$store.commit("activeView", viewName);
      }
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
</style>
