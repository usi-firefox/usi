<template>
  <!--Alle Userscripte auflisten-->
  <v-container grid-list-md>
    <v-progress-linear v-show="isLoading" :indeterminate="isLoading"></v-progress-linear>
    <v-layout>
      <v-toolbar>
        <v-toolbar-title>
          <span v-if="userscripts.length > 0">Userscripts ({{userscripts.length}})</span>
          <span v-else v-lang="'no_userscript_there'"></span>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-toolbar-items class="hidden-sm-and-down">
          <v-btn flat @click="toggleExpanded">
            <v-icon>expand_more</v-icon>
            <v-icon>expand_less</v-icon>
          </v-btn>
          <v-btn flat @click="refresh">
            <i class="material-icons">refresh</i>
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>
    </v-layout>

    <v-layout v-if="userscripts">
      <list-entry-component
        v-for="(script,index) in userscripts"
        v-bind:key="index"
        v-bind:expanded="is_expanded"
        v-bind:configuration="configuration"
        v-bind:script="script"
        v-bind:index="index"
      />
    </v-layout>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import ListEntryComponent from "./List/ListEntry.vue";
import userscript_storage from "lib/storage/storage";

/**
 * legt den Component Namen fest, damit dieser als HTML Tag
 * genutzt werden kann ->
 *
 * const componentName = "list-component";
 * --->
 * <html>... <list-component> ... </html>
 */
const componentName = "list-component";
export default Vue.component(componentName, {
  props: {
    configuration: {
      type: Object as () => usi.Storage.Config,
      required: true
    }
  },
  data: function() {
    return {
      is_expanded: true,
      isLoading: true,
      userscripts: []
    };
  },
  created: function() {
    this.refresh();
  },
  methods: {
    // fragt die Userscripte ab
    refresh: async function(): Promise<void> {
      this.isLoading = true;

      const script_storage = await userscript_storage();

      await script_storage.refresh();
      this.userscripts = <any>script_storage.getAll();

      this.isLoading = false;
    },
    toggleExpanded: function(): void {
      this.is_expanded = !this.is_expanded;
    }
  },
  components: {
    ListEntryComponent
  }
});
</script>

<style>
</style>