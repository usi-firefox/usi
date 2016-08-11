"use strict";

// Switchery
function switchery_class(){
	return{
		run : function(){
			if (jQuery(".js-switch")[0]) {
				var elems = Array.prototype.slice.call(document.querySelectorAll('.js-switch'));
				elems.forEach(function (html) {
					new Switchery(html, {
						color: '#26B99A'
					});
				});
			}
		}
	};
};
// /Switchery

var switchery_controller = switchery_class();