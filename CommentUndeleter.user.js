// ==UserScript==
// @name         Comment Undeleter
// @description  Allows moderators to undelete user-deleted comments
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      3.1.10
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

/* globals StackExchange, fkey */
/// <reference types="./globals" />

'use strict';

// This is a moderator-only userscript
if (!isModerator()) return;


// Delete individual comment
function deleteComment(cid) {
  return new Promise(function (resolve, reject) {
    if (hasInvalidIds(cid)) { reject(); return; }

    $.post({
      url: `${location.origin}/posts/comments/${cid}/vote/10`,
      data: {
        'fkey': fkey,
        'sendCommentBackInMessage': true
      }
    })
      .done(function (json) {
        if (json.Success) $('#comment-' + cid).replaceWith(json.Message);
        resolve(cid);
      })
      .fail(reject);
  });
}
// Undelete individual comment
function undeleteComment(pid, cid) {
  return new Promise(function (resolve, reject) {
    if (hasInvalidIds(pid, cid)) { reject(); return; }

    $.post({
      url: `${location.origin}/admin/posts/${pid}/comments/${cid}/undelete`,
      data: { 'fkey': fkey }
    })
      .done(function (data) {
        const cmmt = $('#comment-' + cid).replaceWith(data);
        cmmt[0].dataset.postId = pid;
        resolve(cid);
      })
      .fail(reject);
  });
}


// Add undelete link to deleted comment info if not found
function addUndeleteButtons() {
  $('.deleted-comment-info').filter(function () {
    return $(this).children('.js-comment-undelete').length == 0;
  }).append(`<button class="js-comment-undelete undelete-comment s-btn s-btn__link">Undelete</button>`);
}


// Append styles
addStylesheet(`
/* Show undelete link even on deleted answers */
.deleted-answer .comments .deleted-comment .undelete-comment,
.deleted-answer .comments .deleted-comment:hover .undelete-comment {
  display: inline-block;
}
`); // end stylesheet


// On script run
(function init() {

  // Only on mod flag queue "commentvandalismdeletionsauto"
  if (isModDashboardPage && location.search.includes('flagtype=commentvandalismdeletionsauto')) {

    // Add global event for undelete button clicks
    $(document).on('click', '.js-comment-undelete', function () {
      const cmmt = $(this).closest('.comment');
      const pid = cmmt[0].dataset.postId ?? cmmt.closest('.comments')[0]?.id.split('-')[1];
      const cid = cmmt.attr('id').split('-')[1];

      undeleteComment(pid, cid);
      return false;
    });

    // Add global event for delete button clicks
    $(document).on('click', '.js-comment-delete', function () {
      const cmmt = $(this).closest('.comment');
      const pid = cmmt[0].dataset.postId ?? cmmt.closest('.comments')[0]?.id.split('-')[1];
      const cid = cmmt.attr('id').split('-')[1];

      deleteComment(cid).then(() => {
        // Set post id to comment so we can undelete
        cmmt[0].dataset.postId = pid;
      });
      return false;
    });
  }

  $(document).ajaxStop(function (event, xhr, settings) {
    setTimeout(addUndeleteButtons, 100);
  });
})();