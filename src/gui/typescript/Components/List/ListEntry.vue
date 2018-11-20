<template>
    <div class="panel panel-default" v-if="localScript">
        <!--Panel Kopf-->
        <div class="usi-list-entry-id" :class="[{grey : localScript.deactivated},{'strike-through': markedAsDeleted}]">
            <div class="panel-heading" @click="toggleOverview">
                <h4 class="panel-title">
                    <img v-bind:src="localScript.icon" /> Index: {{index}} | {{localScript.settings.name}} | {{localScript.settings.author}} | {{localScript.settings.version}}
                    <span v-if="localScript.isSpa">| SPA</span>
                    <i class="material-icons" v-html="showUserscriptEntry ? 'expand_less' : 'expand_more'" title="expand or compress overview"></i>
                </h4>
            </div>

            <!--Panel Inhalt-->
            <div class="panel-body fade-in-animation" :class="[{'not-visible' : !showUserscriptEntry}, { 'hidden' : !showUserscriptEntry }]">
                <div class="row">
                    <v-btn @click="export_script" class="btn btn-info col-xs-3 col-xs-push-8">export</v-btn>
                </div>

                <label>usi-id: </label>{{localScript.id}}
                <br />
                <label>Name: </label>{{localScript.settings.name}}
                <br />
                <label>Author: </label>{{localScript.settings.author}}
                <br />
                <label>Version: </label>{{localScript.settings.version}}
                <br />
                <label>
                    <span data-usi-lang="description"></span>: </label>{{localScript.settings.description}}
                <br />

                <hr />

                <!--Userscript aktivieren oder deaktivieren-->
                <label>Userscript:</label>
                <br />
                <v-btn color="info" :class="{active: this.localScript.deactivated}" @click="toggleActivation">
                    <span v-show="!this.localScript.deactivated">{{lang.activated}}</span>
                    <span v-show="this.localScript.deactivated">{{lang.deactivated}}</span>
                </v-btn>

                <hr />

                <div v-if="localScript.isSpa" class="row">
                    <v-btn @click="start_spa" class="btn btn-info col-xs-push-2 col-xs-8">Start SPA</v-btn>
                </div>

                <!--Require Skripte-->
                <div v-if="localScript.require_scripts.length > 0">
                    <hr />
                    <label>Require Scripts:</label>
                    <br />
                    <ol class="usi-list-entry-required-scripts---output">
                        <li v-for="entry in localScript.require_scripts" :key="entry.url">
                            {{entry.url}}
                        </li>
                    </ol>
                </div>

                <div v-if="localScript.settings && localScript.settings.include">
                    <!--gültige Include Regeln-->
                    <label>Includes: </label>
                    <br />
                    <ol>
                        <li v-for="(entry,index) in localScript.settings.include" :key="index">
                            {{entry}}
                        </li>
                    </ol>
                </div>

                <hr />

                <div v-if="localScript.moreinformations && localScript.moreinformations.url">
                    <label class="" data-usi-lang="reload_from_source">
                    </label>
                    <br />
                    <!--Neuladen von der Quelle-->
                    <v-btn @click="loadAgain">
                        <i class="material-icons">repeat</i>
                    </v-btn>
                    <br />
                </div>
                <br />

                <!--Greasemonkey Variablen-->
                <div v-if="localScript.val_store">
                    <label data-usi-lang="GMValues">
                        <!--Zeige die gespeicherten GM Variablen-->
                    </label>
                    <br />
                    <v-btn @click="GMValuesGet" class="btn btn-info col-xs-3" data-usi-lang="show">
                    </v-btn>
                    <v-btn @click="GMValuesDelete" :class="{hidden : (GMValues.length == 0)}" class="btn btn-danger col-xs-offset-1 col-xs-3"
                        data-usi-lang="delete_x">
                    </v-btn>
                    <br />
                    <br />
                    <div class="row" v-if="GMValues.length > 0">
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
                    <hr />
                    <br />
                </div>

                <!--Userscript Inhalt-->
                <label>Userscript:</label>
                <br />

                <!--Userscript bearbeiten-->
                <div class="row">
                    <!--Userscript anzeigen/ausblenden-->
                    <span class="col-xs-3">
                        <v-btn color="info" @click="showUserscript">
                            <span v-show="!showUserscriptContent">{{lang.show}}</span>
                            <span v-show="showUserscriptContent">{{lang.hide}}</span>
                        </v-btn>
                    </span>
                    <v-btn class="btn btn-info col-xs-3 col-xs-offset-1" @click="edit" data-usi-lang="change"></v-btn>
                    <!--Userscript entfernen-->
                    <v-btn class="btn btn-danger col-xs-3 col-xs-offset-1" @click="deleteUserscript" data-usi-lang="delete_x"></v-btn>
                </div>

                <br />

                <div v-if="showUserscriptContent" class="usi-list-entry-view-userscript---output row">
                    <br />
                    <br />

                    <span v-if="hightlightsjsActive">
                        <highlightjs-component :code="this.localScript.userscript" :astyle="hightlightsjsStyle" />
                    </span>
                    <span v-else>
                        <!-- Es dürfen keine Leerzeichen dazwischen sein -->
                        <pre><code class="border-black">{{this.localScript.userscript}}</code></pre>
                    </span>
                </div>
            </div>
        </div>
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
  data: function() {
    return {
      showUserscriptEntry: true,
      showUserscriptContent: false,
      markedAsDeleted: false,
      localScript: this.$props.script,
      hightlightsjsActive: this.configuration.hightlightjs.active,
      hightlightsjsStyle: this.configuration.hightlightjs.style,
      GMValues: [],
      lang: {
        deactivated: browser.i18n.getMessage("deactivated"),
        activated: browser.i18n.getMessage("activated"),
        show: browser.i18n.getMessage("show"),
        hide: browser.i18n.getMessage("hide")
      }
    };
  },
  created: function() {
    if (typeof this.localScript.settings.spa !== "undefined") {
      this.localScript.isSpa = true;
    }

    // @todo
    this.$parent.$emit("change-tab-additional", { event_name: "usi:lang" });
  },
  methods: {
    export_script: function(): void {
      event_controller().get.userscript.export.single(this.localScript.id);
    },
    add_icon: function(): void {
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
    toggleActivation: function(): void {
      // aktiviere oder deaktiviere dieses Userscript!
      event_controller().set.userscript.toogle_state(this.localScript.id);

      this.localScript.deactivated = !this.localScript.deactivated;
    },

    // fragt nach den gesetzten Greasemonkey Variablen
    GMValuesGet: function(): void {
      event_controller()
        .request.userscript.gm_values(this.localScript.id)
        .then((GMValues: any) => {
          this.GMValues = GMValues;
        });
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
    GMValuesDelete: function(): void {
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
    edit: function(): void {
      // veranlasse den Tab Wechsel!
      this.$parent.$emit("change-tab", {
        comp: "edit",
        extraData: {
          userscript: this.localScript.userscript,
          id: this.localScript.id
        }
      });
    },

    start_spa: function(): void {
      event_controller().request.userscript.start_spa(this.localScript);
    },

    // Übergibt die URL an die Nachlade Funktion
    loadAgain: function(): void {
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

    showUserscript: function(): void {
      this.showUserscriptContent = !this.showUserscriptContent;
    }
  },
  watch: {
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
</style>