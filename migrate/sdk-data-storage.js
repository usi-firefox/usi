const sp = require("sdk/simple-prefs"),
ss = require("sdk/simple-storage");

exports.setSyncLegacyDataPort = function(port) {
  
  let sdk_prefs = sp.prefs;
  let sdk_userscript_storage = ss.storage;
  
  let data_dump = {
    prefs: {
      sdk_prefs
    },
    storage: {
      sdk_userscript_storage
    }
  };
  // Send the initial data dump.
  port.postMessage(data_dump);

};
 