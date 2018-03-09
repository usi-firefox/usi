"use strict";

/* global browser,basic_helper, page_injection_helper, userscript_handle */

class SPA {

    async _create(script, existingTabId) {
        const background_page = browser.extension.getBackgroundPage();
        const userscript_init = background_page.userscript_handle.initWithData(script);

        const spa_userscript_exec_object = await background_page.page_injection_helper.create_spa_userscript_exec_object(userscript_init);

        if (spa_userscript_exec_object === false) {
            console.error(`Error, coudn't create SPA Object (${script.id})`);
            return false;
        }

        if (existingTabId) {
            const tabId = existingTabId;
            // Mittels Page Injection ausführen
            background_page.page_injection_helper._startTabExecution(tabId, spa_userscript_exec_object);
        } else {
            let spa_page = browser.tabs.create({
                url: "/spa.html#" + script.id
            });

            try {
                // tab wird geöffnet, hier muss gewartet werden
                const success_tab = await spa_page;
                const tabId = success_tab.id;

                // Mittels Page Injection ausführen
                background_page.page_injection_helper._startTabExecution(tabId, spa_userscript_exec_object);

            } catch (error_tab) {

                if (browser.runtime.lastError) {
                    console.error(browser.runtime.lastError);
                }

                console.error(error_tab);
                basic_helper.notify("Error while creating SPA Page");
                return;
            }
        }
    }

    /**
     * erzeugt einen neuen Tab und führt das SPA aus
     * @param {string} script 
     */
    async createPage(script) {
        this._create(script);
    }

    /**
     * führt das SPA aus in diesem Tab aus
     * @param {string} script 
     * @param {int} tabId 
     */
    async applyToThisTab(script, tabId) {
        this._create(script, tabId);
    }
}

// öffnet einen Port
browser.runtime.onConnect.addListener(function (port) {

    if (port.name !== "spa") {
        return false;
    }

    

    // für Nachrichten vom Content Script
    port.onMessage.addListener(async function (message) {
        try {

            switch (message.name) {
                case "applyToThisTab":
                    if(!message.data.userscript || !message.data.tabId){
                        // keine ID
                        port.postMessage({name: message.name});
                        return;
                    }

                    let spa_instance = new SPA();
                    // exec
                    spa_instance.applyToThisTab(message.data.userscript, message.data.tabId);
                    
                    break;
            }
        } catch (err) {
            console.error(err);
        }
    });

});