import AppBody from "Components/AppBody.vue";
import Vue from "vue";
import Vuetify from "vuetify";
 
Vue.use(Vuetify);

import 'vuetify/dist/vuetify.min.css'; // Ensure you are using css-loader
import 'material-design-icons-iconfont/dist/material-design-icons.css'; // Ensure you are using css-loader

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