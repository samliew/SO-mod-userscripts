// ==UserScript==
// @name         Sam's OpenAI Detector
// @description  Detect OpenAI in post content and revisions
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      2.0
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
//
// @grant        GM_xmlhttpRequest
// ==/UserScript==

/* globals StackExchange */
/// <reference types="./globals" />

'use strict';

let oaiUrl = 'https://openai-openai-detector--8j7k8.hf.space/';

const detectGpt = async content => {
  content = content?.trim(); // trim whitespace

  const returnData = {
    success: false,
    content,
    length: content.length
  };

  // Validation
  if (content?.length < 100) {
    returnData.error = 'Content too short';
  }
  else {
    // Send to API
    const resp = await fetch(`${oaiUrl}?${encodeURIComponent(content)}`);
    returnData.fetch = resp;

    if (!resp?.ok) {
      returnData.error = resp?.error;
    }
    else {
      const data = await resp.json();
      returnData.success = true;
      returnData.data = data;
    }
  }

  return returnData;
};


// Append styles
addStylesheet(`
.js-detect-gpt-result {
  font-weight: bold;
}
`); // end stylesheet


// On script run
(async function init() {

  // Add Detect GPT buttons to each post menu, and post revisions menu
  document.querySelectorAll('.js-post-menu > .s-anchors, .js-revision .s-anchors').forEach(el => {
    const menuItem = makeElemFromHtml(`
      <div class="flex--item">
        <button type="button" class="js-detect-gpt-btn s-btn s-btn__link" title="Detect GPT">
          Detect GPT
        </button>
      </div>`);
    el.append(menuItem);
  });

  // Click event for Detect GPT buttons
  document.addEventListener('click', async (evt) => {
    const target = evt.target;

    // Only run on "Detect GPT" or "Copy" button
    if (!['js-detect-gpt-btn', 'js-detect-copy'].some(v => target.classList.contains(v))) return;

    // Copy to clipboard
    if (target.classList.contains('js-detect-copy') && target.dataset.content) {
      const copied = copyToClipboard(target.dataset.content);
      if (copied) {
        StackExchange.helpers.showToast('Post content copied to clipboard!', {
          type: 'success',
          useRawHtml: false,
          transient: true,
          transientTimeout: 3e3,
        });
      }
      return;
    }

    // Detecting, do nothing
    if (target.classList.contains('js-detect-gpt-loading')) return;
    target.classList.add('js-detect-gpt-loading');

    // Get post content
    const post = target.closest('.question, .answer, .candidate-row, .js-revision');
    const isPostRevision = post.classList.contains('js-revision');
    const postRevisionUrl = isPostRevision && target.closest('.s-anchors')?.children[0]?.getAttribute('href');
    const postId = isPostRevision ? getPostId(location.pathname) : (post.dataset.questionid || post.dataset.answerid || post.dataset.postid);

    // Get content
    const content = postRevisionUrl ? await getRevisionSource(postRevisionUrl) : await getLatestPostRevisionSource(postId);

    // No content found
    if (typeof content !== 'string' || !content?.length) {
      StackExchange.helpers.showToast(`Could not detect GPT for ${postId}: No post body found`, {
        type: 'danger',
        useRawHtml: false,
        transient: false,
      });
    }

    // Detect GPT
    StackExchange.helpers.addSpinner(target);
    const result = await detectGpt(content);
    StackExchange.helpers.removeSpinner();
    console.log(`Detect GPT result for ${postId}`, result);

    if (result.success && !isNaN(result.data?.fake_probability)) {
      const percFake = result.data.fake_probability * 100;

      // Insert result after button
      const resultElem = makeElem('a', {
        class: `js-detect-gpt-result ml12 ${percFake > 90 ? 'fc-red-600' : percFake > 75 ? 'fc-orange-600' : 'fc-black-800'}`,
        title: 'Probability of content being fake/GPT-generated',
        href: oaiUrl,
        target: '_blank',
      }, `${percFake.toFixed(2)}%`);
      target.parentElement.insertBefore(resultElem, target.nextSibling);

      // Change button text to copy to clipboard
      target.innerText = 'Copy';
      target.title = 'Copy post content to clipboard';
      target.classList.remove('js-detect-gpt-btn');
      target.classList.add('js-detect-copy');
      target.dataset.content = content;
    }
    else {
      // Show error
      StackExchange.helpers.showToast(`Could not detect GPT for ${postId}:<br>${result.error}`, {
        type: 'danger',
        useRawHtml: true,
        transient: false,
      });

      // Reset button, allow retry
      target.classList.remove('js-detect-gpt-loading');
    }
  });

  // Get final URL of OpenAI Detector load balancer redirect
  oaiUrl = await getFinalUrl('https://huggingface.co/openai-detector') || oaiUrl;
  console.info('OpenAI Detector URL', oaiUrl);

})();