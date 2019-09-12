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
  },
  mutations: {
    activeView(state, activeView: string) {
      state.activeView = activeView;
    },
    editUserscriptId(state, editUserscriptId: number | null) {
      state.editUserscriptId = editUserscriptId;
    },
    editUserscriptContent(state, editUserscriptContent: string | null) {
      state.editUserscriptContent = editUserscriptContent;
    },
  },
});
