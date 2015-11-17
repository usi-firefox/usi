"use strict";

/* global angular, self, directive, basic_helper */
 
var usiOptions = angular.module('usiOptions', ["mobile-angular-ui"]);

/************************************************************************
 ************************* Übersetzungen holen **************************
 ************************************************************************/
var lang = self.options.language;

//Auflistung der Userscripte
usiOptions.controller("ListUserScripts", ["$scope", "$rootScope" , function ListUserScripts($scope, $rootScope){
	// Var init...
	$scope.all_userscripts = {};
	$scope.lang = self.options.language;
	
	
	$scope.request_for_reload = function(){
		console.log("request_for_reload: aufgerufen ....");
		
		self.port.emit("request-for---list-all-scripts", false);
	};
	
	/**
	 * Userscript aktivieren, bzw deaktivieren
	 * @param {type} userscript
	 * @returns void
	 */
	$scope.toggleActivation = function (userscript){
		// aktiviere oder deaktiviere dieses Userscript!
		self.port.emit("toggle-userscript-state", userscript.id);
	};
	
	$scope.delete = function (userscript){
		// das Skript mit der ID löschen!
		if (!basic_helper.empty(userscript.id)) {
			//zusätzliche Abfrage
			if(window.confirm( lang.want_to_delete_this_userscript_1 + userscript.id + lang.want_to_delete_this_userscript_2)){
				
				// @todo erstmal abschalten!!!
				//self.port.emit("delete-script-by-id", userscript.id);
			}
		}
	};
	
	// Events
	self.port.on("list-all-scripts", function(data){
		// Daten für alle Userscripts setzen
		$scope.all_userscripts = data;
	});
	
	
	// Init
	$scope.request_for_reload();
	
}]).directive("listuserscripts", function(){
    return {
		templateUrl : "directive/listuserscripts.html"
    };
});

// Userscript bearbeiten
usiOptions.controller("EditUserScript", ["$scope", "$rootScope" , function EditUserScript($scope, $rootScope){
	// Var init...
//	$scope.all_userscripts = {};
	$scope.lang = self.options.language;
	
}]).directive("edituserscript", function(){
    return {
		templateUrl : "directive/edit_userscript.html"
    };
});

// Userscript nachladen
usiOptions.controller("LoadExternalUserScript", ["$scope", "$rootScope" , function LoadExternalUserScript($scope, $rootScope){
	// Var init...
//	$scope.all_userscripts = {};
	$scope.lang = self.options.language;
	
	
}]).directive("loadexternaluserscript", function(){
    return {
		templateUrl : "directive/load_external_userscript.html"
    };
});