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
	$scope.userscript_count = 0;
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
		
		// Anzahl der Userscripts - zählen mittels Object.keys
		$scope.userscript_count = Object.keys(data).length;
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

// Extra Optionen
usiOptions.controller("ExtraOptionsForUSI", ["$scope", "$rootScope" , function ExtraOptionsForUSI($scope, $rootScope){
	// Var init...
//	$scope.all_userscripts = {};
	$scope.lang = self.options.language;
	
	$scope.deleteAll = function (){
		// Doppelte Sicherheitsabfrage, bevor wirklich alles gelöscht wird!
		if(window.confirm(lang.really_reset_all_settings)){
			if(window.confirm(lang.really_really_reset_all_settings)){
				self.port.emit("delete-everything");
			}
		}
	};
	
	// Prüfe ob für die Skripte Updates gefunden wurden!
	$scope.checkForUpdates = function(){
		self.port.emit("check-for-userscript-updates");
	};
}]);

// Userscript nachladen
usiOptions.controller("LoadExternalUserScript", ["$scope", "$rootScope" , function LoadExternalUserScript($scope, $rootScope){
	// Var init...
	$scope.url		= "";
	$scope.lang		= self.options.language;
	
	// Userscript nachladen
	$scope.loadExternal = function(){
		$scope.error = "";
		if(typeof $scope.url !== "undefined" && $scope.url.length > 0){
			// sende die URL an das Backend Skript...
			self.port.emit("loadexternal-script_url", {script_url: $scope.url});
			
		}else{
			// Fehler Text anzeigen
			$scope.error = $scope.lang.empty_userscript_url;
		}
	};
	
}]).directive("loadexternaluserscript", function(){
    return {
		templateUrl : "directive/load_external_userscript.html"
    };
});