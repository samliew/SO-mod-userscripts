// ==UserScript==
// @name         Chat Redact Messages
// @description  Add "Redact + Purge + Delete" button to message history page
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      3.0
//
// @match      https://chat.stackoverflow.com/*
// @match      https://chat.stackexchange.com/*
// @match      https://chat.meta.stackexchange.com/*
// @updateURL  https://github.com/samliew/SO-mod-userscripts/raw/master/ChatRedactMessages.user.js
// @downloadURL https://github.com/samliew/SO-mod-userscripts/raw/master/ChatRedactMessages.user.js
// ==/UserScript==

/* globals StackExchange, GM_info, window, unsafeWindow */

'use strict';

const _window = window || unsafeWindow;
const store = _window.localStorage;
let cachedfkey = store.getItem('fkey');
let redactText = `[message redacted by moderator]`;

function doPageLoad() {

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
                fetch('https://' + location.hostname + '/messages/' + mid + '/delete', {
                    method: 'POST',
                    body: form
                });
            }

            // Edit to replace message with redactText
            form = new FormData();
            form.append('fkey', cachedfkey);
            form.append('text', '*' + redactText + '*');
            fetch('https://' + location.hostname + '/messages/' + mid, {
                method: 'POST',
                body: form
            }).then(() => {

                    // Purge history
                    form = new FormData();
                    form.append('fkey', cachedfkey);
                    fetch('https://' + location.hostname + '/messages/' + mid + '/purge-history', {
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

        // Always re-cache latest fkey if available
        if (typeof _window.fkey === 'function') {

            // Cache fkey for use in message history page
            store.setItem('fkey', _window.fkey().fkey);
        }

        // When message actions link is clicked
        document.querySelectorAll('#chat .action-link, #transcript .action-link').forEach(elm => {
            elm.addEventListener('click', evt => {
                const message = evt.target.closest('.message');
                const mid = message.id.replace(/[^\d]+/g, '');
                // wait for the DOM to add the popup element
                waitForElm(message, '.popup').then(popup => {
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
}

// Credit to https://stackoverflow.com/a/61511955 for the base code
function waitForElm(parent, selector) {
    return new Promise(resolve => {
        if (parent.querySelector(selector)) {
            return resolve(parent.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (parent.querySelector(selector)) {
                resolve(parent.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(parent, {
            childList: true,
            subtree: true
        });
    });
}

// On page load
doPageLoad();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
#redactpurge {
position: relative;
top: -2px;
margin-left: 10px;
}
`;
document.body.appendChild(styles);
