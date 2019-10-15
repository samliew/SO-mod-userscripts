// ==UserScript==
// @name         Stack Print Styles
// @description  Print preprocessor and print styles for Stack Exchange Q&A, blog, and chat. Includes a handy load all comments button at bottom right.
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.1.1
//
// @include      https://*stackexchange.com/*
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*.stackexchange.com/*
//
// @include      https://stackapps.com/*
// @include      https://stackoverflow.blog/*
//
// @include      https://chat.stackoverflow.com/*
// @include      https://chat.stackexchange.com/*
// @include      https://chat.meta.stackexchange.com/*
//
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';


    function appendQnaPrintStyles() {

        GM_addStyle(`
@media print {

    html, body {
        max-width: none;
    }
    body {
        font-size: 11px;
        background-color: #fff;
        background-image: none;
    }
    header,
    footer,
    #topbar,
    #sidebar,
    #left-sidebar,
    #footer,
    #post-form,
    body > span,
    .site-header,
    .deleted-comment-info,
    .comment-flagging,
    .comment-voting,
    .js-post-issue,
    .comments + div[id^="comments-link"],
    .pager-answers,
    .bottom-notice,
    a.new-answer,
    .js-comment-edit,
    .js-comment-delete
    {
        display: none;
    }

    #content
    .question-page #answers .answer {
        border: none;
    }

    /* Lighten bg of deleted answer */
    .deleted-answer {
        background-color: #fff8f8;
    }

    /* Don't show if you have voted */
    .s-btn.fc-theme-primary {
        color: inherit;
    }

    /* No relative dates */
    .relativetime,
    .relativetime-clean,
    #question-header + .grid > .grid--cell time,
    #question-header + .grid > .grid--cell a {
        font-size: 0;
    }
    .relativetime:before,
    .relativetime-clean:before,
    #question-header + .grid > .grid--cell time:before,
    #question-header + .grid > .grid--cell a:before {
        content: attr(title);
        font-size: 13px;
        white-space: nowrap;
    }
    #question-header + .grid > .grid--cell time:before {
        content: attr(datetime);
    }
    .comment-date .relativetime:before,
    .comment-date .relativetime-clean:before,
    .user-info .user-action-time .relativetime:before,
    .user-info .user-action-time .relativetime-clean:before {
        font-size: 12px;
    }

    /* Answer starts on a new page */
    #answers > a {
        display: block;
        height: 1px;
        page-break-before: always;
    }
    #answers > a:nth-of-type(2),
    #answers > a:last-of-type {
        page-break-before: auto;
    }

    /* Do not break comments between pages */
    .comment,
    .comment-text {
        page-break-inside: avoid;
    }

    /* Hide/Reset SOMU stuff */
    #somusidebar,
    #usersidebar,
    .redact-buttons,
    .print-comment-buttons,
    .post-id,
    .post-mod-menu-link,
    .mod-userlinks,
    .comment-flagcount
    {
        display: none;
    }
    .votecell .vote,
    .votecell .js-voting-container,
    .post-stickyheader {
        position: relative;
        top: 0;
    }
    .post-stickyheader .relativetime {
        border-bottom: none;
    }
    .deleted-answer .votecell .vote, .deleted-answer .votecell .js-voting-container {
        background-color: transparent;
    }

    /* Hide/Reset other userscripts stuff */
    #roombaFieldRow,
    .pronouns
    {
        display: none;
    }

}
`.replace(/ !important/g, '').replace(/;/g, ' !important;'));

    } // End QnA styles


    function appendChatPrintStyles() {

        GM_addStyle(`
@media print {

    html, body {
        max-width: 780px;
    }
    body {
        font-size: 11px;
        background-color: #fff;
        background-image: none;
    }

    body > span[style*="absolute"],
    #topbar,
    .topbar,
    #feed-ticker,
    #bottom,
    #input-area,
    #sound,
    input,
    button,
    .button,
    #container > a,
    #container > br,
    #widgets > .sidebar-widget:nth-child(2),
    #widgets > .sidebar-widget:last-child,
    #sidebar .more,
    #sidebar .user-currentuser,
    #sidebar .js-hasfull .message-orig,
    #sidebar #room-ad,
    #toggle-favorite,
    #transcript-body #info br + br,
    #transcript-body .room-mini ~ br,
    #transcript-body #transcript-logo,
    #transcript-body #copyright,
    .monologue .avatar,
    .message-controls,
    .message > .action-link,
    .message > .meta,
    .username .name + br,
    .username .pronouns
    {
        display: none;
    }

    #sidebar #info #roomdesc > div,
    #starred-posts > div > ul > li,
    .ob-message.js-onebox-hidden,
    #chat .monologue:first-child .js-dynamic-timestamp
    {
        display: block;
    }

    #sidebar .js-hasfull .message-full
    {
        display: inline;
    }

    #main {
        display: flex;
        flex-direction: column-reverse;
        width: 100%;
    }
    #sidebar {
        position: relative;
        width: auto;
        margin: 10px 0 20px;
        padding: 10px;
        border: 1px dotted black;
    }
    #transcript-body #sidebar {
        margin-bottom: -10px;
    }
    #sidebar #info #roomdesc {
        position: relative;
        height: auto;
        padding-bottom: 0;
        border: none;
        background: transparent;
        white-space: unset;
    }
    #sidebar #info #roomdesc + #sidebar-menu {
        margin-top: 10px;
    }
    #sidebar #present-users-list {
        max-height: none;
        overflow: visible;
        color: #000;
    }
    #sidebar #present-users-list li {
        flex: 0 0 20%;
    }
    #sidebar #present-users-list li.inactive {
        opacity: 0.7;
    }
    #sidebar #starred-posts ul.collapsible,
    #sidebar #starred-posts ul.collapsible.expanded {
        max-height: none;
        padding-bottom: 0;
        overflow: visible;
    }
    #chat-body #container {
        padding-top: 0;
    }
    #chat {
        padding-bottom: 20px;
    }
    .monologue {
        display: flex;
        margin: 10px 20px 0 0;
        padding: 0;
    }
    .monologue .signature {
        flex: 0 1 100px;
        margin-right: 8px;
    }
    .monologue .messages {
        flex: 1 0 80%;
        background-color: #f8f8f8;
    }
    .monologue.catchup-marker {
        padding-top: 0;
        border-top: none;
    }
    #chat .monologue,
    #chat .monologue * {
        float: none;
    }
    .message {
        display: flex;
        page-break-inside: avoid;
        border: none;
    }
    .message .content {
        flex: 1 1 100%;
        padding-right: 50px;
    }
    div.message .full,
    div.message .partial {
        max-height: none;
    }
    #chat .messages .timestamp,
    #chat .message.cmmt-deleted span.deleted {
        position: absolute;
        right: 28px;
    }
    .stars .img {
        filter: saturate(0) grayscale(1) brightness(0);
    }

    /* SOMU - Chat Transcript Helper - switch back to original timestamp (UTC) */
    .timestamp[data-orig-timestamp] {
        font-size: 0;
    }
    .timestamp[data-orig-timestamp]:before {
        content: attr(data-orig-timestamp);
        font-size: 9px;
        white-space: nowrap;
    }

}
`.replace(/ !important/g, '').replace(/;/g, ' !important;'));

    } // End chat styles


    function loadAllComments(inclDeleted = false) {

        // Short delay for Q&A to init
        setTimeout(() => {

            // Always expand comments if comments have not been expanded yet
            $('.question, .answer').find('.js-comments-container').not('.js-del-loaded').addClass('js-del-loaded').each(function() {

                const postId = this.dataset.answerid || this.dataset.questionid || this.dataset.postId;

                // Remove default comment expander
                const elems = $(this).next().find('.js-show-link.comments-link').prev().addBack();

                // Get all including deleted comments
                // This method will avoid jumping to comments section
                const commentsUrl = `/posts/${postId}/comments?includeDeleted=${inclDeleted}&_=${Date.now()}`;
                $('#comments-'+postId).children('ul.comments-list').load(commentsUrl, function() {
                    elems.remove();
                });
            });

        }, 1000);
    }


    function doPageload() {

        if(location.pathname.includes('/questions/')) {
            appendQnaPrintStyles();

            const commentButtons = $(`<div class="print-comment-buttons"><button>Load comments</button></div>`).appendTo('body');
            if(StackExchange.options.user.isModerator) {
                commentButtons.prepend(`<button data-incldeleted="true">Load deleted comments</button>`);
            }

            commentButtons.on('click', 'button', function(evt) {

                // Remove buttons
                commentButtons.remove();

                const inclDeleted = !!evt.target.dataset.incldeleted;
                loadAllComments(inclDeleted);

                return false;
            });

            // Styles for loading comments buttons
            GM_addStyle(`
.print-comment-buttons {
    position: fixed !important;
    bottom: 3px;
    right: 3px;
    z-index: 999999;
}
.print-comment-buttons:hover button {
    display: inline-block !important;
}
.print-comment-buttons button {
    display: none;
    margin-right: 3px;
    opacity: 0.5;
}
.print-comment-buttons button:hover {
    opacity: 1;
}
.print-comment-buttons button:nth-last-child(1) {
    display: inline-block;
    margin-right: 0;
}
`);
        }

        else if(location.hostname.includes('chat.')) {
            appendChatPrintStyles();
        }
    }


    // On page load
    doPageload();


})();
