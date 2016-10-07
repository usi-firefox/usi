"use strict"; // Strict Mode aktivieren!
/************************************************************************
 ************************* Basic Funktionen! *************************
 ************************************************************************/

// benötigt für den Url Check
var MatchPattern = require("sdk/util/match-pattern").MatchPattern,
// Userscript Storage laden
userscript_storage = userscript_storage || require("lib/storage/userscript").userscript_storage,
parse_userscript = require("lib/parse/parse_userscript").parse_userscript;

/* global exports */

var test_url = {
	check: function(url, userscript_id){

		var userscript_entry = userscript_storage.getById(userscript_id);

		var includes = parse_userscript.prepare_includes_and_excludes(userscript_entry.getSettings()["include"], userscript_entry.getSettings() , "include");
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