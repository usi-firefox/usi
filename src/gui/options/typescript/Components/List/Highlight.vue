<template>
    <span class="highlightjs">
        <label>HighlightJS Style:</label>
        <select class="form-control" @change="run" v-model="active_style">
            <option v-for="(style, index) in hightlightjsstyles" :key="index" :value="style">{{style}}</option>
        </select>
        <hr />
        <pre><code class="border-black">{{this.dataCode}}</code></pre>
    </span>
</template>

<script lang="ts">
declare var jQuery: any;
declare var global_settings: any;
declare var hljs: any;

import event_controller from "events/event_controller";
import event_manager_controller from "events/event_manager";
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
    }
  },
  data: function() {
    return {
      dataCode: this.$props.code,
      active_style: "default",
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
    run: function() {
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
      event_controller().set.highlightjs.style(this.active_style);
    }
  }
});
</script>

<style>

</style>