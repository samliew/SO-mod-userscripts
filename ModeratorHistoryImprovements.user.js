// ==UserScript==
// @name         Moderator History Improvements
// @description  Better UI for mod action history page. Auto-refresh every minute.
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.2
//
// @include      https://stackoverflow.com/admin/history/*
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';

if (unsafeWindow !== undefined && window !== unsafeWindow) {
    window.jQuery = unsafeWindow.jQuery;
    window.$ = unsafeWindow.jQuery;
}

const hour = 3600000;
const day = hour * 24;
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
let $historyContainer, lastUpdated = -1;


const htmlEntities = str => str.replace(/[\u00A0-\u9999<>\&]/gim, i => `&#${i.charCodeAt(0)};`);
const linkify = htmlstr => htmlstr
    .replace(/[\[]{1}([^\]]+)[\]]{1}[\(]{1}([^\)\"]+)(\"(.+)\")?[\)]{1}/g, '<a href="$2" title="$4">$1</a>')
    .replace(/(?<!>|=")(https?:\/\/)([-_a-z0-9:.,\/#=&?]+[^?.,! ])/gi, '<a href="$1$2" target="_blank">$2</a>');


function processNewItems($items) {

    // Remove fluff
    $items.children('li').each(function () {
        let t = this.innerHTML.trim().replace(/\s*- no link available\s*/, '');
        this.innerHTML = t;
    });

    // Links open in new window since this page auto-updates
    $items.find('a').attr('target', '_blank');

    // Linkify stuff on history page
    $('ul li', $items).each(function () {

        let t = this.innerText.trim().replace(/\s*- no link available\s*/, '').replace(/- from question id =/, 'for question').replace(/- for id =/, '').replace(/-$/, '');

        if (t.includes('Declined)')) $(this).addClass('mod-declined');
        else if (t.includes('Flag processed')) $(this).addClass('mod-helpful');

        if (/^♦/.test(t)) {
            $(this).addClass('mod-actions');
        }

        if (/Comment deleted:/.test(t)) {
            t = t.replace('Comment deleted: ', '');
            t = '<em>' + htmlEntities(t) + '</em>';
            $(this).addClass('type-cmnt');
        }
        else if (t.includes('(AnswerNotAnAnswer')) {
            $(this).addClass('type-naa');
        }
        else if (t.includes('(PostOther')) {
            $(this).addClass('type-postother');
        }
        else if (t.includes('(PostLowQuality')) {
            $(this).addClass('type-vlq');
        }
        else if (t.includes('(PostTooManyCommentsAuto')) {
            $(this).addClass('type-toomanycmnts');
        }
        else if (/^User annotated - /.test(t)) {
            t = linkify(t);
            $(this).addClass('mod-annotates');
        }
        else if (/^Moderator (deletes|destroys) user/.test(t)) {
            t = t.replace(/(\d+)/, `<a href="https://${location.hostname}/users/$1" target="_blank" title="view user">$1</a>`);
            $(this).addClass('mod-destroys');
        }
        else if (/^Moderator merges users/.test(t)) {
            t = t.replace(/(\d+)/g, `<a href="https://${location.hostname}/users/$1" target="_blank" title="view user">$1</a>`);
            $(this).addClass('mod-merges-users');
        }
        else if (/^(Moderator contacts user|See user-message)/.test(t)) {
            t = t.replace(/(\d+)/, `<a href="https://${location.hostname}/users/message/$1" target="_blank" title="view message">$1</a>`);
            $(this).addClass('mod-contacts-user');
        }
        else if (/^(Moderator removes bounty)/.test(t)) {
            t = t.replace(/(\d+)/, `<a href="https://${location.hostname}/questions/$1" target="_blank" title="view question">$1</a>`);
            $(this).addClass('mod-removes-bounty');
        }
        else if (/^(Moderator edits comment)/.test(t)) {
            t = t.replace(/ - on post id = (\d+), comment id = (\d+)/, ` <a href="https://${location.hostname}/posts/comments/$2" target="_blank" title="view comment">$2</a>`);
            $(this).addClass('mod-edits-comment');
        }
        else if (/^Moderator merges tags/.test(t)) {
            t = t.replace(/\[([^\]]+)\]/g, `<a href="https://${location.hostname}/tags/$1/info" class="post-tag" target="_blank" title="view tag">$1</a>`);
            $(this).addClass('mod-merges-tags');
        }
        else if (/^Moderator merges questions/.test(t)) {
            t = t.replace(/(\d+)/g, `<a href="https://${location.hostname}/questions/$1" target="_blank" title="view question">$1</a>`);
            $(this).addClass('mod-merges-questions');
        }

        this.innerHTML = t.replace(/Flag processed \((\w+), (Declined|Helpful)\)/, '$1');
    });
}


function updatePage() {

    // Get same page
    $.get(location.href, function (page) {

        // Preprocess items to get pid
        const $items = $('#mod-user-history > li', page);
        let $newItems = $items.filter(function (i, el) {
            const url = $(el).find('a.answer-hyperlink, a.question-hyperlink').first().attr('href');
            const pid = url ? Number(url.match(/\/(\d+)/g).pop().replace('/', '')) : -1;
            $(this).attr('data-pid', pid);

            // Return items that are newer than last time
            return new Date($(this).find('.relativetime').attr('title')).getTime() > lastUpdated;
        })
            .prependTo($historyContainer);
        processNewItems($newItems);

        // Get last item timestamp
        lastUpdated = new Date($items.first().find('.relativetime').attr('title')).getTime();
    });
}


function doPageLoad() {

    // Set page title
    const mod = $('#mod-user-history').parent().prev().find('.user-info');
    const modname = mod.find('.user-details a').first().text();
    document.title = `${modname} - mod history`;

    // Cache item container
    $historyContainer = $('#mod-user-history');

    // Preprocess items to get pid
    const $items = $historyContainer.children('li');
    $items.each(function (i, el) {
        const url = $(el).find('a.answer-hyperlink, a.question-hyperlink').first().attr('href');
        const pid = url ? Number(url.match(/\/(\d+)/g).pop().replace('/', '')) : -1;
        $(this).attr('data-pid', pid);
    });
    processNewItems($items);

    // Get last item timestamp
    lastUpdated = new Date($items.first().find('.relativetime').attr('title')).getTime();

    // If more than 24h, instead of relative date text, show date + time
    $items.find('.relativetime').each(function () {
        let d = new Date(this.title);
        if (Date.now() - day > d) {
            this.innerText = `${months[d.getMonth()]} ${d.getDate()} at ${('0' + d.getHours()).substr(-2)}:${('0' + d.getMinutes()).substr(-2)}`;
        }
    });

    // Remove time from old items
    $items.find('.relativetime').text((i, v) => v.replace(' at ', ', '));

    // Auto update history
    setInterval(updatePage, 30000);

    // Update timestamps of items
    setInterval(() => {
        StackExchange.realtime.updateRelativeDates();
    }, 10000);
}


// On page load
doPageLoad();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
.mod-page #mod-user-history {
    margin-top: 20px;
    margin-left: 10px;
}
.mod-page #mod-user-history ul {
    margin-left: 0 !important;
}
.mod-page #mod-user-history .question-hyperlink,
.mod-page #mod-user-history .answer-hyperlink {
    margin-bottom: 0;
}
.mod-page #mod-user-history .question-hyperlink:before {
    content: 'Q: ';
}
.mod-page #mod-user-history li {
    margin-top: 10px;
    padding: 0 !important;
}
.mod-page #mod-user-history > li {
    position: relative; /* for Post IDs Everywhere userscript */
    display: grid;
    grid-template-columns: 94px 1fr;
    margin-bottom: 25px;
    font-size: 0; /* to fix stray hyphen without FOUC */
}
.mod-page #mod-user-history > li > * {
    grid-column: 2;
    font-size: 1rem; /* to fix stray hyphen without FOUC */
}
.mod-page #mod-user-history > li .question-hyperlink {
    font-size: 1.2rem; /* to fix stray hyphen without FOUC */
}
.mod-page #mod-user-history > li > .relativetime {
    grid-column: 1;
    padding-right: 10px;
    text-align: right;
    color: var(--black-400);
    white-space: nowrap;
}
.mod-page #mod-user-history > li > .relativetime + ul > li:first-child {
    margin-top: 0;
}
.mod-page #mod-user-history > li > *:nth-child(2) {
    grid-row: 1;
}
.mod-page #mod-user-history > li > .mod-flair {
    display: none;
}
.mod-page #mod-user-history li.mod-helpful:before {
    content: 'Helpful: ';
    color: var(--green-500);
}
.mod-page #mod-user-history li.mod-declined:before {
    content: 'Declined: ';
    color: var(--red-500);
}
.mod-page #mod-user-history li.mod-actions {
    display: inline-block;
    margin-top: 5px;
    padding: 3px 10px 3px 8px !important;
    background: var(--black-050);
}
.mod-page #mod-user-history li.mod-destroys {
    color: var(--red-700);
}
.mod-page #mod-user-history li.type-cmnt:before {
    content: 'Comment deleted: ';
    color: var(--green-500);
}
.mod-page #mod-user-history li.type-cmnt em {
    padding: 1px 8px;
    font-style: normal;
    color: var(--black-600);
    background: var(--red-050);
}
.mod-page #mod-user-history li.type-toomanycmnts ~ li {
    display: none;
}
.mod-page #mod-user-history li.mod-contacts-user:before {
    display: inline-block;
    content: "";
    width: 14px;
    height: 14px;
    margin-right: 5px;
    margin-bottom: -1px;
    background: url('data:image/svg+xml;utf8,<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="envelope" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="svg-inline--fa fa-envelope fa-w-16 fa-3x"><path fill="currentColor" d="M502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7V400c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V195.6c0-5 5.7-7.8 9.7-4.7 22.4 17.4 52.1 39.5 154.1 113.6 21.1 15.4 56.7 47.8 92.2 47.6 35.7.3 72-32.8 92.3-47.6 102-74.1 131.6-96.3 154-113.7zM256 320c23.2.4 56.6-29.2 73.4-41.4 132.7-96.3 142.8-104.7 173.4-128.7 5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48H48C21.5 64 0 85.5 0 112v19c0 7.4 3.4 14.3 9.2 18.9 30.6 23.9 40.7 32.4 173.4 128.7 16.8 12.2 50.2 41.8 73.4 41.4z" class=""></path></svg>') left 0px bottom 0px/14px no-repeat;
}
.mod-page #mod-user-history li.mod-destroys:before {
    display: inline-block;
    content: "";
    width: 14px;
    height: 14px;
    margin-right: 5px;
    margin-bottom: -1px;
    background: url('data:image/svg+xml;utf8,<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="times-octagon" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="svg-inline--fa fa-times-octagon fa-w-16 fa-3x"><path fill="currentColor" d="M497.9 150.5c9 9 14.1 21.2 14.1 33.9v143.1c0 12.7-5.1 24.9-14.1 33.9L361.5 497.9c-9 9-21.2 14.1-33.9 14.1H184.5c-12.7 0-24.9-5.1-33.9-14.1L14.1 361.5c-9-9-14.1-21.2-14.1-33.9V184.5c0-12.7 5.1-24.9 14.1-33.9L150.5 14.1c9-9 21.2-14.1 33.9-14.1h143.1c12.7 0 24.9 5.1 33.9 14.1l136.5 136.4zM377.6 338c4.7-4.7 4.7-12.3 0-17l-65-65 65.1-65.1c4.7-4.7 4.7-12.3 0-17L338 134.4c-4.7-4.7-12.3-4.7-17 0l-65 65-65.1-65.1c-4.7-4.7-12.3-4.7-17 0L134.4 174c-4.7 4.7-4.7 12.3 0 17l65.1 65.1-65.1 65.1c-4.7 4.7-4.7 12.3 0 17l39.6 39.6c4.7 4.7 12.3 4.7 17 0l65.1-65.1 65.1 65.1c4.7 4.7 12.3 4.7 17 0l39.4-39.8z" class=""></path></svg>') left 0px bottom 0px/14px no-repeat;
}
.mod-page #mod-user-history li.mod-annotates:before {
    display: inline-block;
    content: "";
    width: 14px;
    height: 14px;
    margin-right: 5px;
    margin-bottom: -1px;
    background: url('data:image/svg+xml;utf8,<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="dot-circle" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="svg-inline--fa fa-dot-circle fa-w-16 fa-5x"><path fill="currentColor" d="M256 8C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm80 248c0 44.112-35.888 80-80 80s-80-35.888-80-80 35.888-80 80-80 80 35.888 80 80z" class=""></path></svg>') left 0px bottom 0px/14px no-repeat;
}
`;
document.body.appendChild(styles);
