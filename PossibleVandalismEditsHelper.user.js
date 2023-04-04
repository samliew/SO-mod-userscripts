// ==UserScript==
// @name         Possible Vandalism Edits Helper
// @description  Display revision count and post age
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      3.0
//
// @match        https://*.stackoverflow.com/admin/dashboard?flagtype=postvandalismeditsauto*
// @match        https://*.serverfault.com/admin/dashboard?flagtype=postvandalismeditsauto*
// @match        https://*.superuser.com/admin/dashboard?flagtype=postvandalismeditsauto*
// @match        https://*.askubuntu.com/admin/dashboard?flagtype=postvandalismeditsauto*
// @match        https://*.mathoverflow.net/admin/dashboard?flagtype=postvandalismeditsauto*
// @match        https://*.stackapps.com/admin/dashboard?flagtype=postvandalismeditsauto*
// @match        https://*.stackexchange.com/admin/dashboard?flagtype=postvandalismeditsauto*
// @match        https://stackoverflowteams.com/c/*/admin/dashboard?flagtype=postvandalismeditsauto*
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

// This is a moderator-only userscript
if (!isModerator()) return;


// Append styles
addStylesheet(`
.post-header,
.post-summary,
.close-question-button,
.undelete-post,
.delete-post,
p[title="question originally asked"],
.user-action-time,
.mod-audit-user-info + br {
  display: none !important;
}
.post-list {
  margin-left: 0;
}
.post-list .title-divider {
  margin-top: 5px;
}
.revision-comment {
  position: relative;
  display: block;
}
.revision-comment:hover {
  background: cornsilk;
}
.info-num {
  display: inline-block;
  min-width: 18px;
  margin-right: 10px;
  font-weight: bold;
  font-size: 1.1em;
}
.info-num.red {
  color: var(--red-500);
}
.post-recommendation {
  display: block;
  margin: 5px 0;
  font-weight: bold;
  font-size: 1.2em;
}
.post-recommendation:before {
  content: 'Recommendation: ';
}
.tagged-ignored {
  opacity: 1;
}
`); // end stylesheet


// On script run
(function init() {

  $('.post-list .revision-comment a').each(function () {
    const flag = $(this).parents('.flagged-post-row');
    const link = $(this);
    const pid = this.href.match(/\d+/)[0];

    // Get post info
    $.get({
      url: `https://stackoverflow.com/posts/${pid}/timeline`,
      success: function (data) {
        const eventrows = $('.event-rows tr', data);
        const dateCreated = new Date(eventrows.filter('[data-eventtype="history"]').last().find('.relativetime').attr('title'));
        const dateDiff = Date.now() - dateCreated;
        const age = Math.floor(dateDiff / 86400000); // 86400000 = 1 day
        const revisions = eventrows.filter(function () {
          return $(this).find('.event-verb, .wmn1').text().includes('edited');
        });
        //console.log(eventrows, dateCreated, age, revisions.length);

        link.before(`<span class="info-num rev-count ${revisions.length >= 5 ? 'red' : ''}" title="post revisions">${revisions.length}</span>`);
        link.before(`<span class="info-num post-age ${age > 365 ? 'red' : ''}" title="post age">${age}d</span>`);
      }
    });
  });
})();