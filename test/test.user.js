// ==UserScript==
// @name           {Userscript Name}
// @namespace      {deine Webseite?!}
// @author         {Dein Name}
// @description    {Userscript Beschreibung}
// @include        *
//		Wenn dein Userscript auf allen Seiten ausgeführt werden soll: *
//		Bei einem Include, kannst du auch mehrere * als Wildcard nutzen
//		um es als regulären Ausdruck zu verwenden,
//		allerdings muss dann der gesamte Ausdruck passen!
//		zum Beispiel: *.beliebige-webseite.de* 
//		Ansonsten muss es so aussehen: www.beliebige-webseite.de
// @info           {weitere Informationen ...}
// @grant          {erbitte Zugriff auf extra Funktionen}
// @updateURL      {wenn die Versionsnummer verschieden ist, 
//		USI dein Userscript aktualisieren}
// @run-at         (document-end || document-start || document-ready)
// @include-jquery (true || false)
// @use-greasemonkey (true || false)
// @version        1.0.0
// ==/UserScript==

// ACHTUNG: bitte beachte, dass ein neues Userscript sofort eingefügt wird.
// Dies ist nur ein Beispiel damit du siehst, dass USI funktioniert

document.addEventListener("click", function(){
	alert("Du hast soeben geklickt!");
});