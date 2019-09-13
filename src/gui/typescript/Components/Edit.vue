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
          filled
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

            <!-- Undo Auswahl -->
            <v-dialog v-model="undo_dialog" width="500">
              <template v-slot:activator="{ on }">
                <v-btn v-on="on" v-show="last_userscript_text.length > 0" color="warning">
                  <v-icon>undo</v-icon>
                  &nbsp;{{last_userscript_text.length}}
                </v-btn>
              </template>

              <v-card v-for="entry in last_userscript_text" v-bind:key="entry.time">
                <v-card-title class="headline grey lighten-2" primary-title>Text {{_undoSecondsText(entry.time)}}</v-card-title>
                <v-card-text
                  @click="undo(entry)"
                  class="pointer"
                >
                  <code>{{entry.text}}</code>
                </v-card-text>
              </v-card>
            </v-dialog>

            <!--Standard laden oder leeren-->
            <v-btn id="usi-edit-script-load-example" @click="load_example" v-lang="'load_example'">
              <!--Beispiel laden-->
            </v-btn>
            <v-btn id="usi-edit-script-textarea-clear" @click="textarea_clear" v-lang="'clear'">
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

import add_userscript from "lib/storage/add_userscript";
import page_injection_helper from "lib/inject/page_injection_helper";
import { notify, getSeconds, getTranslation } from "lib/helper/basic_helper";
import { mapState } from "vuex";

const add_userscript_instance = new add_userscript();

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
  props: {
    addional: {
      type: Object as () => usi.Frontend.EditAddtional,
      required: false
    }
  },
  data() {
    return {
      script_id: 0,
      undo_dialog: false,
      textarea: {
        size: 14,
        default_size: 14,
        height: 14,
        content: ""
      },
      last_userscript_interval_id: 0,
      lang: {
        overwrite_without_warning: getTranslation("overwrite_without_warning")
      },
      overwrite_without_warning: false,
      last_userscript_text: <usi.Frontend.EditUndo[]>[],
      load_example_by_prefered_locale: "de"
    };
  },
  beforeDestroy: function() {
    // Interval für Undo Funktion beenden
    window.clearInterval(this.last_userscript_interval_id);
  },
  computed: {
    ...mapState(["editUserscriptId", "editUserscriptContent"]),
  },
  mounted() {
    /**
     * falls zusältziche Daten übergeben wurden
     * Werden diese gesetzt
     */
    if (this.editUserscriptId) {
      this.script_id = this.editUserscriptId;
    }

    if (this.editUserscriptContent) {
      // Falls ein Userscript zur Editierung
      // aus einem anderen Component übergeben wurde
      this.textarea.content = this.editUserscriptContent;
    }

    const prefered_locale = browser.i18n.getUILanguage();

    // nur wenn die erste 'prefered_locale' -> 'de' ist, ansonsten wird die Englische Version geladen
    if (prefered_locale === "de" || prefered_locale === "de-de") {
      this.load_example_by_prefered_locale = "de";
    } else {
      this.load_example_by_prefered_locale = "en";
    }

    this.last_userscript_interval_id = window.setInterval(() => {
      const text = this.textarea.content;
      // falls der letzte Wert in der Historie verschieden sein sollte
      if (text.length > 0) {
        const last_undo = this.last_userscript_text[0];

        // letzte Wert ist verschieden
        if (last_undo === undefined || last_undo.text !== text) {
          this.last_userscript_text.unshift({ time: getSeconds(), text: text });
        }
      }

      // alle 5 Sekunden durchführen
    }, 5000);

    // Schalter richtig positionieren lassen ...
    this.defaultSize();
    this.setTextareaHeight();
  },

  methods: {
    /**
     * Ersetzt den Platzhalter für die Sekunden Ausgabe
     */
    _undoSecondsText(seconds: number){
      const seconds_ago = getSeconds() - seconds;
      const seconds_text = getTranslation("seconds_ago");
      return seconds_text.replace(/#1#/, seconds_ago.toString());
    },

    /**
     * Höhe der Textarea an die Fenstergröße anpassen!
     */
    setTextareaHeight: function(): void {
      // Textarea Höhe auf 65 % setzen
      this.textarea.height = Math.floor(window.innerHeight * (65 / 100));
    },
    /**
     * Textarea auf Standard Größe zurücksetzen
     */
    defaultSize: function(): void {
      this.textarea.size = this.textarea.default_size;
    },

    textarea_clear: function(): void {
      this.script_id = 0;
      this.textarea.content = "";

      // vuex Store aktualisieren
      this.$store.commit("editUserscriptId", null);
      this.$store.commit("editUserscriptContent", null);

      this.$forceUpdate();
    },

    // Setzt den Text Inhalt zurück
    undo: function(entry: usi.Frontend.EditUndo): void {
      this.undo_dialog = false;
      this.textarea.content = entry.text;
    },

    load_example: function(
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
      const url =
        window.location.origin +
        "/gui/example/" +
        lang_local +
        "-example.user.js";

      fetch(url)
        .then(async example_userscript => {
          this.textarea.content = await example_userscript.text();
        })
        .catch(() => {
          // versuche es erneut mit der englischen Variante
          this.load_example(event, "en", error_count--);
        });
    },

    /**
     * Userscript aus der Textarea übermitteln
     * @returns {undefined}
     */
    save: function(): void {
      // Textarea nicht leer ...
      if (this.textarea.content.length > 20) {
        // sende den Userscript Text an das Addon Skript...
        // Falls eine Userscript ID existiert und es überschrieben werden soll
        if (this.script_id && this.overwrite_without_warning) {
          // Vorhandes Userscript überschreiben
          this._overrideUserscript(this.script_id, this.textarea.content);
        } else {
          // Keine Script ID gegeben
          this._createUserscript(this.textarea.content);
        }

        // den Wert der Historie hinzufügen
        this.last_userscript_text.unshift({
          time: getSeconds(),
          text: this.textarea.content
        });
      }
    },

    _createUserscript: async function(userscript: string) {
      if (!userscript) {
        throw "Userscript is missing";
      }
      // Hier wird das UserScript weiterverarbeitet und gespeichert
      let valid_userscript = add_userscript_instance.check_for_valid_userscript_settings(
        userscript
      );

      if (valid_userscript.valid === false) {
        // Userscript Konfiguration nicht in Ordnung
        notify("userscript-config-is-wrong");
        // @Todo
        this.$root.$emit("snackbar", "userscript-config-is-wrong");
        return;
      }

      // Überprüfe ob das Userscript bereits gespeichert wurde
      let userscript_id = await add_userscript_instance.exist_userscript_already(
        userscript
      );

      if (userscript_id === 0) {
        // neu anlegen
        let userscript_handle = await (<any>(
          add_userscript_instance.save_new_userscript(userscript)
        ));
        // füge das Skript gleich hinzu, damit es ausgeführt werden kann
        new page_injection_helper().add_userscript(userscript_handle.getId());

        const message_text =
          getTranslation("userscript_was_created") +
          " (ID " +
          userscript_handle.getId() +
          ")";
        // Neues Userscript wurde erstellt
        notify(message_text);

        this.$root.$emit("snackbar", message_text);
      } else {
        // bzgl. update fragen
        // Es wurde ein Userscript gefunden, soll es aktualisiert werden?
        if (
          window.confirm(
            getTranslation("same_userscript_was_found_ask_update_it_1") +
              userscript_id +
              getTranslation("same_userscript_was_found_ask_update_it_2")
          )
        ) {
          // Dieses Skript wird nun aktualisiert! userscript_infos = {id : id , userscript: userscript}
          this._overrideUserscript(userscript_id, userscript);
        }
      }
    },

    _overrideUserscript: async function(
      userscript_id: number,
      userscript: string,
      moreinformations?: usi.Userscript.AddionalData.Moreinformations
    ) {
      if (!userscript_id) {
        throw "Userscript ID is missing";
      }
      if (!userscript) {
        throw "Userscript is missing";
      }

      let userscript_handle = await (<any>(
        add_userscript_instance.update_userscript(
          userscript_id,
          userscript,
          moreinformations
        )
      ));
      new page_injection_helper().add_userscript(userscript_handle.getId());

      const message_text =
        getTranslation("userscript_was_overwritten") +
        " (ID " +
        userscript_id +
        ")";
      // Userscript wurde überschrieben
      notify(message_text);
      this.$root.$emit("snackbar", message_text);
    },

    /**
     * Textarea in einen Vollbild Modus schalten!
     */
    textarea_to_fullscreen: function(): void {
      // Textarea höhe berechnen
      this.textarea.height = Math.floor(window.innerHeight * (75 / 100));
    },

    /**
     * Convert Funktionen, falls es Probleme mit den Charset's geben sollte
     */
    utf8_to_latin1: function(): void {
      try {
        this.textarea.content = window.unescape(
          encodeURIComponent(this.textarea.content)
        );
      } catch (e) {}
    },
    latin1_to_utf8: function(): void {
      try {
        this.textarea.content = decodeURIComponent(
          window.escape(this.textarea.content)
        );
      } catch (e) {}
    }
  },
});
</script>

<style scoped>
#usi-edit-script-textarea{
  line-height: 100%;
}
.pointer{
  cursor: pointer;
}
</style>