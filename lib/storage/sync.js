"use strict";

var simple_storage = require("sdk/simple-storage"),
storage = simple_storage.storage,

// Managed den gesamten Sync
sync_handler = (function () {
    var self = {
        getServers : function(){
            return storage.syncSettings.servers;
        }
    };    
}());

if (typeof exports !== "undefined") {
    exports.sync_handler = sync_handler;
}