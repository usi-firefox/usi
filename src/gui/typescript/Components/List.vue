<template>
    <!--Alle Userscripte auflisten-->
    <v-container grid-list-md>
        <v-progress-linear v-show="isLoading" :indeterminate="isLoading"></v-progress-linear>
        <v-layout row wrap>
            <h3>
                <span v-if="userscripts.length > 0" @click="toggleExpanded">
                    <p>Userscripts ({{userscripts.length}})
                    <v-btn>
                        <v-icon v-html="is_expanded ? 'expand_more' : 'expand_less'"></v-icon>
                    </v-btn>
                    </p>
                </span>
                <span v-else >
                    <p data-usi-lang="no_userscript_there"></p>
                </span>
            </h3>
            <v-spacer></v-spacer>
            <v-btn @click="refresh">
                <i class="material-icons">refresh</i>
            </v-btn>
        </v-layout>

        <v-layout v-if="userscripts">
            <list-entry-component v-for="(script,index) in userscripts" v-bind:key="index" v-bind:expanded="is_expanded" v-bind:configuration="configuration" v-bind:script="script" v-bind:index="index" />
        </v-layout>
    </v-container>
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