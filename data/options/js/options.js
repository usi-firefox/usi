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








// Active Style festlegen
self.port.on("USI-BACKEND:highlightjs-style", function(style){
	highlightjs_c.set_active_style(style);
});
self.port.on("USI-BACKEND:highlightjs-activation-state",function(state){
	// Setzt den aktuellen Aktivierungs Status von HighlightJS
	highlightjs_c.activate(state);
});

/**
 * Wenn das Userscript schon existiert und überschrieben werden kann
 */
self.port.on("USI-BACKEND:same-userscript-was-found", 
	/**
	 * 
	 * @param {object} userscript_infos
	 * @returns {void}
	 */
	function (userscript_infos) {

	//wurde gefunden, möchtest du es aktualisieren?")){
	if (window.confirm($scope.lang.same_userscript_was_found_ask_update_it_1 + userscript_infos.id + $scope.lang.same_userscript_was_found_ask_update_it_2)) {
		// Dieses Skript wird nun aktualisiert! userscript_infos = {id : id , userscript: userscript}
		self.port.emit("USI-BACKEND:override-same-userscript", userscript_infos);
		self.port.emit("USI-BACKEND:request-for---list-all-scripts");
	}
});

// Beispiel Datei laden  
// Anfrage für das Userscript Beispiel
self.port.emit("USI-BACKEND:get-userscript-example", $scope.load_example_by_prefered_locale);
// Rückantwort sichern
self.port.on("USI-BACKEND:get-userscript-example-done", function(data){
	$scope.userscript_example = data;
});

// Hört darauf ob Aktualisierungen für die Skripte zur Verfügung stehen ...
self.port.on("USI-BACKEND:update-for-userscript-available", function (userscript_infos) {
	if (window.confirm($scope.lang.userscript_update_was_found_1 + userscript_infos.id + $scope.lang.userscript_update_was_found_2)) {

		// Nun das Skript aktualisieren!
		self.port.emit("USI-BACKEND:override-same-userscript", userscript_infos);

		self.port.emit("USI-BACKEND:request-for---list-all-scripts");
	}
});

// Wenn das Skript gelöscht wurde
self.port.on("USI-BACKEND:delete-script-is-now-deleted", function (script_was_deleted) {
	if (script_was_deleted === true) { // script wurde erfolgreich gelöscht
		window.alert($scope.lang.userscript_was_successful_deleted);
	} else { // script konnte nicht gelöscht werden
		window.alert($scope.lang.userscript_could_not_deleted);
	}
});


// Wrapper Funktion für AngularJS, da im Backend keine Event() gebaut werden können -.-
self.port.on("USI-FRONTEND:Event-Wrapper", function(conf){
	$rootScope.$emit(conf.event_name, conf.data);
});

self.port.on("USI-BACKEND:options_always_activate_greasemonkey",function(state){
	$scope.options_always_activate_greasemonkey = state;
	$scope.$digest();
});

self.port.on("USI-BACKEND:ExternalScriptLoadQuestion",function(state){
	$scope.enableExternalScriptLoadQuestion = state;
	$scope.$digest();
});

self.port.on("USI-BACKEND:OldUsiIncludeBehavior",function(state){
	$scope.OldUsiIncludeBehavior = state;
	$scope.$digest();
});

/** 
 * Erzeugt ein Download Fenster für den Fertigen Export
 */
self.port.on("USI-BACKEND:get-all-userscripts-for-export-done", 
	/**
	 * 
	 * @param {boolean} result_export_data
	 * @returns {void}
	 */
	function (result_export_data) {

	if (typeof $scope.complete_export !== "undefined" && $scope.complete_export === true) {
		createDownload(result_export_data, "text/plain", "usi-export.usi.json");
	} else {
		createDownload(result_export_data, "application/octet-stream", "usi-export.usi.js");
	}
});

// Speicherverbrauch anzeigen
self.port.on("USI-BACKEND:storage-quota", function (quota) {
	var rounded_quota = Math.round(quota * 100) / 100 + "";

	// falls ein Komma enthalten sein sollte ...
	rounded_quota = rounded_quota.replace(".", ",");

	$scope.currentMemoryUsage = $scope.lang.actual_used_quota + " : " + rounded_quota + "%";
});


self.port.on("USI-BACKEND:get-alert", 
	/**
	 * 
	 * @param {string} text
	 * @returns {void}
	 */
	function(text){
		window.alert(text);
});


// Speichert ein Userscript!
self.port.on("USI-BACKEND:export-userscript-done", function (result) {
	createDownload(result.userscript, "text/plain", encodeURI(result.filename + ".user.js"));
});

// Wenn Userscripts gesendet werden, packe sie in die Variable --- all_userscripts
self.port.on("USI-BACKEND:list-all-scripts", function (data) {
	$scope.all_userscripts = {};
	// Aktualisiere den View, falls Elemente gelöscht wurden!
	$scope.$digest();

	// Daten für alle Userscripts setzen
	$scope.all_userscripts = data;

	// Anzahl der Userscripts - zählen mittels Object.keys
	$scope.userscript_count = Object.keys(data).length;

	// Aktualisiere den View, falls Elemente gelöscht wurden!
	$scope.$digest();

	// zurücksetzen 
	$scope.already_highlighted = [];

	// Beende die Lade Animation
	if(typeof window.loading_screen !== "undefined" && typeof window.loading_screen.finish === "function"){
		window.loading_screen.finish();
	}
});