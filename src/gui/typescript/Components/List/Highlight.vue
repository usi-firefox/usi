<template>
  <v-container>
    <h3>HighlightJS Style</h3>
    <v-layout>
      <v-flex xs8 md4>
        <v-autocomplete :items="hightlightjsstyles" @change="changeHighlightStyle" v-model="active_style"></v-autocomplete>
      </v-flex>
      <v-flex xs4>
        <v-btn @click="active_style = 'default'; changeHighlightStyle()">
          <v-icon>undo</v-icon>
        </v-btn>
      </v-flex>
    </v-layout>

    <v-layout>
        <highlightjs language='javascript' :code="this.code"></highlightjs>
    </v-layout>
  </v-container>
</template>

<script lang="ts">

import config_storage from "lib/storage/config";

import Vue from "vue";
import { mapState } from "vuex";

/** 
 * Enthält alle aktuell zur Verfügung stehenden Highlight.js Styles
 * @see webpack.config.js
 */
declare var highlightjsStyles : string[];

/** 
 * Dieser Pfad wird über die webpack.config.js generiert
 * und die entsprechenden Styles werden dorthin kopiert 
 */
const highlight_styles_path = "highlight-styles/";

/**
 * legt den Component Namen fest, damit dieser als HTML Tag
 * genutzt werden kann ->
 *
 * const componentName = "highlightjs-component";
 * --->
 * <html>... <highlightjs-component> ... </html>
 */
const componentName = "highlightjs-component";
export default Vue.component(componentName, {
  props: {
    code: {
      type: String,
      required: true
    }
  },
  data(){
    return {
      active_style : "default"
    };
  },
  computed: {
    hightlightjsstyles(){
      return highlightjsStyles.map((filename) => {
        // .css Datei Endung entfernen
        return filename.replace(/\.css$/, "");
      });
    }
  },
  mounted() {
    this.changeHighlightStyle();
  },
  methods: {
    changeHighlightStyle: async function(): Promise<void> {
      // Pfad zur CSS Datei festlegen
      const style_filepath =
        highlight_styles_path + this.active_style + ".css";
      // Link auf die neue CSS Datei ändern
      const stlye_tag = document.getElementById("HighlightJSStyle");
      if (stlye_tag) {
        stlye_tag.setAttribute("href", style_filepath);
      }
    }
  }
});
</script>

<style>
.v-application code {
  background-color: unset !important;
}
</style>