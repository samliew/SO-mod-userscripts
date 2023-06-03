// ==UserScript==
// @name         Expand Short Links
// @description  Appends more characters to short link texts in posts and comments so they can be easily seen and clicked on
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      3.0.11
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
// ==/UserScript==

/* globals StackExchange */
/// <reference types="./globals" />

'use strict';

function expandShortLinks() {
  $('.js-post-body, .comment-copy').find('a').not('.post-tag').not('.shortlink').filter((i, el) => el.innerText.length > 0 && el.innerText.length <= 2 && el.children.length == 0).addClass('shortlink');
}


// Append styles
addStylesheet(`
a.shortlink {
  font-weight: bold;
  color: var(--red-500) !important;
}
a.shortlink:after {
  content: '_link';
  color :var(--green-400);
  font-style: italic;
  font-weight: normal;
}
`); // end stylesheet


// On script run
(function init() {
  expandShortLinks();
  $(document).ajaxComplete(expandShortLinks);
})();