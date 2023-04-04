// ==UserScript==
// @name         Hide Reputation
// @description  Hide all user reputation on the site
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      3.0
//
// @match        https://*.stackoverflow.com/*
// @match        https://*.serverfault.com/*
// @match        https://*.superuser.com/*
// @match        https://*.askubuntu.com/*
// @match        https://*.mathoverflow.net/*
// @match        https://*.stackapps.com/*
// @match        https://*.stackexchange.com/*
// @match        https://stackoverflowteams.com/*
//
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
//
// @run-at       document-end
// ==/UserScript==

/* globals StackExchange */
/// <reference types="./globals" />

'use strict';

function removeRepTooltips() {
  // Remove anything with rep in title tooltips
  $('[title]').attr('title', function (i, v) {
    return v.includes('rep') ? '' : v;
  });
}


// Append styles
addStylesheet(`
.user-info .-flair {
  display: none !important;
}
`); // end stylesheet


// On script run
(function init() {
  removeRepTooltips();

  // On any page update
  $(document).ajaxStop(function (event, xhr, settings) {
    removeRepTooltips();
  });
})();