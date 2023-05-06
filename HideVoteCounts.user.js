// ==UserScript==
// @name         Hide Vote Counts
// @description  Hides post score until voted
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
// @exclude      */admin/*
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

// If user rep is too low or guests (0 rep), do nothing
if (StackExchange.options?.user?.rep < 125) return;

function listenToPageUpdates() {

  // On any page update
  $(document).ajaxComplete(function (event, xhr, settings) {

    // Ignore unsuccessful ajax responses
    if (xhr.status != 200 && xhr.status != 204) return;

    // On vote
    if (/\/posts\/\d+\/vote\/\d/.test(settings.url)) {
      const pid = Number(settings.url.match(/\/(\d+)\//)[1]);
      const votetype = Number(settings.url.match(/\d+$/)[0]);

      // Show if voted, hide if unvoted successfully
      if (xhr.responseJSON.Success) $(`.js-voting-container[data-post-id="${pid}"]`).toggleClass('js-score-hidden', votetype === 0);
    }
  });
}


// Append styles
addStylesheet(`
.js-voting-container.js-score-hidden .js-vote-count {
  position: relative;
  font-size: 0 !important;
  pointer-events: none;
}
.js-voting-container.js-score-hidden .js-vote-count .vote-count-separator {
  display: none;
}
.js-voting-container.js-score-hidden .js-vote-count:after {
  content: '?';
  display: inline-block;
  font-size: 1.61538462rem !important;
}
`); // end stylesheet


// On script run
(function init() {

  // Hide all vote counts immediately on page load
  $('.js-voting-container').addClass('js-score-hidden');

  // Show vote counts for these scenarios
  const showVotes = $('.question, .answer').filter(function () {
    const postScore = $(this).find('.js-vote-count').data('value');
    return (

      // extreme score
      postScore <= -200 || postScore >= 200

      // deleted posts
      || $(this).hasClass('deleted-answer')

      // locked posts (dispute or hist sig)
      || ($(this).find('.question-status').last().text().includes('locked') || $(this).find('.js-vote-up-btn').length == 0)

      // own posts
      || $(this).find(`.user-details[itemprop="author"] > a[href^="/users/${selfId}/"]`).length > 0
    );
  }).find('.js-voting-container').removeClass('js-score-hidden');

  // Function to check for votes again when Q&A has initialized
  StackExchange.ready(function () {

    // If we have voted, show post votes
    $('.js-voting-container .fc-theme-primary').parent().removeClass('js-score-hidden');
  });

  // Show vote counts on double-click
  $(document).on('dblclick', '.js-score-hidden', function () {
    $(this).removeClass('js-score-hidden');
  });

  listenToPageUpdates();
})();