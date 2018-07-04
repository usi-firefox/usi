<template>

    <!--Userscript nachladen-->
    <div class="container" id="usi-load-external">
        <label data-usi-lang="direct_userscript_upload">
            <!--Userscript direkt hochladen-->
        </label>
        <i class="fa fa-upload" aria-hidden="true"></i>
        <input type="file" accept="text/*" id="direct-userscript-upload" />
        <br />
        <button class="btn btn-primary col-xs-push-1 col-xs-10 text-capitalize" @click="loadLocalFile" data-usi-lang="start">
            <!--Start-->
        </button>
        <br />
        <br />
        <br />
        <label data-usi-lang="alternative_charset_description">
            <!--Wenn du Probleme mit der Kodierung der Dateien haben solltest, kannst du hier eine andere Kodierung festlegen-->
        </label>
        <br />
        <br />

        <label data-usi-lang="alternative_charset">
            <!--Alternatives Charset-->
        </label>

        <!-- Eigenes Charset hinzufügen -->
        <button @click="addCustomCharset" class="btn btn-default">
            <i class="fa fa-plus-circle"></i>
        </button>

        <select class="form-control">
            <!-- Charset Auswahl für die Datei -->
            <option v-for="opt in alternativeCharsets" @click="charset = opt" :key="opt" :value="opt">{{opt}}</option>
        </select>
    </div>

</template>

<script lang="ts">
declare var jQuery: any;

import event_controller from "../events/event_controller";

import Vue from "vue";
import { throws } from "assert";

/**
 * legt den Component Namen fest, damit dieser als HTML Tag
 * genutzt werden kann ->
 *
 * const componentName = "loadExternal-component";
 * --->
 * <html>... <loadExternal-component> ... </html>
 */
const componentName = "loadExternal-component";
export default Vue.component(componentName, {
  props: ["directUpload", "charset"],
  data() {
    return {
      alternativeCharsets: ["", "utf-8", "cp1252"]
    };
  },
  methods: {
    addCustomCharset: function(): void {
      // nach dem eigenen Charset fragen
      const new_charset = window.prompt(
        browser.i18n.getMessage("add_new_custom_charset")
      );

      if (!new_charset) {
        // leer
        return;
      }

      if (this.alternativeCharsets.indexOf(new_charset) !== -1) {
        // bereits enthalten
        alert(browser.i18n.getMessage("charset_already_exist"));
        return;
      }

      // hinzufügen
      this.alternativeCharsets.push(new_charset);
    },

    // Direkter Userscript Datei Upload
    loadLocalFile: function(): void {
      var file = jQuery("#direct-userscript-upload").get(0).files[0];

      if (typeof file !== "object") {
        return;
      }
      var reader = new FileReader();

      reader.onload = (e: any) => {
        // Daten an den EditController weiterreichen
        this.$emit("change-tab", {
          comp: "edit",
          extraData: { userscript: e.target.result }
        });
      };

      // Read in the image file as a data URL.
      reader.readAsText(file, this.charset);
    }
  }
});
</script>

<style>
</style>