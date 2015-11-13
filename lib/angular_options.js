"use strict"; // Strict Mode aktivieren!
/************************************************************************
 ******************* Angular Funktionen für Optionen ********************
 ************************************************************************/

/* global exports, require */

var cfx_jpm_helper = require("./cfx_jpm_helper").cfx_jpm_helper;

var angular_options = {
	/**
	 * Gibt den Pfad zu den AngularJS Dateien zurück
	 * @returns {String}
	 */
	getAngularJsPath: function(){
		return cfx_jpm_helper.resource_path() + "external/angularjs/";
	}
	/**
	 * Gibt den Pfad zu den AngularJS Mobile Dateien zurück
	 * @returns {String}
	 */
	,getAngularJsMobilePath: function(){
		return cfx_jpm_helper.resource_path() + "external/angularjs-mobile/";
	}
	/**
	 * Hilfs Funktion, die jedem Array den vorangestellten Pfad übergibt
	 * 
	 * @param {String} path
	 * @param {Array} array
	 * @returns {Array|angular_options.forEachPath.result}
	 */
	,forEachPath : function(path, array){
		var result = [];
		for (var i in array){
			// Array mit vollen Pfad angaben erzeugen
			result.push(path + array[i]);
		}
		
		return result;
	}
	/**
	 * Liefert AngularJS Dateien inkl. Pfad zurück
	 * @returns {angular_options.forEachPath.result|Array}
	 */
	,getAngularJsJSFiles: function(){
		var files = [
			"angular.min.js"
			,"angular-touch.min.js"];

		return this.forEachPath(this.getAngularJsPath(), files);
	}
	/**
	 * Liefert AngularJS Mobile Fonts inkl. Pfad zurück
	 * @returns {angular_options.forEachPath.result|Array}
	 */
	,getAngularJsMobileFontFiles: function(){
		var files = [
			"fontawesome-webfont.woff"
			,"fontawesome-webfont.tff"];

		return this.forEachPath(this.getAngularJsMobilePath() + "fonts/", files);
	}
	/**
	 * Liefert AngularJS Mobile JS Dateien inkl. Pfad zurück
	 * @returns {angular_options.forEachPath.result|Array}
	 */
	,getAngularJsMobileJSFiles: function(){
		var files = [
			"mobile-angular-ui.core.min.js"
			,"mobile-angular-ui.min.js"
			,"mobile-angular-ui.gestures.min.js"
			,"mobile-angular-ui.migrate.min.js"];

		return this.forEachPath(this.getAngularJsMobilePath() + "js/", files);
	}
	
	/**
	 * Liefert AngularJS Mobile CSS Dateien inkl. Pfad zurück
	 * @returns {angular_options.forEachPath.result|Array}
	 */
	,getAngularJsMobileCSSFiles: function(){
		var files = [
			"mobile-angular-ui-base.min.css"
			,"mobile-angular-ui-desktop.min.css"
			,"mobile-angular-ui-hover.min.css"
			,"mobile-angular-ui-migrate.min.css"
		];
		
		return this.forEachPath(this.getAngularJsMobilePath() + "css/", files);
	}
	
};

// nötig damit es auch im Content Script verwendet werden kann!!!
if (typeof angular_options !== "undefined") {
	exports.angular_options = angular_options;
}