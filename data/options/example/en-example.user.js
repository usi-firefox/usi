// ==UserScript==
// @name           {Userscript name}
// @namespace      {e.g. your website}
// @author         {your name}
// @description    {Userscript description}
// @include        *			
//		https://developer.mozilla.org/en-US/Add-ons/SDK/High-Level_APIs/page-mod#Parameters
//		
// @clean-include   (true || false) if it's > true < , USI will not change any of your @includes
// @info				{more informations ...}
// @updateURL			{USI can update your Userscript, if the version number has changed}
// @run-at				(document-end || document-start || document-ready)
// @include-jquery		(true || false)
// @use-greasemonkey	(true || false)
// @version        1.0.0
// ==/UserScript==

// WARNING: If you save this Userscript, it will be immediately active

document.addEventListener("click", function(){
	alert("You have clicked!");
});