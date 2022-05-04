// ==UserScript==
// @name         Expand Short Links
// @description  Appends more characters to short link texts in posts and comments so they can be easily seen and clicked on
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.1
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*.stackexchange.com/*
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';

if (typeof unsafeWindow !== 'undefined' && window !== unsafeWindow) {
    window.jQuery = unsafeWindow.jQuery;
    window.$ = unsafeWindow.jQuery;
}

function expandShortLinks() {
    $('.js-post-body, .comment-copy').find('a').not('.post-tag').not('.shortlink').filter((i, el) => el.innerText.length > 0 && el.innerText.length <= 2 && el.children.length == 0).addClass('shortlink');
}


// On page load
expandShortLinks();
$(document).ajaxComplete(expandShortLinks);


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
a.shortlink {
    font-weight: bold;
    color: var(--red-500) !important;
}
a.shortlink:after {
    content: '_link';
    color :var(--green-400);
    font-style: italic;
    font-weight: normal;
}
`;
document.body.appendChild(styles);
