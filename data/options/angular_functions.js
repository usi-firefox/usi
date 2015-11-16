/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


/* global angular, self */
 
var usiOptions = angular.module('usiOptions', ["mobile-angular-ui"]);

usiOptions.controller("ListUserScripts", ["$scope" ,function ListUserScripts($scope){
	
	$scope.all_userscripts = [];
	// Liste alle verfügbaren Skripte auf
		self.port.on("list-all-scripts", function (all_scripts) {
			$scope.all_userscripts = all_scripts;
			
			console.log("$scope.all_userscripts");
			console.log($scope.all_userscripts);
		});
	
}]);

