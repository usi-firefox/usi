"use strict"; // Strict Mode aktivieren!
/************************************************************************
 ************************* Basic Funktionen! *************************
 ************************************************************************/

/* global exports */

var basic_helper = {
	isset: function (v) {
		if (typeof v !== "undefined") {
			return true;
		} else {
			return false;
		}
	},
	is_string: function (v) {
		if (typeof v === "string") {
			return true;
		} else {
			return false;
		}
	},
	empty: function (v) {
		if (typeof v === "undefined" || v === "" || v === 0 || v === false) {
			return true;
		} else {
			return false;
		}
	},
	is_user_script_ending: function (url) {
		if (/\.user\.\js$/g.test(url)) {
			return true;
		} else {
			return false;
		}
	},
	escapeHTMLEntities: function (str) {
		return str.replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
			return '&#' + i.charCodeAt(0) + ';';
		});
	},
	escapeRegExp: function (str) {
		return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	},
	arrayWrap: function (arr, wrapper_front, wrapper_back){
		var result_arr = [];
		var arr = arr || []; // default Value => []
		var wrapper_front = wrapper_front || ""; // wenn nichts übergeben wurde, ist es leer ... 
		var wrapper_back = wrapper_back || wrapper_front; // wenn der "wrapper_back" nicht gesetzt wurde ist es der gleiche wie "wrapper_front"
		for (var i in arr){
			result_arr.push(wrapper_front + arr[i] + wrapper_back);
		}
		return result_arr.join("");
	}
};

// nötig damit es auch im Content Script verwendet werden kann!!!
if(typeof exports != "undefined"){
	exports.basic_helper = basic_helper;
}