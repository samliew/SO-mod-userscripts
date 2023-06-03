// ==UserScript==
// @name         No User Id in Share Links
// @description  Remove your referral user id when copying a post share link
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      2.0.11
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
// @exclude      */tour
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/se-ajax-common.js
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

/* globals StackExchange */
/// <reference types="./globals" />

'use strict';

function stripUserIds() {
  // Strip user ids from the link itself
  const sharelinks = $('.js-share-link').not('.js-no-userid').addClass('js-no-userid').attr('href', (i, v) => v.replace(/(\/\d+)\/\d+/, '$1'));

  // Strip user ids from the popups
  sharelinks.next().find('input').val((i, v) => v.replace(/(\/\d+)\/\d+/, '$1'));
}


// Append styles
addStylesheet(`
.js-share-link + .s-popover .js-subtitle {
  display: none;
}
`); // end stylesheet


// On script run
(function init() {
  stripUserIds();

  // When new stuff is loaded
  $(document).ajaxComplete(function (event, xhr, settings) {
    stripUserIds();
  });
})();