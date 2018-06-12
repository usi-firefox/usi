<template>
    <div class="panel panel-default" v-if="localScript">
        <!--Panel Kopf-->
        <div class="usi-list-entry-id" :class="[{grey : localScript.deactivated},{'strike-through': markedAsDeleted}]">
            <div class="panel-heading" @click="toggleOverview">
                <h4 class="panel-title">
                    <img v-bind:src="localScript.icon" /> Index: {{index}} | {{localScript.settings.name}} | {{localScript.settings.author}} | {{localScript.settings.version}}
                    <span v-if="localScript.isSpa">| SPA</span>

                    <i :class="[{'fa-angle-double-up':showUserscriptEntry},{'fa-angle-double-down' : !showUserscriptEntry}]" class="fa" title="expand or compress overview"></i>
                </h4>
            </div>

            <!--Panel Inhalt-->
            <div class="panel-body fade-in-animation" :class="[{'not-visible' : !showUserscriptEntry}, { 'hidden' : !showUserscriptEntry }]">
                <div class="row">
                    <button @click="export_script" class="btn btn-info col-xs-3 col-xs-push-8">export</button>
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
                <button class="btn btn-default" :class="{active: this.localScript.deactivated}" @click="toggleActivation">
                    <span v-show="!this.localScript.deactivated">{{lang.activated}}</span>
                    <span v-show="this.localScript.deactivated">{{lang.deactivated}}</span>
                </button>

                <hr />

                <div v-if="localScript.isSpa" class="row">
                    <button @click="start_spa" class="btn btn-info col-xs-push-2 col-xs-8">Start SPA</button>
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
                    <button @click="loadAgain">
                        <i class="fa fa-repeat"></i>
                    </button>
                    <br />
                </div>
                <br />

                <!--Greasemonkey Variablen-->
                <div v-if="localScript.settings.val_store">
                    <label data-usi-lang="GMValues">
                        <!--Zeige die gespeicherten GM Variablen-->
                    </label>
                    <br />
                    <button @click="GMValuesGet" class="btn btn-info col-xs-3" data-usi-lang="show">
                    </button>
                    <button @click="GMValuesDelete" :class="{hidden : !localScript.GMValues}" class="btn btn-danger col-xs-offset-1 col-xs-3"
                        data-usi-lang="delete_x">
                    </button>
                    <br />
                    <br />
                    <div class="row">
                        <div class="col-xs-2">
                            {{localScript.GMValues}}
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
                        <button class="btn btn-default" @click="showUserscript">
                            <span v-show="!showUserscriptContent">{{lang.show}}</span>
                            <span v-show="showUserscriptContent">{{lang.hide}}</span>
                        </button>
                    </span>
                    <button class="btn btn-info col-xs-3 col-xs-offset-1" @click="edit" data-usi-lang="change"></button>
                    <!--Userscript entfernen-->
                    <button class="btn btn-danger col-xs-3 col-xs-offset-1" @click="deleteUserscript" data-usi-lang="delete_x"></button>
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
import event_controller from "events/event_controller";
import event_manager_controller from "events/event_manager";
import language_replace_in_DOM from "language";

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
      hightlightsjsActive: false,
      hightlightsjsStyle: "default",
      GMValuesFlat: "",
      lang: {
        deactivated: browser.i18n.getMessage("deactivated"),
        activated: browser.i18n.getMessage("activated"),
        show: browser.i18n.getMessage("show"),
        hide: browser.i18n.getMessage("hide")
      }
    };
  },
  created: function() {
    this.$parent.$parent.$emit("usi:lang");

    // @todo Highlight JS aktiv?
    let parent_data = <any>this.$parent.$parent;
    this.hightlightsjsActive = <boolean>parent_data.configuration.hightlightjs.active;
    if(parent_data.configuration.hightlightjs.style){
      this.hightlightsjsStyle = <string>parent_data.configuration.hightlightjs.style;
    }

    // @todo
    this.$parent.$emit("change-tab-additional", {event_name : "usi:lang"});

  },
  methods: {
    export_script: function() {
      event_controller().get.userscript.export.single(this.localScript.id);
    },
    add_icon: function() {
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
    toggleActivation: function() {
      // aktiviere oder deaktiviere dieses Userscript!
      event_controller().set.userscript.toogle_state(this.localScript.id);

      this.localScript.deactivated = !this.localScript.deactivated;
    },

    // fragt nach den gesetzten Greasemonkey Variablen
    GMValuesGet: function() {
      event_controller()
        .request.userscript.gm_values(this.localScript.id)
        .then((GMValues: any) => {
          this.localScript.GMValues = GMValues;
          this.GMValuesFlat = flatten_keys(GMValues, "V");
        });
    },

    toggleOverview: function(force: any) {
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
    deleteUserscript: function() {
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
    GMValuesDelete: function() {
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
    edit: function() {
      // veranlasse den Tab Wechsel!
      this.$parent.$emit("change-tab", {
        comp: "edit",
        extraData: {
          userscript: this.localScript.userscript,
          id: this.localScript.id
        }
      });
    },

    start_spa: function() {
      event_controller().request.userscript.start_spa(this.localScript);
    },

    // Übergibt die URL an die Nachlade Funktion
    loadAgain: function() {
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

    showUserscript: function() {
      this.showUserscriptContent = !this.showUserscriptContent;
    }
  },
  watch: {
    expanded: function() {
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