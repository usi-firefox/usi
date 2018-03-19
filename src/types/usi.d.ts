declare namespace usi {
    interface tabExecData {
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