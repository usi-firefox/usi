<template>
    <!--Alle Userscripte auflisten-->
    <div>
        <v-progress-linear :indeterminate="isLoading"></v-progress-linear>
        <div>
            <h3>
                <span v-if="userscripts" @click="toggleExpanded">
                    Userscripts ({{userscripts.length}})
                    <v-btn>
                        <v-icon v-html="is_expanded ? 'expand_more' : 'expand_less'"></v-icon>
                    </v-btn>
                </span>
                <span v-else data-usi-lang="no_userscript_there">
                </span>
            </h3>
            <v-spacer></v-spacer>
            <v-btn @click="refresh">
                <i class="material-icons">refresh</i>
            </v-btn>
        </div>

        <div v-if="userscripts" v-for="(script,index) in userscripts" :key="index">
            <list-entry-component v-bind:expanded="is_expanded" v-bind:configuration="configuration" v-bind:script="script" v-bind:index="index" />
        </div>
    </div>
</template>

<script lang="ts">
import event_controller from "../events/event_controller";

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
    props: {
        configuration: {
            type: Object as () => usi.Storage.Config,
            required: true
        }
    },
    data: function () {
        return {
            is_expanded: true,
            isLoading: true,
            userscripts: []
        };
    },
    created: function () {
        this.refresh();
    },
    methods: {
        // fragt die Userscripte ab
        refresh: async function (): Promise<void> {
            this.isLoading = true;
            this.userscripts = <any>await event_controller().request.userscript.all();
            this.isLoading = false;
        },
        toggleExpanded: function (): void {
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