"use strict";

/* global angular, self, directive, basic_helper */

//var usiOptions = angular.module('usiOptions', []);
var usiOptions = angular.module('usiOptions', ["mobile-angular-ui", "mobile-angular-ui.gestures"]);

/************************************************************************
 ************************* Übersetzungen holen **************************
 ************************************************************************/

// Overlay Controller
usiOptions.controller("Overlay", ["$scope", "$rootScope", function Overlay($scope, $rootScope) {
		// Initiale Werte
		// Version von USI
		$scope.version = self.options.version;
		$scope.tab = 'overview';
		
		$scope.lang = self.options.language;
		
		// Event für Tab Wechsel
		$rootScope.$on("USI-FRONTEND:changeTab", function (event, data) {
			$scope.changeTab(data);
		});

		$scope.changeTab = function (text) {
			$scope.tab = text;
		};

	}]);

//Auflistung der Userscripte
usiOptions.controller("ListUserScripts", ["$scope", "$rootScope", "$q", function ListUserScripts($scope, $rootScope, $q) {
		// Var init...
		$scope.all_userscripts = {};
		$scope.userscript_count = 0;
		$scope.lang = self.options.language;

		/**
		 * Userscript aktivieren, bzw deaktivieren
		 * @param {type} userscript
		 * @returns void
		 */
		$scope.toggleActivation = function (userscript) {
			// aktiviere oder deaktiviere dieses Userscript!
			self.port.emit("USI-BACKEND:toggle-userscript-state", userscript.id);
		};

		/**
		 * Userscript entfernen
		 * @param {type} userscript
		 * @returns {undefined}
		 */
		$scope.delete = function (userscript) {
			// das Skript mit der ID löschen!
			if (!basic_helper.empty(userscript.id)) {
				//zusätzliche Abfrage
				if (window.confirm($scope.lang.want_to_delete_this_userscript_1 + userscript.id + $scope.lang.want_to_delete_this_userscript_2)) {

					// @todo erstmal abschalten!!!
					self.port.emit("USI-BACKEND:delete-script-by-id", userscript.id);

					self.port.emit("USI-BACKEND:request-for---list-all-scripts");
				}
			}
		};

		// Sende es an den Editierungs Controller
		$scope.edit = function (userscript) {
			$rootScope.$emit("USI-FRONTEND:EditUserscipt_edit", userscript);

			// veranlasse den Tab Wechsel!
			$scope.$emit("USI-FRONTEND:changeTab", "createOrEdit");

		};
		
		// testet die eingebene URL ob ein Include darauf greifen(matchen) würde
		$scope.testUrlMatch = function (userscript){
			// Backend anfragen
			self.port.emit("USI-BACKEND:test-url-match", {url: userscript.testurl, id: userscript.id});
			
			// Ergebnis zustand zurückschreiben
			self.port.once("USI-BACKEND:test-url-match-" + userscript.id, function(state){
				// Treffer => true
				if(userscript.testurlstate !== state){
					// Zustand sichern
					userscript.testurlstate = state;

					// Symbol ändern
					jQuery("#testurlstate-" + userscript.id).toggleClass("fa-close").toggleClass("fa-check");
				}
			});
		};

		// Wenn Userscripts gesendet werden, packe sie in die Variable --- all_userscripts
		self.port.on("USI-BACKEND:list-all-scripts", function (data) {

			// Daten für alle Userscripts setzen
			$scope.all_userscripts = data;

			// Anzahl der Userscripts - zählen mittels Object.keys
			$scope.userscript_count = Object.keys(data).length;

		});

		// Speicherverbrauch anzeigen
		self.port.on("USI-BACKEND:storage-quota", function (quota) {
			var rounded_quota = Math.round(quota * 100) / 100 + "";

			// falls ein Komma enthalten sein sollte ...
			rounded_quota = rounded_quota.replace(".", ",");

			$scope.currentMemoryUsage = $scope.lang.actual_used_quota + " : " + rounded_quota + "%";
		});

		// Initiale Abfrage
		self.port.emit("USI-BACKEND:request-for---list-all-scripts", false);

	}]).directive("listuserscripts", function () {
	return {
		templateUrl: "directive/userscripts/list.html"
	};
});


// Extra Optionen
usiOptions.controller("ExtraOptionsForUSI", ["$scope", "$rootScope", function ExtraOptionsForUSI($scope, $rootScope) {
		// Var init...
		$scope.lang = self.options.language;

		/**
		 * Alle Userscripte entfernen
		 * @returns {undefined}
		 */
		$scope.deleteAll = function () {
			// Doppelte Sicherheitsabfrage, bevor wirklich alles gelöscht wird!
			if (window.confirm($scope.lang.really_reset_all_settings)) {
				if (window.confirm($scope.lang.really_really_reset_all_settings)) {
					self.port.emit("USI-BACKEND:delete-everything");
					self.port.emit("USI-BACKEND:request-for---list-all-scripts");
				}
			}
		};

		// Prüfe ob für die Skripte Updates gefunden wurden!
		$scope.checkForUpdates = function () {
			self.port.emit("USI-BACKEND:check-for-userscript-updates");
		};

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

	}]);

// Userscript nachladen
usiOptions.controller("LoadExternalUserScript", ["$scope", function LoadExternalUserScript($scope) {
		// Var init...
		$scope.url = "";
		$scope.lang = self.options.language;

		// Userscript nachladen
		$scope.loadExternal = function () {
			$scope.error = "";
			if (typeof $scope.url !== "undefined" && $scope.url.length > 0) {
				// sende die URL an das Backend Skript...
				self.port.emit("USI-BACKEND:loadexternal-script_url", {script_url: $scope.url});

				self.port.emit("USI-BACKEND:request-for---list-all-scripts");
				
				self.port.once("USI-BACKEND:external-script-is-now-loaded", function(status){
					if(status === true){
						// Nachgeladenes Userscript ist geladen
						alert($scope.lang.external_script_is_now_loaded + " -> " + $scope.url);
					}
				});
			} else {
				// Fehler Text anzeigen
				$scope.error = $scope.lang.empty_userscript_url;
			}
		};

	}]).directive("loadexternaluserscript", function () {
	return {
		templateUrl: "directive/userscripts/load_external.html"
	};
});



// Userscript bearbeiten
usiOptions.controller("EditUserScript", ["$scope", "$rootScope", "$http", function EditUserScript($scope, $rootScope, $http) {
		// Var init...
		$scope.lang						=	self.options.language;
		$scope.prefered_locale			=	self.options.PreferedLocales[0]; // setze die Standard Sprache
		$scope.textarea_default_size	=	jQuery("#script-textarea").css("font-size").split("px")[0];
		$scope.state = 0;

		// nur wenn die erste 'prefered_locale' -> 'de' ist, ansonsten wird die Englische Version geladen
		if($scope.prefered_locale === "de"){
			$scope.load_example_by_prefered_locale = "de";
		}else{
			$scope.load_example_by_prefered_locale = "en";
		}

		// Beispiel Datei laden 
		// self.options.PreferedLocales[0] erste Bevorzugte Sprache
		$http.get("example/" + $scope.load_example_by_prefered_locale + "-example.user.js").then(function(response){
			$scope.userscript_example = response.data;
		});

		/**
		 * Höhe der Textarea an die Fenstergröße anpassen!
		 * @returns {undefined}
		 */
		$scope.setTextareaHeight = function () {
			var window_innerHeight = parseInt(window.innerHeight),
					size_by_percent = 65 / 100;

			// Textarea höhe berechnen
			var textarea_height = Math.floor(window_innerHeight * size_by_percent);

			// Größe setzen
			jQuery("#script-textarea").css("height", textarea_height + "px");
		};


		/**
		 * Textarea Größe anpassen
		 * @returns {undefined}
		 */
		$scope.changeSize = function () {
			// Setze die Größe der Textarea auf den Wert aus dem Range "Button"
			jQuery("#script-textarea").css("font-size", $scope.textarea_size + "px");
		};

		/**
		 * Textarea auf Standard Größe zurücksetzen
		 * @returns {undefined}
		 */
		$scope.defaulltSize = function () {
			// Wert des ZOOM Reglers auf den Standard setzen
			$scope.textarea_size = $scope.textarea_default_size;

			// Setze die Größe der Textarea auf den Wert aus dem Range "Button"
			jQuery("#script-textarea").css("font-size", $scope.textarea_default_size + "px");
		};

		/**
		 * Userscript aus der Textarea übermitteln
		 * @returns {undefined}
		 */
		$scope.save = function () {
			// Textarea nicht leer ...
			if ($scope.textarea) {
				// sende den Userscript Text an das Addon Skript...
				self.port.emit("USI-BACKEND:new-usi-script_content", {script: $scope.textarea});

				self.port.emit("USI-BACKEND:request-for---list-all-scripts");
			}
		};

		/**
		 * Textarea in einen Vollbild Modus schalten!
		 * @returns {undefined}
		 */
		$scope.textarea_to_fullscreen = function () {
			var window_innerHeight = parseInt(window.innerHeight),
					size_by_percent = 75 / 100;

			// Textarea höhe berechnen
			var textarea_height = Math.floor(window_innerHeight * size_by_percent);

			// Größe setzen
			jQuery("#script-textarea").css("height", textarea_height + "px");
		};

		/**
		 * Wenn das Userscript schon existiert und überschrieben werden kann
		 */
		self.port.on("USI-BACKEND:same-userscript-was-found", function (userscript_infos) {

			//wurde gefunden, möchtest du es aktualisieren?")){
			if (window.confirm($scope.lang.same_userscript_was_found_ask_update_it_1 + userscript_infos.id + $scope.lang.same_userscript_was_found_ask_update_it_2)) {
				// Dieses Skript wird nun aktualisiert! userscript_infos = {id : id , userscript: userscript}
				self.port.emit("USI-BACKEND:override-same-userscript", userscript_infos);
				self.port.emit("USI-BACKEND:request-for---list-all-scripts");
			}
		});

		/**
		 * Events
		 */
		$rootScope.$on("USI-FRONTEND:EditUserscipt_edit", function (event, userscript) {
			// Nimm das Userscript und schreibe es in die Textarea
			$scope.textarea = userscript.userscript;
			$scope.script_id = userscript.id;
			// Schalte den State um
			$scope.state = "edit";
		});


		// Schalter richtig positionieren lassen ...
		$scope.defaulltSize();
		$scope.setTextareaHeight();
		
		// Text Area anpassen bei Größen Änderung
		jQuery(window).on("resize", $scope.setTextareaHeight);

	}]).directive("edituserscript", function () {
	return {
		templateUrl: "directive/userscripts/edit.html"
	};
}); 