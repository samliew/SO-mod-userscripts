// ==UserScript==
// @name         User History Improvements
// @description  Fixes broken links in user annotations, and minor layout improvements
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      3.0
//
// @include      https://*stackoverflow.com/users/history/*
// @include      https://*serverfault.com/users/history/*
// @include      https://*superuser.com/users/history/*
// @include      https://*askubuntu.com/users/history/*
// @include      https://*mathoverflow.net/users/history/*
// @include      https://*.stackexchange.com/users/history/*
// ==/UserScript==

/* globals StackExchange */

'use strict';

if (unsafeWindow !== undefined && window !== unsafeWindow) {
    window.jQuery = unsafeWindow.jQuery;
    window.$ = unsafeWindow.jQuery;
}

const uid = Number(location.pathname.match(/\/(\d+)/)[1]);


function moveHistoryFilters() {

    const origFilters = $('#summary');
    const newFilters = $('<div id="newHistoryFilters"></div>').insertAfter('#infoAndSpecialEvents');

    origFilters.children().appendTo(newFilters);
    origFilters.remove();

    // wrap count in span and sort by text
    newFilters.find('li').each(function (i, el) {
        if (el.childNodes.length == 2) {
            $(el.childNodes[1]).wrap('<span class="count"></span>');
        }
        else {
            $(el).prepend('<span></span>');
        }
    }).sort(function (a, b) {
        const x = a.children[0].innerText.toLowerCase();
        const y = b.children[0].innerText.toLowerCase();
        return x == y ? 0 : (x > y ? 1 : -1);
    }).appendTo(newFilters.children('ul'));

    // simplify count and move to front
    newFilters.find('.count').each(function (i, el) {
        el.innerText = el.innerText.replace(/\D+/g, '');
        $(this).prependTo(this.parentNode);
    });
}


function doPageLoad() {

    // Show user links on history page
    const userheader = $(`<div class="SOMU-userheader"></div>`).prependTo($('#mainbar-full'));
    userheader.load(`https://${location.hostname}/users/account-info/${uid} .js-user-header`, function () {
        userheader.addClass('loaded');

        // Fix user profile tab/pills taking up too much space
        userheader.find('.js-user-header .s-navigation--item[href^="/users/account-info/"]').text('Dashboard');
        userheader.find('.js-user-header .s-navigation--item[href^="/users/edit/"]').text('Edit');
        userheader.find(`.js-user-header a[href^="https://meta.${location.hostname}/users/"] .ml4`).text('Meta');
        userheader.find(`.js-user-header a[href^="https://stackexchange.com/users/"]`).html((i, v) => v.replace(/\s+Network profile\s+/, 'Network'));
        userheader.find('.js-user-header > div .fs-body3').addClass('fw-bold');
    });

    // Prettify annotations table
    const table = $('#annotations table').addClass('s-table');

    // Read indicator
    table.find('thead th').last().text('Read');

    // Message
    $('tbody tr', table).each(function () {

        // Shorten type
        const type = $(this).children('td').first().text((i, v) => v.trim().slice(0, 4)).text();

        // Shorten timestamps, pad single digits
        $(this).find('.relativetime').text((i, v) => v.replace(/ at .+$/, '').replace(/ (\d),/, ' 0$1,'));

        // Get message
        const td = $(this).children('td').eq(3);

        // Special class for message/suspension rows
        const msgLink = $(this).children().eq(3).find('a');
        const aHasLink = $(this).children().eq(3).find('a').length === 1;
        if (/^\s?(susp|mess)/i.test(type) && aHasLink) {
            $(this).addClass('user-message');

            // Read status cell
            const status = $('<span class="num-msgs"></span>').appendTo($(this).find('td').last().empty());

            // Get user message and update status
            const url = msgLink.attr('href');
            $.get(url).done(function(page) {
                const messages = $('#mainbar .msg', page);
                const modMessages = messages.filter('.msg-moderator', page);
                const readModMessages = $('.msg-audit', modMessages).filter((i, el) => el.children.length == 2);

                const numModMessages = modMessages.length;
                const numReadModMessages = readModMessages.length;

                console.log(messages, numModMessages, numReadModMessages);

                const color = numModMessages !== numReadModMessages ? 'fc-red-600' : '';
                status.text(`${numReadModMessages}/${numModMessages}`);
                status.addClass(color);
            });

            return;
        }

        // Fix broken links in annotations
        const str = td.html()
            .replace(/" title="([^"]+)/g, '') // remove title attribute
            .replace(/" rel="nofollow noreferrer/g, '') // remove auto-inserted rel attribute from external links
            .replace(/(<a href="|">[^<]+<\/a>)/g, '') // strip existing links (text)
            .replace(/(&lt;a href="|"&gt;[^&]+&lt;\/a&gt;)/g, '') // strip existing links (html-encoded)
            .replace(/\s(\/users\/\d+\/[^\s\b]+)\b/gi, ' <a href="$1">$1</a> ') // relink users relative urls
            .replace(/(https?:\/\/[^\s\)]+)\b/gi, '<a href="$1">$1</a>') // all other urls
            .replace(/\s(\d{6,})\b/g, ' <a href="/users/$1">$1</a>') // assume numeric digits of >= 6 chars are user ids

        td.html(str);
    });

    // Links in annotations open in new window
    $('#annotations a').attr('target', '_blank');

    // Move history filters to sidebar
    moveHistoryFilters();

    // Fix history
    $('#user-history thead td').first().attr('width', '130');
    $('#user-history tbody tr').each(function () {
        const action = this.children[1];
        const comment = this.children[2];
        const link = $(comment).children('a').last();
        comment.classList.add('history-comment');

        // Remove community
        if (link.length && link.attr('href')?.includes('-1')) {
            comment.classList.add('hide-by');
            link.remove();
        }

        // Easier to read name changes
        if (action.innerText === 'edit displayname') {
            $(comment).html((i, v) => v.replace(/from ([Uu]ser\d+|.+) to (.+)/, '<em>from:</em> <span class="from-name">$1</span><br /><em>to:</em> <span class="to-name">$2</span>'));
        }

        // Linkify user ids
        else if (/^moderator (merges|deletes|destroys) users?$/.test(action.innerText)) {
            $(comment).html((i, v) => v.replace(/id = (\d+)/, 'id: <a href="/users/$1" target="_blank">$1</a>'));
        }

        // Linkify post ids
        else if (/^moderator (removes bounty|merges questions|deletes flag votes)$/.test(action.innerText)) {
            $(comment).html((i, v) => v.replace(/from (post|question|answer) id = (\d+)/, '$1: <a href="/q/$2" target="_blank">$2</a>'));
        }

        // Linkify comment ids
        else if (/^moderator edits comment$/.test(action.innerText)) {
            $(comment).html((i, v) => v.replace(/on post id = (\d+), comment id = (\d+)/, 'comment: <a href="/q/$1/#comment$2_$1" target="_blank">$2</a>'));
        }

        // Linkify bounty post ids
        else if (/^bounty$/.test(action.innerText)) {
            $(comment).html((i, v) => v.trim().replace(/(,)?\s*[\n\r]+\s*/g, '$1 ').replace(/ ,/, ',').replace(/on (question|answer) (\d+)/, 'on $1: <a href="/q/$2" target="_blank">$2</a>'));
        }

        // Linkify tags
        else if (/^moderator merges tags$/.test(action.innerText)) {
            $(comment).html((i, v) => v.trim().replace(/(,)?\s*[\n\r]+\s*/g, '$1 ').replace(/\[([\w+.-]+)\]/g, '[<a href="/tags/$1/info" target="_blank">$1</a>]'));
        }

        // Linkify tags (format change)
        else if (/^moderator updates tag language format$/.test(action.innerText)) {
            $(comment).html((i, v) => v.trim().replace(/(,)?\s*[\n\r]+\s*/g, '$1 ').replace(/tag([\w+.-]+),/, 'tag [<a href="/tags/$1/info" target="_blank">$1</a>] : '));
        }

        // Image preview for avatar changes
        else if (/profile image/.test(action.innerText)) {
            const src = $(comment).find('a').attr('href');
            $(comment).html(`<a href="${src}" class="s-avatar s-avatar__32" target="_blank"><img src="${src}" class="s-avatar--image" /></a>`);
        }

        // Recalc rep
        else if(/^moderator recalcs rep$/.test(action.innerText)) {
            const $comment = $(comment).html((i, v) => v.trim().replace(/(,)?\s*[\n\r]+\s*/g, '$1 ').replace(/Scheduled: /, '')
                .replace(/old rep = (\d+), new rep = (\d+) by/, '<span class="from-rep">$1</span> » <span class="to-rep">$2</span> <span class="rep-change"></span> <span class="user-by"> by </span>'));

            // Calculate change
            const from = Number($comment.children('.from-rep').text());
            const to = Number($comment.children('.to-rep').text());
            const change = to - from;

            if(change !== 0) $comment.children('.rep-change').text('(' + (change >= 0 ? `+${change}` : change) + ')');
        }
    });
}


// On page load
doPageLoad();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
.SOMU-userheader {
    min-height: 33px;
    margin-bottom: 16px;
    opacity: 0;
    transition: opacity 0.2s linear;
}
.SOMU-userheader.loaded {
    opacity: 1;
}
.SOMU-userheader > div {
    margin-bottom: 0;
}
#content .subheader {
    display: none;
}

#annotations span.mod-flair {
    display: none;
}
#annotations th {
    font-weight: bold;
    font-size: 1em;
}
#annotations th,
#annotations td {
    padding: 3px;
    text-overflow: ellipsis;
    overflow: hidden;
    vertical-align: top;
}
#annotations td {
    font-size: 0.9em;
}
#annotations td:nth-child(-n + 3) {
    white-space: nowrap;
}
#annotations td:nth-child(1) {
    max-width: 52px;
}
#annotations td:nth-child(2) {
    max-width: 90px;
}
#annotations td:nth-child(3) {
    max-width: 95px;
    text-align: right;
}
#annotations td:nth-child(4) {
    width: 100%;
}
#annotations td:nth-child(5) {
    min-width: 200px;
    max-width: 200px;
}
#annotations td:nth-child(6) {
    text-align: center;
}
.s-table tbody tr:nth-child(even),
#annotations tbody tr:nth-child(even) {
    background-color: var(--black-025);
}
#annotations table.annotation {
    border: 1px solid var(--black-100);
}
#annotations tr.user-message td:nth-child(4) {
    padding-left: 25px;
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M464 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm0 48v40.805c-22.422 18.259-58.168 46.651-134.587 106.49-16.841 13.247-50.201 45.072-73.413 44.701-23.208.375-56.579-31.459-73.413-44.701C106.18 199.465 70.425 171.067 48 152.805V112h416zM48 400V214.398c22.914 18.251 55.409 43.862 104.938 82.646 21.857 17.205 60.134 55.186 103.062 54.955 42.717.231 80.509-37.199 103.053-54.947 49.528-38.783 82.032-64.401 104.947-82.653V400H48z"></path></svg>') left 5px top 3px/14px no-repeat;
}
body.SOMU-SEDM #annotations tr.user-message td:nth-child(4) {
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path stroke="white" fill="white" d="M464 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm0 48v40.805c-22.422 18.259-58.168 46.651-134.587 106.49-16.841 13.247-50.201 45.072-73.413 44.701-23.208.375-56.579-31.459-73.413-44.701C106.18 199.465 70.425 171.067 48 152.805V112h416zM48 400V214.398c22.914 18.251 55.409 43.862 104.938 82.646 21.857 17.205 60.134 55.186 103.062 54.955 42.717.231 80.509-37.199 103.053-54.947 49.528-38.783 82.032-64.401 104.947-82.653V400H48z"></path></svg>') left 5px top 3px/14px no-repeat;
}

#change-filter {
    display: none;
}
#infoAndSpecialEvents {
    width: 100%;
    margin-top: 15px;
    margin-bottom: 25px;
    padding: 0 0 25px;
    border-bottom: 1px solid var(--black-300);
}
#infoAndSpecialEvents .user-info {
    margin-left: -7px;
}
#infoAndSpecialEvents .special-event {
    font-size: 0.9em;
}
#newHistoryFilters {
    clear: both;
    font-size: 0.92em;
    line-height: 1.5;
}
#newHistoryFilters li {
    display: table-row;
}
#newHistoryFilters li > * {
    display: table-cell;
}
#newHistoryFilters li > .count {
    padding-right: 5px;
}

#annotations td.pre,
#user-history td.pre {
    font-family: monospace;
    white-space: pre-line;
}
#user-history tbody > tr > td {
    word-break: break-word;
}
#user-history td.hide-by .user-by {
    display: none;
}
/* Hides IP address column
#user-history tr th:last-child,
#user-history tr td:last-child {
    display: none;
}
*/
#user-history th:nth-child(1) {
    width: auto !important;
    min-width: 80px;
}
#user-history th:nth-child(2) {
    width: auto !important;
    min-width: 150px;
}
#user-history .history-comment.new-review-susp li,
#user-history .history-comment.new-review-susp li p {
    margin-bottom: 0;
}
#user-history .history-comment.new-review-susp br:last-of-type {
    display: none;
}
`;
document.body.appendChild(styles);
