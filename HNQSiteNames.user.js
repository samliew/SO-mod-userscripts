// ==UserScript==
// @name         HNQ Site Names
// @description  Adds site names to HNQ sidebar
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      1.0
//
// @match        https://*.stackoverflow.com/*
// @match        https://*.serverfault.com/*
// @match        https://*.superuser.com/*
// @match        https://*.askubuntu.com/*
// @match        https://*.mathoverflow.net/*
// @match        https://*.stackapps.com/*
// @match        https://*.stackexchange.com/*
//
// @exclude      https://stackoverflowteams.com/*
// @exclude      https://api.stackexchange.com/*
// @exclude      https://data.stackexchange.com/*
// @exclude      https://contests.stackoverflow.com/*
// @exclude      https://winterbash*.stackexchange.com/*
// @exclude      *chat.*
// @exclude      *blog.*
// @exclude      */tour
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/se-ajax-common.js
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

/// <reference types="./globals" />
'use strict';

addStylesheet(`
#hot-network-questions li {
  margin-bottom: 1rem;
}
#hot-network-questions .favicon {
  position: relative;
  pointer-events: none;
}
#hot-network-questions .favicon + a {
  margin-top: 1.1rem;
}
#hot-network-questions .favicon:after {
  content: attr(title);
  display: block;
  position: absolute;
  left: calc(100% + 6px);
  top: 0;
  font-size: 0.8rem;
  line-height: 1;
  color: var(--black-400);
  white-space: nowrap;
}
`);

// Links open in a new tab/window
document.querySelectorAll('#hot-network-questions a').forEach(v => v.target = "_blank");