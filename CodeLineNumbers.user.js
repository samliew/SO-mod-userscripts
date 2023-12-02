// ==UserScript==
// @name         Code Line Numbers
// @description  Insert line numbers into code blocks
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      1.2
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
// ==/UserScript==

/* globals StackExchange, jQuery */
/// <reference types="./globals" />

'use strict';


// Append styles
addStylesheet(`
.s-prose,
.js-post-body {
  position: relative;
}
.s-prose pre,
.js-post-body pre {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
}
.s-prose pre > .line-numbers,
.js-post-body pre > .line-numbers {
  position: sticky;
  top: 0;
  left: calc(-1 * var(--su12));
  margin: calc(-1 * var(--su12));
  margin-right: var(--su12);
  padding: var(--su12);
  font-size: var(--_pr-code-fs);
  background-color: white;
  color: var(--black-300);
  text-align: right;
  pointer-events: none;
  user-select: none;
}
.s-prose .copy-code,
.js-post-body .copy-code {
  position: absolute;
  right: 0;
  margin: 0 !important;
  z-index: 1;
  opacity: 0;
}
.copy-code:has(+ pre:hover) {
  opacity: 0.5;
}
.copy-code:hover {
  opacity: 1;
}
`); // end stylesheet


function addLineNumbers() {

  // Get code blocks on page
  document.querySelectorAll('.s-prose pre, .js-post-body pre').forEach(pre => {

    // Only once per code block (line numbers was already added)
    if (pre.querySelector('.line-numbers, [class*="line-numbers"]')) return;

    // Make line numbers element and insert before code block
    const lineNumbers = pre.querySelector('code').textContent.split('\n').filter(((v, i, a) => i < a.length - 1 || v !== '')).map((_, i) => i + 1);
    const ln = makeElem('div', { class: 'line-numbers' });
    ln.textContent = lineNumbers.join('\n');
    pre.prepend(ln);

    // Add copy button
    const copyBtn = makeElem('button', { class: 's-btn s-btn__muted s-btn__outlined s-btn__xs s-btn__icon copy-code' }, 'copy');
    pre.insertAdjacentElement('beforebegin', copyBtn);

    // Copy code on click
    copyBtn.addEventListener('click', function () {
      copyToClipboard(pre.querySelector('code').textContent);
      this.textContent = 'copied!';
      setTimeout(() => this.textContent = 'copy', 1400);
    });
  });
}


// On script run
(function init() {

  // Mutation observer to detect hljs init
  const observer = new MutationObserver(function (mutationsList, observer) {
    // Check if hljs class was added to any code element
    const hljs = !!mutationsList.filter(m => m.target.nodeName === 'CODE' && m.target.classList?.contains('hljs')).length;
    if (hljs) {
      observer.disconnect();
      addLineNumbers();
    }
  });
  observer.observe(document.body, { childList: false, subtree: true, attributes: true });

  // On page load
  addLineNumbers();

})();