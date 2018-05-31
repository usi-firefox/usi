import AppBody from "Components/AppBody.vue";
import Vue from "vue";
 
/**
 * Workaround für die Vue Compiler Funktionen
 * Um CSP Probleme zu vermeiden und "eval" und 
 * ähnliche Funktionen zu vermeiden
 */
const app = new Vue({
    el: '#gui',
    /**
     * Dies ist der Workaround für den Vue Compiler
     */
    render: createElement => createElement(AppBody)
});