// ==UserScript==
// @name         No Oneboxes in Chat
// @description  Collapses oneboxes from chat rooms/transcripts/bookmarks, click to display onebox
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      3.1.11
//
// @match        https://chat.stackoverflow.com/rooms/*
// @match        https://chat.stackexchange.com/rooms/*
// @match        https://chat.meta.stackexchange.com/rooms/*
//
// @match        https://chat.stackoverflow.com/transcript/*
// @match        https://chat.stackexchange.com/transcript/*
// @match        https://chat.meta.stackexchange.com/transcript/*
//
// @match        https://chat.stackoverflow.com/rooms/*/conversation/*
// @match        https://chat.stackexchange.com/rooms/*/conversation/*
// @match        https://chat.meta.stackexchange.com/rooms/*/conversation/*
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/se-ajax-common.js
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
//
// @grant        unsafeWindow
// ==/UserScript==

/* globals StackExchange, _window */
/// <reference types="./globals" />

'use strict';

const showOneboxTitle = 'click to show onebox';
const hideOneboxTitle = 'click to hide onebox';

/**
 * @summary Hide all oneboxes on any page update
 * @param {number} mid - message ID to re-hide its expanded onebox, OR -1 to re-hide all expanded oneboxes
 * @example hideOneboxes(12345678); // re-hide onebox for message ID 12345678
 */
const hideOneboxes = function (mid = null) {

  // Process new oneboxes on page
  document.querySelectorAll('.onebox').forEach(ob => {
    if(ob.classList.contains('js-onebox-hidden')) return; // already processed

    // Hide onebox
    ob.classList.add('js-onebox-hidden');

    // Get onebox permalink is usually the first URL in the onebox
    let url = ob.querySelector('a[href]').href;

    // If onebox type is a tweet, permalink is the last link in onebox
    if (ob.classList.contains('ob-tweet')) url = ob.querySelector('a:last-of-type').href;

    // If onebox type is an image, preload
    if (ob.classList.contains('ob-image')) ob.querySelector('img').src = url;

    // Make placeholder element to toggle onebox
    const obPlaceholder = makeElemFromHtml(
      `<span class="has-onebox" title="${showOneboxTitle}"><a href="${url}" class="onebox-url" target="_blank">${url}</a></span>`
    );

    // Placeholder click event handler
    obPlaceholder.addEventListener('click', function () {
      this.classList.toggle('js-show-onebox');
      this.title = ob.classList.contains('js-show-onebox') ? showOneboxTitle : hideOneboxTitle;
    });
    ob.insertAdjacentElement('beforebegin', obPlaceholder);

    // Also collapse user signature (use tiny-signature)
    const tinySignature = ob.closest('.monologue').querySelector('.tiny-signature');
    tinySignature.style.display = 'inline-block';
    tinySignature.parentElement.querySelectorAll(':scope > *:not(.tiny-signature)').forEach(el => el.style.display = 'none');
  });

  // Re-hide all expanded oneboxes
  if (mid === -1) {
    document.querySelectorAll('.js-show-onebox').forEach(el =>{
      el.classList.remove('js-show-onebox');
      el.title = showOneboxTitle;
    });
  }
  // Re-hide specific message's onebox
  else if (mid) {
    const ob = document.getElementById(`message-${mid}`).querySelector('.js-show-onebox');
    if (ob) {
      ob.classList.remove('js-show-onebox');
      ob.title = showOneboxTitle;
    }
  }
};
// Function promotion: Call window.hideOneboxes() from other scripts to hide all new oneboxes
_window.hideOneboxes = hideOneboxes;


// Append styles
addStylesheet(`
.has-onebox {
  display: block;
  padding: 0 1rem;
  border-left: 3px solid orange;
  cursor: zoom-in;
}
.js-show-onebox {
  cursor: zoom-out;
}
.js-onebox-hidden {
  display: none !important;
}
.js-show-onebox + .js-onebox-hidden {
  display: block !important;
}
.onebox-url {
  pointer-events: none;
}
`); // end stylesheet


// On script run
(function init() {

  // Once on page load, process oneboxes on page
  hideOneboxes();

  // Occasionally, process new oneboxes
  setInterval(hideOneboxes, 1000);

  // When page is not focused
  window.addEventListener('blur', function () {
    hideOneboxes(-1);
  });

})();