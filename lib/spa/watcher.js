"use strict";
/**
 * Prüft den Hash und lädt gegebenfalls 
 * das passende Skript anhand der ID
 */

(async () => {

    if (!window.location.hash) {
        // keine ID vorhanden
        return;
    }

    // "#" entfernen, und in integer wandeln
    const possible_spa_id = window.location.hash.replace("#", "");

    if (possible_spa_id === 0) {
        // keine ID vorhanden
        return;
    }

    // storage connection
    const storage_connection = browser.runtime.connect({ name: "storage" });

    // definiere die Listener
    storage_connection.onMessage.addListener(async function (response) {

        // Skript gefunden
        if (response.name === "getUserscriptById-done" && response.data.userscript) {

            const userscript = response.data.userscript;
            const currentTab = await browser.tabs.getCurrent();

            // nun eine Verbindung zum SPA Listener herstellen
            const spa_connection = browser.runtime.connect({ name: "spa" });

            spa_connection.postMessage({ name: "applyToThisTab", data: { userscript: userscript, tabId: currentTab.id } });
            // STOP
            return;
        }

        // für Fehlermeldungen
        // es konnte kein passendes Skript gefunden werden
        console.error(response.name + " : " + possible_spa_id);

        return;
    });

    // versuche nun das SPA zu laden
    storage_connection.postMessage({ name: "getUserscriptById", id: possible_spa_id });

})();