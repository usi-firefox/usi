<template>
  <div class="highlightjs">
    <v-container>
      <v-divider class="mb-3"></v-divider>
      <h3>
        HighlightJS Style
        <v-btn @click="active_style = ''">
          <v-icon>undo</v-icon>
        </v-btn>
      </h3>
      <v-autocomplete :items="hightlightjsstyles" @change="run" v-model="active_style"></v-autocomplete>
      <pre><code class="border-black">{{this.code}}</code></pre>
    </v-container>
  </div>
</template>

<script lang="ts">
declare var jQuery: any;
declare var hljs: any;

import config_storage from "lib/storage/config";

import Vue from "vue";

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
      required: true
    },
    // @todo rename
    astyle: {
      default: "default",
      required: false
    }
  },
  data: function() {
    return {
      active_style: this.astyle,
      highlight_styles_path: "libs/highlight/styles/",
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
  created: function() {
    Vue.nextTick().then(() => {
      this.run();
    });
  },
  methods: {
    run: async function(): Promise<void> {
      jQuery(this.$el)
        .find("pre code")
        .each(function(i: number, block: HTMLElement) {
          // HighlightJS ausführen
          hljs.highlightBlock(block);
        });

      // Pfad zur CSS Datei festlegen
      const style_filepath =
        this.highlight_styles_path + this.active_style + ".css";
      // Link auf die neue CSS Datei ändern
      jQuery("#HighlightJSStyle").attr("href", style_filepath);

      // Style speichern
      this.setStyle(this.active_style);

      this.$parent.$parent.$emit("change-tab-additional", <usi.Frontend.changeTabAdditionalEvent>{ event_name: "usi:refresh-config" });
    },
    async setStyle(style_name: string) {
      let config = await config_storage().get();
      config.hightlightjs.style = style_name;
      return await config_storage().set(config);
    }
  }
});
</script>

<style>
</style>