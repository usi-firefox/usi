<template>
  <!--Neues Userscript erstellen / bearbeiten-->
  <v-container grid-list-md>
    <v-layout>
      <v-flex x12>
        <h3 v-if="script_id">
          <span v-lang="'edit_userscript_with_id'">: {{script_id}}</span>
          <!--Userscript überschreiben?-->
          <v-switch
            v-model="overwrite_without_warning"
            :label="'Userscript ' + lang.overwrite_without_warning"
          ></v-switch>
        </h3>

        <!--Userscript Eingabe-->
        <v-textarea
          v-model="textarea.content"
          box
          :style="{fontSize : textarea.size + 'px'}"
          id="usi-edit-script-textarea"
          rows="30"
          cols="64"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          placeholder="// ==UserScript== ..."
        ></v-textarea>
      </v-flex>
    </v-layout>
    <v-card>
      <v-container>
        <v-layout>
          <v-subheader>Userscript:</v-subheader>
          <v-flex>
            <!--Userscript Beispiel-->
            <v-btn @click="save" color="info">
              <v-icon>save</v-icon>&nbsp;
              <span v-lang="'save'"></span>
            </v-btn>

            <v-btn @click="undo" color="warning">
              <v-icon>undo</v-icon>
              &nbsp;{{last_userscript_text.length}}
            </v-btn>

            <!--Standard laden oder leeren-->
            <v-btn
              id="usi-edit-script-load-example"
              @click="load_example"
              v-lang="'load_example'"
            >
              <!--Beispiel laden-->
            </v-btn>
            <v-btn
              id="usi-edit-script-textarea-clear"
              @click="textarea_clear"
              v-lang="'clear'"
            >
              <!--Textfeld leeren-->
            </v-btn>
          </v-flex>
        </v-layout>
      </v-container>
    </v-card>
    <v-card>
      <v-container>
        <v-layout>
          <v-subheader>Textarea:</v-subheader>
          <!--Textarea Zoom einstellen-->
          <v-flex xs10>
            <v-slider label="Zoom:" v-model="textarea.size" min="8" max="30" step="0.5" value="14"></v-slider>
          </v-flex>
          <v-flex xs2>
            <v-btn @click="defaultSize">
              <i class="material-icons">undo</i>
            </v-btn>
          </v-flex>
        </v-layout>
      </v-container>
    </v-card>
    <v-card>
      <v-container>
        <v-layout>
          <v-subheader>Convert:</v-subheader>
          <!--Umwandlung bei Problemen mit dem Charset-->
          <v-flex>
            <v-btn @click="utf8_to_latin1">UTF-8 -> Latin1</v-btn>
            <v-btn @click="latin1_to_utf8">Latin1 -> UTF-8</v-btn>
          </v-flex>
        </v-layout>
      </v-container>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";

declare var window: any;

import event_controller from "../events/event_controller";

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
            lang: {
                overwrite_without_warning: browser.i18n.getMessage("overwrite_without_warning"),
            },
            overwrite_without_warning : false,
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
            const url = window.location.origin + "/gui/example/" + lang_local + "-example.user.js";

            fetch(url).then(async (example_userscript) => {
              this.textarea.content = await example_userscript.text();
            }).catch(() =>{
              // versuche es erneut mit der englischen Variante
              this.load_example(event, "en", error_count--);
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
                    this.overwrite_without_warning
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