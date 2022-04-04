// ==UserScript==
// @name         Display Inline Comment Flag History
// @description  Grabs post timelines and display comment flag counts beside post comments, on comment hover displays flags
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      3.2
//
// @include      https://*stackoverflow.com/questions/*
// @include      https://*serverfault.com/questions/*
// @include      https://*superuser.com/questions/*
// @include      https://*askubuntu.com/questions/*
// @include      https://*mathoverflow.com/questions/*
// @include      https://*.stackexchange.com/questions/*
//
// @include      https://*stackoverflow.com/*posts*/timeline*
// @include      https://*serverfault.com/*posts*/timeline*
// @include      https://*superuser.com/*posts*/timeline*
// @include      https://*askubuntu.com/*posts*/timeline*
// @include      https://*mathoverflow.com/*posts*/timeline*
// @include      https://*.stackexchange.com/*posts*/timeline*
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';

if (unsafeWindow !== undefined && window !== unsafeWindow) {
    window.jQuery = unsafeWindow.jQuery;
    window.$ = unsafeWindow.jQuery;
}

// Moderator check
if (typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator) return;

const store = window.localStorage;
const baseUrl = `https://${location.hostname}`;
const postsUrl = baseUrl + '/posts';


const loadCommentsFlagsFromTimeline = function () {

    // So we only load each post's timeline once
    if ($(this).hasClass('js-cmmtflags-loaded')) return;
    $(this).addClass('js-cmmtflags-loaded');

    const postId = this.dataset.questionid || this.dataset.answerid;
    const isQ = $(this).hasClass('question');
    //console.log(postId, isQ);

    // Get post timeline
    $.get(`${postsUrl}/${postId}/timeline`, function (data) {
        const cmmtDiv = $('<div class="all-comment-flags"></div>').appendTo('#comments-' + postId);
        const eventRows = $('.event-rows', data);
        const cmmtFlags = eventRows.find('tr[data-eventtype="flag"]').filter((i, el) => $(el).find('.event-type.flag').text() === 'comment flag');

        // Each comment with flags
        eventRows.find('tr[data-eventtype="comment"]').filter((i, el) => $(el).find('.js-toggle-comment-flags').length == 1).each(function () {
            const cmmt = $(this);
            const cmmtId = this.dataset.eventid;
            const cmmtUser = $(this).find('.comment-user').first().get(0);
            const cmmtUserId = cmmtUser ? (cmmtUser.href || cmmtUser.innerText).match(/\d+/)[0] || -1 : -1;
            const cmmtFlagIds = $(this).find('.js-toggle-comment-flags').attr('data-flag-ids').split(';');
            const cmmtFlagsDiv = $('<div class="comment-flags"></div>').appendTo(`#comment-${cmmtId} .comment-text`);
            const cmmtFlagcountDiv = $(`<a class="comment-flagcount supernovabg" title="comment flags" href="${postsUrl}/${postId}/timeline#comment_${cmmtId}" target="_blank">${cmmtFlagIds.length}</a>`)
                .appendTo(`#comment-${cmmtId} .comment-actions`);
            $(`#comment-${cmmtId}`).addClass('hasflags');

            // Each flag on comment
            $.each(cmmtFlagIds, function (i, v) {
                const fEvent = cmmtFlags.filter(`[data-eventid="${v}"]`).first();
                const fType = fEvent.find('.event-verb').text().replace(/(^\s+|\s+$)/g, '');
                const num = Number(cmmt.attr('data-flagtype-' + fType)) || 0;
                cmmt.attr('data-flagtype-' + fType, num + 1);
                fEvent.clone(true, true).appendTo(cmmt);
                fEvent.clone(true, true).appendTo(cmmtFlagsDiv);
                //console.log(postId, cmmtId, v, fType, fEvent);
            });

            // TODO: Get flag raisers

            // Trim timeline username link text that is causing an autocomplete bug on deleted posts
            //  - https://meta.stackoverflow.com/q/371539
            $(this).find('.comment-user').text((i, v) => v.trim());

        }).appendTo(cmmtDiv);
        //console.log(cmmtDiv);

        $('.event-comment').filter((i, el) => el.innerText.replace(/(^\s+|\s+$)/g, '') === 'rude or abusive').addClass('rude-abusive');
    });
};

const updateCommentsFromTimelines = function () {

    // Each post on page, that already has post timelines loaded
    $('.question, .answer').filter('.js-cmmtflags-loaded').each(function () {

        const postId = this.dataset.questionid || this.dataset.answerid;
        const isQ = $(this).hasClass('question');
        //console.log(postId, isQ);

        const eventRows = $('.all-comment-flags', this).children('tr');

        // Each comment with flags
        eventRows.each(function () {
            const cmmt = $(this);
            const cmmtId = this.dataset.eventid;
            const cmmtUser = $(this).find('.comment-user').first().get(0);
            const cmmtUserId = cmmtUser ? (cmmtUser.href || cmmtUser.innerText).match(/\d+/)[0] || -1 : -1;
            const cmmtFlagIds = $(this).find('.js-toggle-comment-flags').attr('data-flag-ids').split(';');

            const comment = $(`#comment-${cmmtId}`);
            if (comment.hasClass('hasflags')) return;
            comment.addClass('hasflags');

            const cmmtFlagsDiv = $('<div class="comment-flags"></div>').appendTo(`#comment-${cmmtId} .comment-text`);
            const cmmtFlagcountDiv = $(`<a class="comment-flagcount supernovabg" title="comment flags" href="${postsUrl}/${postId}/timeline#comment_${cmmtId}" target="_blank">${cmmtFlagIds.length}</a>`)
                .appendTo(`#comment-${cmmtId} .comment-actions`);

            // Each flag on comment
            cmmt.find('tr[data-eventtype]').each(function () {
                const fEvent = $(this);
                $(this).clone(true, true).appendTo(cmmtFlagsDiv);
                //console.log(postId, cmmtId, cmmtId);
            });

            // TODO: Get flag raisers
        });
    });

    // Highlight R/A comment flags
    $('.event-comment').filter((i, el) => el.innerText.replace(/(^\s+|\s+$)/g, '') === 'rude or abusive').addClass('rude-abusive');
};


function doPageLoad() {

    // If timeline page
    if (location.href.indexOf('/timeline') >= 0) {

        // If comment is found in URL, also expand flags on the comment
        if (location.hash && location.hash.indexOf('#comment_') >= 0) {

            // Timeout to allow other userscripts to complete first
            setTimeout(function () {
                const cmmtRow = $(`a[href="${location.hash}"]`).first().closest('tr');
                cmmtRow.find('.js-toggle-comment-flags').click();
            }, 500);
        }
    }

    // Each post on page
    const qas = $('.question, .answer');
    if (qas.length > 15) {
        qas.on('mouseover', loadCommentsFlagsFromTimeline)
    }
    else {
        qas.each(loadCommentsFlagsFromTimeline);
    }
}

function listenToPageUpdates() {
    // On any page update
    $(document).ajaxComplete(function (event, xhr, settings) {
        if (settings.url.indexOf('/comments') >= 0) updateCommentsFromTimelines();
    });
}


// On page load
doPageLoad();
listenToPageUpdates();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
.all-comment-flags,
.comment-flags {
display: none;
}
.comment-flags .dno {
display: block;
}
.comment .comment-text {
position: relative;
}
.comment:hover .comment-text {
z-index: 1;
}

.comment.hasflags .comment-actions {
border-left: 1px solid transparent;
transition: none;
}
.comment.hasflags .comment-text {
border-right: 1px solid transparent;
transition: none;
}
.comment.hasflags:hover .comment-actions,
.comment.hasflags:hover .comment-text {
border-color: var(--black-100);
background: var(--yellow-050);
}

.comment:hover .comment-flags {
display: block;
}
.comment .comment-flags {
position: absolute;
top: 100%;
right: -1px;
width: calc(100% + 7px);
padding: 0px 10px 10px;
border-bottom-left-radius: 5px;
border-bottom-right-radius: 5px;
background: var(--yellow-050);
border: 1px solid var(--black-100);
border-top: none;
box-shadow: 2px 2px 6px -2px rgba(0,0,0,0.2);
z-index: 1;
}
.comment .comment-flags td,
.comment .comment-flags td.creation-date .simultaneous-symbol {
display: none;
}
.comment .comment-flags td.creation-date,
.comment .comment-flags td.event-comment {
display: inline-block;
min-width: 100px;
max-width: 490px;
margin-top: 8px;
vertical-align: top;
}
.comment-flagcount {
min-width: 18px;
padding: 2px 0;
border-radius: 3px;
text-align: center;
font-size: 0.85em;
color: var(--white) !important;
}
.rude-abusive > span:first-child {
color: var(--red-500);
}
`;
document.body.appendChild(styles);


// Debug functions to clear localStorage
unsafeWindow.lsRemoveItemsWithPrefix = function (prefix) {
    const store = window.localStorage;
    let count = 0;
    for (let i = store.length - 1; i >= 0; i--) {
        const key = store.key(i);
        if (key && key.indexOf(prefix) === 0) {
            store.removeItem(key);
            count++;
        }
    }
    console.log(count + ' items cleared');
    return count;
};
unsafeWindow.purgeDisplayInlineCommentFlagHistory = function () {
    lsRemoveItemsWithPrefix('CommentFlags');
};

// Clear comment flaggers cache every two days
if (new Date().getDay() % 2 === 0) purgeDisplayInlineCommentFlagHistory();
