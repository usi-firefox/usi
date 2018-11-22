<template>
    <!--Neues Userscript erstellen / bearbeiten-->
    <div id="usi-edit-script">
        <h3 v-if="script_id">
            <span data-usi-lang="edit_userscript_with_id"></span> : {{script_id}}
        </h3>

        <!--Userscript Eingabe-->
        <v-textarea v-model="textarea.content" box :style="{fontSize : textarea.size + 'px'}" id="usi-edit-script-textarea" rows="30" cols="64" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="// ==UserScript== ..."></v-textarea>

        <!--Userscript Beispiel-->
        <v-btn @click="save" color="info" data-usi-lang="save">
            <!--Userscript speichern-->
        </v-btn>

        <label data-usi-lang="edit_last_changes"></label>
        ({{last_userscript_text.length}})
        <v-btn @click="undo" color="warning">
            <i class="material-icons">undo</i>
        </v-btn>

        <!--Userscript überschreiben?-->
        <div v-if="script_id">
            <label>Userscript <span data-usi-lang="overwrite_without_warning"></span>?</label>
            <input id="usi-edit-script-overwrite" data-toggle="toggle" type="checkbox" />
        </div>

        <!--Standard laden oder leeren-->
        <v-btn id="usi-edit-script-load-example" @click="load_example" data-usi-lang="load_example">
            <!--Beispiel laden-->
        </v-btn>
        <v-btn id="usi-edit-script-textarea-clear" @click="textarea_clear" data-usi-lang="clear">
            <!--Textfeld leeren-->
        </v-btn>
        <!--Textarea Zoom einstellen-->
        <v-flex xs12>
            <v-subheader class="pl-0">Zoom:</v-subheader>
            <v-slider thumb-label v-model="textarea.size" min="8" max="30" step="0.5" value="14"></v-slider>
        </v-flex>
        <v-btn @click="defaultSize">
            <i class="material-icons">undo</i>
        </v-btn>
        <p>
            <!--Umwandlung bei Problemen mit dem Charset-->
            <label>Convert : </label>
            <v-btn @click="utf8_to_latin1">UTF-8 -> Latin1</v-btn>
            <v-btn @click="latin1_to_utf8">Latin1 -> UTF-8</v-btn>
        </p>
    </div>
</template>

<script lang="ts">
import Vue from "vue";

declare var jQuery: any;
declare var window: any;

import event_controller from "../events/event_controller";
import { throws } from "assert";

// Die ID der Textarea
var last_userscript_interval_id: number = 0;

/**
 * legt den Component Namen fest, damit dieser als HTML Tag
 * genutzt werden kann ->
 *
 * const componentName = "edit-component";
 * --->
 * <html>... <edit-component> ... </html>
 */
const componentName = "edit-component";
export default Vue.component(componentName, {
    props: ["addional"],
    data() {
        return {
            script_id: 0,
            textarea: {
                size: 14,
                default_size: 14,
                height: 14,
                content: ""
            },
            last_userscript_text: <any>[],
            load_example_by_prefered_locale: "de"
        };
    },
    created: function () {
        /**
         * falls zusältziche Daten übergeben wurden
         * Werden diese gesetzt
         */
        if (this.addional) {
            if (this.addional.id) {
                this.script_id = this.addional.id;
            }

            if (this.addional.userscript) {
                // Falls ein Userscript zur Editierung
                // aus einem anderen Component übergeben wurde
                this.textarea.content = this.addional.userscript;

                this.$emit("change-tab-additional", {
                    event_name: "usi:reset-extraData"
                });
            }
        }

        const prefered_locale = browser.i18n.getUILanguage();

        // nur wenn die erste 'prefered_locale' -> 'de' ist, ansonsten wird die Englische Version geladen
        if (prefered_locale === "de" || prefered_locale === "de-de") {
            this.load_example_by_prefered_locale = "de";
        } else {
            this.load_example_by_prefered_locale = "en";
        }

        if (last_userscript_interval_id === 0) {
            last_userscript_interval_id = window.setInterval(() => {

                const text = this.textarea.content;
                // falls der letzte Wert in der Historie verschieden sein sollte
                if (text.length > 0) {
                    const undo_length = this.last_userscript_text.length;
                    const b = this.last_userscript_text[undo_length - 1];

                    // Kein Wert enthalten ODER der Letzte Wert ist verschieden
                    if (undo_length === 0 || this.last_userscript_text[undo_length - 1] !== text) {
                        // den Wert der Historie hinzufügen
                        this.last_userscript_text.push(text);
                    }

                }

                // alle 7 Sekunden durchführen
            }, 7000);
        }

        // Schalter richtig positionieren lassen ...
        this.defaultSize();
        this.setTextareaHeight();

    },

    methods: {
        /**
         * Höhe der Textarea an die Fenstergröße anpassen!
         */
        setTextareaHeight: function (): void {
            // Textarea Höhe auf 65 % setzen
            this.textarea.height = Math.floor(window.innerHeight * (65 / 100));
        },
        /**
         * Textarea auf Standard Größe zurücksetzen
         */
        defaultSize: function (): void {
            this.textarea.size = this.textarea.default_size;
        },

        textarea_clear: function (): void {
            this.script_id = 0;
            this.textarea.content = "";
            this.$forceUpdate();
        },

        // Setzt den Text Inhalt zurück
        undo: function (): void {
            if (this.last_userscript_text.length > 0) {
                var undo_value = this.last_userscript_text.pop();

                if (undo_value === this.textarea.content) {
                    // Falls es der gleiche Wert sein sollte, kannst du es 1x überspringen
                    undo_value = this.last_userscript_text.pop();
                }

                // zuletzt gesicherten Wert wieder eintragen
                if (typeof undo_value === "string" && undo_value.length > 0) {
                    this.textarea.content = undo_value;
                }
            }
        },

        load_example: function (
            event: any,
            lang_key: string,
            error_count: number = 1
        ): void {
            const lang_local = lang_key ? lang_key : browser.i18n.getUILanguage();

            if (error_count < 0) {
                // Kein weiteren Versuch unternehmen, unbekannter Fehler
                return;
            }

            // Beispiel Datei laden
            jQuery.ajax({
                url:
                    window.location.origin +
                    "/gui/example/" +
                    lang_local +
                    "-example.user.js",
                dataType: "text",
                success: (example_userscript: string) => {
                    this.textarea.content = example_userscript;
                },
                error: () => {
                    // versuche es erneut mit der englischen Variante
                    this.load_example(event, "en", error_count--);
                }
            });
        },

        /**
         * Userscript aus der Textarea übermitteln
         * @returns {undefined}
         */
        save: function (): void {
            // Textarea nicht leer ...
            if (this.textarea.content.length > 20) {
                // sende den Userscript Text an das Addon Skript...
                // Falls eine Userscript ID existiert und es überschrieben werden soll
                if (
                    this.script_id &&
                    jQuery("#usi-edit-script-overwrite").prop("checked")
                ) {
                    // Vorhandes Userscript überschreiben
                    event_controller().set.userscript.override({
                        userscript: this.textarea.content,
                        id: this.script_id
                    });
                } else {
                    // Keine Script ID gegeben
                    event_controller().set.userscript.create({
                        userscript: this.textarea.content
                    });
                }

                // den Wert der Historie hinzufügen
                this.last_userscript_text.push(this.textarea.content);
            }
        },

        /**
         * Textarea in einen Vollbild Modus schalten!
         */
        textarea_to_fullscreen: function (): void {
            // Textarea höhe berechnen
            this.textarea.height = Math.floor(window.innerHeight * (75 / 100));
        },

        /**
         * Convert Funktionen, falls es Probleme mit den Charset's geben sollte
         */
        utf8_to_latin1: function (): void {
            try {
                this.textarea.content = window.unescape(
                    encodeURIComponent(this.textarea.content)
                );
            } catch (e) { }
        },
        latin1_to_utf8: function (): void {
            try {
                this.textarea.content = decodeURIComponent(
                    window.escape(this.textarea.content)
                );
            } catch (e) { }
        }
    },
    computed: {}
});
</script>

<style>
</style>