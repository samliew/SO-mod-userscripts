// ==UserScript==
// @name         Too Many Comments Flag Queue Helper
// @description  Inserts quicklinks to "Move comments to chat + delete" and "Delete all comments"
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      6.0.11
//
// @match        https://*.stackoverflow.com/admin/dashboard?flagtype=posttoomanycommentsauto*
// @match        https://*.serverfault.com/admin/dashboard?flagtype=posttoomanycommentsauto*
// @match        https://*.superuser.com/admin/dashboard?flagtype=posttoomanycommentsauto*
// @match        https://*.askubuntu.com/admin/dashboard?flagtype=posttoomanycommentsauto*
// @match        https://*.mathoverflow.net/admin/dashboard?flagtype=posttoomanycommentsauto*
// @match        https://*.stackapps.com/admin/dashboard?flagtype=posttoomanycommentsauto*
// @match        https://*.stackexchange.com/admin/dashboard?flagtype=posttoomanycommentsauto*
// @match        https://stackoverflowteams.com/c/*/admin/dashboard?flagtype=posttoomanycommentsauto*
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
// @require      https://raw.githubusercontent.com/samliew/ajax-progress/master/jquery.ajaxProgress.js
// ==/UserScript==

/* globals StackExchange, fkey */
/// <reference types="./globals" />

'use strict';

// This is a moderator-only userscript
if (!isModerator()) return;

const superusers = [584192];
const isSuperuser = superusers.includes(selfId);

const delCommentThreshold = 40;
let ajaxTimeout;


// Locks individual post
// Type: 20 - content dispute
//       21 - offtopic comments
function lockPost(pid, type, hours = 24) {
  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid === null) { reject(); return; }
    if (typeof type === 'undefined' || type === null) { reject(); return; }

    $.post({
      url: `${location.origin}/admin/posts/${pid}/lock`,
      data: {
        'fkey': fkey,
        'mod-actions': 'lock',
        'noticetype': type,
        'duration': hours
      }
    })
      .done(resolve)
      .fail(reject);
  });
}

// Undelete individual comment
function undeleteComment(pid, cid) {
  if (typeof pid === 'undefined' || pid == null) return;
  if (typeof cid === 'undefined' || cid == null) return;
  $.post({
    url: `${location.origin}/admin/posts/${pid}/comments/${cid}/undelete`,
    data: { 'fkey': fkey }
  });
}

// Undelete comments
function undeleteComments(pid, cids) {
  if (typeof pid === 'undefined' || pid == null) return;
  if (typeof cids === 'undefined' || cids.length === 0) return;
  cids.forEach(v => undeleteComment(pid, v));
}

// Delete individual comment
function deleteComment(cid) {
  return new Promise(function (resolve, reject) {
    if (typeof cid === 'undefined' || cid == null) { reject(); return; }

    $.post({
      url: `${location.origin}/posts/comments/${cid}/vote/10`,
      data: { 'fkey': fkey }
    })
      .done(function (data) {
        $('#comment-' + pid).remove();
        resolve();
      })
      .fail(reject);
  });
}

// Delete all comments on post
function deleteCommentsOnPost(pid) {
  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid == null) { reject(); return; }

    $.post({
      url: `${location.origin}/admin/posts/${pid}/delete-comments`,
      data: {
        'fkey': fkey,
        'mod-actions': 'delete-comments'
      }
    })
      .done(function (data) {
        $('#comments-' + pid).remove();
        $('#comments-link-' + pid).html('<b>Comments deleted.</b>');
        resolve();
      })
      .fail(reject);
  });
}

// Move all comments on post to chat
function moveCommentsOnPostToChat(pid) {
  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid == null) { reject(); return; }

    $.post({
      url: `${location.origin}/admin/posts/${pid}/move-comments-to-chat`,
      data: {
        'fkey': fkey,
        'deleteMovedComments': 'true'
      }
    })
      .done(function (data) {
        $('#comments-' + pid).remove();
        $('#comments-link-' + pid).html(`<b>${data.info}</b>`);
        resolve();
      })
      .fail(reject);
  });
}

// Mark all flags on post as helpful
function dismissAllHelpful(pid, comment = "") {
  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid == null) { reject(); return; }

    $.post({
      url: `${location.origin}/messages/delete-moderator-messages/${pid}/${StackExchange.moderator.renderTimeTicks}?valid=true`,
      data: {
        'fkey': fkey,
        'comment': comment
      }
    })
      .done(function (data) {
        $('#flagged-' + pid).remove();
        resolve();
      })
      .fail(reject);
  });
}


function addPostCommentsModLinks() {

  $('div[id^="comments-link-"]').addClass('js-comments-menu');

  // Append link to post sidebar if it doesn't exist yet
  const allCommentMenus = $('.js-comments-menu');

  // Init those that are not processed yet
  allCommentMenus.not('.js-comments-menu-init').addClass('js-comments-menu-init').each(function () {

    const post = $(this).closest('.answer, .question');
    const pid = Number(post.attr('data-answerid') || post.attr('data-questionid')) || null;
    this.dataset.postId = pid;

    // If there are deleted comments, move from sidebar to bottom
    const delCommentsBtn = post.find('.js-fetch-deleted-comments');
    if (delCommentsBtn.length == 1) {
      const numDeletedComments = (delCommentsBtn.attr('title') || delCommentsBtn.attr('aria-label')).match(/\d+/)[0];
      $(this).append(`<span class="js-link-separator2">&nbsp;|&nbsp;</span> <a class="js-show-deleted-comments-link fc-red-600" title="expand to show all comments on this post (including deleted)" href="${delCommentsBtn.attr('href')}" role="button">load <b>${numDeletedComments}</b> deleted comment${numDeletedComments > 1 ? 's' : ''}</a>`);
      delCommentsBtn.hide();
    }

    // Add move to chat and purge links
    $(this).children('.mod-action-links').remove(); // in case added by another US
    $(this).append(`<div class="mod-action-links dno" style="float:right; padding-right:10px">
<a data-post-id="${pid}" class="js-move-comments-link fc-red-600" title="move all comments to chat + delete all">move to chat</a>
<a data-post-id="${pid}" class="js-purge-comments-link fc-red-600" title="delete all comments">purge all</a>
</div>`);

  });

  // Show move/purge links depending on comments
  allCommentMenus.each(function () {
    const hasComments = $(this).prev().find('.comment').length > 0;
    $(this).find('.mod-action-links').toggle(hasComments);
  });
}


function initPostCommentsModLinksEvents() {

  const d = $('body').addClass('js-comments-menu-events')
    .off('click handle', 'a.js-show-deleted-comments-link')
    .off('click handle', 'a.js-move-comments-link')
    .off('click handle', 'a.js-purge-comments-link');

  d.on('click', 'a.js-show-deleted-comments-link', function (e) {
    e.preventDefault();
    const post = $(this).closest('.answer, .question');
    post.find('.js-fetch-deleted-comments').trigger('click');
    $(this).prev('.js-link-separator2').addBack().remove();
  });

  // On move comments to chat link click
  d.on('click handle', 'a.js-move-comments-link', function (e) {
    e.preventDefault();
    const post = $(this).closest('.answer, .question');
    const pid = Number(this.dataset.postId) || null;
    const flaggedPost = $(this).closest('.js-flagged-post');
    const possibleDupeCommentIds = $(`#comments-${pid} .comment`).not('.deleted-comment')
      .filter(function (i, el) {
        const cmmtText = $(el).find('.comment-copy').text().toLowerCase();
        return cmmtText.indexOf('possible duplicate of ') === 0;
      })
      .map((i, el) => el.dataset.commentId).get();

    $(this).remove();

    moveCommentsOnPostToChat(pid)
      .then(function (v) {
        lockPost(pid, 21);
        undeleteComments(pid, possibleDupeCommentIds);
        flaggedPost.addClass('comments-handled');
      });
  });

  // On purge all comments link click
  d.on('click handle', 'a.js-purge-comments-link', function (e) {
    e.preventDefault();
    const post = $(this).closest('.answer, .question');
    const pid = Number(this.dataset.postId) || null;
    const flaggedPost = $(this).closest('.js-flagged-post');
    const possibleDupeCommentIds = $(`#comments-${pid} .comment`).not('.deleted-comment')
      .filter(function (i, el) {
        const cmmtText = $(el).find('.comment-copy').text().toLowerCase();
        return cmmtText.indexOf('possible duplicate of ') === 0 || cmmtText.indexOf('let us continue this discussion ') === 0;
      })
      .map((i, el) => el.dataset.commentId).get();

    deleteCommentsOnPost(pid)
      .then(function (v) {
        undeleteComments(pid, possibleDupeCommentIds);
        flaggedPost.addClass('comments-handled');
      });
  });
}


function doPageLoad() {

  // Expand unhandled posts
  const unhandledPosts = $('.js-flagged-post').filter((i, el) => $('.mod-post-actions', el).text().indexOf('ModMovedCommentsToChat') === -1);
  const handledPosts = $('.js-flagged-post').not(unhandledPosts).addClass('comments-handled');
  setTimeout((unhandledPosts) => $('.js-body-loader:last .js-expand-body', unhandledPosts).trigger('click'), 1000, unhandledPosts);

  // On "done" button click
  $('.js-flagged-post').on('click', '.js-resolve-now', function () {
    const $post = $(this).closest('.js-flagged-post');
    const pid = $post[0].dataset.postId;
    // Hide post immediately so we can move on
    $post.hide();
  });

  const actionBtns = $('<div id="actionBtns"></div>');
  $('.js-flagged-post').first().parent().prepend(actionBtns);

  // Start from bottom link
  $('<button class="s-btn s-btn__filled s-btn__xs">Review from bottom</button>')
    .on('click', function () {
      window.scrollTo(0, 999999);
    }).appendTo(actionBtns);

  if (isSuperuser) {

    // Move all comments on page to chat
    $('<button class="s-btn s-btn__danger s-btn__filled s-btn__xs">Move ALL to chat</button>')
      .on('click', function () {
        $(this).remove();
        const moveLinks = $('.js-move-comments-link:visible');
        $('body').showAjaxProgress(moveLinks.length, { position: 'fixed' });
        moveLinks.trigger('handle');
      }).appendTo(actionBtns);

    // Dismiss all
    $('<button class="s-btn s-btn__danger s-btn__filled s-btn__xs">Dismiss ALL</button>')
      .on('click', function () {
        const dismissLinks = $('.comments-handled .js-resolve-now:visible');
        dismissLinks.trigger('click');
      }).appendTo(actionBtns);
  }
}


function listenToPageUpdates() {
  initPostCommentsModLinksEvents();

  // On any page update
  $(document).ajaxStop(function (event, xhr, settings) {

    // Closed questions
    $('.question-status').each(function () {
      $(this).closest('.js-flagged-post').addClass('already-closed comments-handled');
    });

    // Always expand comments if post is expanded, if comments have not been expanded yet
    $('.comments.js-comments-container').not('.js-del-loaded').each(function () {
      const postId = this.id.match(/\d+/)[0];

      // So we only load deleted comments once
      $(this).addClass('js-del-loaded').removeClass('dno');

      // Remove default comment expander
      $(this).next().find('.js-show-link.comments-link').prev().addBack().remove();

      // Get all including deleted comments
      let commentsUrl = `/posts/${postId}/comments?includeDeleted=true&_=${Date.now()}`;
      $('#comments-' + postId).children('ul.comments-list').load(commentsUrl, function () {

        // Display post stats near action buttons, so we don't have to scroll back up
        const el = $(this);
        const post = $(this).closest('.js-flagged-post');
        const postFlags = post.find('.js-post-flags');

        const postCreated = post.find('.post-signature .relativetime').last().get(0).outerHTML;
        const numAnswers = post.find('.js-post-header span.s-badge').last().text();
        const isAccepted = post.find('.js-post-header .s-badge__answered').length > 0;
        const numAnswersText = numAnswers ? `<div>post type: question (${numAnswers} answer${pluralize(numAnswers)})</div>` : `<div>post type: answer ${isAccepted ? '(accepted)' : ''}</div>`;
        const closeReasonElem = post.find('.question-status:not(.bounty)');
        const closeReason = closeReasonElem.length ? (closeReasonElem[0].children[0].childNodes[2] ? closeReasonElem[0].children[0].childNodes[2].nodeValue.replace(/\s*\b(as|by)\b\s*/g, '') : '') : '';
        const closeReasonText = closeReasonElem.length && closeReason.length ? `<div>closed: ${closeReason}</div>` : '';
        const cmmts = el.find('.comment-body');
        const cmmtsDel = el.find('.deleted-comment');
        const percDel = Math.ceil(cmmtsDel.length / cmmts.length * 100);
        const cmmtUsers = el.find('.comment-body').find('.comment-user:first').map((i, el) => el.href).get().filter((v, i, self) => self.indexOf(v) === i); // unique users
        const infoDiv = $(`
<div class="post-comment-stats">
  <h3>Post info:</h3>
  <div>created: ${postCreated}</div>
  ${numAnswersText}
  ${closeReasonText}
  <div>${cmmts.length} comments, ${cmmtsDel.length} deleted (<span class="${percDel >= delCommentThreshold ? 'red' : ''}">${percDel}%</span>)</div>
  <div>${cmmtUsers.length} users</div>
</div>`).appendTo(postFlags);

        //console.log(closeReasonElem, closeReason);

        if (percDel >= delCommentThreshold) {
          post.addClass('too-many-deleted');
        }
      });
    });

    setTimeout(addPostCommentsModLinks, 100);
  });
}


// Append styles
addStylesheet(`
.js-post-body,
.post-taglist,
.js-post-flag-options input,
.js-delete-post,
.mod-message {
  display: none !important;
}
.tagged-ignored {
  opacity: 1 !important;
}
.post-comment-stats {
  padding: 15px 0;
  text-align: right;
}
.post-comment-stats .red {
  color: var(--red-500);
  font-weight: bold;
}
.red-mod-link {
  color: var(--red-500);
}

#actionBtns {
  margin: 25px 24px 20px;
}
#actionBtns button {
  margin-top: 10px;
  margin-right: 10px;
}

/* New mod interface */
.js-post-header .js-loaded-body {
  margin-left: -44px !important;
  margin-right: -3px !important;
}
.visited-post {
  opacity: 1;
}
`); // end stylesheet


// On script run
(function init() {
  doPageLoad();
  listenToPageUpdates();
})();