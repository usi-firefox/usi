function appendScript(userscript) {
    // Script Darstellung --- START
    newscript = document.createElement("div");
    
    var userscript_lines = userscript.split(/\n/g);
    for (var i in userscript_lines){
        // Zeilennummer hinzufügen
        userscript_lines[i] = i + ": " + userscript_lines[i];
    }
   
    newscript.innerHTML = userscript_lines.join("<br />");
    document.body.appendChild(newscript);
    // Script Darstellung --- END
    
    
    // Skript ausführen, für den Syntax Check
    newscript = document.createElement("script");
    newscript.innerHTML = userscript;
    document.body.appendChild(newscript);
}