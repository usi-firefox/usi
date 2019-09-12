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
    configuration: null as usi.Storage.Config | null,
    /**
     * Daten für die Edit Komponente
     */
    editUserscriptId: null as number | null,
    editUserscriptContent: null as string | null,
  },
  getters: {
    activeView(state, activeView: string) {
      return state.activeView;
    },
    editUserscriptId(state, editUserscriptId: number | null) {
      return state.editUserscriptId;
    },
    editUserscriptContent(state, editUserscriptContent: string | null) {
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
    configuration(state, configuration: usi.Storage.Config | null) {
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
