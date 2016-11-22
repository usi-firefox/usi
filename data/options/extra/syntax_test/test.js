function appendScript(userscript) {
    var newscript, newscript_textnode, userscript_lines;
    
    // Script Darstellung --- START
    newscript = document.createElement("div");
    
    userscript_lines = userscript.split(/\n/g);
    for (var i in userscript_lines) {
        // Zeilennummer hinzufügen und Inhalt hinzufügen
        newscript.appendChild(document.createTextNode(i + ": " + userscript_lines[i]));
        // Zeilenumbruch hinzufügen
        newscript.appendChild(document.createElement("br"));
    }
    
    document.body.appendChild(newscript);
    // Script Darstellung --- END


    // Skript ausführen, für den Syntax Check
    newscript = document.createElement("script");
    newscript_textnode = document.createTextNode(userscript);
    
    newscript.appendChild(newscript_textnode);

    document.body.appendChild(newscript);
}