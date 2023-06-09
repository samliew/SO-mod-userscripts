// ==UserScript==
// @name         Comment User Colours
// @description  Unique colour for each user in comments to make following users in long comment threads easier
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      3.1.12
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

function getUserColor(uid, username) {
  if (typeof uid === 'string') uid = Number(uid) || 0;
  const colorCode = (uid * 99999999 % 16777216).toString(16) + '000000'; // 16777216 = 16^6
  return colorCode.slice(0, 6);
}
function setUserColor(i, el) {
  el.style.setProperty("--usercolor", '#' + getUserColor(this.dataset.uid, this.innerText));
  el.classList.add("js-usercolor");
}

function updateUsers() {

  // Pre-parse user ids
  $('.comment-user').not('[data-uid]').each(function () {
    // No href if deleted user, fallback to innerText
    const commentUserId = getUserId(this.href) || this.innerText.match(/\d+/, '')?.pop();
    this.dataset.uid = commentUserId ?? 'undefined';
  });

  // If more than one comment per comment section, set user color
  $('.comments').each(function (i, section) {
    $('.comment-copy + div .comment-user', section).not('.js-usercolor').filter(function () {
      return $(`.comment-user[data-uid=${this.dataset.uid}]`, section).length > 1;
    }).each(setUserColor);
  });
}


// Append styles
addStylesheet(`
.js-usercolor {
  position: relative;
  --usercolor: transparent;
}
.js-usercolor:after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  border-bottom: 3px solid var(--usercolor) !important;
  pointer-events: none;
}
`); // end stylesheet


// On script run
(function init() {
  updateUsers();
  $(document).ajaxStop(updateUsers);
})();