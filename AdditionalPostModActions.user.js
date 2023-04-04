// ==UserScript==
// @name         Additional Post Mod Actions
// @description  Adds a menu with mod-only quick actions in post sidebar
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      4.0
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
// @require      https://unpkg.com/sweetalert/dist/sweetalert.min.js
// ==/UserScript==

/* globals StackExchange, swal, fkey, isSO, isSOMeta, isMetaSite, parentUrl, metaUrl */
/// <reference types="./globals" />

'use strict';

// This is a moderator-only userscript
if (!isModerator()) return;

const newlines = '\n\n';
const seApiKey = 'lSrVEbQTXrJ4eb4c3NEMXQ((';

const superusers = [584192, 366904, 6451573];
const isSuperuser = superusers.includes(StackExchange.options.user.userId);

// Manually switch this variable to true when site under spam attack so you can delete accounts as fast as possible without distractions and multiple confirmations
const underSpamAttackMode = isSuperuser || false;


/*
 * Reload functions
 */
const reloadPage = () => {
  // If in mod queues, do not reload
  if (location.pathname.includes('/admin/dashboard')) return false;
  location.reload();
};
const reloadWhenDone = () => {
  // Triggers when all ajax requests have completed
  $(document).ajaxStop(function () {
    // Stop subsequent calls
    $(this).off("ajaxStop");
    reloadPage();
  });
};
const reloadPost = async pid => {
  if (pid && StackExchange?.realtime?.reloadPosts) {
    const result = await StackExchange.realtime.reloadPosts(pid);
    if (result) return true;
  }
  return reloadPage();
};


/*
 * Post dissociation feature functions
 */
function updateModTemplates() {

  const template = $('.popup input[name=mod-template]').filter((i, el) => $(el).next().text().includes('post disassociation'));
  let addstr = '';

  // Build list of posts
  const pids = getQueryParam('pid').split('|');
  pids.forEach(function (v) {
    if (v.length === 0) return;
    addstr += `${location.origin}/a/${v}` + newlines;
  });

  // Build list of meta posts
  const metaPids = getQueryParam('metapid').split('|');
  metaPids.forEach(function (v) {
    if (v.length === 0) return;
    addstr += `${metaUrl}/a/${v}` + newlines;
  });

  if (addstr === '') addstr = newlines;

  // Insert to template
  template.val(template.val()
    .replace(/:\s+{todo}/, ':<br>\n' + addstr + '**Requested via custom flag.**' + newlines) // replace todo with additional information
  ).trigger('click');

  $('.popup-submit').trigger('click');

  // Failsafe
  $('#templateName').val('post disassociation');
}

function initPostDissociationHelper() {

  // Only on main sites
  if (isMetaSite) return;

  // Run once, whether on AdditionalPostModActions or AdditionalInlinePostModMenu
  if (document.body.classList.contains('SOMU-PostDissociationHelper')) return;
  else document.body.classList.add('SOMU-PostDissociationHelper');

  // If on contact CM page and action = dissocciate
  if (location.pathname.includes('/admin/cm-message/create/') && getQueryParam('action') == 'post-dissociation') {

    // On any page update
    $(document).ajaxComplete(function (event, xhr, settings) {

      // If CM templates loaded on contact CM page, and action = dissocciate, update templates
      if (settings.url.includes('/admin/contact-cm/template-popup/')) {

        // Run once only. Unbind ajaxComplete event
        $(event.currentTarget).unbind('ajaxComplete');

        // Update CM mod templates
        setTimeout(updateModTemplates, 500);
      }
    });

    // click template link
    $('#show-templates').trigger('click');

    return;
  }

  // If on mod flag queues, remove close question and convert to comment buttons when flag message contains "di(sa)?ssociate", and add "dissociate" button
  if (location.pathname.includes('/admin/dashboard')) {
    const dissocFlags = $('.revision-comment.active-flag').filter((i, v) => v.innerText.match(/di(sa)?ssociate/));
    const dissocPosts = dissocFlags.closest('.js-flagged-post');
    dissocPosts.each(function () {
      const post = $(this);
      const userlink = post.find('.mod-audit-user-info a').attr('href');

      // User not found, prob already deleted
      if (userlink == null) return;

      const uid = Number(userlink.match(/\/(\d+)\//)[0].replace(/\//g, ''));
      const pid = post.attr('data-post-id') || post.attr('data-questionid') || post.attr('data-answerid');
      $('.js-post-flag-options', this).prepend(`<a href="${location.origin}/admin/cm-message/create/${uid}?action=post-dissociation&pid=${pid}" class="btn" target="_blank">dissociate</a>`);

      $('.close-question-button, .js-convert-to-comment', this).hide();
    });
    return;
  }
}


/*
 * UI functions
 */
function addPostModMenuLinks() {

  // Add post issues container in mod flag queues, as expanded posts do not have this functionality
  $('.js-flagged-post .votecell .vote').filter(function () {
    return $(this).children('.js-post-issues').length == 0;
  }).each(function () {
    const post = $(this).closest('.answer, .question');
    const pid = post.attr('data-questionid') || post.attr('data-answerid') || post.attr('data-post-id');
    $(this).append(`
      <div class="js-post-issues grid fd-column ai-stretch gs4 mt16">
        <a class="grid--item s-btn s-btn__muted" href="/posts/${pid}/timeline" data-shortcut="T" title="Timeline" target="_blank">
        <svg aria-hidden="true" class="svg-icon mln1 mr0 iconHistory" width="19" height="18" viewBox="0 0 19 18">
          <path d="M3 9a8 8 0 1 1 3.73 6.77L8.2 14.3A6 6 0 1 0 5 9l3.01-.01-4 4-4-4h3zm7-4h1.01L11 9.36l3.22 2.1-.6.93L10 10V5z"></path>
        </svg></a>
      </div>`);
  });

  // Append link to post sidebar if it doesn't exist yet
  $('.question, .answer').find('.js-voting-container').not('.js-post-mod-menu-init').addClass('js-post-mod-menu-init').each(function () {
    const post = $(this).closest('.question, .answer');
    const postScore = Number($(this).find('.js-vote-count').text());
    const postStatus = post.find('.js-post-notice, .special-status').text().toLowerCase();
    const isQuestion = post.hasClass('question');
    const isDeleted = post.hasClass('deleted-answer');
    const isModDeleted = post.find('.deleted-answer-info').text().includes('♦') || (postStatus.includes('deleted') && postStatus.includes('♦'));
    const isClosed = postStatus.includes('closed') || postStatus.includes('on hold') || postStatus.includes('duplicate') || postStatus.includes('already has');
    const isProtected = post.find('.js-post-notice b').text().includes('Highly active question');
    const isMigrated = postStatus.includes('migrated to');
    const isLocked = isMigrated || postStatus.includes('locked') || postStatus.includes('community effort');
    const isOldDupe = isQuestion && post.find('.js-post-body blockquote').first().find('strong').text().includes('Possible Duplicate');
    const needsRedupe = postStatus.match(/This question already has( an)? answers? here:(\s|\n|\r)+Closed/i) != null;
    const hasComments = post.find('.comment, .comments-link.js-show-link:not(.dno)').length > 0;
    const pid = post.attr('data-questionid') || post.attr('data-answerid');
    const userbox = post.find('.post-layout .user-info:last .user-action-time').filter((i, el) => el.innerText.includes('answered') || el.innerText.includes('asked')).parent();
    const userlink = userbox.find('a').attr('href');
    const userrep = userbox.find('.reputation-score').text();
    const username = userbox.find('.user-details a').first().text();
    const postdate = userbox.find('.relativetime').attr('title');
    const postage = (Date.now() - new Date(postdate)) / 86400000;

    // Create menu based on post type and state
    let menuitems = '';

    //isSO && isQuestion ? console.log('isOldDupe:', isOldDupe, 'needsRedupe:', needsRedupe) : null;
    if (isSO && isOldDupe && needsRedupe) { // Q-only
      const oldDupePid = isOldDupe ? post.find('.js-post-body > blockquote:first a').attr('href').match(/(\/\d+\/|\/\d+$)/)[0].replace(/\D/g, '') : null;

      menuitems += `<a data-action="old-redupe" data-redupe-pid="${oldDupePid}">close as proper duplicate</a>`;
      menuitems += `<div class="separator"></div>`;
    }

    // Comment mod links are now added below the comments section
    //if(hasComments) { // when there are comments only?
    //    menuitems += `<a data-action="move-comments" class="${isDeleted || !hasComments ? 'disabled' : ''}">move comments to chat</a>`;
    //    menuitems += `<a data-action="purge-comments" class="${!hasComments ? 'disabled' : ''}">purge comments</a>`;
    //}

    if (isQuestion) { // Q-only
      menuitems += `<a data-action="toggle-protect" class="${isDeleted ? 'disabled' : ''}" title="${isDeleted ? 'question is deleted!' : ''}">toggle protect</a>`;

      if (isSO && !isClosed && !isDeleted) {
        menuitems += `<a data-action="close-offtopic" title="close with default off-topic reason">close (offtopic)</a>`;
      }

      // Incorrectly posted question on SO Meta
      if (isSOMeta && !isDeleted) {
        menuitems += `<a data-action="meta-incorrect">close + delete (incorrectly posted)</a>`;
      }
      else {
        menuitems += `<a data-action="mod-delete" title="redelete post as moderator to prevent undeletion">mod-delete post</a>`;
      }

    }
    else { // A-only
      menuitems += `<a data-action="convert-comment" title="convert only the post to a comment on the question">convert post to comment</a>`;
      menuitems += `<a data-action="convert-edit" title="append the post as an edit to the question">convert post to edit</a>`;
      menuitems += `<a data-action="mod-delete" title="redelete post as moderator to prevent undeletion">mod-delete post</a>`;
    }

    menuitems += `<div class="separator"></div>`;

    if (!isLocked) { // unlocked-only
      menuitems += `<a data-action="lock-dispute" title="prompts for number of days to dispute lock">lock - dispute (custom days)</a>`;
      menuitems += `<a data-action="lock-comments" title="prompts for number of days to comment lock">lock - comments (custom days)</a>`;

      // Old good questions only
      if (isQuestion && postage >= 60 && postScore >= 20) {
        menuitems += `<a data-action="lock-historical">lock - historical (perm)</a>`;
      }
    }
    else { // locked-only
      menuitems += `<a data-action="unlock">unlock</a>`;
    }

    // CM message option won't work on Meta
    if (userlink && /.*\/\d+\/.*/.test(userlink)) {
      const uid = Number(userlink.match(/\/\d+\//)[0].replace(/\D+/g, ''));

      menuitems += `<div class="separator"></div>`;

      const postIdParam = pid ? '&' + (!isMetaSite ? `pid=${pid}` : `metapid=${pid}`) : '';
      menuitems += `<a href="${parentUrl}/admin/cm-message/create/${uid}?action=post-dissociation${postIdParam}" target="_blank" title="compose CM dissociation message in a new window">request dissociation</a>`; // non-deleted user only

      // Allow destroy option only if < 60 days and not on Meta site
      if (!isMetaSite && (postage < 60 || isSuperuser)) {

        // Allow destroy option only if user < 200 rep
        if (/^\d+$/.test(userrep) && Number(userrep) < 200) {
          menuitems += `<a data-action="suspend-delete" data-uid="${uid}" data-username="${username}" class="danger" title="confirms whether you want to suspend-delete the account">DELETE post &amp; user</a>`; // non-deleted user only
          menuitems += `<a data-action="destroy-spammer" data-uid="${uid}" data-username="${username}" class="danger" title="confirms whether you want to suspend-destroy the spammer">SPAM post &amp; DESTROY spammer</a>`; // non-deleted user only
        }
        // Display disabled destroy menu item with description
        else {
          menuitems += `<a class="danger disabled" title="user rep too high to use this option">DESTROY spammer (confirm)</a>`; // non-deleted user only
        }
      }
    }

    $(this).append(`
      <div class="js-post-issue flex--item s-btn s-btn__unset ta-center py8 js-post-mod-menu-link" data-shortcut="O" title="Other mod actions">
        <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 512" class="svg-icon mln1 mr0"><path fill="currentColor"
          d="M64 208c26.5 0 48 21.5 48 48s-21.5 48-48 48-48-21.5-48-48 21.5-48 48-48zM16 104c0 26.5 21.5 48 48 48s48-21.5 48-48-21.5-48-48-48-48 21.5-48 48zm0 304c0 26.5 21.5 48 48 48s48-21.5 48-48-21.5-48-48-48-48 21.5-48 48z"></path>
        </svg>
        <div class="js-post-mod-menu" title="" data-pid="${pid}" role="dialog">
        <div class="js-post-mod-menu-header">Post ${pid}:</div>
        ${menuitems}
        </div>
      </div>`);

    // If we are testing auto-reduping of posts
    // Seems like Community -1 user will auto remove the old post notices after we redupe
    if (isOldDupe && isSuperuser) {
      $('.js-post-mod-menu a[data-action="old-redupe"]').trigger('click');
    }
  });
}

function initPostModMenuLinkActions() {

  // Handle mod actions menu link click
  // have to use tag "main" for mobile web doesn't contain wrapping elem "#content"
  $('#content, main').on('click', '.js-post-mod-menu a', function () {

    if ($(this).hasClass('disabled')) return false;

    // Get question link if in mod queue
    const qlink = $(this).closest('.js-flagged-post').find('.js-body-loader a').first().attr('href');
    const reviewlink = $('.question-hyperlink').attr('href');

    const menuEl = this.parentNode;
    const pid = Number(menuEl.dataset.postId || menuEl.dataset.pid);
    const qid = Number($('#question').attr('data-questionid') || getPostId(qlink) || getPostId(reviewlink)) || null;
    const redupePid = Number(this.dataset.redupePid);
    const uid = Number(this.dataset.uid);
    const uName = this.dataset.username;
    //console.log(pid, qid);
    if (isNaN(pid) || isNaN(qid)) return false;

    const post = $(this).closest('.answer, .question');
    const isQuestion = post.hasClass('question');
    const isDeleted = post.hasClass('deleted-answer');
    const action = this.dataset.action;
    console.log(action);

    function removePostFromModQueue() {
      if (location.pathname.includes('/admin/dashboard')) {
        post.parents('.js-flagged-post').remove();
      }
    }

    switch (action) {
      case 'old-redupe':
        console.log();
        reopenQuestion(pid).then(function (v) {
          closeQuestionAsDuplicate(pid, redupePid).finally(reloadPage);
        });
        break;
      case 'move-comments':
        if (confirm('Really move comments to chat?')) {
          moveCommentsOnPostToChat(pid).then(function (v) {
            post.find('.comments-list').html('');
            post.find('.comments-link').prev().addBack().remove();
            removePostFromModQueue();
            reloadPage();
          });
        }
        break;
      case 'purge-comments':
        deleteCommentsOnPost(pid).then(function (v) {
          post.find('.comments-list').html('');
          post.find('.comments-link').prev().addBack().remove();
          removePostFromModQueue();
          reloadPage();
        });
        break;
      case 'convert-comment':
        undeletePost(pid).then(function () {
          convertToComment(pid, qid).then(function () {
            removePostFromModQueue();
            reloadPage();
          });
        });
        break;
      case 'convert-edit':
        undeletePost(pid).then(function () {
          convertToEdit(pid, qid).then(function () {
            removePostFromModQueue();
            goToPost(qid);
          });
        });
        break;
      case 'toggle-protect': {
        if (post.find('.js-post-notice').text().includes('unprotect')) unprotectPost(pid).finally(reloadPage);
        else protectPost(pid).finally(reloadPage);
      }
        break;
      case 'meta-incorrect':
        closeSOMetaQuestionAsOfftopic(pid).then(function () {
          deletePost(pid).finally(reloadPage);
        });
        break;
      case 'close-offtopic':
        closeQuestionAsOfftopic(pid).then(function () {
          removePostFromModQueue();
          goToPost(qid);
        });
        break;
      case 'mod-delete':
        modUndelDelete(pid).then(reloadPage);
        break;
      case 'lock-dispute': {
        let d = Number(prompt('Lock for how many days?', '3').trim());
        if (!isNaN(d)) lockPost(pid, 20, 24 * d).then(reloadPage);
        else StackExchange.helpers.showErrorMessage(menuEl.parentNode, 'Invalid number of days');
        break;
      }
      case 'lock-comments': {
        let d = Number(prompt('Lock for how many days?', '1').trim());
        if (!isNaN(d)) lockPost(pid, 21, 24 * d).then(reloadPage);
        else StackExchange.helpers.showErrorMessage(menuEl.parentNode, 'Invalid number of days');
        break;
      }
      case 'lock-historical':
        if (confirm(`Confirm apply a permanent historical lock on this question and answers?`)) {
          lockPost(pid, 22, -1).then(reloadPage);
        }
        break;
      case 'unlock':
        unlockPost(pid).then(reloadPage);
        break;
      case 'suspend-delete':
        if (confirm(`Suspend for 365, and DELETE the user "${uName}" (id: ${uid})???`) &&
          (underSpamAttackMode || confirm(`Are you VERY SURE you want to DELETE the account "${uName}"???`))) {
          deletePost(pid);
          deleteUser(uid).then(function () {
            if (!isSuperuser && !underSpamAttackMode) window.open(`${location.origin}/users/${uid}`);
            removePostFromModQueue();
            reloadPage();
          });
        }
        break;
      case 'destroy-spammer':
        if (confirm(`Spam-nuke the post, suspend for 365, and DESTROY the spammer "${uName}" (id: ${uid})???`) &&
          (underSpamAttackMode || confirm(`Are you VERY SURE you want to DESTROY the account "${uName}"???`))) {
          spamFlagPost(pid);
          destroyUser(uid).then(function () {
            if (!isSuperuser && !underSpamAttackMode) window.open(`${location.origin}/users/${uid}`);
            removePostFromModQueue();
            reloadPage();
          });
        }
        break;
      default:
        return true;
    }

    return false;
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
      $(this).append(`<span class="js-link-separator2">&nbsp;|&nbsp;</span> <a class="js-show-deleted-comments-link fc-red-600" title="expand to show all comments on this post (including deleted)" href="#" onclick="" role="button">load <b>${numDeletedComments}</b> deleted comment${numDeletedComments > 1 ? 's' : ''}</a>`);
      delCommentsBtn.hide();
    }

    // Add move to chat and purge links
    $(this).children('.mod-action-links').remove(); // in case added by another US
    $(this).append(`
    <div class="mod-action-links dno" style="float:right; padding-right:10px">
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

  const d = $('body').not('.js-comments-menu-events').addClass('js-comments-menu-events');

  d.on('click', 'a.js-show-deleted-comments-link', function () {
    const post = $(this).closest('.answer, .question');
    post.find('.js-fetch-deleted-comments').trigger('click');
    $(this).prev('.js-link-separator2').addBack().remove();
  });

  d.on('click', 'a.js-move-comments-link', function () {
    const post = $(this).closest('.answer, .question');
    const pid = Number(this.dataset.postId) || null;
    $(this).remove();
    moveCommentsOnPostToChat(pid);
  });

  d.on('click', 'a.js-purge-comments-link', function () {
    const post = $(this).closest('.answer, .question');
    const pid = Number(this.dataset.postId) || null;
    deleteCommentsOnPost(pid);
  });
}


// Append styles
addStylesheet(`
/* Better post menu links */
.js-post-menu .s-anchors > .flex--item {
  text-transform: lowercase;
}
.js-post-menu .s-anchors > div.flex--item {
  margin-left:  0;  /* Move margins from container to item... */
  margin-right: 0;  /* ...to allow hiding individual items.   */
}
.js-post-menu .s-anchors > div.flex--item button,
.js-post-menu .s-anchors > div.flex--item a {
  text-transform: lowercase;
  font-size: 0.97em;
  margin-left:  calc(var(--su8) / 2);
  margin-right: calc(var(--su8) / 2);
}
.js-post-menu .s-anchors.s-anchors__muted .s-btn.s-btn__link,
.js-post-menu .s-anchors.s-anchors__muted a:not(.s-link) {
  color: var(--black-500);
}
.js-post-menu .s-anchors.s-anchors__muted .s-btn.s-btn__link:hover,
.js-post-menu .s-anchors.s-anchors__muted a:not(.s-link):hover {
  color: var(--black-300);
}

.post-signature {
  min-width: 180px;
  width: auto;       /* allow the usercard to shrink, if possible...          */
  max-width: 200px;  /* ...but never allow to expand larger than default size */
}


/* Overflow each post in mod dashboard so the menu can be visible */
.js-loaded-body,
.js-loaded-body.overflow-x-auto {
  overflow: initial !important;
}

/* Mod menu link in sidebar */
.js-post-mod-menu-link {
  position: relative;
  display: inline-block;
  margin-top: 8px;
  padding: 8px;
  color: inherit;
  cursor: pointer;
}
.js-post-mod-menu-link svg {
  max-width: 19px;
  max-height: 18px;
  width: 19px;
  height: 18px;
}
.js-post-mod-menu-link:hover .js-post-mod-menu,
.js-post-mod-menu-link .js-post-mod-menu:hover {
  display: block;
}
.js-post-mod-menu-link:hover svg {
  visibility: hidden;
}

/* Mod menu popup */
.js-post-mod-menu-link .js-post-mod-menu {
  display: none;
  position: absolute;
  top: 0;
  left: 0;
  padding: 0 0 6px;
  z-index: 3;
  cursor: auto;

  background: var(--white);
  border-radius: 2px;
  border: 1px solid transparent;
  box-shadow: 0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12), 0 5px 5px -3px rgba(0,0,0,0.2);

  text-align: left;
  font-size: 0.923rem;
  font-family: Roboto,RobotoDraft,Helvetica,Arial,sans-serif;
  letter-spacing: .2px;
  line-height: 20px;
  white-space: nowrap;
}
.js-post-mod-menu .js-post-mod-menu-header {
  display: block !important;
  margin-bottom: 5px;
  padding: 8px 0;
  padding-left: 26px;
  padding-right: 48px;
  background-color: var(--yellow-050);
  border-bottom: 1px solid var(--yellow-100);
  color: var(--black);
  font-weight: bold;
}
.js-post-mod-menu a {
  display: block;
  min-width: 120px;
  padding: 5px 0;
  padding-left: 26px;
  padding-right: 48px;
  cursor: pointer;
  color: var(--black-900);
  user-select: none;
}
.js-post-mod-menu a.dno {
  display: none;
}
.js-post-mod-menu a:hover {
  background-color: var(--black-100);
}
.js-post-mod-menu a.disabled {
  background-color: var(--black-050) !important;
  color: var(--black-200) !important;
  cursor: not-allowed;
}
.js-post-mod-menu a.danger:hover {
  background-color: var(--red-500);
  color: var(--white);
}
.js-post-mod-menu .separator {
  display: block;
  border-top: 1px solid var(--black-100);
  margin: 5px 0;
}

@media screen and (max-width: 500px) {
  header.-summary {
    overflow: initial;
  }
  .js-post-mod-menu-link svg {
    max-width: 17px;
    max-height: 16px;
    color: var(--black-500);
  }
}


/* Comments form and links */
.js-comment-form-layout > div:nth-child(2),
.js-comments-menu {
  display: block !important;
}
.js-comment-form-layout > div:nth-child(2) br {
  display: none;
}
.js-edit-comment-cancel {
  display: block;
  margin-bottom: 5px;
}
a.js-load-deleted-nomination-comments-link,
a.js-show-deleted-comments-link,
a.js-move-comments-link,
a.js-purge-comments-link {
  color: var(--red-600);  /* slightly darken "danger" color (.bg-danger) */
}
a.js-show-deleted-comments-link,
a.js-move-comments-link,
a.js-purge-comments-link {
  padding: 0 3px 2px 3px;
  text-decoration: none;
}
.comment-help {
  max-width: none;
}


/* Pop-up dialog for destroy user */
.swal-overlay {
  background-color: hsl(358deg 67% 6% / 50%); /* Stacks' --_mo-bg */
  /*background: 0; */
}
.swal-overlay,
.swal-overlay--show-modal .swal-modal {
  transition: ease-in-out 0.1s;
  animation: 0;
}
.swal-modal,
.swal-overlay--show-modal .swal-modal {
  padding: 18px;
  border-radius: 0;
  will-change: unset;
}
.swal-modal {
  width: 700px;
  background-color: var(--white);
  border: solid 1px var(--black-300);
  box-shadow: var(--bs-sm);
}
body.theme-dark .swal-modal,
.theme-dark__forced .swal-modal,
body.theme-system .theme-dark__forced .swal-modal {
  background-color: var(--black-100);
}
@media only screen and (max-width: 750px) {
  .swal-modal {
    width: 495px;
  }
}
.swal-content {
  margin: 0;
  padding: 0;
  color: inherit;
  font-size: var(--fs-body2);
  width: 100%
}
.swal-title:first-child,
.swal-title:not(:last-child) {
  margin: -3px 0 18px 0;
  padding: 0;
  text-align: left;
  font-size: var(--fs-title);
  font-weight: 400;
  color: var(--red-600); /* Stacks' --_mo-header-fc */
}
.swal-content .group {
  display: block;
  margin: 18px 0;
  text-align: left;
}
.swal-content .header {
  font-weight: bold;
}
.swal-content .info {
  margin: 18px 0;
  font-size: var(--fs-body2);
}
.swal-content code {
  padding: 0;
  background-color: inherit;
}
.swal-content .user-info {
  float: right;
  margin-left: 18px;
  font-size: 90%;
  background-color: var(--theme-secondary-050);  /* ALTERNATIVE: var(--highlight-bg); */
  border: 1px solid var(--br-md);                /* ALTERNATIVE: var(--bc-light);     */
}
.swal-content .s-notice {
  clear: both;
  float: left;
  width: 100%;
  margin: 9px 0 18px;
  padding: 9px;
}
.swal-content .option {
  margin: 6px 18px;
}
.swal-content .option input,
.swal-content .option input + label {
  cursor: pointer;
}
.swal-content .option input:disabled,
.swal-content .option input:disabled + label {
  cursor: not-allowed;
}
.swal-content .option input:disabled + label {
  opacity: 0.5;
}
.swal-content textarea {
  width: 100%;
  height: 80px;
  margin: 4px 0 0 0;
  font: inherit;
  font-weight: normal;
}
.swal-footer {
  margin: 0;
  padding: 0;
}
.swal-button-container {
  float: left;
  margin: 0 5px 0 0;
}
.swal-button__loader {
  width: 100%;
  padding: 9px 0;
  background-color: var(--red-500);  /* Stacks' .bg-danger */
}


/* Hide question summary if in spam mode */
body.js-spam-mode .post-layout.expandable-question-summary {
  display: none !important;
}
body.js-spam-mode .visited-post {
  opacity: 1 !important;
}

/* Sidebar has too high of a z-index */
#left-sidebar {
  z-index: 1;
}
`); // end stylesheet


// On script run
(function init() {
  const isElectionPage = document.body.classList.contains('election-page');

  // Election page
  if (isElectionPage) {

    // Allow loading of deleted comments under nominations
    $('#mainbar').find('.candidate-row').each(function () {
      const pid = this.id.match(/\d+$/)[0];
      const cmmtlinks = $(this).find('[id^="comments-link-"]');
      const builtin = $(this).find('.js-fetch-deleted-comments');
      const count = builtin.text();
      cmmtlinks.append(`
        <span class="js-link-separator">&nbsp;|&nbsp;</span>
        <a class="js-show-link comments-link s-link__danger js-load-deleted-nomination-comments-link"
            title="Expand to show all comments on this post, including deleted"
            data-pid="${pid}">
          Show <b>${count}</b> deleted comment${count > 1 ? 's' : ''}
        </a>`);
      builtin.hide();
    });

    // Handle the click event
    $('.js-load-deleted-nomination-comments-link').on('click', function () {
      const pid = this.dataset.pid;
      const commentsUrl = `/posts/${pid}/comments?includeDeleted=true&_=${Date.now()}`;
      $('#comments-' + pid).show().children('ul.comments-list').load(commentsUrl);
    });
  }

  // Non-election pages
  else {

    // If spam mode is switched on
    if (underSpamAttackMode) {
      document.body.classList.add('js-spam-mode'); // CSS styling purposes only

      // If filtered to spamoffensive flags in mod dashboard, expand all flagged posts
      if (location.search.includes('flags=spamoffensive')) {
        setTimeout(function () {
          $('.js-expand-body:visible').trigger('click');
        }, 1000); // short wait for dashboard scripts to init
      }
    }

    // Once on page load
    initPostModMenuLinkActions();
    addPostModMenuLinks();
    initPostCommentsModLinksEvents();
    addPostCommentsModLinks();

    initPostDissociationHelper();

    // After requests have completed
    $(document).ajaxStop(function () {
      addPostModMenuLinks();
      addPostCommentsModLinks();
    });
  }
})();