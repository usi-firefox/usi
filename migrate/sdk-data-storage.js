const sp = require("sdk/simple-prefs"),
ss = require("sdk/simple-storage");

exports.setSyncLegacyDataPort = function(port) {
  
    var prefs = Object.assign({}, sp.prefs); 
    var storage = Object.assign({}, ss.storage); 
   
    let data_dump = {
        prefs: prefs
        ,storage: storage
    }; 
  // Send the initial data dump.
  port.postMessage(data_dump);

};
 