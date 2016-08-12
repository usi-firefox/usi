"use strict";

function backend_events_class() {

	if (typeof self.port !== "undefined") {

		var api = self.port;

		return {
			
			trigger: function (name, values) {
				if(values !== null){
					api.emit(name, values);
				}else{
					api.emit(name);
				}
			}

			,on : function (name, callback) {
				if(typeof callback === "function"){
					api.on(name, callback);
				}
			}
		};
		
	} else {
		return false;
	}

};

var backend_events_controller = backend_events_class();