// ==UserScript==
// @name         Post Ids Everywhere
// @description  Inserts post IDs everywhere where there's a post or post link
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.3
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://stackapps.com/*
// @include      https://*.stackexchange.com/*
//
// @exclude      *chat.*
// @exclude      https://stackoverflow.com/c/*
// @exclude      https://stackoverflow.blog/*
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';


/**
 * @summary jQuery plugin to fit element width to text
 * @link https://github.com/samliew/dynamic-width
 */
$.fn.dynamicWidth = function () {
    var plugin = $.fn.dynamicWidth;
    if (!plugin.fakeEl) plugin.fakeEl = $('<span>').hide().appendTo(document.body);

    function sizeToContent(el) {
        var $el = $(el);
        var cs = getComputedStyle(el);
        plugin.fakeEl.text(el.value || el.innerText || el.placeholder).css('font', $el.css('font'));
        $el.css('width', plugin.fakeEl.width() + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight));
    }

    return this.each(function (i, el) {
        sizeToContent(el);
        $(el).filter('input:not([readonly])').on('change keypress keyup blur', evt => sizeToContent(evt.target));
    });
};


function insertPostIds() {

    // Lists
    const modQueuePostLinks = $('.js-body-loader').find('a:first');
    $('a.question-hyperlink, a.answer-hyperlink, .s-post-summary--content-title > a, .s-post-summary--content-title.s-link, .js-post-title-link, .originals-of-duplicate li > a, .originals-of-duplicate .js-originals-list > a').add(modQueuePostLinks)
        .not('.js-somu-post-ids').addClass('js-somu-post-ids')
        .each((i, el) => {
            if (el.href.includes('/election')) return;
            const pid = getPostId(el.href);
            $(`<input class="post-id" title="double click to view timeline" value="${pid}" readonly />`).insertAfter(el);
        });

    // Q&A
    $('[data-questionid], [data-answerid]').not('.close-question-link')
        .not('.js-somu-post-ids').addClass('js-somu-post-ids')
        .each((i, el) => {
            const pid = el.dataset.answerid || el.dataset.questionid;
            $(`<input class="post-id" title="double click to view timeline" value="${pid}" readonly />`).insertBefore($(el).find('.post-layout'));
        });

    // Remove duplicates if necessary
    $('.post-id ~ .post-id').remove();

    // Fit width of element to content
    $('.post-id').dynamicWidth();
}


function doPageLoad() {
    insertPostIds();
    $(document).ajaxStop(insertPostIds);

    // Select when focused
    $(document).on('click', 'input.post-id', function () { this.select(); });

    // Open post timeline in new tab when double clicked
    $(document).on('dblclick', 'input.post-id', function () { window.open(`https://${location.hostname}/posts/${this.value}/timeline?filter=WithVoteSummaries`, ''); });
}


// On page load
doPageLoad();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
.count-cell + td,
.user-page .s-card .flex--item,
.user-page .js-user-tab .flex--item,
.js-user-panel .d-flex,
.js-user-panel .fl-grow1,
.question-link,
.answer-link,
.question-summary,
.summary-table td,
.history-table td,
.top-posts .post-container,
.mod-section table.table td,
.post-container,
.reviewable-post h1,
.js-flag-text li,
.originals-of-duplicate li {
    position: relative;
}
.popup[data-questionid],
.popup[data-answerid] {
    position: absolute;
}
.flagged-post-row .answer-link {
    float: none;
}
.reviewable-post .question .post-id {
    display: none;
}

.post-id {
    position: absolute;
    top: 0;
    right: 0;
    width: 5rem;
    min-width: 36px;
    margin: 0;
    padding: 3px 0;
    font-size: 1rem;
    font-family: monospace;
    font-weight: 600;
    text-align: right;
    color: var(--black-800);
    background: transparent;
    border: none;
    outline: none !important;
    opacity: 0.15;
    z-index: 1;
}
.post-id:before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: var(--white);
    opacity: 0.8;
    z-index: 0;
}
.post-id + a {
    display: inline !important;
}
#question .post-id,
#answers .post-id {
    position: relative;
}
.question:not(#question) > .post-id {
    top: -20px;
}
.js-admin-dashboard .js-flagged-post .post-id {
    transform: translate(0, -90%);
}
.js-admin-dashboard .js-flagged-post .js-flag-text li .post-id {
    transform: translate(0, 0);
}
#question .post-id,
#answers .post-id,
#user-tab-questions .post-id:hover,
#user-tab-answers .post-id:hover,
#user-tab-activity .post-id:hover,
*:hover > .post-id,
.originals-of-duplicate .post-id {
    display: inline-block;
    opacity: 1;
}
#sidebar .post-id,
#question-header .post-id,
.js-loaded-body .post-id {
    display: none;
}
.post-list .revision-comment {
    position: relative;
    display: block;
}

/* Compatibility */
.post-stickyheader ~ .post-id {
    z-index: unset;
}
`;
document.body.appendChild(styles);