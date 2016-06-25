"use strict";

var jsSHA = require("./sha256");

var hash = {
	
	encode: function(input, outputType){
		var shaObj = new jsSHA("SHA-256", "TEXT");
		shaObj.update(input);
		
		switch(outputType){
			case "HEX":
			case "B64":
			case "BYTES":
			case "ARRAYBUFFER":
				break;
			default:
				outputType = "B64";
				break;
		}
		return shaObj.getHash(outputType);
	},
	
	validate: function(str, hash){
		return (this.encode(str) === hash);
	}

};

// nötig damit es auch im Content Script verwendet werden kann!!!
if(typeof exports !== "undefined"){
	exports.hash = hash;
}