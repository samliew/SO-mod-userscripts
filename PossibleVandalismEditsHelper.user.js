// ==UserScript==
// @name         Possible Vandalism Edits Helper
// @description  Display revision count and post age
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      3.1
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

const apikey = 'ENmQ1YxlYnp725at*EkjEg((';


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
(async function init() {

  // Move flagged post to post-list
  $('.js-flagged-post').each(function() {
    const link = $(this).find('.answer-hyperlink, .question-hyperlink').first().clone();
    link.removeClass();
    $(this).find('.flag-action-card-text ul.post-list').prepend(`<li><span class="revision-comment">${link[0].outerHTML}</span></li>`)
  });

  const flaggedPosts = $('.post-list .revision-comment a').each(function() {
    this.dataset.postId = getPostId(this.href);
  });
  const postIds = flaggedPosts.map((_i, v) => v.dataset.postId).get();
  const postsData = await getPostsFromApi(postIds);

  // Add post info to each link
  flaggedPosts.each(function (_i, link) {
    const postData = postsData.find(v => v.post_id == link.dataset.postId);
    if (!postData) return;

    const age = Math.floor((Date.now() - postData.creation_date * 1000) / MS.oneDay);
    $(link).before(`<span class="info-num post-age ${age > 365 ? 'red' : ''}" title="post age">${age}d</span>`);
  });

})();