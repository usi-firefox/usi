/* global self */

/**
 * Worker Implementation für HighlightJS
 * @param {type} event
 * @returns {undefined}
 */
var onmessage = function(event) {
  importScripts("/data/libs/highlight/highlight.pack.js");
  var result = self.hljs.highlightAuto(event.data);
  postMessage(result.value);
};