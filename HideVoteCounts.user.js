// ==UserScript==
// @name         Hide Vote Counts
// @description  Hides post score until voted
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.2
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*.stackexchange.com/*
//
// @exclude      https://data.stackexchange.com/*
// @exclude      */c/*
// @exclude      */admin/*
// @exclude      *chat.*
// @exclude      *blog.*
//
// @run-at       document-end
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';

// If rep is too low, do nothing. Rep for guests is 0, so this covers not logged-in users.
if (StackExchange.options.user.rep < 125) return;

if (unsafeWindow !== undefined && window !== unsafeWindow) {
    window.jQuery = unsafeWindow.jQuery;
    window.$ = unsafeWindow.jQuery;
}

function doPageLoad() {

    // Hide all vote counts immediately on page load
    $('.js-voting-container').addClass('js-score-hidden');

    // Show vote counts for these scenarios
    const showVotes = $('.question, .answer').filter(function () {
        const postScore = $(this).find('.js-vote-count').data('value');
        return (

            // extreme score
            postScore <= -200 || postScore >= 200

            // deleted posts
            || $(this).hasClass('deleted-answer')

            // locked posts (dispute or hist sig)
            || ($(this).find('.question-status').last().text().includes('locked') || $(this).find('.js-vote-up-btn').length == 0)

            // own posts
            || $(this).find(`.user-details[itemprop="author"] > a[href^="/users/${StackExchange.options.user.userId}/"]`).length > 0
        );
    }).find('.js-voting-container').removeClass('js-score-hidden');

    // Function to check for votes again when Q&A has initialized
    StackExchange.ready(function () {

        // If we have voted, show post votes
        $('.js-voting-container .fc-theme-primary').parent().removeClass('js-score-hidden');
    });

    // Show vote counts on double-click
    $(document).on('dblclick', '.js-score-hidden', function () {
        $(this).removeClass('js-score-hidden');
    });
}

function listenToPageUpdates() {

    // On any page update
    $(document).ajaxComplete(function (event, xhr, settings) {

        // Ignore unsuccessful ajax responses
        if (xhr.status != 200 && xhr.status != 204) return;

        // On vote
        if (/\/posts\/\d+\/vote\/\d/.test(settings.url)) {
            const pid = Number(settings.url.match(/\/(\d+)\//)[1]);
            const votetype = Number(settings.url.match(/\d+$/)[0]);

            // Show if voted, hide if unvoted successfully
            if (xhr.responseJSON.Success) $(`.js-voting-container[data-post-id="${pid}"]`).toggleClass('js-score-hidden', votetype === 0);
        }
    });
}


// On page load
doPageLoad();
listenToPageUpdates();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
.js-voting-container.js-score-hidden .js-vote-count {
    position: relative;
    font-size: 0 !important;
    pointer-events: none;
}
.js-voting-container.js-score-hidden .js-vote-count .vote-count-separator {
    display: none;
}
.js-voting-container.js-score-hidden .js-vote-count:after {
    content: '?';
    display: inline-block;
    font-size: 1.61538462rem !important;
}
`;
document.body.appendChild(styles);
