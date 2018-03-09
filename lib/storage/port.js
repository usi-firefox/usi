browser.runtime.onConnect.addListener(function (port) {

    if (port.name !== "storage") {
        return false;
    }

    // für Nachrichten vom Content Script
    port.onMessage.addListener(async function (message) {
        try {
            switch (message.name) {
                case "getUserscriptById":
                    if (!message.id) {
                        // keine ID
                        port.postMessage({ name: "getUserscriptById-error" });
                        return;
                    }

                    const storage = await userscript_storage;
                    const userscript = storage.getById(message.id).getUserscriptContent();
                    
                    port.postMessage({ name: "getUserscriptById-done", data: { userscript: userscript } });

                    break;
            }
        } catch (err) {
            console.error(err);
        }
    });

});