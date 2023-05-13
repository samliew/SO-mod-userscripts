// ==UserScript==
// @name         When Did I Vote
// @description  Get the timestamp of when you voted on a post
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      1.0
//
// @match        https://*.stackoverflow.com/*
// @match        https://*.serverfault.com/*
// @match        https://*.superuser.com/*
// @match        https://*.askubuntu.com/*
// @match        https://*.mathoverflow.net/*
// @match        https://*.stackapps.com/*
// @match        https://*.stackexchange.com/*
// @match        https://stackoverflowteams.com/c/*/*
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

// Need to be logged in to use this userscript
if (!selfId) return;


const searchVoteTimestampFromVotesPage = async (postId, voteType, pageNum = 1, lastPage = null) => {
  // Validation
  if (typeof postId !== 'number' || isNaN(postId) || postId <= 0) throw new Error('Invalid postId');
  if (typeof voteType !== 'string' || !['upvote', 'downvote'].includes(voteType)) throw new Error('Invalid voteType');

  // Show search progress
  StackExchange.helpers.showToast(
    `Searching page ${pageNum}${lastPage ? ' of ' + lastPage : ''}...`, {
    type: 'info',
    useRawHtml: false,
    transient: false,
    transientTimeout: 10e3,
  });

  // Get votes page
  const url = `${location.origin}/users/${selfId}/?tab=votes&sort=${voteType}&page=${pageNum}`;
  const result = await fetch(url);
  const html = await result.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');

  // Search for post link on page
  const postLink = doc.querySelector(`#user-tab-votes a[href*="/${postId}"]`);

  // Post found
  if (postLink) {
    StackExchange.helpers.hideToasts();
    const post = postLink.closest('.js-post-expandable');
    const voteDate = new Date(post.querySelector('.relativetime')?.title);
    return {
      success: true,
      postId,
      voteType,
      voteDate,
      foundPageNum: pageNum,
      foundPageLink: url,
    };
  }

  // Post not found
  // Get next page link and last page number
  const nextPageLink = doc.querySelector('.js-user-tab-paging a[rel="next"]');
  lastPage = lastPage || Number(nextPageLink?.previousElementSibling?.textContent?.trim());

  // If there is a next page, continue searching
  if (nextPageLink && pageNum < lastPage) {
    await delay(1000); // delay to avoid rate limiting
    return await searchVoteTimestampFromVotesPage(postId, voteType, pageNum + 1, lastPage);
  }

  // No more pages, terminate search
  return { success: false };
};


// On script run
(async function init() {

  // Add WDIV buttons to each post menu
  document.querySelectorAll('.js-post-menu > .s-anchors').forEach(el => {
    const menuItem = makeElemFromHtml(`
      <div class="flex--item">
        <button type="button" class="js-wdiv-btn s-btn s-btn__link" title="When Did I Vote?\nGet the date & time of your vote on this post.\nMay not be efficient if you voted a long time ago.">WDIV?</button>
      </div>`);
    el.prepend(menuItem);
  });

  // Click event for When Did I Vote buttons
  document.addEventListener('click', async (evt) => {
    const target = evt.target;

    // Only run on "js-wdiv-btn" button
    if (!target.classList.contains('js-wdiv-btn')) return;

    // Get post id
    const post = target.closest('.question, .answer, .candidate-row');
    const postId = Number(post.dataset.questionid || post.dataset.answerid || post.dataset.postid);
    const postType = post.dataset.questionid ? 'question' : post.dataset.answerid ? 'answer' : 'candidate';

    // Get vote status
    const isUpvoted = post.querySelector('.js-vote-up-btn[aria-pressed="true"]');
    const isDownvoted = post.querySelector('.js-vote-down-btn[aria-pressed="true"]');
    //const isSaved = post.querySelector('.js-saves-btn[aria-pressed="true"]');
    const voteType = isUpvoted ? 'upvote' : isDownvoted ? 'downvote' : null;

    // User has not voted on this post
    if (!voteType) {
      StackExchange.helpers.showToast(`You have not voted on this post yet.`, {
        type: 'danger',
        useRawHtml: false,
        transient: true,
        transientTimeout: 3e3,
      });
      return;
    }

    // Already fetching result, do nothing
    if (target.classList.contains('js-wdiv-loading')) return;
    target.classList.add('js-wdiv-loading');

    // Try to get vote timestamp
    StackExchange.helpers.addSpinner(target);
    const result = await searchVoteTimestampFromVotesPage(postId, voteType);
    StackExchange.helpers.removeSpinner();
    //console.log(`When Did I Vote result for ${postId}`, result);

    // Show result
    if (result.success) {
      StackExchange.helpers.showToast(
        `You <a href="${result.foundPageLink}" target="_blank">${voteType}d this post</a> on ${dateToIsoString(result.voteDate)} (${dateToRelativeTime(result.voteDate)})`, {
        type: 'success',
        useRawHtml: true,
        transient: false,
      });
    }
    else {
      StackExchange.helpers.showToast(`Could not find vote date for ${postType} (#${postId})`, {
        type: 'danger',
        useRawHtml: false,
        transient: true,
        transientTimeout: 20e3,
      });
    }

    // Remove loading state
    target.classList.remove('js-wdiv-loading');
  });

})();