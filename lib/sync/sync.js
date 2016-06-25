"use strict";

var hash = require("../hash/hash").hash,
		basic_helper = require("../core/basic_helper").basic_helper;

var sync = {
	
	/**
	 * erstellt für alle Userscripte die dazugehörigen Hash Werte
	 * als auch für die gespeicherten Variablen um einen Unterschied auf dem Server feststellen zu können
	 * 
	 * @returns array
	 */
	generateHashesForSync: function () {
		return this.collectUserscriptsAndValStore(true);
	},
	
	getAllDataForSync: function () {
		return this.collectUserscriptsAndValStore(false);
	},
	
	collectUserscriptsAndValStore : function (only_hash_content){
	
		// Storage laden
		var addon_storage = require("sdk/simple-storage");

		var result = {
			userscripts: [],
			val_store: []
		};

		var userscript_TMP, userscript_hash,
			valstore_hash, valstore_TMP;

		for (var i in addon_storage.storage) {

			if (!basic_helper.empty(addon_storage.storage[i].userscript)) {
				// den Inhalt des Userscripts übernehmen
				userscript_TMP	=	addon_storage.storage[i].userscript;
				// SHA Hash für das Userscript berechnen
				userscript_hash	=	hash.encode(userscript_TMP);
				
				if(only_hash_content === true){
					result.userscripts.push(userscript_hash);
				}else{
					result.userscripts.push({
						data: userscript_TMP
						, hash: userscript_hash
					});
				}

				if (!basic_helper.empty(addon_storage.storage[i].val_store)) {
					
					valstore_TMP = addon_storage.storage[i].val_store;
					 
					// Hash Wert vom Userscript und der dazugehörige GM Value Speicher
					valstore_hash = hash.encode(basic_helper.convertToText(valstore_TMP));
					 
					if(only_hash_content === true){
						result.val_store.push({
							userscript_hash: userscript_hash
							, hash: valstore_hash
						});
					}else{
						result.val_store.push({
							userscript_hash: userscript_hash
							, data: valstore_TMP
							, hash: valstore_hash
						});
					}
					
				}

			}

		}

		return result;
		
	},
	
	searchForExternalChanges : function (){
		
		
	}

};

// nötig damit es auch im Content Script verwendet werden kann!!!
if (typeof exports !== "undefined") {
	exports.sync = sync;
}