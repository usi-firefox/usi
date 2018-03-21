
/**
 * Prüft den Hash und lädt gegebenfalls 
 * das passende Skript anhand der ID
 */

(async (): Promise<void> => {

    if (!window.location.hash) {
        // keine ID vorhanden
        return;
    }

    // "#" entfernen, und in integer wandeln
    const possible_spa_id = Number(window.location.hash.replace("#", ""));

    if (possible_spa_id === 0) {
        // keine ID vorhanden
        return;
    }

    const currentTab = await browser.tabs.getCurrent();
    // nun eine Verbindung zum SPA Listener herstellen
    const spa_connection = browser.runtime.connect(undefined, { name: "spa" });

    // versuche nun das SPA zu laden
    spa_connection.postMessage({ name: "applyToThisTab", data: { id: possible_spa_id, tabId: currentTab.id } });

})();