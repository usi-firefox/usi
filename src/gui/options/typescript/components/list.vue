<template>
    <!--Alle Userscripte auflisten-->
    <div class="container">
        <div class="row">
            <div :class="{hidden : !isLoading}">
                <object data="icon/hourglass.svg" type="image/svg+xml"></object>
            </div>
            <h3 class="col-xs-6">
                <span v-if="userscripts">
                    Userscripts ({{userscripts.length}})
                    <i id="usi-list-userscript-expandOrCompress" class="fa fa-expand"></i>
                </span>
                <span v-else data-usi-lang="no_userscript_there">
                </span>
            </h3>
            <button class="btn btn-primary col-xs-push-4 col-xs-2" @click="refresh">
                <i class="fa fa-refresh"></i>
            </button>
        </div>
        <div class="panel-group">
            <div v-if="userscripts">
                <div v-for="(script,index) in userscripts" :key="index">
                    <list-entry-component v-bind:script="script" v-bind:index="index" />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import event_controller from "events/event_controller";
import userscript_list_entry_class from "userscript/list_entry";

import Vue from "vue";
import ListEntryComponent from "./List/ListEntry.vue";

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
  data: function() {
    return {
      is_expanded: false,
      isLoading: false,
      userscripts: []
    };
  },
  created: function() {
    this.refresh();
  },
  methods: {
    // fragt die Userscripte ab
    refresh: async function() {
      this.userscripts = <any>await event_controller().request.userscript.all();
    }
  },
  components: {
    ListEntryComponent
  }
});
</script>

<style>

</style>