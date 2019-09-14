import config_storage from "lib/storage/config";
import Vue from "vue";
import Vuex from "vuex";
Vue.use(Vuex);

const config_storage_instance = new config_storage();

export const store = new Vuex.Store({
  modules: {
    /**
     * Einstellungen
     */
    configuration: {
      namespaced: true,
      state: {
        load_script_with_js_end: true
        , hightlightjs: {
          active: true,
          style: "default",
        }
        , global_excludes: []
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
        hightlightjs_active(state) {
          return state.hightlightjs.active;
        },
        hightlightjs_style(state) {
          return state.hightlightjs.style;
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
        hightlightjs_active(state, val: boolean) {
          state.hightlightjs.active = val;
        },
        hightlightjs_style(state, val: string) {
          state.hightlightjs.style = val;
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
            context.commit("hightlightjs_active", config.hightlightjs.active);
            context.commit("hightlightjs_style", config.hightlightjs.style);

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
        async hightlightjs_active(context, payload: boolean) {
          try {
            context.commit("hightlightjs_active", payload);
            await config_storage_instance.set(context.state);
            return true;
          } catch (message) {
            /** Fehler beim Laden der Konfiguration */
            console.error("Error in setting hightlightjs_active");
            console.error(message);
            return false;
          }
        },
        async hightlightjs_style(context, payload: string) {
          try {
            context.commit("hightlightjs_style", payload);
            await config_storage_instance.set(context.state);
            return true;
          } catch (message) {
            /** Fehler beim Laden der Konfiguration */
            console.error("Error in setting hightlightjs_style");
            console.error(message);
            return false;
          }
        },
      },
    }
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
    }

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
