// ==UserScript==
// @name         Reduce Clutter
// @description  Revert updates that make the page more cluttered or less accessible
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      4.0.1
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
//
// @run-at       document-start
// ==/UserScript==

/* globals StackExchange */
/// <reference types="./globals" />

'use strict';

// Show announcement bar if it does not contain these keywords
const blacklistedAnnouncementWords = ['podcast', 'listen', 'tune', 'research', 'blog'];

// Hide ads/clickbaity blog posts titles if they contain these keywords
const blacklistedBlogWords = ['the loop', 'podcast', 'worst', 'bad', 'surprise', 'trick', 'terrible', 'will change', 'actually', 'team', 'try', 'free', 'easy', 'easier', 'e.p.', 'ep.'];


// Append styles to header
addStylesheet(`
/*
  Fix all Q&A links having same colour even when visited
*/
body .s-link {
  color: var(--theme-link-color) !important;
}
body .s-link:visited {
  color: var(--theme-link-color-visited) !important;
}


/*
  Fix comment upvote and flag always showing
  https://meta.stackexchange.com/q/312794
*/
ul.comments-list .comment-voting,
ul.comments-list .comment-flagging {
  visibility: hidden;
}
ul.comments-list .comment:hover .comment-voting,
ul.comments-list .comment:hover .comment-flagging,
ul.comments-list .comment-up-on {
  visibility: visible;
}
.popup-flag-comment {
  visibility: visible !important;
}


/*
  Make comment edited icon same color as timestamp
  https://meta.stackoverflow.com/q/371313
*/
.s-link,
.iconPencilSm {
  color: #9199a1 !important;
}


/*
  Revert change to permanent "edit tags" link
  https://meta.stackoverflow.com/q/374024
*/
.post-taglist #edit-tags {
  opacity: 0.5;
}
.post-layout:hover .post-taglist #edit-tags {
  opacity: 1;
}


/*
  Remove Products menu in the top bar
  https://meta.stackoverflow.com/q/386393
*/
.s-topbar--logo + ol,
.s-topbar--logo + [role="presentation"],
.s-topbar ol.s-navigation[role="presentation"],
.js-top-bar ol.s-navigation[role="presentation"] {
  display: none !important;
}


/*
  Hide announcements bar before page load,
    then check text for blacklisted words after page load
  https://meta.stackoverflow.com/q/390709
*/
#announcement-banner {
  display: none !important;
}


/*
  Hide newsletter sidebar ad to reclaim vertical space
  https://meta.stackoverflow.com/q/360450
*/
#newsletter-ad {
  display: none !important;
}


/*
  Hide "new contributor" popover
  Hide "new contributor" displaying twice on a post (post author and when commenting)
  https://meta.stackoverflow.com/q/372877
*/
.js-new-contributor-popover {
  display: none !important;
}
.comments .new-contributor-indicator {
  display: none !important;
}


/*
  Better "duplicates edited list" in question revisions page
  Works with "betterDuplicatesEditedList()" function below
  https://meta.stackoverflow.com/q/400817
*/
.js-revisions .js-revision-comment.somu-duplicates-edited {
  display: block;
  padding-top: 5px;
}
.js-revisions .js-revision-comment.somu-duplicates-edited ul {
  margin-bottom: 0;
}
.js-revisions .js-revision-comment.somu-duplicates-edited li {
  padding-top: 0;
}
.js-revisions .originals-of-duplicate li {
  position: relative;
  cursor: initial;
  list-style-type: none;
}
.js-revisions .originals-of-duplicate li:before {
  display: block;
  position: absolute;
  top: 0;
  left: -16px;
  font-size: 1.2em;
  font-weight: bold;
  content: '•';
  color: var(--black-300);
}
.js-revisions .js-revision-comment.somu-duplicates-edited .originals-of-duplicate li.somu-dupe-added:before {
  content: '+';
  color: var(--green-600);
  left: -18px;
}
.js-revisions .js-revision-comment.somu-duplicates-edited .originals-of-duplicate li.somu-dupe-removed:before {
  content: '–';
  color: var(--red-600);
  top: -2px;
  left: -18px;
}
.js-revisions .d-flex.ai-center.fw-wrap {
  display: block !important;
}


/*
  Hide follow post tooltip popup
  https://meta.stackexchange.com/q/345661
*/
.js-follow-post ~ .s-popover {
  display: none !important;
}


/*
  Set a variable max-height for code blocks
  https://meta.stackoverflow.com/q/397012
*/
.js-post-body pre,
.wmd-preview pre {
  max-height: 80vh;
}


/*
  Remove edit button from question closed notice
  https://meta.stackexchange.com/q/349479
*/
.js-post-notice .mt24:last-child {
  display: none;
}


/*
  Revert large margins on .s-prose
  https://meta.stackexchange.com/q/353446
*/
.s-prose {
  margin-bottom: 1.4em;
  line-height: 1.4em;
}
.s-prose blockquote {
  margin-left: 0px;
  line-height: 1.4em;
}
.s-prose:not(.reason) > * {
  margin-bottom: 1em !important;
}


/*
  Switch back to yellow background color for blockquotes
  https://meta.stackexchange.com/q/343919
  https://meta.stackexchange.com/q/344874
*/
.s-prose blockquote {
  margin-left: 0;
  margin-right: 0;
  padding: 1em;
  padding-left: 1.2em;
  background-color: var(--yellow-050) !important;
  color: inherit;
}


/*
  Fix some z-indexes to prevent them from being in front of (close) dialogs
*/
.s-btn-group .s-btn.is-selected {
  z-index: unset !important;
}


/* Expand profile descriptions on hover without using scrollbars in a small area */
#user-card .profile-user--about {
  max-height: auto;
  height: auto;
  overflow: hidden !important;
}
#user-card .profile-user--bio {
  height: 240px;
  overflow: hidden;
}
#user-card > .grid > .flex--item:hover .profile-user--bio {
  height: auto;
}


/*
  Revert post menu to lowercase
*/
#edit-tags,
.js-post-menu > .grid > .flex--item > a,
.js-post-menu > .grid > .flex--item > button {
  text-transform: lowercase;
}


/*
  Remove cookie consent banner
*/
.js-consent-banner {
  display: none;
}


/*
  Collectives - TylerH - https://meta.stackoverflow.com/a/423500
*/
/* Hides the collective content on the right sidebar */
#sidebar > div.s-sidebarwidget.js-join-leave-container {
  display: none;
}
#sidebar > .sidebar-subcommunity {
  display: none;
}
/* Hides the "recommended by <collective>" verbiage */
.js-endorsements {
  display: none;
}
/* Hides the trophy for Collectives ranking next to usernames in user cards*/
div.user-details > a[href^="/collectives"] {
  display: none;
}
ul.s-user-card--awards li a[href^="/collectives/"] {
  display: none;
}
/* Hides collective buttons on the tag line */
a.subcommunity-avatar,
a.subcommunity-topic-avatar {
  display: none;
}
div.js-community-icons {
  display: none;
}


/*
  Other Collectives elements
*/
/* Hides collectives in the question header */
#question-header + div .flex--item.fc-light:last-child {
  display: none;
}


/*
  Hide post reactions (Teams)
  https://meta.stackoverflow.com/q/398367
*/
.js-reactions {
  display: none !important;
}


/*
  Hides teams in the left sidebar
*/
.nav-links li:has(ol.nav-links .js-create-team-cta) {
  display: none;
}


/*
  Hide blocked ads still taking up 300px in right sidebar
*/
.js-sidebar-zone {
  min-height: 0 !important;
}
`, false); // end stylesheet


// On page load
document.addEventListener('DOMContentLoaded', function (evt) {

  // Make jQuery available when running in a userscript sandbox
  // See https://github.com/samliew/SO-mod-userscripts/issues/112
  if (typeof unsafeWindow !== 'undefined' && window !== unsafeWindow) {
    window.jQuery = unsafeWindow.jQuery;
    window.$ = unsafeWindow.jQuery;
  }

  // If rep notification is displaying low values, remove it
  let repBadge = document.querySelector('.js-achievements-button .indicator-badge');
  if (repBadge) {
    let repCount = Number(repBadge.innerText);
    if (repCount > -5 && repCount < 5) repBadge.parentNode.removeChild(repBadge);
  }

  showAnnouncementIfNotBlacklisted();
  hideClickbaityBlogPosts();
  setTimeout(stripUnnecessaryTracking, 2000);

  revertRelatedQuestions();
  initShortenBadgeCounts();
  initFixBrokenImages();

  betterDuplicatesEditedList();
});


/*
 * [feature]
 * Hide the announcement bar if it contains blacklisted keywords (usually used to promote podcasts or blog posts)
 */
function showAnnouncementIfNotBlacklisted() {

  const annBar = document.getElementById('announcement-banner');
  if (annBar) {

    const annText = annBar.innerText.trim().toLowerCase();
    const isBlacklisted = blacklistedAnnouncementWords && blacklistedAnnouncementWords.some(v => annText.includes(v));

    // Show announcement bar when it doesn't contain blacklisted keywords
    if (!isBlacklisted) {
      annBar.style.setProperty('display', 'block', 'important');
    }
    else {
      console.log('Reduce Clutter: Announcement bar has been blocked.', annText);
    }
  }
}


/*
 * [feature]
 * Hide click-baity blog posts from sidebar. If there are no remaining items, remove the blog section.
 */
function hideClickbaityBlogPosts() {

  // Hide clickbaity featured blog post titles from sidebar
  const blogheader = $('.s-sidebarwidget__yellow .s-sidebarwidget--header').filter((i, el) => el.innerText.includes('Blog'));
  if (blogheader.length) {
    let itemsRemoved = 0;
    let items = blogheader.nextAll('li').find('a[href^="https://stackoverflow.blog"]').each(function (i, el) {
      const blogtext = el.innerText.toLowerCase().trim();
      const isBlacklisted = blacklistedBlogWords && blacklistedBlogWords.some(v => blogtext.includes(v));
      const isSponsored = el.nextElementSibling?.innerText.includes('sponsored');
      if (isBlacklisted || isSponsored) {
        $(this).parents('li').remove();
        itemsRemoved++;
        console.log('Reduce Clutter: Featured blogpost has been blocked.', blogtext);
      }
    });

    // if no items remaining, remove "Blog" heading
    if (items.length == itemsRemoved) {
      blogheader.remove();
    }
  }
}


/*
 * [feature]
 * Remove tracking from elements (e.g.: links and buttons)
 */
function stripUnnecessaryTracking() {

  // Strip unnecessary tracking
  let trackedElemCount = 0;
  $('.js-gps-track, [data-ga], [data-gps-track], a[href*="utm_"]').each(function (i, el) {
    this.classList.remove('js-gps-track');
    el.dataset.ga = '';
    el.dataset.gpsTrack = '';
    el.removeAttribute('data-ga');
    el.removeAttribute('data-gps-track');

    // Specify which query params to remove from link
    let params = new URLSearchParams(el.search);
    params.delete('utm_source');
    params.delete('utm_medium');
    params.delete('utm_campaign');
    params.delete('utm_content');
    el.search = params.toString();

    trackedElemCount++;
  });
  console.log('Reduce Clutter: Removed tracking data from ' + trackedElemCount + ' elements.');

  // Strip unnecessary query params from Q&A links
  let trackedQaCount = 0;
  const linkTrackingRegex = /[?&]((cb|lq|rq)=\d+|ref=.*)/i;
  $('#content a, #sidebar a').each(function (i, el) {
    let isTracking = false;
    if (el.dataset.searchsession || el.dataset.tracker) {
      el.dataset.searchsession = '';
      el.dataset.tracker = '';
      isTracking = true;
    }
    if (el.search && linkTrackingRegex.test(el.search)) {
      el.href = el.getAttribute('href').replace(linkTrackingRegex, '');
      isTracking = true;
    }
    if (isTracking) trackedQaCount++;
  });
  $('.js-search-results').off('mousedown touchstart');
  console.log('Reduce Clutter: Removed tracking data from ' + trackedQaCount + ' Q&A links.');
}


/*
 * [feature]
 * Improve the display of duplicates edited list on the post revisions page
 */
function betterDuplicatesEditedList() {

  $('.js-revisions .js-revision-comment').not('.somu-duplicates-edited').each(function (i, el) {

    // Duplicates list edit revisions
    if (el.innerText.includes('duplicates list edited from')) {
      let replacedHtml = el.innerHTML
        .replace('duplicates list edited from', '<span>duplicates list edited from</span> <ul class="originals-of-duplicate">')
        .replace(/<\/a>\s+to\s+<a/, '</a></ul><span>to</span><ul class="originals-of-duplicate"><a')
        .replace(/\s*<\/a>,\s*/g, '</a>');
      el.innerHTML = replacedHtml + '</ul>';
      $(this).addClass('somu-duplicates-edited').find('a').wrap('<li>');

      // Highlight changes
      $(this).find('li').each(function () {
        this.dataset.linkedpostid = $(this).children('a').attr('href').match(/\/(\d+)\//)[1];
      });
      const firstList = $(this).children('.originals-of-duplicate').first();
      const secondList = $(this).children('.originals-of-duplicate').last();

      // Find removals
      firstList.children('li').each(function (i, el) {
        const removed = !secondList.children('li').get().map(v => v.dataset.linkedpostid).some(id => el.dataset.linkedpostid === id);
        $(this).toggleClass('somu-dupe-removed', removed);
      });

      // Find additions
      secondList.children('li').each(function (i, el) {
        const added = !firstList.children('li').get().map(v => v.dataset.linkedpostid).some(id => el.dataset.linkedpostid === id);
        $(this).toggleClass('somu-dupe-added', added);
      });
    }
  });
}


/*
 * [revert]
 * Revert the "Related" questions module under unanswered questions back to the sidebar
 * See https://meta.stackoverflow.com/q/423143 (2023-02-10)
 */
function revertRelatedQuestions() {

  const module = $('#inline_related_var_a_more, #inline_related_var_a_less').first();
  if (!module.length) return;

  // Set respective classes
  // module, move to sidebar
  module.removeClass('pt32 px16 d-none')
    .addClass('module sidebar-related')
    .insertBefore($('#feed-link, .zone-container-sidebar, #hireme', '#sidebar').first())
    .insertAfter($('#sidebar .sidebar-linked')); // optimal position, but falls back to above slots

  // module title
  module.children('.fs-body3')
    .removeClass('pb8 fs-body3')
    .addClass('fs-subheading mt16 mb16 pb2')
    .text((i, v) => v.replace(' questions', ''));

  // list
  module.children().last()
    .removeClass('bar-lg ba bc-black-150 js-gps-inline-related-questions')
    .addClass('related');

  // list items
  module.find('.spacer')
    .removeClass('bb bc-black-150');

  // links
  const links = module.find('.spacer > a')
    .removeClass('p12')
    .addClass('ai-start pr0');

  // score
  links.children('.s-badge')
    .addClass('mr8');

  // title wrapper
  links.children('.fl-grow1, .pr12')
    .removeClass('pr12')
    .addClass('ml2 h100 ai-center');

  // title (originally truncated)
  module.find('.break-word, .fs-body1, .v-truncate1')
    .removeClass('break-word fs-body1 m0 pl16 v-truncate1')
    .attr('title', '');

  // Remove expand link
  if ($('#inline_related_var_a_more').length > 1) $('#inline_related_var_a_less').remove();
  $('#inline_related_see_more').parent().remove();

  console.log('Reduce Clutter: Moved Related questions module back to sidebar.');
}


/*
 * [feature]
 * Fix badge counts that are too long and take up too much space causing wrapping
 */
function initShortenBadgeCounts() {

  function findAndShortenBadgeCounts() {
    $('.badgecount').not('[data-shortbadgecounts]').attr('data-shortbadgecounts', '').text((i, v) => v.length <= 3 ? v : v.replace(/\d{3}$/, 'k'));
  }

  findAndShortenBadgeCounts();
  $(document).ajaxStop(findAndShortenBadgeCounts); // on page update
}


/*
 * [bugfix]
 * Some images (e.g.: avatars) may be broken or blocked - this will replace them with a transparent image with a gray background
 */
function initFixBrokenImages() {

  function fixBrokenImages() {

    // Apply to newly-loaded unprocessed images
    $('img').not('[js-error-check]').attr('js-error-check', '').each(function (i, img) {

      const originalImg = img.src;

      // When image throws an error, set to transparent svg with gray background
      img.addEventListener('error', function (evt) {
        img.setAttribute('data-original-image', originalImg);
        img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"; // https://stackoverflow.com/a/26896684
        img.style.background = 'var(--black-100)';
        img.classList.add('img-haserror');
      });

      // Workaround for cached images, swap the source so we can catch any image errors after setting the event listener
      img.src = '#';
      img.src = originalImg;
    });
  }

  fixBrokenImages();
  $(document).ajaxStop(fixBrokenImages); // on page update
}
