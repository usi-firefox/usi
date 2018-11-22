<template>
    <div v-if="localScript">
        <v-flex>
            <div class="usi-list-entry-id" :class="[{'strike-through': markedAsDeleted}]">
                <v-card :class="localScriptDeactivated ? 'grey' : ''">
                    <v-card-title primary-title>
                        <div @click="toggleOverview" class="pointer">
                            <img v-bind:src="localScript.icon" />
                            <h3>Index: {{index}} | {{localScript.settings.name}} | {{localScript.settings.author}} | {{localScript.settings.version}}
                                <span v-if="localScript.isSpa"> | SPA</span>
                                <v-btn icon>
                                    <v-icon v-html="showUserscriptEntry ? 'expand_less' : 'expand_more'" title="expand or compress overview"></v-icon>
                                </v-btn>
                            </h3>
                        </div>
                        <v-spacer></v-spacer>
                        <v-menu offset-y>
                            <!-- Options Menü -->
                            <span slot="activator" class="pointer">
                                <!-- !!!TODO -->
                                <v-btn icon>
                                    <v-icon>more_vert</v-icon>
                                </v-btn>
                            </span>

                            <v-list class="pointer">
                                <!--Userscript anzeigen/ausblenden-->
                                <v-list-tile>
                                    <v-list-tile-title @click="showUserscript">
                                        <i class="material-icons">pageview</i>
                                        <span v-html="!showUserscriptContent ? lang.show: lang.hide"></span>
                                    </v-list-tile-title>
                                </v-list-tile>
                                <v-divider></v-divider>

                                <!--Userscript bearbeiten-->
                                <v-list-tile>
                                    <v-list-tile-title @click="edit">
                                        <i class="material-icons">edit</i>
                                        <span v-html="lang.change"></span>
                                    </v-list-tile-title>
                                </v-list-tile>
                                <v-divider></v-divider>

                                <!--Userscript entfernen-->
                                <v-list-tile>
                                    <v-list-tile-title @click="deleteUserscript">
                                        <i class="material-icons">delete</i>
                                        <span v-html="lang.delete_x"></span>
                                    </v-list-tile-title>
                                </v-list-tile>
                                <v-divider></v-divider>
                                <!-- Userscript Exportieren -->
                                <v-list-tile>
                                    <v-list-tile-title @click="export_script">
                                        <i class="material-icons">import_export</i>
                                        export
                                    </v-list-tile-title>
                                </v-list-tile>
                                <v-divider></v-divider>
                                <!-- SPA Starten -->
                                <v-list-tile v-if="localScript.isSpa">
                                    <v-list-tile-title @click="start_spa">
                                        <i class="material-icons">play_arrow</i>
                                        Start SPA
                                    </v-list-tile-title>
                                </v-list-tile>
                                <v-divider></v-divider>
                                <!--Neuladen von der Quelle-->
                                <v-list-tile v-if="localScript.moreinformations && localScript.moreinformations.url">
                                    <v-list-tile-title @click="loadAgain">
                                        <i class="material-icons">repeat</i>
                                        <span data-usi-lang="reload_from_source"></span>
                                    </v-list-tile-title>
                                </v-list-tile>
                                <v-divider></v-divider>
                                <!-- Gespeicherte Variablen anzeigen-->
                                <v-list-tile v-if="localScript.val_store">
                                    <v-list-tile-title @click="GMValuesGet">
                                        <i class="material-icons">get_app</i>
                                        GM Values show
                                    </v-list-tile-title>
                                </v-list-tile>
                                <v-divider></v-divider>

                                <!-- Gespeicherte Variablen entfernen-->
                                <v-list-tile v-if="localScript.val_store">
                                    <v-list-tile-title @click="GMValuesDelete">
                                        <i class="material-icons">delete</i>
                                        GM Values delete
                                    </v-list-tile-title>
                                </v-list-tile>

                            </v-list>
                        </v-menu>
                    </v-card-title>
                    <v-card-text v-if="this.showUserscriptEntry">
                        <!--Userscript aktivieren oder deaktivieren-->
                        <v-switch v-model="localScriptDeactivated" :label="localScriptDeactivated ? lang.deactivated : lang.activated"></v-switch>

                        <p v-if="localScript.id">usi-id: {{localScript.id}} </p>
                        <p v-if="localScript.settings.name">Name: {{localScript.settings.name}} </p>
                        <p v-if="localScript.settings.author">Author: {{localScript.settings.author}} </p>
                        <p v-if="localScript.settings.version">Version: {{localScript.settings.version}} </p>
                        <p v-if="localScript.settings.description"> <span data-usi-lang="description"></span>:{{localScript.settings.description}} </p>

                        <!--Require Skripte-->
                        <div v-if="localScript.require_scripts.length > 0">

                            <p>Require Scripts:</p>
                            <ol class="usi-list-entry-required-scripts---output">
                                <li v-for="entry in localScript.require_scripts" :key="entry.url">
                                    {{entry.url}}
                                </li>
                            </ol>
                        </div>

                        <div v-if="localScript.settings && localScript.settings.include">
                            <!--gültige Include Regeln-->
                            <p>Includes:</p>
                            <ol>
                                <li v-for="(entry,index) in localScript.settings.include" :key="index">
                                    {{entry}}
                                </li>
                            </ol>
                        </div>

                        <!--Greasemonkey Variablen-->
                        <div class="row" v-if="GMValues.length > 0">
                            <label data-usi-lang="GMValues">
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
                                <highlightjs-component :code="this.localScript.userscript" :astyle="hightlightsjsStyle" />
                            </span>
                            <span v-else>
                                <!-- Es dürfen keine Leerzeichen dazwischen sein -->
                                <pre><code class="border-black">{{this.localScript.userscript}}</code></pre>
                            </span>
                        </div>
                    </v-card-text>
                </v-card>
            </div>
        </v-flex>
    </div>
</template>
<script lang="ts">
declare var jQuery: any;
declare var global_settings: any;

import basic_helper from "lib/helper/basic_helper";
import event_controller from "../../events/event_controller";
import language_replace_in_DOM from "../../Language";

import HighlightjsComponent from "./Highlight.vue";

import Vue from "vue";

function flatten_keys(obj: any, prepend_key: string, result?: any) {
    var key;
    if (typeof result === "undefined") {
        result = {};
    }
    for (var i in obj) {
        key = prepend_key + "-" + i;
        if (typeof obj[i] === "object") {
            flatten_keys(obj[i], key, result);
        } else {
            result[key] = obj[i];
        }
    }

    return result;
}

var highlightjs_already_done = false;
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
            required: true
        },
        index: {
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
    data: function () {
        return {
            showUserscriptEntry: true,
            showUserscriptContent: false,
            markedAsDeleted: false,
            localScript: this.$props.script,
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
    created: function () {
        if (typeof this.localScript.settings.spa !== "undefined") {
            this.localScript.isSpa = true;
        }

        // @todo
        this.$parent.$emit("change-tab-additional", { event_name: "usi:lang" });
    },
    methods: {
        export_script: function (): void {
            event_controller().get.userscript.export.single(this.localScript.id);
        },
        add_icon: function (): void {
            // Icon mit usi logo füllen, falls leer
            // @todo -- ICON
            if (!this.localScript.settings.icon_data) {
                // default ICON
                this.localScript.icon = "/gui/icon/usi.png";
            } else {
                this.localScript.icon = this.localScript.settings.icon_data;
            }
        },
        /**
         * Userscript aktivieren, bzw deaktivieren
         * @returns void
         */
        toggleActivation: function (): void {
            // aktiviere oder deaktiviere dieses Userscript!
            event_controller().set.userscript.toogle_state(this.localScript.id);

            this.localScript.deactivated = !this.localScript.deactivated;
        },

        // fragt nach den gesetzten Greasemonkey Variablen
        GMValuesGet: function (): void {
            event_controller()
                .request.userscript.gm_values(this.localScript.id)
                .then((GMValues: any) => {
                    this.GMValues = GMValues;
                });
        },

        toggleOverview: function (force: any): void {
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
        deleteUserscript: function (): void {
            // das Skript mit der ID löschen!
            if (!basic_helper().empty(this.localScript.id)) {
                // Frage zusammensetzen
                const question_text =
                    browser.i18n.getMessage("want_to_delete_this_userscript_1") +
                    this.localScript.id +
                    browser.i18n.getMessage("want_to_delete_this_userscript_2");

                //zusätzliche Abfrage
                if (window.confirm(question_text)) {
                    event_controller().request.userscript.delete(this.localScript.id);

                    // Text nur durchstreichen, nicht direkt neuladen
                    this.markedAsDeleted = true;
                }
            }
        },

        // entfernt alle gesetzten GM_Values
        GMValuesDelete: function (): void {
            // Frage den Benutzer nochmals ob er wirklich alle gesetzten Werte entfernen möchte
            if (
                window.confirm(browser.i18n.getMessage("confirm_delete_all_GMValues"))
            ) {
                event_controller().set.userscript.gm_values.delete_all(
                    this.localScript.id
                );
            }
        },

        // Sende es an den Editierungs Controller
        edit: function (): void {
            // veranlasse den Tab Wechsel!
            this.$parent.$emit("change-tab", {
                comp: "edit",
                extraData: {
                    userscript: this.localScript.userscript,
                    id: this.localScript.id
                }
            });
        },

        start_spa: function (): void {
            event_controller().request.userscript.start_spa(this.localScript);
        },

        // Übergibt die URL an die Nachlade Funktion
        loadAgain: function (): void {
            if (/^http/.test(this.localScript.moreinformations.url)) {
                // URL muss mit http beginnen
                event_controller().request.userscript.reload_from_source(
                    this.localScript.moreinformations.url
                );
            } else {
                basic_helper().notify(
                    "only source from http:// or https:// are allowed at the moment"
                );
            }
        },

        showUserscript: function (): void {
            this.showUserscriptContent = !this.showUserscriptContent;
        }
    },
    watch: {
        localScriptDeactivated: function (newVal: boolean): void {
            // @TODO !!!
            this.localScript.deactivated = newVal;
            this.toggleActivation();
        },
        expanded: function (): void {
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
<style scoped>
p {
    font-size: 18px
}
</style>