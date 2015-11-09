"use strict"; // Strict Mode aktivieren!

/* global self */


window.localStorage.clear();

	function GM_getValue(name, default_value) {
		// holt aus dem Localstorage, den Speicher für das USI Skript
		var script_localstorage = window.localStorage.getItem("usi+" + self.options.id);
		
		if(script_localstorage !== ""){
			script_localstorage = JSON.parse(script_localstorage);
		}
		
	console.log("GET script_localstorage");
	console.log(script_localstorage);
	console.log("GET script_localstorage[name]");
	console.log(script_localstorage[name]);
		
		// Prüft ob im Localstorage etwas zu finden ist...
		if (typeof script_localstorage !== "" && typeof script_localstorage[name] !== "undefined"){
			// Daten aus dem Localstorage beziehen...
			return script_localstorage[name];
		} else if (typeof self.options.storage !== "undefined" && typeof self.options.storage[name] !== "undefined") {
			// Daten aus den übergebenen ScriptOptions
				return self.options.storage[name];
		}  else {
			return default_value;
		}
	}

	function GM_setValue(name, value) {
		// holt aus dem Localstorage, den Speicher für das USI Skript
		var script_localstorage = window.localStorage.getItem("usi+" + self.options.id);
	console.log("typeof script_localstorage");
	console.log(typeof script_localstorage);
	console.log("script_localstorage");
	console.log(script_localstorage);
		 
		if(script_localstorage !== "" && script_localstorage !== null){
			// in ein JSON umwandeln
			script_localstorage = JSON.parse(script_localstorage);
		} else{
			// initial erzeugen!
			script_localstorage = {};
		}
		 
	console.log('script_localstorage nach JSON');
	console.log(script_localstorage);
		 
		// Variable setzen
		script_localstorage[name] = value;
	
		console.log("---SET script_localstorage");
		console.log(script_localstorage);
		console.log("---SET script_localstorage.name");
		console.log(script_localstorage[name]);
		
		// Variable schreiben
		window.localStorage.setItem("usi+" + self.options.id, JSON.stringify(script_localstorage));
		
		// Im Extension Speichern sichern!
		self.port.emit("GM_setValue", {name: name, value: value});
	}

	function GM_deleteValue(name) {
		// Variable löschen
		//self.port.emit("GM_deleteValue", {name: name});
	}

	function GM_listValues() {
		// Alle Variablen namen zurück liefern
		//self.port.emit("GM_listValues");
	}
