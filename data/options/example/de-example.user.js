// ==UserScript==
// @name            {Userscript Name}
// @namespace       {zum Beispiel deine Webseite}
// @author          {Dein Name}
// @description     {Userscript Beschreibung}
// @include         *
//		https://developer.mozilla.org/en-US/Add-ons/SDK/Low-Level_APIs/util_match-pattern
//
// @clean-include       (true || false)
// Wenn es > true < ist, bleiben deine @includes von USI unangetastet
// 
// @info                {weitere Informationen ...}
// @updateURL           {wenn die Versionsnummer verschieden ist,kann USI dein Userscript aktualisieren}
// @run-at              (document-end || document-start || document-ready)
// @include-jquery      (true || false)
// @use-greasemonkey    (true || false)
// @version             1.0.0
// ==/UserScript==

document.addEventListener("click", function(){
	alert("Du hast soeben geklickt!");
});