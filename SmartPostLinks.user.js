// ==UserScript==
// @name         Smart Post Links
// @description  Replaces the link text in comments and posts with the full question title, and adds post info in the title attribute
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

const seApiKey = 'lSrVEbQTXrJ4eb4c3NEMXQ((';


const urlToSiteApiSlug = url => new URL(url).hostname.replace(/(\.stackexchange)?\.(com|net|org)$/, '').trim();

const groupBySiteApiSlug = arr => {
  const groups = {};
  for (const item of arr) {
    const key = urlToSiteApiSlug(item);
    groups[key] = groups[key] || [];
    const postId = getPostId(item);
    if(postId) groups[key].push(postId);
  }
  return groups;
};


async function processLinksOnPage() {

  const postLinksToProcess = $('a[href!="#"]', '#mainbar, #chat, #transcript, #content').filter(function () {
    return /\/(?:questions|q|a)\/\d+/.test(this.href) && // only post links
      !$(this).closest('.post-menu, .votecell, .post-signature, .user-info, .post-stickyheader').length; // not a child element of these containers
  }).not('.js-smart-link').addClass('js-smart-link');

  // Extract siteApiSlug and postId from links
  postLinksToProcess.each(function () {
    this.dataset.siteApiSlug = urlToSiteApiSlug(this.href);
    this.dataset.postId = getPostId(this.href);
  });

  // Group by site before sending off in separate requests to API
  const postLinks = postLinksToProcess.get().map(v => v.href);
  const postIdsByGroup = groupBySiteApiSlug(postLinks);

  for (const [siteApiSlug, postIds] of Object.entries(postIdsByGroup)) {

    // Duplicate ids will be handled by getPostsFromApi()
    const postsData = await getPostsFromApi(postIds, 'default', 'creation', 'desc', siteApiSlug);
    if (!postsData?.length) {
      console.error('getPostsFromApi - No posts data found.', siteApiSlug, postIds);
      return;
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
        console.error('getPostsFromApi - No post data found.', linkSiteApiSlug, postId, this);
        this.title = '(deleted post)';
        return;
      }

      // Preserve original title and text
      this.dataset.originalTitle = this.title;
      this.dataset.originalText = this.innerText;
      this.dataset.originalHref = this.href;

      const decodedPostTitle = htmlDecode(postData.title);
      const postOwnerInfo = postData.owner ? `${postData.owner.display_name} (${postData.owner.reputation.toLocaleString('en-AU')} reputation)` : '(deleted user)';

      // If link text contains a post URL, replace with full question title
      if (/\/(questions|q|a)\//.test(this.innerText)) {
        this.textContent = decodedPostTitle;
      }

      // Update title attribute with post info
      this.title = `${decodedPostTitle}
${postData.post_type} by ${postOwnerInfo}
created on  ${dateToIsoString(seApiDateToDate(postData.creation_date))}
last activity ${dateToIsoString(seApiDateToDate(postData.last_activity_date))}`;

      // Update link with short permalink
      this.href = postData.link;
    });
  }

  await delay(500); // short delay before processing next group
}


// On script run
(function init() {

  // After requests have completed
  $(document).ajaxStop(processLinksOnPage);
})();