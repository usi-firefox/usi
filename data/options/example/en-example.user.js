// ==UserScript==
// @name           {Userscript name}
// @namespace      {e.g. your website}
// @author         {your name}
// @description    {Userscript description}
// @include        *
//		https://developer.mozilla.org/en-US/Add-ons/SDK/Low-Level_APIs/util_match-pattern
//		
// @info                {more informations ...}
// @updateURL           {USI can update your Userscript, if the version number has changed}
// @run-at              (document-end || document-start || document-ready)
// @include-jquery      (true || false)
// @use-greasemonkey    (true || false)
// @version             1.0.0
// ==/UserScript==

document.addEventListener("click", function(){
	alert("You have clicked!");
});