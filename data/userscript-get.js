/* global self */

/************************************************************************
 ************************* Übersetzungen holen **************************
 ************************************************************************/
var lang = {};
self.port.on("language",function(translated_object){
	lang = translated_object;
});

/************************************************************************
 ****************************** MAIN ************************************
 ************************************************************************/

// frage ob das Skript heruntergeladen werden soll
if (window.confirm(lang.should_usi_import_this_userscript)) {
//if (window.confirm("Soll dieses UserScript von USI geladen und aktiviert werden?")) {
	// sende die aktuelle URL an das ADD-ON
	self.port.emit("new-usi-script_url---call", {script_url: window.location.href});
}

// Falls ein identisches Userscript gefunden wurde!
self.port.on("same-userscript-was-found", function (userscript_infos) {

//	if (window.confirm("Ein Userscript mit den gleichen Einstellungen (usi-id: '" + userscript_infos.id + "') \n\
//wurde gefunden, möchtest du es aktualisieren?")) {
	if (window.confirm(lang.same_userscript_was_found_ask_update_it_1 + userscript_infos.id + lang.same_userscript_was_found_ask_update_it_2)) {
		// Dieses Skript wird nun aktualisiert! userscript_infos = {id : id , userscript: userscript}
		self.port.emit("override-same-userscript", userscript_infos);
	}
});