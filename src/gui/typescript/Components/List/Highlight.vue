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
        <pre><code>{{this.code}}</code></pre>
    </v-layout>
  </v-container>
</template>

<script lang="ts">
declare var hljs: any;

import config_storage from "lib/storage/config";

import Vue from "vue";
import { mapState } from "vuex";

const highlight_styles_path = "libs/highlight/styles/";

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
  data: function() {
    return {
      
      // enthält alle verfügbaren highlight js styles
      hightlightjsstyles: [
        "agate",
        "androidstudio",
        "arduino-light",
        "arta",
        "ascetic",
        "atelier-cave-dark",
        "atelier-cave-light",
        "atelier-dune-dark",
        "atelier-dune-light",
        "atelier-estuary-dark",
        "atelier-estuary-light",
        "atelier-forest-dark",
        "atelier-forest-light",
        "atelier-heath-dark",
        "atelier-heath-light",
        "atelier-lakeside-dark",
        "atelier-lakeside-light",
        "atelier-plateau-dark",
        "atelier-plateau-light",
        "atelier-savanna-dark",
        "atelier-savanna-light",
        "atelier-seaside-dark",
        "atelier-seaside-light",
        "atelier-sulphurpool-dark",
        "atelier-sulphurpool-light",
        "atom-one-dark",
        "atom-one-light",
        "brown-paper",
        "codepen-embed",
        "color-brewer",
        "darcula",
        "dark",
        "darkula",
        "default",
        "docco",
        "dracula",
        "far",
        "foundation",
        "github-gist",
        "github",
        "googlecode",
        "grayscale",
        "gruvbox-dark",
        "gruvbox-light",
        "hopscotch",
        "hybrid",
        "idea",
        "ir-black",
        "kimbie.dark",
        "kimbie.light",
        "magula",
        "mono-blue",
        "monokai-sublime",
        "monokai",
        "obsidian",
        "ocean",
        "paraiso-dark",
        "paraiso-light",
        "pojoaque",
        "purebasic",
        "qtcreator_dark",
        "qtcreator_light",
        "railscasts",
        "rainbow",
        "routeros",
        "school-book",
        "solarized-dark",
        "solarized-light",
        "sunburst",
        "tomorrow-night-blue",
        "tomorrow-night-bright",
        "tomorrow-night-eighties",
        "tomorrow-night",
        "tomorrow",
        "vs",
        "vs2015",
        "xcode",
        "xt256",
        "zenburn"
      ]
    };
  },
  computed: {
    active_style: {
      get() : string {
        return this.$store.getters["configuration/hightlightjs_style"];
      },
      set(style: string){
        this.$store.dispatch("configuration/hightlightjs_style",style);
      }
    }
  },
  mounted() {
    const codeblock = this.$el.querySelector("pre code");
    // HighlightJS ausführen
    if (codeblock) {
      hljs.highlightBlock(codeblock);
    }

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