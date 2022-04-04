// ==UserScript==
// @name         Chat Transcripts By Default
// @description  In Q&A posts and comments, rewrites chat room links to chat transcript to avoid accidentally joining the room
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.1
//
// @include      https://*stackoverflow.com/questions/*
// @include      https://*serverfault.com/questions/*
// @include      https://*superuser.com/questions/*
// @include      https://*askubuntu.com/questions/*
// @include      https://*mathoverflow.net/questions/*
// @include      https://*.stackexchange.com/questions/*
//
// @include      https://*stackoverflow.com/admin/dashboard*
// @include      https://*serverfault.com/admin/dashboard*
// @include      https://*superuser.com/admin/dashboard*
// @include      https://*askubuntu.com/admin/dashboard*
// @include      https://*mathoverflow.net/admin/dashboard*
// @include      https://*.stackexchange.com/admin/dashboard*
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';

if (unsafeWindow !== undefined && window !== unsafeWindow) {
    window.jQuery = unsafeWindow.jQuery;
    window.$ = unsafeWindow.jQuery;
}

function convertChatLinksToTranscript() {

    // For each link in comments, where url matches chat + rooms
    const links = $('.comment-copy a, .js-post-body a')
        .not('.js-chat-transcript')
        .filter((i, el) => el.href.includes('chat.') >= 0 && (el.href.includes('/rooms/') || el.href.includes('/transcript/')) && !el.href.includes('/info'))
        .addClass('js-chat-transcript')
        .attr('href', (i, v) => v.replace('/rooms/', '/transcript/'))
        .attr({
            target: '_blank',
            title: 'Open chat transcript in a new window'
        })
        .html((i, v) => v + ' <em>(chat transcript)</em>');

    console.log(links);
}

function listenToPageUpdates() {

    // On any page update
    $(document).ajaxComplete(function (event, xhr, settings) {

        // If comments have updated
        if (settings.url.indexOf('/comments') >= 0) convertChatLinksToTranscript();
    });
}


// On page load
listenToPageUpdates();
setTimeout(convertChatLinksToTranscript, 50);


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
a[href*="/transcript/"] em {
    font-size: 0.85em;
}
`;
document.body.appendChild(styles);
