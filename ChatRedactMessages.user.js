// ==UserScript==
// @name         Chat Redact Messages
// @description  Add "Redact + Purge + Delete" button to message history page
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      4.0.11
//
// @match        https://chat.stackoverflow.com/*
// @match        https://chat.stackexchange.com/*
// @match        https://chat.meta.stackexchange.com/*
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/se-ajax-common.js
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

/* globals StackExchange, store, fkey */
/// <reference types="./globals" />

'use strict';

// This is a moderator-only userscript
if (!isModerator()) return;


const storeKey = `fkey-${location.hostname}`;
let cachedfkey = store.getItem(storeKey);
let redactText = `[message redacted by moderator]`;


// Append styles
addStylesheet(`
#redactpurge {
  position: relative;
  top: -2px;
}
`); // end stylesheet


// On script run
(function init() {

  // On message history page
  if (/^\/messages\/\d+\/history$/.test(location.pathname) && cachedfkey != null) {

    const mid = Number(location.pathname.replace(/[^\d]+/g, ''));
    const header = document.getElementById('content').querySelector('h2');
    const currMessage = document.querySelector('.message > .content').innerText;
    const isDeleted = header.innerText.includes('deletion');
    const isRedacted = currMessage === redactText || currMessage.includes('redact');

    // If already redacted, do nothing
    if (isRedacted) return;

    // Add redact button next to header
    header.insertAdjacentHTML('afterend', '<input class="button" type="submit" value="Redact + Purge + Delete" id="redactpurge">');
    const redactBtn = document.getElementById('redactpurge');

    // Click event on button
    redactBtn.addEventListener('click', evt => {

      // Disable button to prevent double-clicking
      evt.target.disabled = true;
      let form;

      // Delete if not already deleted
      if (!isDeleted) {
        form = new FormData();
        form.append('fkey', cachedfkey);
        fetch(location.origin + '/messages/' + mid + '/delete', {
          method: 'POST',
          body: form
        });
      }

      // Edit to replace message with redactText
      form = new FormData();
      form.append('fkey', cachedfkey);
      form.append('text', '*' + redactText + '*');
      fetch(location.origin + '/messages/' + mid, {
        method: 'POST',
        body: form
      }).then(() => {

        // Purge history
        form = new FormData();
        form.append('fkey', cachedfkey);
        fetch(location.origin + '/messages/' + mid + '/purge-history', {
          method: 'POST',
          body: form
        }).then(() => {
          // Refresh page to reflect changes
          location.reload();
        });
      });
    });
  }

  // Other chat pages
  else {

    // Cache fkey for use in message history page
    const newfkey = typeof _window.fkey === 'function' ? _window.fkey().fkey : document.querySelector('#fkey').value;
    if (newfkey) store.setItem(storeKey, newfkey);

    // When message actions link is clicked
    document.querySelectorAll('#chat .action-link, #transcript .action-link').forEach(elm => {
      elm.addEventListener('click', evt => {
        const message = evt.target.closest('.message');
        const mid = message.id.replace(/[^\d]+/g, '');
        // wait for the DOM to add the popup element
        waitForElem('.popup', message).then(popup => {
          popup = popup[0];
          const histlink = popup.querySelector('a[href$=history]');
          // If no history link in popup, insert history link after permalink
          if (!histlink) {
            const permalink = popup.querySelector('a[href^="/transcript/message/"]');
            permalink.innerText = 'link';
            permalink.parentElement.lastElementChild.remove(); // remove <br>
            permalink.parentElement.insertAdjacentHTML('beforeend', '; <a href="/messages/' + mid + '/history" title="view and redact message history">history</a><br>');
          } else {
            histlink.title = 'view and redact message history';
          }
        });
      });
    });
  }
})();