// ==UserScript==
// @name         Discussed on Meta
// @description  For questions and answers, displays info if it's discussed on Meta. On arrow mouseover, displays the Meta posts
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      4.1
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
// @exclude      *chat.*
// @exclude      *blog.*
// @exclude      *meta.*
// @exclude      */tour
//
// @connect      *
// @connect      self
// @connect      stackoverflow.com
// @connect      serverfault.com
// @connect      superuser.com
// @connect      askubuntu.com
// @connect      mathoverflow.com
// @connect      stackapps.com
// @connect      stackexchange.com
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/se-ajax-common.js
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
//
// @grant        GM_xmlhttpRequest
// ==/UserScript==

/* globals StackExchange */
/// <reference types="./globals" />

'use strict';

const siteMetaHostname = metaUrl.replace('https://', '');


const doSearch = (postElem, searchQuery, searchDomain) => {
  const pid = postElem.dataset.answerid || postElem.dataset.questionid;
  const searchUrl = `https://${searchDomain}/search?tab=newest&q=${searchQuery}&deleted=any`;
  console.log(`Searching ${searchDomain} for post ${pid}`, searchUrl);

  ajaxPromise(searchUrl).then(function (data) {
    const count = Number($('.results-header h2, .fs-body3', data).first().text().replace(/[^\d]+/g, ''));
    if (!count) return;

    const results = $('.js-search-results .js-post-summary', data);
    const lastMentioned = results.first().find('.relativetime').text();
    const lastPermalink = results.first().find('a').first().attr('href');
    results.find('a').attr('href', (i, v) => 'https://' + searchDomain + v).attr('target', '_blank');

    // Create meta posts container
    const metaName = searchDomain === 'meta.stackexchange.com' ? 'Meta Stack Exchange' : 'Meta';
    const metaPosts = $(`
      <div class="meta-mentioned" target="_blank">
        <a href="${searchUrl}" target="_blank">${count} posts</a> on ${metaName},
        last seen <a href="https://${searchDomain}${lastPermalink}" target="_blank">${lastMentioned}</a>
        <span class="meta-mentions-toggle"></span>
      </div>`).insertBefore(postElem);

    // Append search results
    $(`<div class="meta-mentions"></div>`).append(results).appendTo(metaPosts);
  });
};


// Append styles
addStylesheet(`
.meta-mentioned {
  position: relative;
  width: 100%;
  height: 38px;
  margin: 0 0 15px;
  padding: 10px 12px;
  background: var(--yellow-050);
  border: 1px solid var(--yellow-200);
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
  top: 4px;
  right: 4px;
  display: block;
  width: 28px;
  height: 32px;
  cursor: pointer;
}
.meta-mentions-toggle:before {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 4px;
  left: 0;
  background: var(--black-100);
  border-radius: 3px;
}
.meta-mentions-toggle:after {
  content: "";
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
  box-shadow: 5px 5px 5px -3px rgba(0, 0, 0, 0.1);
  z-index: 1;
}
.meta-mentions .js-post-summary {
  max-width: 100%;
  padding: 10px 0;
}
.meta-mentions .js-post-summary:last-child {
  border: none;
}
.s-post-summary .s-post-summary--content-title {
  margin-bottom: 6px;
  line-height: 1;
}
.meta-mentions .js-post-summary .s-post-summary--content-title a {
  font-size: 14px;
}
.meta-mentions .js-post-summary .s-post-summary--content-excerpt {
  font-size: 12px;
  line-height: 1.3;

  -webkit-line-clamp: 2;
}
.meta-mentions .js-post-summary .js-tags .js-post-tag-list-wrapper {
  margin-bottom: 0;
}
.meta-mentions .js-post-summary .js-tags .post-tag {
  font-size: 10px;
  pointer-events: none;
}
.meta-mentions .s-post-summary--stats {
  margin-top: 3px;
}
.meta-mentions .s-post-summary--stats .s-post-summary--stats-item {
  font-size: 10px;
}
`); // end stylesheet


// On script run
(function init() {

  // Up to first three questions and answers, unless user is a moderator
  $('.question, .js-question, .answer, .js-answer').slice(0, isModerator() ? 20 : 3).each(function () {
    const pid = this.dataset.answerid || this.dataset.questionid;

    // Ignore if too short, will generate lots of false positives
    if (pid <= 99999) return;

    // Build search query
    const searchQuery = encodeURIComponent(`url://${location.hostname}/*/${pid}`);

    // Check if post is discussed on site meta
    doSearch(this, searchQuery, siteMetaHostname);

    // If we are on Stack Overflow, also check if post is discussed on MSE
    if (location.hostname === 'stackoverflow.com') {
      doSearch(this, searchQuery, 'meta.stackexchange.com');
    }
  });

})();