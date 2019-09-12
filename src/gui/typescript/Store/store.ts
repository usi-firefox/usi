import config_storage from "lib/storage/config";
import Vue from "vue";
import Vuex from "vuex";
Vue.use(Vuex);

export const store = new Vuex.Store({
  state: {
    /**
     * Momentan Aktiver View
     */
    activeView: "list",

    /**
     * Einstellungen
     */
    configuration: {
      load_script_with_js_end: true
      , hightlightjs: {
        active: true
        , style: "default"
      }
      , greasemonkey: {
        global_active: true
      }
    } as usi.Storage.Config,
    /**
     * Daten für die Edit Komponente
     */
    editUserscriptId: null as number | null,
    editUserscriptContent: null as string | null,
  },
  getters: {
    activeView(state) {
      return state.activeView;
    },
    editUserscriptId(state) {
      return state.editUserscriptId;
    },
    editUserscriptContent(state) {
      return state.editUserscriptContent;
    },
    configuration(state) {
      return state.configuration;
    },
  },
  actions: {
    /**
     * Hole die aktuelle Konfiguration aus dem Storage
     */
    async configurationLoadFromStorage({ commit }) {
      try {
        const config = await config_storage().get();
        commit("configuration", config);
        return true;
      } catch (message) {
        /** Fehler beim Laden der Konfiguration */
        console.error("Error in loading usi:config_storage");
        console.error(message);
        return false;
      }
    },
    async configurationSetInStorage___load_script_with_js_end({ commit }, payload : boolean) {
      try {
        this.state.configuration.load_script_with_js_end = payload;
        config_storage().set(this.state.configuration);
        return true;
      } catch (message) {
        /** Fehler beim Laden der Konfiguration */
        console.error("Error in setting configurationSetInStorage___load_script_with_js_end");
        console.error(message);
        return false;
      }
    },
    async configurationSetInStorage___greasemonkey_global_active({ commit }, payload : boolean) {
      try {
        this.state.configuration.greasemonkey.global_active = payload;
        config_storage().set(this.state.configuration);
        return true;
      } catch (message) {
        /** Fehler beim Laden der Konfiguration */
        console.error("Error in setting configurationSetInStorage___greasemonkey_global_active");
        console.error(message);
        return false;
      }
    },
    async configurationSetInStorage___hightlightjs_active({ commit }, payload : boolean) {
      try {
        this.state.configuration.hightlightjs.active = payload;
        config_storage().set(this.state.configuration);
        return true;
      } catch (message) {
        /** Fehler beim Laden der Konfiguration */
        console.error("Error in setting configurationSetInStorage___hightlightjs_active");
        console.error(message);
        return false;
      }
    },
    async configurationSetInStorage___hightlightjs_style({ commit }, payload : string) {
      try {
        this.state.configuration.hightlightjs.style = payload;
        config_storage().set(this.state.configuration);
        return true;
      } catch (message) {
        /** Fehler beim Laden der Konfiguration */
        console.error("Error in setting configurationSetInStorage___hightlightjs_style");
        console.error(message);
        return false;
      }
    },
    async configurationSetInStorage({ commit }, payload) {
      try {
        config_storage().set(payload);
        commit("configuration", payload);
        return true;
      } catch (message) {
        /** Fehler beim Laden der Konfiguration */
        console.error("Error in setting usi:config_storage");
        console.error(message);
        return false;
      }
    },

  },
  mutations: {
    activeView(state, activeView: string) {
      state.activeView = activeView;
    },
    configuration(state, configuration: usi.Storage.Config) {
      state.configuration = configuration;
    },
    editUserscriptId(state, editUserscriptId: number | null) {
      state.editUserscriptId = editUserscriptId;
    },
    editUserscriptContent(state, editUserscriptContent: string | null) {
      state.editUserscriptContent = editUserscriptContent;
    },
  },
});
