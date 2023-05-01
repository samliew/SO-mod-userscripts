// ==UserScript==
// @name         Post Ids Everywhere
// @description  Inserts post IDs everywhere where there's a post or post link
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      3.2.2
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

function insertPostIds() {

  const modQueuePostLinks = $('.js-body-loader').find('a:first');

  // Lists
  $('a.question-hyperlink, a.answer-hyperlink, .s-post-summary--content-title > a, .s-post-summary--content-title.s-link, .js-post-title-link, .originals-of-duplicate li > a, .originals-of-duplicate .js-originals-list > a')
    .add(modQueuePostLinks)
    .not('.js-somu-post-ids').addClass('js-somu-post-ids')
    .each((i, el) => {
      if (el.href.includes('/election')) return; // ignore election pages
      const pid = getPostId(el.href);
      const input = $(`<input class="post-id" title="double click to view timeline" value="${pid}" readonly />`).insertAfter(el);
      input.dynamicWidth();
    });

  // Q&A
  $('[data-questionid], [data-answerid]').not('.close-question-link')
    .not('.js-somu-post-ids').addClass('js-somu-post-ids')
    .each((i, el) => {
      const pid = el.dataset.answerid || el.dataset.questionid;
      const input = $(`<input class="post-id" title="double click to view timeline" value="${pid}" readonly />`).insertBefore($(el).find('.post-layout'));
      input.dynamicWidth();
    });

  // Flagged Comments (mod-page)
  $('.js-comments-table-container a[href^="https://stackoverflow.com/questions/"]')
    .each((i, el) => {
      if (el.href.includes('/election')) return; // ignore election pages
      const pid = getPostId(el.href);
      const lastDiv = $(el).closest('td').children('div').last().css('position', 'relative');
      const input = $(`<input class="post-id" title="double click to view timeline" value="${pid}" readonly />`).appendTo(lastDiv);
      input.dynamicWidth();
    });


  // Remove duplicates just in case duplicates were added somehow
  $('.post-id ~ .post-id').remove();
}


// Append styles
addStylesheet(`
.count-cell + td,
.user-page .s-card .flex--item,
.user-page .js-user-tab .flex--item,
.js-user-panel .d-flex,
.js-user-panel .fl-grow1,
.question-link,
.answer-link,
.question-summary,
.summary-table td,
.history-table td,
.top-posts .post-container,
.mod-section table.table td,
.post-container,
.reviewable-post h1,
.js-flag-text li,
.originals-of-duplicate li,
.js-expandable-posts .break-word {
  position: relative;
}
.popup[data-questionid],
.popup[data-answerid] {
  position: absolute;
}
.flagged-post-row .answer-link {
  float: none;
}
.reviewable-post .question .post-id {
  display: none;
}

.post-id {
  position: absolute;
  top: 0;
  right: 0;
  width: 5rem;
  min-width: 36px;
  margin: 0;
  padding: 3px 0;
  font-size: 1rem;
  font-family: monospace;
  font-weight: 600;
  text-align: right;
  color: var(--black-800);
  background: transparent;
  border: none;
  outline: none !important;
  opacity: 0.15;
  z-index: 1;
}
.post-id:before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: var(--white);
  opacity: 0.8;
  z-index: 0;
}
.post-id + a {
  display: inline !important;
}
#question .post-id,
#answers .post-id {
  position: relative;
}
.question:not(#question) > .post-id {
  top: -20px;
}
.s-post-summary--content-title .post-id {
  top: -7px;
}
.js-admin-dashboard .js-flagged-post .post-id {
  transform: translate(0, -90%);
}
.js-admin-dashboard .js-flagged-post .js-flag-text li .post-id {
  transform: translate(0, 0);
}
#question .post-id,
#answers .post-id,
#user-tab-questions .post-id:hover,
#user-tab-answers .post-id:hover,
#user-tab-activity .post-id:hover,
*:hover > .post-id,
.originals-of-duplicate .post-id {
  display: inline-block;
  opacity: 1;
}
#sidebar .post-id,
#question-header .post-id,
.js-loaded-body .post-id {
  display: none;
}
.post-list .revision-comment {
  position: relative;
  display: block;
}

/* Compatibility */
.post-stickyheader ~ .post-id {
  z-index: unset;
}
`); // end stylesheet


// On script run
(function init() {

  insertPostIds();
  $(document).ajaxStop(insertPostIds);

  // Select when focused
  $(document).on('click', 'input.post-id', function () {
    this.select();
  });

  // Open post timeline in new tab when double clicked
  $(document).on('dblclick', 'input.post-id', function () {
    window.open(`${location.origin}/posts/${this.value}/timeline?filter=WithVoteSummaries`, '');
  });
})();