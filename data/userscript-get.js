// frage ob das Skript heruntergeladen werden soll
if (window.confirm("Soll dieses UserScript von USI geladen und aktiviert werden?")) {
	// sende die aktuelle URL an das ADD-ON
	self.port.emit("new-usi-script_url---call", {script_url: window.location.href});
}

// Falls ein identisches Userscript gefunden wurde!
self.port.on("same-userscript-was-found", function (userscript_infos) {

	if (window.confirm("Ein Userscript mit den gleichen Einstellungen (usi-id: '" + userscript_infos.id + "') \n\
wurde gefunden, möchtest du es aktualisieren?")) {
		// Dieses Skript wird nun aktualisiert! userscript_infos = {id : id , userscript: userscript}
		self.port.emit("override-same-userscript", userscript_infos);
	}
});