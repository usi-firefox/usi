import AppBody from "Components/AppBody.vue";
import Vue from "vue";
import Vuetify from "vuetify";
import {store} from "./Store/store";

Vue.use(Vuetify);

import "@mdi/font/css/materialdesignicons.css"; // Ensure you are using css-loader
import { getTranslation } from "lib/helper/basic_helper";
import "material-design-icons-iconfont/dist/material-design-icons.css"; // Ensure you are using css-loader

import "vuetify/dist/vuetify.min.css"; // Ensure you are using css-loader
import { vuetify_options } from "./vuetify_options";

// Register a global custom directive called `v-lang`
/**
 * Verwendung:
 * v-lang="'language_string'" -> Fügt den übersetzten den Text als Textknoten in dem Element hinzu (ACHTUNG Prepend)
 */
Vue.directive("lang", {

    // When the bound element is inserted into the DOM...
    inserted(el, binding) {
        // Language Key holen
        const { value, arg } = binding;

        if (!value) {
            return;
        }

        const translated = getTranslation(value);
        if (!translated) {
            // Language Key wurde nicht gefunden
            return;
        }

        // Neuen Textknoten erstellen
        const text_node = document.createTextNode(translated);

        switch (arg) {

            case "replace":
                // Übersetzung überschreiben einsetzen
                el.innerText =  translated;
                break;

            case "label":
                // Übersetzung in das label Attribut einsetzen
                el.setAttribute(arg, translated);
                break;

            case "append":

                // Die Übersetzung nun anhängen
                el.append(text_node);
                break;
            default:

                // Die Übersetzung nun als erstes Element hinzufügen
                el.prepend(text_node);
                break;
        }

    },
});

/**
 * Workaround für die Vue Compiler Funktionen
 * Um CSP Probleme zu vermeiden und "eval" und
 * ähnliche Funktionen zu vermeiden
 */
const app = new Vue({
    el: "#vuetify-gui",
    vuetify: new Vuetify(vuetify_options),
    store,
    /**
     * Dies ist der Workaround für den Vue Compiler
     */
    render: (createElement) => createElement(AppBody),
});
