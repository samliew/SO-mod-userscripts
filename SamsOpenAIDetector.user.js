// ==UserScript==
// @name         Sam's OpenAI Detector
// @description  Detect OpenAI in post content
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      1.1
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

const oaiUrl = 'https://openai-openai-detector--8j7k8.hf.space/';

const detectGpt = async content => {
  content = content.replace(/\s*[\n\r]+\s*/gi, ' ').trim();
  const resp = await fetch(`${oaiUrl}?${encodeURIComponent(content)}`);

  // Request failed
  if (!resp.ok) {
    return { success: false, error: resp.error };
  }

  // Request successful
  const data = await resp.json();
  return { success: true, data };
};


// On script run
(function init() {

  // Add Detect GPT button
  const postMenus = document.querySelectorAll('.js-post-menu > .s-anchors');
  postMenus.forEach(el => {
    const menuItem = makeElemFromHtml(`
      <div class="flex--item">
        <button type="button" class="js-detect-gpt-btn s-btn s-btn__link" title="Detect GPT">
          Detect GPT
        </button>
      </div>`);
    el.append(menuItem);
  });

  document.addEventListener('click', async (evt) => {
    const target = evt.target;

    // Only run on Detect GPT button
    if (!target.classList.contains('js-detect-gpt-btn')) return;

    // Get post content
    const post = target.closest('.question, .answer');
    const postId = post.dataset.questionid || post.dataset.answerid;

    // Get post body
    const postBody = post.querySelector('.js-post-body, .s-prose, [itemprop="text"]');
    if (!postBody) return console.error(`No post body found for ${postId}!`);

    // Make a shadow copy of post body, remove aside elements
    const postBodyClone = postBody.cloneNode(true);
    postBodyClone.querySelectorAll('aside').forEach(el => el.remove());
    const content = postBodyClone.innerText;

    // Has ran, do nothing
    if (target.classList.contains('js-detect-gpt-loading')) return;
    target.classList.add('js-detect-gpt-loading');

    // Detect GPT
    StackExchange.helpers.addSpinner(target);
    const result = await detectGpt(content);
    StackExchange.helpers.removeSpinner();
    //console.log(`Detect GPT result for ${postId}`, content, result);

    if (result.success && result.data?.fake_probability) {
      const percFake = result.data.fake_probability * 100;
      if (isNaN(percFake)) return console.error(`Invalid detect GPT result for ${postId}!`, result.data);

      // Insert result after button
      const resultElem = makeElem('a', {
        class: `js-detect-gpt-result ml4 ${percFake > 90 ? 'fc-red-600' : percFake > 75 ? 'fc-orange-600' : 'fc-black-800'}`,
        title: 'Probability of content being fake/GPT-generated',
        href: oaiUrl,
        target: '_blank',
      }, `${percFake.toFixed(2)}%`);
      target.parentElement.insertBefore(resultElem, target.nextSibling);

      // Change button text to copy to clipboard
      target.innerText = 'Copy';
      target.title = 'Copy post content to clipboard';
      target.classList.add('js-detect-gpt-copy');
      target.classList.remove('js-detect-gpt-btn', 'js-detect-gpt-loading');
    }
  });

  document.addEventListener('click', async (evt) => {
    const target = evt.target;

    // Only run on copy button
    if (!target.classList.contains('js-detect-gpt-copy')) return;

    // Get post content
    const post = target.closest('.question, .answer');
    const postId = post.dataset.questionid || post.dataset.answerid;
    const content = post.querySelector('.js-post-body, .s-prose, [itemprop="text"]')?.innerText;
    if (!content) return console.error(`No content found for ${postId}!`);

    const copied = copyToClipboard(content);
    if (copied) {
      StackExchange.helpers.showSuccessMessage('Post content copied to clipboard!');
    }
  });

})();