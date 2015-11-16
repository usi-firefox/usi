"use strict"; // Strict Mode aktivieren!
/************************************************************************
 ************************ Kompatibilitäts Funktionen ********************
 ************************************************************************/

/* global exports */


var config = {
	/**
	 *	Buildsystem -  JPM oder CFX, dadurch ist beispielsweise der Zugriff auf die Ressourcen verschieden
	 *
	 *	buildsystem_jpm = true;		// wenn true	=> JPM
	 *	buildsystem_jpm = false;	// wenn false	=> CFX
	 *		
	 */
	buildsystem_jpm : true
};

// nötig damit es auch im Content Script verwendet werden kann!!!
if (typeof config !== "undefined") {
	exports.config = config;
}