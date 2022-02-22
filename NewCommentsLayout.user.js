// ==UserScript==
// @name         New Comments Layout
// @description  Better comments layout for easier readability and moderation
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.0
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
// @run-at       document-start
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';

const commentsFontSize = '0.94rem';


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
/* Main comments UI changes */
.comment-body {
    font-size: 0;
}
.comment-body > * {
    display: inline-block;
    margin: 0 10px 0 0;
    font-size: ${commentsFontSize};
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
    font-size: ${commentsFontSize};
}
.comment-form .comment-copy,
.comment-body .comment-copy {
    display: block;
    margin: 0 0 2px 0;
    line-height: 1.2;
    color: var(--black);

    font-family: Helvetica, Arial, sans-serif;
    font-size: ${commentsFontSize};
    letter-spacing: 0.1px;
}

/* Minor comments UI changes */
.comments ul.comments-list .comment-text {
    padding-right: 0;
}
.comment-copy + .comment-user {
    margin-left: 5px;
    margin-right: 5px;
}
.comment-user {

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

/* New mod/staff badges */
.s-badge__staff {
  border-color: var(--orange-400) !important;
  background-color: transparent !important;
  color: var(--orange-400) !important;
}
.s-badge__moderator {
  border-color: var(--theme-secondary-color) !important;
  background-color: transparent !important;
  color: var(--theme-secondary-color) !important;
}
.s-badge__moderator.s-badge__xs:before {
  background-image: url("data:image/svg+xml,%3Csvg width='7' height='9' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2.798.246c.3-.329 1.1-.327 1.399 0l2.579 3.66c.3.329.298.864 0 1.192L4.196 8.75c-.299.329-1.1.327-1.398 0L.224 5.098a.904.904 0 010-1.192L2.798.246z' fill='%230077cc'/%3E%3C/svg%3E") !important;
}
.s-badge__moderator:before {
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='14' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5.528.746c.257-.329.675-.327.93 0l4.42 5.66c.258.329.257.864 0 1.192l-4.42 5.66c-.256.328-.674.327-.93 0l-4.42-5.66c-.257-.329-.256-.865 0-1.192l4.42-5.66z' fill='%230077cc'/%3E%3C/svg%3E") !important;
}
.comment-body > .s-badge {
    position: relative;
    display: inline-block;
    white-space: nowrap;
    margin: 0px 0px 5px;
}
.comment-body > .s-badge + .comment-date {
    margin-left: 6px;
}
.s-badge__moderator:before {
    display: inline-block !important;
}
`;
document.head.appendChild(styles);