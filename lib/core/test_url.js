"use strict"; // Strict Mode aktivieren!
/************************************************************************
 ************************* Basic Funktionen! *************************
 ************************************************************************/

// benötigt für den Url Check
var MatchPattern = require("sdk/util/match-pattern").MatchPattern,
addon_storage = addon_storage || require("sdk/simple-storage"),
page_injection_helper = require("../inject/page_injection_helper").page_injection_helper;

/* global exports */

var test_url = {
	check: function(url, userscript_id){

		var userscript_entry = addon_storage.storage[userscript_id];

		var includes = page_injection_helper.prepare_includes_and_excludes(userscript_entry.settings.include, userscript_entry.settings , "include");
//		var excludes = page_injection_helper.prepare_includes_and_excludes(userscript_entry.settings.exclude, userscript_entry.settings , "exclude");
		
		var pattern;
	
		// Setze für jedes Include ein neues MatchPattern und teste es
		for (var i in includes){
			pattern = new MatchPattern(includes[i]);
			
			if(pattern.test(url) === true){
				// es reicht wenn auch nur ein Pattern matched/greift
				return true;
			}
		}
		
		return false;
	}
};

// nötig damit es auch im Content Script verwendet werden kann!!!
if(typeof exports !== "undefined"){
	exports.test_url = test_url;
}