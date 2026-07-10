// ==UserScript==
// @name ATB Main
// @namespace https://www.bondageprojects.com/
// @version 0.0.1
// @description Azer Toy Box
// @author Azer147
// @match https://bondageprojects.elementfx.com/*
// @match https://www.bondageprojects.elementfx.com/*
// @match https://bondage-europe.com/*
// @match https://www.bondage-europe.com/*
// @match https://bc.bctoolbox.net/*
// @match https://www.bondageprojects.com/*
// @run-at document-end
// @grant none
// ==/UserScript==

(function() {
    'use strict';
    var script = document.createElement("script");
    script.langauge = "JavaScript";
    script.setAttribute("crossorigin", "anonymous");
    script.src = `https://azer147.github.io/ATB/bundle.js`;
    document.head.appendChild(script);
})();
