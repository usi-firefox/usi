import config_storage from "lib/storage/config";
import Vue from "vue";
import Vuex from "vuex";
Vue.use(Vuex);

const config_storage_instance = new config_storage();

/* tslint:disable:object-literal-sort-keys */

export const store = new Vuex.Store({
  modules: {
    /**
     * Einstellungen
     */
    configuration: {
      namespaced: true,
      state: {
        load_script_with_js_end: true
        , global_excludes: [] as string[]
        , greasemonkey: {
          global_active: true,
        },
      } as usi.Storage.Config
      , getters: {
        load_script_with_js_end(state) {
          return state.load_script_with_js_end;
        },
        greasemonkey_global_active(state) {
          return state.greasemonkey.global_active;
        },
        global_excludes(state) {
          return state.global_excludes;
        },
      },
      mutations: {
        load_script_with_js_end(state, val: boolean) {
          state.load_script_with_js_end = val;
        },
        greasemonkey_global_active(state, val: boolean) {
          state.greasemonkey.global_active = val;
        },
        global_excludes(state, val: string[]) {
          state.global_excludes = val;
        },
        global_excludes_add(state, val: string) {
          state.global_excludes.push(val);
        },
        global_excludes_remove(state, val: string) {
          const index = state.global_excludes.indexOf(val);
          if (index > -1) {
            (state.global_excludes as []).splice(index, 1);
          }
        },
      },
      actions: {
        /**
         * Hole die aktuelle Konfiguration aus dem Storage
         */
        async loadFromStorage(context) {
          try {
            const config = await new config_storage().get();

            context.commit("load_script_with_js_end", config.load_script_with_js_end);
            context.commit("greasemonkey_global_active", config.greasemonkey.global_active);
            context.commit("global_excludes", config.global_excludes);

            return true;
          } catch (message) {
            /** Fehler beim Laden der Konfiguration */
            console.error("Error in loading usi:config_storage");
            console.error(message);
            return false;
          }
        },
        async load_script_with_js_end(context, payload: boolean) {
          try {
            context.commit("load_script_with_js_end", payload);
            await config_storage_instance.set(context.state);
            return true;
          } catch (message) {
            /** Fehler beim Laden der Konfiguration */
            console.error("Error in setting load_script_with_js_end");
            console.error(message);
            return false;
          }
        },
        async greasemonkey_global_active(context, payload: boolean) {
          try {
            context.commit("greasemonkey_global_active", payload);
            await config_storage_instance.set(context.state);
            return true;
          } catch (message) {
            /** Fehler beim Laden der Konfiguration */
            console.error("Error in setting greasemonkey_global_active");
            console.error(message);
            return false;
          }
        },
        async global_excludes_add(context, payload: string) {
          try {
            context.commit("global_excludes_add", payload);
            await config_storage_instance.set(context.state);
            return true;
          } catch (message) {
            /** Fehler beim Laden der Konfiguration */
            console.error("Error in setting global_excludes_add");
            console.error(message);
            return false;
          }
        },
        async global_excludes_remove(context, payload: string) {
          try {
            context.commit("global_excludes_remove", payload);
            await config_storage_instance.set(context.state);
            return true;
          } catch (message) {
            /** Fehler beim Laden der Konfiguration */
            console.error("Error in setting global_excludes_add");
            console.error(message);
            return false;
          }
        },
      },
    },
  },
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
    activeView(state) {
      return state.activeView;
    },
    editUserscriptId(state) {
      return state.editUserscriptId;
    },
    editUserscriptContent(state) {
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
