import AppBody from "Components/AppBody.vue";
import Vue from "vue";
import Vuetify from "vuetify";

Vue.use(Vuetify);

import 'vuetify/dist/vuetify.min.css'; // Ensure you are using css-loader
import 'material-design-icons-iconfont/dist/material-design-icons.css'; // Ensure you are using css-loader


// Register a global custom directive called `v-lang`
/**
 * Verwendung:
 * v-lang="'language_string'" -> Fügt den übersetzten den Text als Textknoten in dem Element hinzu (ACHTUNG Prepend)
 */
Vue.directive("lang", {

    // When the bound element is inserted into the DOM...
    inserted: function (el, binding) {
        // Language Key holen
        const { value, arg } = binding;

        if (!value) {
            return;
        }

        const translated = browser.i18n.getMessage(value);
        if (!translated) {
            // Language Key wurde nicht gefunden
            return;
        }

        switch (arg) {
            case "label":
                // Übersetzung in das label Attribut einsetzen
                el.setAttribute(arg, translated);
            break;

            default:
                // Neuen Textknoten erstellen
                const text_node = document.createTextNode(translated);

                // Die Übersetzung nun hinzufügen
                el.prepend(text_node);
        }

    }
});


/**
 * Workaround für die Vue Compiler Funktionen
 * Um CSP Probleme zu vermeiden und "eval" und 
 * ähnliche Funktionen zu vermeiden
 */
const app = new Vue({
    el: '#vuetify-gui',
    /**
     * Dies ist der Workaround für den Vue Compiler
     */
    render: createElement => createElement(AppBody)
});