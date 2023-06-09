// ==UserScript==
// @name         Post Ban Deleted Posts
// @description  Assists in building low-quality-questions mod messages. For SO Meta only, fetch and display user's deleted posts in markdown format.
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      5.3.12
//
// @match        https://meta.stackoverflow.com/questions/*
//
// @match        https://*.stackoverflow.com/users/message/create/*?action=low-quality-questions*
// @match        https://*.serverfault.com/users/message/create/*?action=low-quality-questions*
// @match        https://*.superuser.com/users/message/create/*?action=low-quality-questions*
// @match        https://*.askubuntu.com/users/message/create/*?action=low-quality-questions*
// @match        https://*.mathoverflow.net/users/message/create/*?action=low-quality-questions*
// @match        https://*.stackapps.com/users/message/create/*?action=low-quality-questions*
// @match        https://*.stackexchange.com/users/message/create/*?action=low-quality-questions*
//
// @exclude      https://stackoverflowteams.com/*
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
// @grant        GM_xmlhttpRequest
// ==/UserScript==

/* globals StackExchange, parentUrl, MS */
/// <reference types="./globals" />

'use strict';

// This is a moderator-only userscript
if (!isModerator()) return;

const superusers = [584192];
const isSuperuser = superusers.includes(selfId);
const newlines = '\n\n';


/**
 * @summary Get deleted posts
 * @param {number} uid
 * @param {string} postType
 * @returns {Promise<{success: boolean, total: number, items: {title: string, url: string, score: number}[], searchUrl: string, postType: string, uid: number}>}
 */
const getDeletedPosts = async (uid, postType) => {
  if (typeof uid !== 'number' || isNaN(uid) || uid <= 0) throw new Error('PBDP: Invalid user id');
  if (postType !== 'question' && postType !== 'answer') throw new Error('PBDP: Invalid post type');

  // Best if default pagesize is larger, but don't override the user's preference
  const url = `${parentUrl}/search?q=user%3a${uid}%20is%3a${postType}%20deleted%3a1%20score%3a..0&tab=newest`;
  const data = await ajaxPromise(url)
    .catch(() => console.error(`PBDP: getDeletedPosts() failed`));
  const items = $('.js-search-results .s-post-summary', data).get()
    .map(post => {
      const postLink = post.querySelector('.s-post-summary--content-title a');
      const postDate = post.querySelector('.s-user-card--time .relativetime');
      return {
        title: postLink.innerText.replace(/ \[\w+\]$/, ''), // remove closed state
        url: postLink.getAttribute('href').replace(/\?.*$/, ''), // remove search referral query string
        score: Number(post.querySelector('.s-post-summary--stats-item-number')?.innerText) || 0,
        created: new Date(postDate?.title) || null,
      }
    });

  return {
    success: true,
    total: Number($('.results-header h2, .fs-body3', data).first().text().replace(/[^\d]+/g, '')),
    items,
    searchUrl: url,
    postType,
    uid,
  };
};


// After mod message template dialog has loaded/opened
let updateModTemplates = async function () {
  updateModTemplates = () => 0; // this function should run once only

  const uid = currentUserId;
  const modal = $('.s-modal');
  const template = modal.find('input[name=mod-template]').filter((i, el) => $(el).nextAll('.js-action-name').text().includes('consistently low quality questions over time')).first();

  const { items, postType } = await getDeletedPosts(uid, 'question');
  const hyperlinksMd = items.map(v => ` - [${v.title}](${parentUrl}${v.url})<br><sup>– asked on ${dateToIsoString(v.created)} with score ${v.score}</sup>\n`).join('');

  const deletedPosts = `Specifically, we would like to highlight ${items.length == 1 ? 'this' : `these ${items.length}`} deleted ${postType}${items.length == 1 ? '' : 's'}, which you should try to improve and flag for undeletion, as **deleted ${postType}s contribute to the [system ${postType} ban](${location.origin}/help/${postType}-bans)**:<br>\n\n${hyperlinksMd}`;

  // Insert to low-quality-questions template
  template[0].value = template[0].value
    .replace(/Specifically, we would like to highlight these questions:[\s\n\r]+<!-- Please add examples here or remove the line above -->/, deletedPosts);

  // Show help message if template selected
  var selBtn = modal.find('.js-popup-submit');
  selBtn.on('click', function () {
    if (template.is(':checked')) {
      StackExchange.helpers.showMessage(
        $('.js-load-modal').parent(),
        items.length ? `The template has been populated with the user's negatively-scored deleted posts` :
          `The user has no negatively-scored deleted posts, are you sure you want to use this template?`,
        {
          type: "success",
        }
      );
    }
  });

  // Finally select the template option if we are automating via query params
  if (getQueryParam('action') === 'low-quality-questions') {
    template.trigger('click');
    selBtn.removeAttr('disabled').trigger('click');

    // Set the name of the template
    $('#js-template-name').val('low quality questions');
    $('#js-template-edited').val('true');
  }
};


// Append styles
addStylesheet(`
#question ~ .meta-mentioned {
  margin: 15px 0 0;
}
.meta-mentioned {
  position: relative;
  width: 100%;
  margin: 0 0 15px;
  padding: 10px 12px;
  background: var(--yellow-050);
  border: 1px solid #E0DCBF;
  box-sizing: border-box;
  z-index: 1;
}
#answers .meta-mentioned {
  margin: 15px 0 0;
}
.meta-mentioned * {
  box-sizing: border-box;
}
.meta-mentioned:hover {
  z-index: 100;
}
.meta-mentions-toggle {
  position: absolute;
  bottom: 0;
  right: 4px;
  display: block;
  width: 28px;
  height: 32px;
  cursor: pointer;
}
.meta-mentions-toggle:before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 4px;
  left: 0;
  background: var(--black-100);
  border-radius: 3px;
}
.meta-mentions-toggle:after {
  content: '';
  position: absolute;
  top: 10px;
  left: 8px;
  display: block;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 8px 6.5px 0 6.5px;
  border-color: var(--black-500) transparent transparent transparent;
}
.meta-mentions-toggle:hover:before {
  background: var(--black-400);
}
.meta-mentions-toggle:hover:after {
  border-color: var(--white) transparent transparent transparent;
}
.meta-mentions-toggle:hover + .meta-mentions,
.meta-mentions:hover {
  display: block;
}
.meta-mentions {
  display: none;
  position: absolute;
  top: 100%;
  max-width: calc(100% + 2px);
  width: calc(100% + 2px);
  min-height: 40px;
  margin-left: -13px;
  padding: 12px;
  background: var(--white);
  border: 1px solid var(--black-150);
  box-shadow: 5px 5px 5px -3px rgba(0,0,0,0.10);
  z-index: 1;
}
.meta-mentions .question-summary {
  max-width: 100%;
  padding: 10px 0;
}
.meta-mentions .question-summary:last-child {
  border: none;
}
.meta-mentions .question-summary .result-link {
  margin-bottom: 6px;
  font-size: 14px;
  line-height: 1.4;
}
.meta-mentions .question-summary .excerpt,
.meta-mentions .question-summary .started,
.meta-mentions .question-summary .started * {
  line-height: 1.4;
  font-size: 11px !important;
}
.meta-mentions .question-summary .started {
  margin-right: 10px;
  text-align: right;
}
.meta-mentions .question-summary .summary {
  max-width: 600px;
}
.meta-mentions .question-summary .post-tag {
  font-size: 11px;
  pointer-events: none;
}
.meta-mentions .bounty-award-container {
  display: none;
}
.meta-mentions .status {
  margin: 0;
}
.meta-mentions .vote-count-post,
.meta-mentions .question-summary .stats strong {
  font-size: 15px;
  line-height: 0.8;
}
.meta-mentions .question-summary .started {
  margin-top: 0;
}
.meta-mentions .statscontainer {
  padding-top: 5px;
}
.meta-mentions .statscontainer .votes,
.meta-mentions .statscontainer .status {
  font-size: 10px;
}
.meta-mentioned textarea {
  position: relative;
  display: block;
  width: calc(100% - 28px);
  height: var(--su-static64);
  margin-top: 10px;
  line-height: 1.15;
  background: var(--white);
  color: var(--black-700);
  cursor: text;
}
.main-banned {
  margin: 15px 0;
}
`); // end stylesheet


// On script run
(async function init() {

  // On mod message create page
  if (location.pathname.startsWith('/users/message/create/')) {

    // On any page update
    $(document).ajaxComplete(function (_event, _xhr, settings) {

      // If mod popup loaded
      if (settings.url.includes('/admin/contact-user/template-popup/')) {
        setTimeout(updateModTemplates, 200);
      }
    });
    return;
  }

  // Rest of the script is only for SO Meta
  if (!isSOMeta) return;

  // SO Meta
  const post = $('#question');
  const answerWrapper = $('#answers');
  const pid = Number(post.attr('data-questionid'));
  const postOwnerLink = $('.post-signature:last .user-details a[href*="/users/"]', post).first();
  const postText = ($('h1 .question-hyperlink').text() + $('.js-post-body p', post).text()).toLowerCase();
  const isDeleted = post.find('.js-post-notice a[href="/help/deleted-questions"]').length > 0;

  const postDate = new Date(post.find('.post-signature').last().find('.relativetime').attr('title'));
  const isRelativelyNew = postDate.getTime() - Date.now() < 3 * MS.oneDay; // three days

  // Is a deleted user, do nothing
  const uid = getUserId(postOwnerLink.attr('href'));
  if (!uid) return;

  const username = postOwnerLink.text().trim();
  const userRep = postOwnerLink.parent().find('.reputation-score').text().replace(',', '') || null;
  const hasDupeLink = $('.js-post-notice a, .comments-list a', post)
    .filter((i, el) => /(https:\/\/meta\.stackoverflow\.com)?\/q(uestions)?\/255583\/?.*/.test(el.href)).length > 0;
  const hasTags = $('a.post-tag', post).filter((i, el) => ['post-ban', 'banning', 'deleted-'].some(v => el.innerText.contains(v))).length > 0;
  const hasKeywords = ['unable', 'cannot', 'can\'t', 'cant', 'create', 'block', 'no longer accepting']
    .some(v => postText.contains(v)) && ['question', 'answer', 'post', 'restrict', 'account'].some(v => postText.contains(v));

  // User rep too high, don't bother checking
  if (userRep == null || userRep.indexOf('k') > 0 || Number(userRep) >= 1000) return;

  // Definitely not a post ban question, ignore post
  if (!isDeleted && (!hasDupeLink && !hasTags && !hasKeywords)) return;

  // Status of comments section
  const hasMyComments = post.find(`.comment-user[href*="/users/${selfId}/"]`).length > 0;
  const hasDeletedComments = post.find('.js-fetch-deleted-comments, .js-show-deleted-comments-link').length > 0;

  // Get user ban stats on main
  const userDashboard = await ajaxPromise(`${parentUrl}/users/account-info/${uid}`)
    .catch(() => console.error(`PBDP: failed to get userDashboard`));
  const blocked = $('.blocked-no, .blocked-yes', userDashboard);
  const qBan = blocked[0].innerText === 'yes';
  const aBan = blocked[1].innerText === 'yes';
  const eBan = blocked[2].innerText === 'yes';
  const rBan = blocked[3].innerText === 'yes';
  const isSuspended = $('#mainbar-full > .system-alert', userDashboard).length > 0;

  const suspendedNotice = $(`
<div class="main-banned">
  <b>${username} is currently suspended on main.</b>
</div>`);

  const banStats = $(`
<div class="main-banned">
  <b>${username} - bans on main: </b>
  <span>${qBan ? 'question' : ''}</span>
  <span>${aBan ? 'answer' : ''}</span>
  <span>${eBan ? 'suggested-edit' : ''}</span>
  <span>${rBan ? 'review' : ''}</span>
  <span>${!qBan && !aBan && !eBan && !rBan ? 'none!' : ''}</span>
</div>`);

answerWrapper.before(isSuspended ? suspendedNotice : banStats);

  // User is currently suspended, do nothing
  if (isSuspended) return;

  // Get deleted questions on main
  if (qBan) {
    const { total, items, postType, searchUrl } = await getDeletedPosts(uid, 'question');

    const stats = $(`
<div class="meta-mentioned">
  ${username} has <a href="${searchUrl}" target="_blank">${total} deleted ${postType}${pluralize(total)}</a> on the main site
  <span class="meta-mentions-toggle"></span>
  <div class="meta-mentions"></div>
</div>`).insertBefore(answerWrapper);

    // If no deleted posts, do nothing
    if (isNaN(total) || total <= 0) return;

    // Add deleted posts to the stats element
    const listHtml = items.map(item => `
<div class="d-flex ai-center mb8">
  <span class="answer-votes bg-black-050 mr12">${item.score}</span>
  <a href="${parentUrl}${item.url}" target="_blank">${item.title}</a>
</div>`).join('');
    stats.find('.meta-mentions').append(listHtml);

    // Add copyable element to the results
    const parentShortDomain = parentUrl.replace(/^https?:\/\//, '//');
    const hyperlinksMarkdown = items.map((v, i) => `[${1 + i}](${toShortLink(v.url, parentShortDomain)})`);
    const comment = `[Deleted ${postType}${pluralize(total)}](${parentUrl}/users/deleted-${postType}s/current), score <= 0, contributing to the [${postType} ban](${parentUrl}/help/${postType}-bans): ${hyperlinksMarkdown.join(' ')}`;
    const commentArea = $(`<textarea class="s-textarea s-textarea__sm" readonly="readonly"></textarea>`).val(comment).appendTo(stats);
    commentArea.on('focus', function () {
      $(this).trigger('select');
    });

    // If not superuser or post is not within past three days, do not auto-post anything
    if (!isSuperuser || !isRelativelyNew) return;

    // If there are more comments or comments by myself, or deleted comments, ignore
    if (post.find('.js-show-link:visible').length !== 0 || hasMyComments || hasDeletedComments) return;

    // Close as duplicate
    await closeQuestionAsDuplicate(pid, 255583)
      .catch(() => console.error(`PBDP: failed to close question ${pid} as duplicate of 255583`));

    // Check if no comments on post starting with "Deleted question" or "Deleted answer"
    const hasDeletedComment = post.find('.comment-copy').filter((i, el) => el.innerText.toLowerCase().includes('deleted ' + postType)).length > 0;
    if (!hasDeletedComment && comment.length <= 600) { // 600 is the max comment length
      await addComment(pid, comment)
        .then(() => location.reload())
        .catch(() => console.error(`PBDP: failed to add comment: \n${comment}`));
    }
  }

})();