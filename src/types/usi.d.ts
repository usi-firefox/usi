declare namespace usi.Tabs {
    interface execData {
        filter_urls: {
            include: Array<RegExp | string>,
            exclude?: Array<RegExp | string>
        }
        , gm?: {
            prefilled_data: {
                storage: any,
                id: number,
                scriptSettings: any,
                scriptMetaStr: string,
                usiVersion: string,
                systemPlatform: string,
                scriptSource: string
            }
            , preparedScript: string
        }
        , exec_details: browser.extensionTypes.InjectDetails
        , userscript_id: number
    }
}

declare namespace usi.Storage {
    interface Config {
        load_script_with_js_end: boolean
        , hightlightjs: {
            active: boolean
            , style: string
        }
        , global_excludes : []
        , greasemonkey: {
            global_active: boolean
        }
    }
    interface Userscript {
        id: number,
        userscript?: string,
        settings?: any,
        deactivated?: boolean,
        moreinformations?: usi.Userscript.AddionalData.Moreinformations,
        val_store?: any,
        require_scripts?: any,
    }
}

declare namespace usi.Userscript.AddionalData {
    interface Moreinformations {
        url: string
    }
}

declare namespace usi.Userscript.MetaBlock {
    interface Keyword {
        m: boolean,
        keyword: string,
        types: string[]
    }
}
declare namespace usi.fromPageWithUserscriptFile {
    interface message {
        name: string,
        data: {
            id?: number,
            userscript: string,
            moreinformations?: {
                url: string
            }
        }
    }
}
declare namespace usi.Backend {
    interface Port extends browser.runtime.Port {
        on: Function
    }
}

declare namespace usi.Frontend {
    interface menuEntry {
        name: string,
        lang: string
    }
    interface changeTabAdditionalEvent {
        event_name: string,
    }
    interface UserscriptInfoElement {
        text: string;
        value?: string;
        values?: Array<string>;
        vlang?: boolean;
    }
    interface EditAddtional {
        id?: number;
        userscript?: string;
    }
    interface EditUndo {
        time: number;
        text: string;
    }
}

declare namespace usi.GM_Backend {
    interface GM_openInTab {
        open_in_background: boolean,
        url: string
    }
    interface GM_value {
        val_name: string,
        value: any,
    }
    interface GM_xhr {
        url: string,
        originUrl: string,
        user?: string,
        password?: string,
        data?: any,
        binary?: boolean,
        ignoreCache?: boolean,
        headers?: any,
        method?: string,
        timeout?: number,
        overrideMimeType?: string
    }
    interface message {
        name: string,
        counter: number,
        data: GM_value | GM_xhr | GM_openInTab
    }
}