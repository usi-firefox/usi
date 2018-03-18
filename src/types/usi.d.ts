declare namespace usi{
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