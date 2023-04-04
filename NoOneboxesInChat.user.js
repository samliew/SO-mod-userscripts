// ==UserScript==
// @name         No Oneboxes in Chat
// @description  Collapses oneboxes from chat rooms/transcripts/bookmarks, click to display onebox
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      3.0
//
// @match        https://chat.stackoverflow.com/rooms/*
// @match        https://chat.stackexchange.com/rooms/*
// @match        https://chat.meta.stackexchange.com/rooms/*
//
// @match        https://chat.stackoverflow.com/transcript/*
// @match        https://chat.stackexchange.com/transcript/*
// @match        https://chat.meta.stackexchange.com/transcript/*
//
// @match        https://chat.stackoverflow.com/rooms/*/conversation/*
// @match        https://chat.stackexchange.com/rooms/*/conversation/*
// @match        https://chat.meta.stackexchange.com/rooms/*/conversation/*
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/se-ajax-common.js
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
//
// @grant        unsafeWindow
// ==/UserScript==

/* globals StackExchange, _window */
/// <reference types="./globals" />

'use strict';

/**
 * @summary Hide all oneboxes on any page update
 * @param {number} mid - message ID to re-hide its expanded onebox, OR -1 to re-hide all expanded oneboxes
 * @example hideOneboxes(12345678); // re-hide onebox for message ID 12345678
 */
const hideOneboxes = function (mid = null) {

  // Display original link and hide oneboxes who hasn't been hidden before
  $('.onebox').not('.js-onebox-hidden').addClass('js-onebox-hidden').hide().each(function () {

    // Onebox permalink is usually the first URL in the onebox
    let url = $(this).find('a[href]').first().attr('href');

    // If onebox type is a tweet, permalink is the last link in onebox
    if ($(this).hasClass('ob-tweet')) url = $(this).find('a').last().attr('href');

    // If onebox type is an image, preload
    if ($(this).hasClass('ob-image')) $(this).find('img').attr('src', url);

    const loadOneboxText = 'click to load onebox';
    const hideOneboxText = 'click to hide onebox';
    let isVisible = false;
    // Click placeholder to show onebox
    $(`<span class="has-onebox" title="${loadOneboxText}"><a href="${url}" class="print-onebox">${url}</a><span>${url}</span></span>`)
      .on('click', function () {
        isVisible = !isVisible;
        if (isVisible) {
          $(this).addClass('js-show-onebox');
          $(this).attr('title', hideOneboxText);
        } else {
          $(this).removeClass('js-show-onebox');
          $(this).attr('title', loadOneboxText);
        }
      }).insertBefore(this);

    // Also collapse user signature (use tiny-signature)
    $(this).parents('.monologue').find('.tiny-signature').fadeIn(200).siblings().hide();
  });

  // Re-hide oneboxes if mid is set
  if (mid === -1) {
    // Re-hide all expanded oneboxes
    $('.js-show-onebox').removeClass('js-show-onebox');
  }
  else if (mid) {
    // Re-hide specific message's onebox
    $(`#message-${mid}`).find('.js-show-onebox').removeClass('js-show-onebox');
  }
};
// Function promotion: Call window.hideOneboxes() from other scripts to hide all new oneboxes
_window.hideOneboxes = hideOneboxes;


// Append styles
addStylesheet(`
.has-onebox {
  padding-left: 10px;
  border-left: 3px solid orange;
  cursor: zoom-in;
}
.js-show-onebox {
  cursor: zoom-out;
}
.js-show-onebox + .js-onebox-hidden {
  display: block !important;
}
.has-onebox .print-onebox {
  display: none;
  word-break: break-all;
}

@media print {
  .print-onebox {
    display: inline !important;
  }
  .print-onebox + span {
    display: none !important;
  }
}
`); // end stylesheet


// On script run
(function init() {

  // Once on page load
  hideOneboxes();

  // Occasionally, look for new oneboxes and hide them
  setInterval(hideOneboxes, 1000);

  // When page is not focused
  $(window).on('blur', function () {
    // Re-hide all expanded oneboxes
    hideOneboxes(-1);
  });
})();