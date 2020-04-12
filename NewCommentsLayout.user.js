// ==UserScript==
// @name         New Comments Layout
// @description  Better comments layout for easier readability and moderation
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*stackapps.com/*
// @include      https://*.stackexchange.com/*
//
// @exclude      *chat.*
//
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';


        GM_addStyle(`

/* Main comments UI changes */
.comment-body {
    font-size: 0;
}
.comment-body > * {
    display: inline-block;
    margin: 0 10px 0 0;
    font-size: 0.9rem;
}
.comment-body .comment-date,
.comment-body .comment-date > a {
    color: var(--black-350);
}
.comment-body > button {
    font-size: 0.9rem;
}
.comment-body > button.js-comment-delete {
    float: right;
    margin-left: 10px;
}
ul.comments-list .comment-score span,
.comment-copy {
    font-size: 0.96rem;
}
.comment-copy {
    display: block;
    margin: 0 0 2px 0;
    line-height: 1.2;
}

/* Minor comments UI changes */
.comments ul.comments-list .comment-text {
    padding-right: 0;
}
.comment-copy + .comment-user {
    margin-left: 5px;
}
.comment-user {
    font-style: italic;
}
.deleted-comment-info {
    float: right;
}
.deleted-comment-info .comment-user {
    display: inline-block;
}

/* Hover only styles */
ul.comments-list:hover .js-comment-delete .hover-only-label {
    visibility: visible;
    opacity: 0.2;
}
ul.comments-list .comment:hover .js-comment-delete .hover-only-label {
    opacity: 1;
}
ul.comments-list .comment .comment-actions,
ul.comments-list .comment .comment-text {
    transition: none;
}
ul.comments-list .comment:not(.deleted-comment):hover .comment-actions,
ul.comments-list .comment:not(.deleted-comment):hover .comment-text {
    background-color: var(--yellow-050);
}

`);

})();
