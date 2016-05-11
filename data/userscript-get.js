/* global self */

/************************************************************************
 ************************* Übersetzungen holen **************************
 ************************************************************************/
var lang = self.options.language;

/************************************************************************
 ****************************** MAIN ************************************
 ************************************************************************/
self.port.on("USI-BACKEND:active", function (status) {

	// wird über die Konfigurationsvariable gesetzt
	if (status === true) {

		// frage ob das Skript heruntergeladen werden soll
		if (window.confirm(lang.should_usi_import_this_userscript)) {
			// sende die aktuelle URL an das ADD-ON
			self.port.emit("USI-BACKEND:new-usi-script_url---call",
				{script_url: window.location.href,
					moreinformations: {getFromUrl: true, url: window.location.href}
				}
			);
		}

		// Falls ein identisches Userscript gefunden wurde!
		self.port.on("USI-BACKEND:same-userscript-was-found", function (userscript_infos) {
			if (window.confirm(lang.same_userscript_was_found_ask_update_it_1 + userscript_infos.id + lang.same_userscript_was_found_ask_update_it_2)) {
				// Dieses Skript wird nun aktualisiert! userscript_infos = {id : id , userscript: userscript}
				self.port.emit("USI-BACKEND:override-same-userscript", userscript_infos);
			}
		});

	}
});