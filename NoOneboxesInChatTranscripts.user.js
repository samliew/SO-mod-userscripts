// ==UserScript==
// @name         No Oneboxes in Chat Transcripts
// @description  Collapses oneboxes from chat transcripts, click to display onebox
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      3.0
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
// ==/UserScript==

/* globals StackExchange, _window */
/// <reference types="./globals" />

'use strict';

/* Call hideOneboxes() from other scripts to hide all new oneboxes on any page update
 * Params:
 *     mid : message ID to re-hide its expanded onebox, OR
 *           -1 to re-hide all expanded oneboxes
 */
const hideOneboxes = (mid = null) => {

  // Display original link and hide oneboxes who hasn't been hidden before
  $('.onebox').not('.js-onebox-hidden').addClass('js-onebox-hidden').hide().each(function () {

    // Onebox permalink is usually the first URL in the onebox
    let url = $(this).find('a').first().attr('href');

    // If onebox type is a tweet, permalink is the last link in onebox
    if ($(this).hasClass('ob-tweet'))
      url = $(this).find('a').last().attr('href');

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

// Promote function to global scope for other scripts to call
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
  hideOneboxes();
})();