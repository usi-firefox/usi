"use strict";

/* global browser */

// Ask to the legacy part to dump the needed data and send it back
// to the background page...
var port = browser.runtime.connect({name: "usi-sdk-addon-data"});
port.onMessage.addListener((msg) => {
  if (msg) {
    // Where it can be saved using the WebExtensions storage API.
    browser.storage.local.set(msg);
  }
});

