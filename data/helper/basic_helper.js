"use strict"; // Strict Mode aktivieren!
/************************************************************************
 ************************* Basic Funktionen! *************************
 ************************************************************************/

/* global exports, NaN */

var basic_helper = {
	isset: function (v) {
		if (typeof v !== "undefined" && v !== "undefined") {
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
	is_obj: function (v) {
		if (typeof v === "object") {
			return true;
		} else {
			return false;
		}
	},
	is_func: function (v) {
		if (typeof v === "function") {
			return true;
		} else {
			return false;
		}
	},
	is_number: function (v) {
		if (typeof v === "number" && v !== NaN) {
			return true;
		} else {
			return false;
		}
	},
	is_null: function (v) {
		if (typeof v === "object" && v === null) {
			return true;
		} else {
			return false;
		}
	},
	empty: function (v) {
		if (typeof v === "undefined" || v === "" || v === 0 || v === false || v === null) {
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
	getFilenameFromURL: function (url) {
		
		if(this.is_string(url) && !this.empty(url)){
			// http://example.com/img/image.png => image.png
			var url_suffix = url.split("/").pop();
			
			if(!this.empty(url_suffix)){
				return url_suffix;
			}
		}
		
		return false;
	},
	arrayWrap: function (arr, wrapper_front, wrapper_back){
		var result_arr = [];
		arr = arr || []; // default Value => []
		wrapper_front = wrapper_front || ""; // wenn nichts übergeben wurde, ist es leer ... 
		wrapper_back = wrapper_back || wrapper_front; // wenn der "wrapper_back" nicht gesetzt wurde ist es der gleiche wie "wrapper_front"
		for (var i in arr){
			result_arr.push(wrapper_front + arr[i] + wrapper_back);
		}
		return result_arr.join("");
	}
};

// nötig damit es auch im Content Script verwendet werden kann!!!
if(typeof exports !== "undefined"){
	exports.basic_helper = basic_helper;
}