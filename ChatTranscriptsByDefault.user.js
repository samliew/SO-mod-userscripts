// ==UserScript==
// @name         Chat Transcripts By Default
// @description  In Q&A posts and comments, rewrites chat room links to chat transcript to avoid accidentally joining the room
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      3.1
//
// @match        https://*.stackoverflow.com/questions/*
// @match        https://*.serverfault.com/questions/*
// @match        https://*.superuser.com/questions/*
// @match        https://*.askubuntu.com/questions/*
// @match        https://*.mathoverflow.net/questions/*
// @match        https://*.stackapps.com/questions/*
// @match        https://*.stackexchange.com/questions/*
// @match        https://stackoverflowteams.com/c/*/questions/*
//
// @match        https://*.stackoverflow.com/admin/dashboard*
// @match        https://*.serverfault.com/admin/dashboard*
// @match        https://*.superuser.com/admin/dashboard*
// @match        https://*.askubuntu.com/admin/dashboard*
// @match        https://*.mathoverflow.net/admin/dashboard*
// @match        https://*.stackapps.com/admin/dashboard*
// @match        https://*.stackexchange.com/admin/dashboard*
// @match        https://stackoverflowteams.com/c/*/admin/dashboard*
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

function convertChatLinksToTranscript() {

  // For each link in comments, where url matches chat + rooms
  $('.comment-copy a, .js-post-body a')
    .not('.js-chat-transcript')
    .filter((_, el) => el.href.includes('chat.') >= 0 && (el.href.includes('/rooms/') || el.href.includes('/transcript/')) && !el.href.includes('/info'))
    .addClass('js-chat-transcript')
    .attr('href', (i, v) => v.replace('/rooms/', '/transcript/'))
    .attr({
      target: '_blank',
      title: 'Open chat transcript in a new window'
    })
    .html((_, v) => v + ' <em>(chat transcript)</em>');
}

function listenToPageUpdates() {

  // On any page update
  $(document).ajaxComplete(function (event, xhr, settings) {

    // If comments have updated
    if (settings.url.indexOf('/comments') >= 0) convertChatLinksToTranscript();
  });
}


// Append styles
addStylesheet(`
a[href*="/transcript/"] em {
  font-size: 0.85em;
}
`); // end stylesheet


// On script run
(function init() {
  listenToPageUpdates();
  setTimeout(convertChatLinksToTranscript, 100);
})();