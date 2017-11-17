"use strict";

/* global browser,basic_helper, page_injection_helper, userscript_handle */

class SPA {

    async createPage (script) {
        const background_page = browser.extension.getBackgroundPage();
        const userscript_init = background_page.userscript_handle.initWithData(script);
        
        const spa_userscript_exec_object = await background_page.page_injection_helper.create_spa_userscript_exec_object(userscript_init);
        
        if(spa_userscript_exec_object === false){
            console.error(`Error, coudn't create SPA Object (${script.id})`);
            return false;
        }
        
        let spa_page = browser.tabs.create({
            url: "/spa.html#" + script.id
        });

        spa_page.then((success_tab) => {
            // Mittels Page Injection ausführen
            background_page.page_injection_helper._startTabExecution(success_tab.id, spa_userscript_exec_object);
            
        }, (error_tab) => {
            if (browser.runtime.lastError) {
                console.error(browser.runtime.lastError);
            }

            console.error(error_tab);
            basic_helper.notify("Error while creating SPA Page");
        });
    }
}