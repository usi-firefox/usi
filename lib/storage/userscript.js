
// Holt die Userscripte aus dem Speicher (simple-storage)
var userscript_storage = (function () {
    var storage = require("sdk/simple-storage").storage,
    private_functions = {
        // simple
        getAll : function(){
            var result = [],i;
            for (i in storage){
                result.push(storage[i]);
            }
            return result;
        }
        ,getById: function(id){
            // ACHTUNG ID wird als Integer verarbeitet
            id = parseInt(id);
            
            // holt alle Userscripte, und mittels find() wird jedes Element übergeben, falls die ele.id mit der ID übereinstimmt gib diese zurück
            var found_userscript = private_functions.getAll().find(function(ele){
                    var element_id = parseInt(ele.id);
                    if(element_id === id){ 
                        return true;
                    }else{
                        return false;
                    }
            });
            
            // wenn ein Userscript gefunden wurde, initialisiere es
            if(typeof found_userscript === "object"){
                return userscript_handle.initWithData(found_userscript);
            }else{
                return false;
            }
        }
        ,save: function(id, userscript_data){
            // speichert alle Daten vom Userscript
            storage[id] = userscript_data;
            
            return true;
        }
        ,createNew : function(){
            var new_id, userscript_found;
            // probiere es 3 Mal eine neue ID zu erzeugen
            for(var i = 0; i < 3; i++){
                new_id = new Date().getTime();
                // prüfe ob die ID, nicht doch schon existiert
                userscript_found = private_functions.getById(new_id);
                if(userscript_found === false){
                    // kein Userscript mit dieser ID gefunden, gibt ein neues Handle zurück
                    return userscript_handle.initWithData(
                        // übergib ein neues Userscript
                        userscript_handle.getSkeleton(new_id)
                    );
                }
            }
            // das sollte eigentlich nicht passieren!
            return false;
        }
    };

    // @todo!
    return private_functions;

}());

// stellt Funktionen für die Verarbeitung des Userscripts zur Verfügung
var userscript_handle = (function () {
    
    return {
        getSkeleton : function(id){
            // für ein neu angelegtes Userscript
            return {
                id: id,
                userscript: null,
                settings: null,
                deactivated: false,
                moreinformations: null
            };
        }
        // initialisiert ein neues Objekt vom Typ userscript_handle
        ,initWithData : function(userscript_initial_data){
            if(typeof userscript_initial_data === "object"){
                // speichert die Daten des Userscripts
                var userscript_data = userscript_initial_data;
                
                // wichtig für Chaining
                var self = {
                    getData: function(){
                        return userscript_data;
                    }
                    ,getId : function(){
                        return userscript_data.id;
                    }
                    ,save : function(){
                        // speichert das Userscript
                        userscript_storage.save(userscript_data.id, userscript_data);
                        
                        return self;
                    }
                    ,changeValues : function(key, values){
                        // Ändert einzelne Werte, danach ist es erforderlich es zu speichern
                        if(typeof userscript_data[key] !== "undefined"){
                            userscript_data[key] = values;
                        }
                        return self;
                    }
                    // fügt eine Resource hinzu --- @resource resourceName http://www.example.com/example.png
                    ,addResource : function(url, content, name, mime_type){
                        if(typeof userscript_data.settings.resources_data === "undefined"){
                            // init
                            userscript_data.settings.resources_data = [];
                        }
                        // füge die Resource hinzu
                        userscript_data.settings.resources_data.push({name: name, data: content, mime_type: mime_type, origUrl: url});
                        
                        // danach speichern
                        return self.save();
                    }
                    // setzt das Icon vom Userscript --- @icon http://www.example.org/icon.png
                    ,addIcon : function(url, content){
                        
                        userscript_data.settings.icon_url   =   url;
                        userscript_data.settings.icon_data  =   content;
                        
                        // danach speichern
                        return self.save();
                    }
                    // fügt ein Skript hinzu welches für die Ausführung benötigt wird --- @require http://www.example.com/example.js
                    ,addRequireScript : function(url, content){
                        if(typeof userscript_data.require_scripts === "undefined"){
                            // init
                            userscript_data.require_scripts = [];
                        }
                        // fügt das benötigte Skript hinzu
                        userscript_data.require_scripts.push({url: url, text: content});
                        
                        // danach speichern
                        return self.save();
                    }
                    
                    ,loadAndAddExternals : function(type, url, name, charset){
                        var load_resource = require("../load/load_resource").load_resource;
                        // Lade die Resource
                        load_resource.load_image_or_text(url, function(response_data, response_contenttype){
                            
                            if(type === "icon"){
                                // Icon hinzufügen
                                self.addIcon(url, response_data);
                            }else if(type === "resource"){
                                // für zusätzliche Resource Dateien (Bilder oder Texte, oder oder oder ...)
                                self.addResource(url, response_data, name, response_contenttype);
                            }else if(type === "require"){
                                // gilt für JS Dateien die benötigt und vor dem Userscript geladen werden müssen
                                self.addRequireScript(url, response_data);
                            }
                            
                        }, charset);
                        
                        return self;
                    }
                };
                
                return self;
            }else{
                // im Fehlerfall
                return false;
            }
        }
    };

}());

if (typeof exports !== "undefined") {
	exports.userscript_storage = userscript_storage;
}