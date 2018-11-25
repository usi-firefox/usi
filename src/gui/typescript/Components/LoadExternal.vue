<template>

    <!--Userscript nachladen-->
    <v-container grid-list-md>
        <div id="usi-load-external">
            <p>
                <label data-usi-lang="direct_userscript_upload">
                    <!--Userscript direkt hochladen-->
                </label>
                <i class="material-icons">cloud_upload</i>
            </p>
            <p>
                <input type="file" accept="text/*" id="direct-userscript-upload" />
            </p>
            <p>
                <v-btn class="text-capitalize" @click="loadLocalFile" data-usi-lang="start">
                    <!--Start-->
                </v-btn>
            </p>

            <v-divider></v-divider>

            <p data-usi-lang="alternative_charset_description">
                <!--Wenn du Probleme mit der Kodierung der Dateien haben solltest, kannst du hier eine andere Kodierung festlegen-->
            </p>

            <p>
                <label data-usi-lang="alternative_charset">
                    <!--Alternatives Charset-->
                </label>

                <!-- Charset Auswahl für die Datei -->
                <v-select :items="alternativeCharsets" v-model="charset"></v-select>

                <!-- Eigenes Charset hinzufügen -->
                <v-btn @click="addCustomCharset" color="info">
                    <i class="material-icons">add_circle</i>
                </v-btn>
            </p>
        </div>
    </v-container>

</template>

<script lang="ts">
declare var jQuery: any;

import event_controller from "../events/event_controller";

import Vue from "vue";

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
    data() {
        return {
            charset: "",
            alternativeCharsets: ["", "utf-8", "cp1252"]
        };
    },
    methods: {
        addCustomCharset: function (): void {
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
        loadLocalFile: function (): void {
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

<style scoped>
p,label {
    font-size: 18px;
}
</style>