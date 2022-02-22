// ==UserScript==
// @name         Redacted Screenshots
// @description  Masks and hides user identifying info
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
//
// @exclude      *chat.*
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';

const ipRegex = /(\d{1,3})(\.\d{1,3}){3}(?=(?:\b|"|'))/g;
const emailRegex = /([^@\s]{1,3})([^@\s]+)@(\S+)\.([a-z]+)(?=(?:\b|"|'))/gi;


function redactPii(i, elem) {
    if (!(ipRegex.test(elem.innerHTML) || emailRegex.test(elem.innerHTML)) || $(this).find('*').length > 10) return;

    elem.innerHTML = elem.innerHTML
        .replace(ipRegex, '$1.███.███$2 ')
        .replace(emailRegex, '$1██████@██████.$4');
}


function cleanPage() {

    // Reset UI (indication of votes/fav)
    $('.vote-up-on, .vote-down-on').removeClass('vote-up-on vote-down-on');
    $('.star-on').removeClass('star-on');
    $('.favoritecount-selected').removeClass('favoritecount-selected');

    // Remove/Reset other SOMU items
    $('body').removeClass('usersidebar-open');
    $('.old-comment, .cmmt-rude, .cmmt-chatty').removeClass('old-comment cmmt-rude cmmt-chatty');
    $('#usersidebar, #qtoc, .meta-mentioned, .post-stickyheader, .dissociate-post-link, .post-id, .js-better-inline-menu, .print-comment-buttons').remove();

    // Remove other userscript items
    $('#roombaTableDiv').remove();

    // Remove unnecessary stuff from page
    $('.my-profile, .user-gravatar32 a, .user-info .-flair').remove();

    // Remove admin stuff from page
    $('.js-post-issue, .js-post-issues, .js-mod-inbox-button, .flag-count-item, .delete-comment, .js-post-flag-bar').remove();

    // Redact IP and email addresses in content div
    const content = $('#content');
    $('input, a', content).each(redactPii);
    $('.s-prose li, .s-prose p, #annotations .pre', content).each(redactPii);
    $('div > div, div > p, div > span', content).each(redactPii);

    // Shrink user comments table for mod messages
    $('table.admin-user-comments').css({ width: '720px' });
}


function anonymizeUsers(fullwipe = false) {

    // Wrap spans around question closers text in close reasons so we can process those too
    $('.close-as-off-topic-status-list li').each(function () {
        if (this.innerHTML.includes('–') && !this.innerHTML.includes('js-reason-user')) {
            let parts = this.innerHTML.split('–');
            this.innerHTML = parts[0] + '–' + parts[1].replace(/(,? )([\w\s]+)/g, '$1<span class="js-reason-user">$2</span>');
        }
    });

    const dataSet = [];
    let usernum = 1;

    // Anonymize userlinks in these sections only...
    const $sections = $('#mod-content, #content, .admin-user-comments, h1');

    // Get user links
    const userlinks = $('a[href*="/users/"]', $sections).each(function (i, el) {

        const username = this.innerText.trim();
        const match = this.href.match(/.*\/users\/-?(\d+)(\/.*)?/);

        // Does not match valid user URL, ignore this link
        if (!match) return;

        // Map user id to unique value
        const uid = match[1];
        if (!dataSet[uid]) {
            dataSet[uid] = usernum++;
        }

        // Set user link text
        // If not full redact, also keep mod diamond in comments
        const isComment = $(this).closest('.comment-body').length > 0;
        const isMod = this.innerText.includes('♦') || $(this).next('.mod-flair').length !== 0;
        const modFlair = isMod && isComment ? ' ♦' : '';
        this.innerText = fullwipe ? "anon" : (isMod ? "mod" + modFlair : "anon-" + dataSet[uid]);

        // Also find same username in question close reasons
        $('.close-as-off-topic-status-list .js-reason-user').filter((i, el) => el.innerText == username).text(this.innerText);
    });

    // Edge case: CW posts that have no revision history
    $('.post-signature .community-wiki').closest('.user-info').find('a[href$="/revisions"]').filter(function () {
        return $(this).siblings('a[href^="/users/"]').length == 0;
    }).text('anon');

    // Remove @ replies from beginning of comments
    $('.comment-copy, .text-row > td > span').html((i, v) => v.replace(/^@[\wŒŠŽÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖØÙÚÛÜÝÞßðÿ]+[,:]?\s/i, ''));

    // If fullwipe, also add class to body to further remove unneeded elements on page
    $('body').addClass(fullwipe ? 'js-redactfull' : 'js-redactsemi');
}


function doPageLoad() {

    const redactButtons = $(`<div class="redact-buttons"><button>Redact</button><button data-fullwipe="true">Redact Full</button></div>`).appendTo('body');
    redactButtons.on('click', 'button', function (evt) {

        const isFullWipe = !!evt.target.dataset.fullwipe;

        cleanPage();
        anonymizeUsers(isFullWipe);

        // Hide buttons for 10 seconds to allow for screenshot taking
        redactButtons.hide().delay(10000).fadeIn(1);

        // If full wipe, also remove other button
        if (isFullWipe) {
            $(this).siblings().remove();
        }
    });
}


// On page load
doPageLoad();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
.redact-buttons {
    position: fixed !important;
    bottom: 3px;
    left: 3px;
    z-index: 999999;
}
.redact-buttons:hover button ~ button {
    display: inline-block;
}
.redact-buttons button {
    opacity: 0.5;
}
.redact-buttons button:hover {
    opacity: 1;
}
.redact-buttons button ~ button {
    display: none;
    margin-left: 3px;
}

body.js-redactfull .mod-flair,
body.js-redactfull .js-usercolor:after {
    display: none !important;
}
body.js-redactfull .user-details a,
body.js-redactfull a.comment-user {
    color: var(--black-400);
}

body.js-redactsemi.question-page #answers .answer,
body.js-redactfull.question-page #answers .answer {
    border-bottom: 1px solid var(--black-075);
}

.post-signature .user-info {
    min-height: 67px;
}
`;
document.body.appendChild(styles);