"use strict";

/* global self, basic_helper, hljs */

$rootScope.$on("USI-FRONTEND:LoadExternalUserScript_reload_from_source", function (event, url) {
	// Nimm die Userscript URL
	$scope.url = url;
});

/**
 * Events
 */
$rootScope.$on("USI-FRONTEND:EditUserscipt_newFromFile",
	/**
	 * 
	 * @param {event} event
	 * @param {object} userscript
	 * @returns {void}
	 */
	function (event, userscript) {
	// Nimm das Userscript und schreibe es in die Textarea
	$scope.textarea = userscript;
	// Schalte den State um
	$scope.state = 0;
});
$rootScope.$on("USI-FRONTEND:EditUserscipt_edit",
	/**
	 * 
	 * @param {event} event
	 * @param {object} userscript
	 * @returns {void}
	 */
	function (event, userscript) {
	// Nimm das Userscript und schreibe es in die Textarea
	$scope.textarea = userscript.userscript;
	$scope.script_id = userscript.id;
	// Schalte den State um
	$scope.state = "edit";
});










// Wrapper Funktion für AngularJS, da im Backend keine Event() gebaut werden können -.-
self.port.on("USI-FRONTEND:Event-Wrapper", function(conf){
	$rootScope.$emit(conf.event_name, conf.data);
});

