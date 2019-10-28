import { notify } from "lib/helper/basic_helper";
import page_injection_helper from "lib/inject/page_injection_helper";
import userscript_storage from "lib/storage/storage";

export default class SPA {

    public async _create(userscriptId: number, existingTabId?: number) {
        const storage = await userscript_storage();
        const userscript_init = storage.getById(userscriptId) as any;

        const spa_userscript_exec_object = await (new page_injection_helper()).create_spa_userscript_exec_object(userscript_init);

        if (spa_userscript_exec_object === false) {
            console.error(`Error, coudn't create SPA Object (${userscript_init.id})`);
            return false;
        }

        if (existingTabId) {
            const tabId = existingTabId;
            // Mittels Page Injection ausführen
            (new page_injection_helper())._startTabExecution(tabId, spa_userscript_exec_object);
        } else {

            try {
                // neuen Tab öffnen
                const spa_page = browser.tabs.create({
                    url: "/html/spa.html#" + userscriptId,
                });
            } catch (error_tab) {

                if (browser.runtime.lastError) {
                    console.error(browser.runtime.lastError);
                }

                console.error(error_tab);
                notify("Error while creating SPA Page");
                return;
            }
        }
    }

    /**
     * erzeugt einen neuen Tab und führt das SPA aus
     * @param {int} userscriptId
     */
    public async createPage(userscriptId: number) {
        this._create(userscriptId);
    }

    /**
     * führt das SPA aus in diesem Tab aus
     * @param {int} userscriptId
     * @param {int} tabId
     */
    public async applyToThisTab(userscriptId: number, tabId: number) {
        this._create(userscriptId, tabId);
    }
}

// öffnet einen Port
browser.runtime.onConnect.addListener((port) => {

    if (port.name !== "spa") {
        return false;
    }

    // für Nachrichten vom Content Script
    port.onMessage.addListener(async (message: any) => {
        try {

            switch (message.name) {
                case "applyToThisTab":
                    if (!message.data.id || !message.data.tabId) {
                        // keine ID
                        port.postMessage({ name: message.name });
                        return;
                    }

                    const spa_instance = new SPA();
                    // exec
                    spa_instance.applyToThisTab(message.data.id, message.data.tabId);

                    break;
            }
        } catch (err) {
            console.error(err);
        }
    });

});
