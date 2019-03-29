<template>

    <!--Userscript nachladen-->
    <v-container>
        <v-card>
            <v-card-title>
                <h3 v-lang="'direct_userscript_upload'"></h3>
                <!--Userscript direkt hochladen-->
                &nbsp;
                <v-icon>cloud_upload</v-icon>
            </v-card-title>
            <v-card-text>
                <v-card-actions>
                    <input type="file" accept="text/*" id="direct-userscript-upload" />
                    <v-btn class="text-capitalize" @click="loadLocalFile" v-lang="'start'">
                        <!--Start-->
                    </v-btn>
                </v-card-actions>
            </v-card-text>
        </v-card>

        <v-card>
            <v-card-title>
                <h3 v-lang="'alternative_charset'"></h3>
                <!--Alternatives Charset-->
            </v-card-title>
            <v-card-text v-lang="'alternative_charset_description'">
                <!--Wenn du Probleme mit der Kodierung der Dateien haben solltest, kannst du hier eine andere Kodierung festlegen-->
            <v-card-actions>
                <v-flex xs2>
                    <!-- Charset Auswahl für die Datei -->
                    <v-select :items="alternativeCharsets" v-model="charset"></v-select>
                </v-flex>
                
                <v-flex xs1 offset-xs1>
                    <!-- Eigenes Charset hinzufügen -->
                    <v-btn @click="addCustomCharset" color="info">
                        <v-icon>add_circle</v-icon>
                    </v-btn>
                </v-flex>
            </v-card-actions>
            </v-card-text>
        </v-card>
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