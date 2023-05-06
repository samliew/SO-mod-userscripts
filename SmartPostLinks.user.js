// ==UserScript==
// @name         Smart Post Links
// @description  Replaces the link text in comments and posts with the full question title, and adds post info in the title attribute
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      1.4.1
//
// @match        https://*.stackoverflow.com/*
// @match        https://*.serverfault.com/*
// @match        https://*.superuser.com/*
// @match        https://*.askubuntu.com/*
// @match        https://*.mathoverflow.net/*
// @match        https://*.stackapps.com/*
// @match        https://*.stackexchange.com/*
//
// @exclude      https://stackoverflowteams.com/*
// @exclude      https://api.stackexchange.com/*
// @exclude      https://data.stackexchange.com/*
// @exclude      https://contests.stackoverflow.com/*
// @exclude      https://winterbash*.stackexchange.com/*
// @exclude      *blog.*
// @exclude      */tour
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/se-ajax-common.js
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

/* globals $, StackExchange, fkey */
/// <reference types="./globals" />

/*
 * Script inspired by https://meta.stackexchange.com/q/379268, https://meta.stackoverflow.com/q/424381
 */

'use strict';

// Yes, you can declare the variable apikey here and have it picked up by the functions in se-ajax-common.js
const apikey = 'lSrVEbQTXrJ4eb4c3NEMXQ((';

const canViewDeletedPosts = isModerator() || (typeof StackExchange !== 'undefined' && StackExchange.options?.user?.reputation >= 10000);


const urlToSiteApiSlug = url => new URL(url).hostname.replace(/(\.stackexchange)?\.(com|net|org)$/, '').trim();

const groupBySiteApiSlug = arr => {
  const groups = {};
  for (const item of arr) {
    const key = urlToSiteApiSlug(item);
    groups[key] = groups[key] || [];
    const postId = getPostId(item);
    if (postId) groups[key].push(postId);
  }
  return groups;
};


async function processLinksOnPage() {

  const postLinksToProcess = $('a[href!="#"]', '#mainbar, #chat, #transcript, #content').filter(function () {
    return /\/(questions|q|a|posts|staging-ground)\/\d+/i.test(this.href) && // only post links
      !/\/edit$/i.test(this.href) && // ignore edit links
      !$(this).closest('.s-post-summary--content-title, .votecell, .post-menu, .post-signature, .user-info, .comment-date, .post-stickyheader').length; // not a child element of these containers
  }).not('.js-smart-link').addClass('js-smart-link');

  // Extract siteApiSlug and postId from links
  postLinksToProcess.each(function () {
    this.dataset.siteApiSlug = urlToSiteApiSlug(this.href);
    this.dataset.postId = getPostId(this.href);

    const isRevisionLink = /\/posts\/\d+\/revisions/.test(this.href);
    if (isRevisionLink) {
      this.dataset.isRevisionLink = true;
    }
  });

  // Group by site before sending off in separate requests to API
  const postLinks = postLinksToProcess.get().map(v => v.href);
  const postIdsByGroup = groupBySiteApiSlug(postLinks);

  for (const [siteApiSlug, postIds] of Object.entries(postIdsByGroup)) {

    // Duplicate ids will be handled by getPostsFromApi()
    const postsData = await getPostsFromApi(postIds, 'default', 'creation', 'desc', siteApiSlug);
    if (!postsData) return;

    if (postsData.length === 0) {
      // likely because all queried posts are deleted
      // don't return here, so we can set the title attribute for deleted posts
    }

    // Update links from same site as group
    postLinksToProcess.filter(function () {
      return this.dataset.siteApiSlug === siteApiSlug;
    }).each(function () {
      const postId = Number(this.dataset.postId);
      const linkSiteApiSlug = this.dataset.siteApiSlug;
      if (!postId || !linkSiteApiSlug) return; // skip if no postId or siteApiSlug

      // Find post data from response
      const postData = postsData.find(v => v.post_id === postId && urlToSiteApiSlug(v.link) === linkSiteApiSlug);
      if (!postData) {

        // If can view deleted posts, load revision details?
        if (canViewDeletedPosts && this.dataset.isRevisionLink === 'true') {
          // TODO
        }

        this.title = `(deleted post)`;
        return;
      }

      // Preserve original title and text
      this.dataset.originalTitle = this.title;
      this.dataset.originalText = this.innerText;
      this.dataset.originalHref = this.href;

      const decodedPostTitle = htmlDecode(postData.title);
      const postOwnerInfo = postData.owner ? `${htmlDecode(postData.owner.display_name)} (${postData.owner.reputation.toLocaleString('en-US')} rep)` : '(deleted user)';

      // If link text contains a post URL, replace with full question title
      if (/\/(questions|q|a)\//.test(this.innerText)) {
        this.textContent = decodedPostTitle;
      }

      // Get link type
      const specialLinkType =
        this.href.includes('/revisions') ? `revisions for ${postData.post_type} –` : // post revisions
          this.href.includes('/timeline') ? 'post timeline –' : // post timeline
            this.href.includes('#comment') ? `comment on ${postData.post_type} –` : // comment permalink
              this.href.includes('/staging-ground/') ? `staging ground question –` : // staging ground (SO)
                this.href.includes('/show-flags') ? `flags on ${postData.post_type} –` : // mod-only flags page
                  null;

      const viewLinkType = specialLinkType ? `view ${specialLinkType}\n` : '';

      // Update title attribute with post info
      this.title = `${viewLinkType}${decodedPostTitle}
\t${postData.post_type === 'question' ? 'question by ' : 'answer by    '} ${postOwnerInfo}
\tcreated on    ${dateToIsoString(seApiDateToDate(postData.creation_date))}
\tlast activity   ${dateToIsoString(seApiDateToDate(postData.last_activity_date))}`;

      // Update link with short permalink
      // ONLY if not special post link
      if (!specialLinkType) {
        this.href = postData.link;
      }

      // If link element has a child element .relativetime, update the title attribute
      const timeSpan = this.querySelector('.relativetime');
      if(timeSpan) {
        timeSpan.originalTitle = timeSpan.title;
        timeSpan.title = `${timeSpan.title}\n` + this.title;
      }
    });

    // Short delay before processing next group
    await delay(500);

  } // End group loop
}


// On script run
(function init() {
  processLinksOnPage();

  // After ajax requests have completed
  $(document).ajaxStop(function () {
    setTimeout(processLinksOnPage, 500);
  });

  // Occasionally check for new links
  setTimeout(processLinksOnPage, 8000);
})();