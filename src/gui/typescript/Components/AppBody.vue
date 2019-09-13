<template>
  <div id="vuetify-gui">
    <v-app>
      <v-snackbar v-model="snackbar">
        {{ snackbar_text }}
        <v-btn color="red" text @click="snackbar = false">X</v-btn>
      </v-snackbar>
      <v-navigation-drawer
        style="background-color: #555;"
        :permanent="drawer_permanent"
        app
        v-model="drawer"
      >
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="title white--text">
            USI
          </v-list-item-title>
          <v-list-item-subtitle class="white--text">
            {{version}}
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
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
            style="border-bottom: 1px solid grey"
          >
            <v-list-item-title v-lang="entry.lang"></v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-navigation-drawer>
      <v-app-bar class="blue--text" app @click.stop="drawer = !drawer">
        <v-app-bar-nav-icon></v-app-bar-nav-icon>
        <v-toolbar-title>{{navTitle}}</v-toolbar-title>
      </v-app-bar>
      <v-content>
        <!-- App Content -->
        <!-- <keep-alive> -->
        <!-- @todo  schaltet die aktive Componente um -->
        <!-- @todo Aktuell ganz übler Workaround, da das <component> Tag nicht wie erwartet funktioniert -->
        <list-component v-if="activeView == 'list'"></list-component>
        <edit-component v-if="activeView == 'edit'"></edit-component>
        <config-component v-if="activeView == 'config'"></config-component>
        <loadExternal-component v-if="activeView == 'loadExternal'"></loadExternal-component>
        <!-- </keep-alive> -->
        <!-- App Content -->
      </v-content>
    </v-app>
  </div>
  <!-- Main -->
</template>

<script lang="ts">
declare const document: Document;

import Vue from "vue";

import EditComponent from "Components/Edit.vue";
import LoadExternalComponent from "Components/LoadExternal.vue";
import ConfigComponent from "Components/Config.vue";
import ListComponent from "Components/List.vue";
import HelpComponent from "Components/Help.vue";
import { getTranslation } from "../../../lib/helper/basic_helper";
import { mapState } from "vuex";

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
      drawer_permanent: false,

      extraData: {},
      menuEntries: <usi.Frontend.menuEntry[]>[],
      version: browser.runtime.getManifest().version
    };
  },

  created: function() {
    browser.runtime.getPlatformInfo().then((info: any)=> {
      if(info.os !== "android"){
        // Falls es kein Android ist, wird der Drawer Permanent gesetzt
        this.drawer_permanent = true;
      }
    });

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
    this.$store.dispatch("configurationLoadFromStorage");

    // Register Global Events
    this.$root.$on("snackbar", (text: string) => {
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
    activeView: {
      get() {
        return (this as any).$store.getters.activeView;
      },
      set(viewName: string) {
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
