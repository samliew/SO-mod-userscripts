// ==UserScript==
// @name         Stack Exchange Dark Mode
// @description  Dark theme for sites and chat on the Stack Exchange Network
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.7.2
//
// @include      https://*stackexchange.com/*
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*.stackexchange.com/*
//
// @include      https://chat.stackoverflow.com/*
// @include      https://chat.stackexchange.com/*
// @include      https://chat.meta.stackexchange.com/*
//
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';


    const textcolor = '#bbb';
    const bgcolor = '#222';
    const btncolor = '#333';
    const bordercolor = '#555';

    const darkgreen = '#296538';
    const darkblue = '#035';
    const orange = '#F48024';


    const soLogo = `<svg xmlns="http://www.w3.org/2000/svg" class="-img _glyph" style="width:160px;height:40px;margin:0 -7px;background:none !important;" viewBox="0 0 480.5 117.9"><style>.st0{fill:#fff}.st1{fill:#bcbbbb}.st2{fill:#f48024}</style><path class="st0" d="M123.7 67.3l-4.8-.4c-3.7-.3-5.2-1.8-5.2-4.3 0-3 2.3-4.9 6.6-4.9 3.1 0 5.8.7 7.9 2.4l2.8-2.8c-2.7-2.2-6.4-3.2-10.7-3.2-6.3 0-10.9 3.3-10.9 8.7 0 4.9 3.1 7.5 8.9 8l4.9.4c3.4.3 4.9 1.7 4.9 4.3 0 3.5-3 5.2-7.9 5.2-3.7 0-6.9-1-9.2-3.4l-2.9 2.9c3.3 3.1 7.2 4.3 12.2 4.3 7.2 0 12.1-3.3 12.1-9 .1-5.8-3.5-7.7-8.7-8.2zm37.2-13.4c-4.8 0-7.8.9-10.4 4.3l2.8 2.8c1.7-2.5 3.7-3.4 7.5-3.4 5.4 0 7.6 2.2 7.6 6.5V67h-8.9c-6.6 0-10.2 3.4-10.2 8.6 0 2.4.8 4.6 2.2 6 1.9 1.9 4.3 2.7 8.4 2.7 4 0 6.1-.8 8.6-3.2V84h4.3V63.8c-.1-6.4-4-9.9-11.9-9.9zm7.5 19.6c0 2.5-.5 4.2-1.5 5.1-1.9 1.8-4.1 2-6.6 2-4.7 0-6.8-1.6-6.8-5.1 0-3.4 2.2-5.2 6.6-5.2h8.3v3.2zm21.3-15.7c2.8 0 4.6.8 6.8 3.3l2.9-2.8c-3-3.3-5.6-4.3-9.7-4.3-7.5 0-13.1 5.1-13.1 15.2s5.7 15.2 13.1 15.2c4.1 0 6.7-1.1 9.8-4.4l-3-2.8c-2.2 2.5-4 3.4-6.8 3.4-2.9 0-5.3-1.1-6.9-3.4-1.4-1.9-1.9-4.2-1.9-8 0-3.7.5-6 1.9-8 1.6-2.3 4-3.4 6.9-3.4zm37.2-3.5h-5.4L208 67.4V41.1h-4.3V84h4.3V73.2l5.3-5.3 9.9 16.1h5.4l-12.3-19.1 10.6-10.6zm20.4-1.6c-4.6 0-7.6 1.8-9.5 3.8-2.8 2.9-3.5 6.4-3.5 12s.7 9.1 3.5 12c1.9 2 5 3.8 9.5 3.8 4.6 0 7.7-1.8 9.6-3.8 2.8-2.9 3.5-6.4 3.5-12s-.7-9.1-3.5-12c-1.9-2-5.1-3.8-9.6-3.8zm3.6 23.3c-.9.9-2.1 1.4-3.6 1.4s-2.7-.5-3.6-1.4c-1.6-1.6-1.8-4.3-1.8-7.5s.2-5.9 1.8-7.5c.9-.9 2-1.4 3.6-1.4 1.5 0 2.7.5 3.6 1.4 1.6 1.6 1.8 4.3 1.8 7.5s-.2 5.9-1.8 7.5zm30-22.9l-6.2 19.1-6.3-19.1h-8.1L271.7 84h6L289 53.1h-8.1zm21.3-.4c-8 0-13.5 5.7-13.5 15.8 0 12.5 7 15.8 14.3 15.8 5.6 0 8.6-1.7 11.7-4.9l-4.7-4.6c-2 2-3.6 2.9-7 2.9-4.3 0-6.8-2.9-6.8-6.9h19.3v-3.4c.1-8.4-4.8-14.7-13.3-14.7zm-5.9 12.9c.1-1.4.2-2.2.7-3.3.8-1.8 2.5-3.2 5.2-3.2 2.6 0 4.3 1.4 5.2 3.2.5 1.1.7 2 .7 3.3h-11.8zM327 56v-3h-7.5v31h7.7V65.4c0-3.9 2.6-5.7 5-5.7 1.9 0 2.9.6 4.1 1.8l5.8-5.8c-2.1-2.1-4.3-2.9-7.3-2.9-3.4-.1-6.3 1.5-7.8 3.2zm17.4-6.1V84h7.7V59.6h5.7v-5.9h-5.7v-3.4c0-1.8.9-2.8 2.7-2.8h3V41h-4.4c-6.2 0-9 4.5-9 8.9zm45.2 2.8c-4.6 0-7.6 1.8-9.5 3.8-2.8 2.9-3.5 6.4-3.5 12s.7 9.1 3.5 12c1.9 2 5 3.8 9.5 3.8 4.6 0 7.7-1.8 9.6-3.8 2.8-2.9 3.5-6.4 3.5-12s-.7-9.1-3.5-12c-1.9-2-5.1-3.8-9.6-3.8zm3.6 23.3c-.9.9-2.1 1.4-3.6 1.4s-2.7-.5-3.6-1.4c-1.6-1.6-1.8-4.3-1.8-7.5s.2-5.9 1.8-7.5c.9-.9 2-1.4 3.6-1.4 1.5 0 2.7.5 3.6 1.4 1.6 1.6 1.8 4.3 1.8 7.5s-.2 5.9-1.8 7.5zm45.9-22.9l-5 19.1-6.3-19.1h-5.6l-6.3 19.1-5-19.1h-8.2l9.5 30.9h6.3l6.5-19.4 6.5 19.4h6.3l9.4-30.9h-8.1zm-69.9 21.6V41h-7.7v34.1c0 4.4 2.7 8.8 9 8.8h4.4v-6.5h-3c-1.9 0-2.7-.9-2.7-2.7zM144.5 59l4-4h-8.2v-9.8H136V76c0 4.4 2.5 8 7.6 8h3.1v-3.7h-2.3c-2.8 0-4-1.6-4-4.3V59h4.1z"/><path class="st1" d="M87.6 91.3v-22H95v29.3H29.1V69.3h7.3v22z"/><path class="st2" d="M44.5 67.3l35.9 7.5 1.5-7.2L46 60.1l-1.5 7.2zm4.7-17.2l33.2 15.5 3.1-6.6-33.2-15.6-3.1 6.7zm9.2-16.3l28.2 23.4 4.7-5.6-28.2-23.4-4.7 5.6zm18.2-17.3l-5.9 4.4 21.9 29.4 5.9-4.4-21.9-29.4zM43.7 83.9h36.6v-7.3H43.7v7.3z"/></svg>`;


    GM_addStyle(`


/* Apply to all */
body {
    background-image: none;
}
*,
*:before,
*:after,
#search-channel-selector,
body .bg-black-025,
body .bg-black-050,
.fc-light,
.fc-medium,
.fc-dark {
    background-color: ${bgcolor};
    color: ${textcolor};
    box-shadow: none;
    outline: none;
    text-shadow: none;
}
.btn,
.button,
button,
input[type="submit"],
input[type="button"],
input[type="reset"] {
    background-image: none;
    border-color: ${bordercolor};
}
hr {
    background-color: ${bordercolor};
    border-color: ${bordercolor};
}
#sidebar .module {
    margin-bottom: 25px;
    padding-bottom: 20px;
    border: none;
    border-bottom: 1px dashed #555;
}
#sidebar .community-bulletin .bulletin-item-content a,
a:not(.s-btn) {
    color: #fff;
}
#sidebar .community-bulletin .bulletin-item-content a:hover,
a:hover {
    color: #fff;
}
iframe:hover,
a:hover img,
a:hover svg,
button:hover img,
button:hover svg {
    filter: none;
    background-color: inherit;
}
iframe,
img,
.-img,
._glyph {
    filter: brightness(0.8) saturate(90%);
}
button:hover,
input[type="button"]:hover,
input[type="submit"]:hover,
.s-btn:hover, .btn:hover {
    background-color: ${btncolor};
    color: white;
}
body .fc-dark {
    color: #ddd;
}
body .fc-medium {
    color: #888;
}
body .bc-black-1,
body .bc-black-2,
body .bc-black-3 {
    border-color: ${bordercolor};
}
body .fc-theme-primary {
    color: ${orange};
}


/* Selection */
::selection { background: ${darkgreen}; }
::-moz-selection { background: ${darkgreen}; }


/* Scrollbars */
::-webkit-scrollbar{ width:10px; height:10px; }
::-webkit-scrollbar-thumb{ background-color:rgb(196, 196, 196); border-radius: 5; }
::-webkit-scrollbar-thumb:hover{ background-color:rgb(196, 196, 196); }
::-webkit-scrollbar-track{ background-color:rgb(60, 60, 60); }


/* Specific elements opacity & hover */
.wmd-button-row,
#left-sidebar,
#sidebar > *,
.deleted-answer,
.downvoted-answer,
.top-bar .-logo,
#usersidebar,
.usersidebar-open #usersidebar,
.js-admin-dashboard aside > * {
    opacity: 0.6;
    transition: opacity 0.2s ease;
}
.question-summary .started,
#footer > div {
    opacity: 0.4;
    transition: opacity 0.2s ease;
}
ul.comments-list .comment-voting,
ul.comments-list .comment-flagging {
    opacity: 0.1;
}
.wmd-button-row:hover,
#left-sidebar:hover,
#sidebar > *:hover,
.deleted-answer:hover,
.downvoted-answer:hover,
.top-bar .-logo:hover,
#usersidebar:hover,
.js-admin-dashboard aside > *:hover,
.question-summary:hover .started,
#footer:hover > div,
ul.comments-list .comment:hover .comment-voting,
ul.comments-list .comment:hover .comment-flagging {
    opacity: 1;
}


/* Specific elements */
#content,
.flush-left,
.question-summary,
.top-bar .searchbar .s-input,
#search-channel-selector {
    border-color: ${bordercolor};
}
.s-btn svg,
.s-btn svg * {
    color: inherit;
}
.s-btn * {
    background: none;
}
#sidebar a,
#content #sidebar .community-bulletin .bulletin-item-content a,
a.fc-medium,
a.fc-dark {
    color: inherit;
}
#sidebar a:hover,
#content #sidebar .community-bulletin .bulletin-item-content a:hover,
a.fc-medium:hover,
a.fc-dark:hover {
    color: white;
}
#content {
    border-right: none;
}
#footer {
    border-top: 1px solid ${bordercolor};
}
.topbar-dialog .unread-item *,
.expander-arrow-small-hide,
#tabs a:before,
.tabs a:before {
    background-color: transparent;
}
.top-bar .-logo,
.top-bar .-logo span {
    background-color: transparent;
    filter: none;
}
.top-bar.top-bar__network .-logo {
    background-color: transparent;
    opacity: 1;
}
.s-select:before, .s-select:after,
.f-select:before, .f-select:after {
    border-color: #AAA transparent;
}
.s-btn__muted.s-btn__outlined.s-btn__dropdown:after {
    border-color: currentColor transparent;
}
.temp-popover--arrow:before,
.temp-popover--arrow:after {
    border-color: transparent;
    border-bottom-color: #e4e6e8;
}
.top-bar .indicator-badge {
    background-color: #07C;
    color: white;
}
.top-bar .indicator-badge._important {
    background-color: #C91D2E;
}
.topbar-dialog .unread-item {
    background-color: ${darkblue};
}
ul.comments-list .comment > * {
    border-color: #333;
}
.comment .relativetime,
.comment .relativetime-clean,
.comment .comment-score {
    opacity: 0.5;
}
.message {
    border: 1px solid ${bordercolor};
}
.wmd-button-row {
    background-color: white;
}
.wmd-button-row * {
    background-color: inherit;
}
.js-post-issues .s-btn {
    border-color: transparent;
}
.question-summary .excerpt {
    color: #aaa;
}
.post-tag,
.tags .post-tag,
.post-taglist .post-tag {
    background-color: ${btncolor};
    color: #aaa;
}
body > div[style*="absolute"],
.tag-popup {
    background-color: transparent;
}
.tag-popup .-container,
.tag-popup .-container > *,
.tag-popup .-container .grid {
    background-color: black;
}
.badge1-alternate,
.badge2-alternate,
.badge3-alternate,
.badge-how-to {
    border-color: transparent;
}
.s-progress {
    background-color: #d6d9dc;
}
.s-progress--bar {
    background-color: #42d773;
}
.youarehere,
.is-selected {
    background-color: ${bordercolor};
}
.nav-links .youarehere .nav-links--link {
    border-right: 3px solid ${orange};
}
.bounty-indicator-tab {
    color: white;
    background-color: #0077dd;
}
.supernovabg {
    color: white;
    background-color: #F48024;
}
.hotbg {
    color: white;
    background-color: #CF7721;
}
.coolbg {
    color: white;
    background-color: #9199a1;
}
.tagged-interesting {
    box-shadow: inset 0 0 16px -4px #bbbb00;
}
.deleted-answer,
.deleted-comment .comment-actions,
.deleted-comment .comment-text,
.deleted-comment .comment-flags {
    box-shadow: inset 0 0 0 9999px #220000;
}
.tagged-interesting *,
.deleted-answer *:not(.popup),
.deleted-comment .comment-text *:not(.popup) {
    background-color: transparent;
}
.vote-up-off,
.vote-down-off,
.star-off {
    opacity: 0.2;
}
.vote-up-on,
.vote-down-on {
    background-blend-mode: exclusion;
    filter: brightness(1000%);
    background-color: #030303;
    opacity: 1;
}
.star-on {
    opacity: 1;
}
body .bg-white,
body .bg-yellow-100 {
    background-color: ${bgcolor};
}
body .bg-green-400,
.accepted,
.answered-accepted,
.special-rep {
    background-color: ${darkgreen};
}
.status > * {
    background-color: transparent;
}
.new-post-activity,
.new-answer-activity {
    background-color: #888;
}
.new-post-activity a,
.new-answer-activity a {
    background-color: transparent;
}
.answer-votes.answered-accepted {
    color: white;
    background-color: #5fba7d;
}
span.diff-delete {
    background-color: #e5bdb2;
    color: #a82400;
}
span.diff-add {
    background-color: #d1e1ad;
    color: #405a04;
}
img.diff-delete {
    border-color: red;
}
img.diff-add {
    border-color: #d1e1ad;
}
.inserted > div {
    background-color: #204a2e;
}
.profile-cards--graph {
    background-image: none;
}
#avatar-card {
    box-shadow: none;
}
a.comment-user.owner {
    background-color: #E1ECF4;
    color: #555;
}
.page-numbers {
    background-image: none;
}
body table.sorter > tbody > tr:nth-child(odd) > td {
    background-color: #181818;
}
body table.sorter > tbody > tr:nth-child(even) > td {
    background: none;
}


/* Code colours */
pre {
    background-color: #444;
}
pre * {
    background-color: inherit;
}
.str, .lit, .tag {
    color: #d68585;
}
.kwd, .dec {
    color: #7e7ef1;
}
.typ {
    color: #6dbcd5;
}


/* Dark mode for SOMU userscripts */
.js-usercolor:after {
    opacity: 0.7;
}
.post-stickyheader {
    background: #111;
}
.post-stickyheader * {
    background: none;
}
.ctype-custom,
.ctype-bad,
.ctype-poor,
.ctype-meh {
    display: inline;
    padding: 2px 5px 3px;
    line-height: 1;
    font-size: 10px;
    font-style: normal;
    border-radius: 2px;
    color: white;
}
.ctype-custom {
    background-color: #ffc;
    color: #333;
}
.ctype-bad {
    background-color: #ff2600;
}
.ctype-poor {
    background-color: #ff9300;
}
.ctype-meh {
    background-color: #999;
}
.cmmt-chatty {
    color: coral;
}
.cmmt-rude {
    color: red;
}
a.comment-user.owner {
    background-color: #5f666d;
    color: #fff;
}
.delete-comment,
.cancel-comment-flag,
.skip-post {
    background: #444;
}
.cancel-comment-flag .cancel-delete-comment-flag {
    background-color: red;
}
.deleted-answer .mod-userlinks,
.deleted-answer .post-mod-menu {
    background-color: #220000;
}
#search-helper {
    padding-bottom: 20px;
    border: 1px solid ${bordercolor};
    border-top: none;
}
#saved-search .handle:before,
#saved-search .handle:after {
    background-color: ${bordercolor};
}
#search-helper svg,
#btn-bookmark-search svg,
#btn-auto-refresh svg {
    background-color: transparent;
    fill: #ccc;
}
#search-helper .active svg {
    fill: #888;
}
#btn-bookmark-search.active svg,
#btn-auto-refresh.active svg {
    fill: gold;
}
.fancybox-bg,
.fancybox-inner,
.fancybox-stage,
.fancybox-slide {
    background: none;
}
.fancybox-container {
    background-color: rgba(0,0,0,0.6);
}
#search-helper input[type="radio"] + label:before {
    color: transparent;
}
#search-helper input[type="radio"]:checked + label:before {
    color: ${orange};
}


/* Chat */
.topbar {
    background: black;
}
.topbar .topbar-wrapper,
.topbar .topbar-wrapper *,
#modflag-count a,
#flag-count a,
#annotation-count a {
    background-color: transparent;
}
.topbar .topbar-icon-on,
.topbar .topbar-icon-on:hover {
    background-color: #eff0f1;
}
.topbar .js-topbar-dialog-corral > * {
    background-color: black;
}
#header-logo img,
#transcript-logo img {
    background-color: white;
}
#chat-body .messages,
#chat-body .message,
.messages,
.message,
.monologue .timestamp {
    background: none;
    border: none;
}
.message .content a {
    border-bottom: 1px dotted #777;
}
.pager .page-numbers.current,
#chat-body .button,
.button {
    background-color: #444;
}
.calendar,
.calendar-small {
    background-image: none;
}
#chat-body .notification {
    border-bottom: 2px dashed ${textcolor};
}
#chat-body div.message.reply-parent .content,
#chat-body div.message.reply-child .content,
#transcript div.message.reply-parent .content,
#transcript div.message.reply-child .content {
    background-color: #444;
}
.message .mention {
    background-color: #8f6224;
}
.vote-count-container.stars .img {
    background-size: 32px;
    background-position: 0px -343px;
}
.vote-count-container.stars.user-star .img {
    background-size: auto;
    background-position: top left;
    background-position: 0 -110px;
}
#feed-ticker {
    border: 2px dashed ${textcolor};
}
#feed-ticker > *,
#feed-ticker .ticker-item {
    background: none;
    border: none;
}
#chat-body .system-message-container .system-message {
    color: ${textcolor};
}
.mspark .mspbar,
.room-histogram .mspark .mspbar,
.mini-room-chart .mspark .mspbar,
.mini-user-chart .mspark .mspbar {
    background-color: ${bordercolor};
}
.mspark .mspbar.now,
.room-histogram .mspark .mspbar.now,
.mini-room-chart .mspark .mspbar.now,
.mini-user-chart .mspark .mspbar.now {
    background-color: #dd6205;
}
.highlight .content,
#main.select-mode .message.selected .content {
    background-color: #135;
}
#starred-posts > div > ul > li {
    border-bottom-color: #666;
}
#sidebar #info #sound {
    filter: brightness(6.5);
    background-color: transparent;
}


/* New mod interface only */
body .js-flagged-post .bc-black-3 {
    border: 1px dotted #666;
}
.js-post-flag-options {
    background-color: transparent;
}
.js-post-flag-group.js-cleared {
    opacity: 0.5;
}


`.replace(/;/g, ' !important;'));


    document.addEventListener('DOMContentLoaded', function() {
        const $ = unsafeWindow.jQuery || window.jQuery;

        if(location.hostname === "stackoverflow.com") {
            $('.top-bar .-logo .-img').replaceWith(soLogo);
        }
        if(location.hostname === "chat.stackoverflow.com") {
            $('#footer-logo img').replaceWith(soLogo);
        }
    });


})();
