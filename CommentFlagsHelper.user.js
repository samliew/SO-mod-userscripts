// ==UserScript==
// @name         Comment Flags Helper
// @description  Always expand comments (with deleted) and highlight expanded flagged comments, Highlight common chatty and rude keywords
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      4.2
//
// @include      https://*stackoverflow.com/admin/dashboard*
// @include      https://*serverfault.com/admin/dashboard*
// @include      https://*superuser.com/admin/dashboard*
// @include      https://*askubuntu.com/admin/dashboard*
// @include      https://*mathoverflow.net/admin/dashboard*
// @include      https://*.stackexchange.com/admin/dashboard*
//
// @include      https://*stackoverflow.com/admin/users/*/post-comments*
// @include      https://*serverfault.com/admin/users/*/post-comments*
// @include      https://*superuser.com/admin/users/*/post-comments*
// @include      https://*askubuntu.com/admin/users/*/post-comments*
// @include      https://*mathoverflow.net/admin/users/*/post-comments*
// @include      https://*.stackexchange.com/admin/users/*/post-comments*
//
// @exclude      *?flagtype=posttoomanycommentsauto*
//
// @require      https://raw.githubusercontent.com/samliew/ajax-progress/master/jquery.ajaxProgress.js
// ==/UserScript==

(function() {
    'use strict';

    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;


    jQuery.fn.lcTrimText = function() {
        return this.first().text().trim().toLowerCase();
    };


    const fkey = StackExchange.options.user.fkey;
    const twohours = 2 * 60 * 60000;
    const oneday = 24 * 60 * 60000;
    const oneweek = 7 * oneday;
    const superusers = [ 584192 ];
    let reviewFromBottom = false;
    let $eventsTable, $eventsContainer, $events;
    let ajaxTimeout;

    // Special characters must be escaped with \\
    const rudeKeywords = [
        'fuck\\w*', 'arse', 'cunts?', 'dick', 'cock', 'pussy', 'hell', 'stupid', 'idiot', '!!+', '\\?\\?+',
        'grow up', 'shame', 'wtf', 'garbage', 'trash', 'spam', 'damn', 'stop', 'horrible', 'inability', 'bother',
        'nonsense', 'no sense', 'sense', 'never work', 'illogical', 'fraud', 'crap', '(bull|cow|horse)?\\s?shit',
        'reported', 'get lost', 'go away', 'useless', 'deleted?', 'delete[\\w\\s]+(answer|question|comment)',
        'move on', 'gay', 'lesbian', 'sissy', 'brain', 'rtfm', 'blind', 'retard(ed)?', 'jerks?', 'bitch\\w*', 'learn',
        'read[\\w\\s]+(tutorial|docs|manual)', 'lack[\\w\\s]+research', 'idownvotedbecau.se', 'bad',
    ];
    const rudeRegex = new RegExp('\\s(' + rudeKeywords.join('|') + ')(?![/-])', 'gi');

    // Special characters must be escaped with \\
    const chattyKeywords = [
        'thanks?', 'thx', 'welcome', 'updated', 'edited', 'added', '(in)?correct(ed)?', 'done', 'worked', 'works', 'glad',
        'appreciated?', 'my email', 'email me', 'contact', 'good', 'great', 'sorry', '\\+1', 'love', 'wow', 'pointless', 'no\\s?(body|one)',
        'homework', 'no idea', 'your mind', 'try it', 'typo', 'wrong', 'unclear', 'regret', 'every\\s?(body|one)',
        'exactly', 'check', 'lol', 'ha(ha)+', 'women', 'girl', 'effort', 'understand', 'want', 'need', 'little',
        'give up', 'documentation', 'google\\s', 'what[\\w\\s]+(try|tried)[\\w\\s]*\\?*', 'free', 'obvious',
        '(down|up)[-\\s]?vot(er|ed|e|ing)',
    ];
    const chattyRegex = new RegExp('\\s(' + chattyKeywords.join('|') + ')(?![/-])', 'gi');


    function replaceKeywords(jqElem) {
        let text = ' ' + this.innerHTML;
        text = text.replace(rudeRegex, ' <span class="cmmt-rude">$1</span>');
        text = text.replace(chattyRegex, ' <span class="cmmt-chatty">$1</span>');
        this.innerHTML = text;
    }


    function filterPosts(filter) {
        console.log(`Filter by: ${filter}`);

        // Get sort function based on selected filter
        let filterFn;
        switch(filter) {

            case 'rude':
                filterFn = function(i, el) {
                    return $(el).next('.text-row').find('.revision-comment, .deleted-info').lcTrimText().contains('rude');
                };
                break;

            case 'unwelcoming':
                filterFn = function(i, el) {
                    return $(el).next('.text-row').find('.revision-comment, .deleted-info').lcTrimText().contains('unwelcoming');
                };
                break;

            case 'nln':
                filterFn = function(i, el) {
                    return $(el).next('.text-row').find('.revision-comment, .deleted-info').lcTrimText().contains('no longer needed');
                };
                break;

            case 'normal':
                filterFn = function(i, el) {
                    return $(el).next('.text-row').find('.revision-comment, .deleted-info').length === 0;
                };
                break;

            case 'deleted':
                filterFn = function(i, el) {
                    return $(el).hasClass('deleted-row');
                };
                break;

            case 'notdeleted':
                filterFn = function(i, el) {
                    return !$(el).hasClass('deleted-row');
                };
                break;

            default:
                filterFn = function(i, el) {
                    return true;
                };
                break;
        }

        $events.addClass('dno').filter(filterFn).removeClass('dno');
    }


    function initCommentFilters() {

        appendUserCommentsFilterstyles();

        $eventsTable = $('table.admin-user-comments');
        $eventsContainer = $eventsTable.find('tbody');
        $events = $eventsContainer.find('.meta-row');

        // Insert sort options
        const $filterOpts = $(`<div id="user-comments-tabs" class="tabs">
                <a data-filter="all" class="youarehere">Show All</a>
                <a data-filter="rude">Rude or Offensive</a>
                <a data-filter="unwelcoming">Unwelcoming</a>
                <a data-filter="nln">No Longer Needed</a>
                <a data-filter="normal">Unflagged</a>
                <a data-filter="deleted">Deleted</a>
                <a data-filter="notdeleted">Active</a>
            </div>`)
            .insertBefore($eventsTable);

        // Filter options event
        $('#user-comments-tabs').on('click', 'a[data-filter]', function() {
            if($(this).hasClass('youarehere')) return false;

            // Filter posts based on selected filter
            filterPosts(this.dataset.filter);

            // Update active tab highlight class
            $(this).addClass('youarehere').siblings().removeClass('youarehere');

            return false;
        });
    }


    function doPageload() {

        // TODO: For Too Many Rude/Abusive queue, load user's R/A flagged comments
        if(false && location.search.includes('commenttoomanydeletedrudenotconstructiveauto')) {

            // Additional styles for this page
            appendCTMDRNCAstyles();

            $('span.revision-comment a').each(function() {
                const uid = Number(this.href.match(/\d+/)[0]);
                const post = $(this).closest('.js-flagged-post');
                const modMessageContent = $(this).closest('td');
                const cmmtsContainer = $(`<table class="comments"></table>`).appendTo($(this).parents('.js-dashboard-row '));

                // Add links to user and comment history
                modMessageContent
                    .append(`<div class="ra-userlinks">[ ` +
                                `<a href="https://${location.hostname}/users/${uid}" target="_blank">Profile</a> | ` +
                                `<a href="https://${location.hostname}/users/account-info/${uid}" target="_blank">Dashboard</a> | ` +
                                `<a href="https://${location.hostname}/users/history/${uid}?type=User+suspended" target="_blank">Susp. History</a> | ` +
                                `<a href="https://${location.hostname}/users/message/create/${uid}" target="_blank">Message/Suspend</a> | ` +
                                `<a href="http://${location.hostname}/admin/users/${uid}/post-comments?state=flagged" target="_blank">Comments</a>` +
                            ` ]</div>`);

                // Move action button
                modMessageContent
                    .append(post.find('.post-options.keep'));

                // Load latest R/A helpful comments
                $.get(this.href.replace('http:', 'https:'), function(data) {

                    // Filter and Transform
                    $('.deleted-info', data)
                        .filter((i, el) => (el.innerText.indexOf('Rude Or Offensive') >= 0 || el.innerText.indexOf('Unwelcoming') >= 0) && el.innerText.indexOf('Helpful') >= 0)
                        .prev('span')
                        .each(function() {
                            const metaRow = $(this).closest('.text-row').prev('.meta-row');
                            $(this).attr({
                                'data-pid' : metaRow.attr('data-postid'),
                                'data-cid' : metaRow.attr('data-id'),
                                'data-date': metaRow.find('.relativetime').text()
                            });
                        })
                        .appendTo(cmmtsContainer)
                        .each(replaceKeywords)
                        .wrap('<tr class="comment roa-comment"><td>')
                        .each(function() {
                            $(`<a class="relativetime" href="/q/${this.dataset.pid}" target="_blank">${this.dataset.date}</a>`).insertAfter(this);
                        });

                    // Remove old comments
                    $('.comments .relativetime').filter((i, el) => el.innerText.indexOf("'") >= 0).closest('.roa-comment').remove();
                });
            });
        }

        // Insert 'skip' button to temporarily hide current post
        $('.js-flagged-post').append(`<a class="skip-post" title="skip (hide) this post" href="#">skip post</a>`);

        // Highlight chatty/rude keywords in comments
        $('.comment-copy, tr.deleted-row > td > span').each(replaceKeywords);

        // Change "dismiss" link to "decline", insert alternate action
        $('.js-flagged-comment .js-dismiss-flags').text('decline').append(`<span class="cancel-delete-comment-flag" title="dismiss flags AND delete comment">+delete</span>`);

        // If there are lots of comment flags
        if($('.js-flagged-comments').length > 3 || true) {

            const actionBtns = $('<div id="actionBtns"></div>');

            function removePostsWithoutFlags() {
                $('.js-comments-container[data-comment-context="flag"]').filter(function() {
                    return $(this).children('.js-flagged-comment').length === 0;
                }).parents('.js-flagged-post').remove();
            }

            // Hide recent comments button (day)
            $('<button>Ignore 2h</button>')
                .click(function() {
                    $(this).remove();
                    let now = Date.now();
                    // Remove comments < twohours
                    $('.js-comment-link').filter(function() {
                        return now - new Date($(this).children('.relativetime').attr('title')).getTime() <= twohours;
                    }).closest('.js-flagged-comment').addBack().remove();
                    // Remove posts without comment flags
                    removePostsWithoutFlags();
                })
                .appendTo(actionBtns);

            // Hide recent comments button (day)
            $('<button>Ignore 1d</button>')
                .click(function() {
                    $(this).prev().remove();
                    $(this).remove();
                    let now = Date.now();
                    // Remove comments < oneday
                    $('.js-comment-link').filter(function() {
                        return now - new Date($(this).children('.relativetime').attr('title')).getTime() <= oneday;
                    }).closest('.js-flagged-comment').addBack().remove();
                    // Remove posts without comment flags
                    removePostsWithoutFlags();
                })
                .appendTo(actionBtns);

            // Hide recent comments button (week)
            $('<button>Ignore 1w</button>')
                .click(function() {
                    $(this).prev().remove();
                    $(this).prev().remove();
                    $(this).remove();
                    let now = Date.now();
                    // Remove comments < oneweek
                    $('.js-comment-link').filter(function() {
                        return now - new Date($(this).children('.relativetime').attr('title')).getTime() <= oneweek;
                    }).closest('.js-flagged-comment').addBack().remove();
                    // Remove posts without comment flags
                    removePostsWithoutFlags();
                })
                .appendTo(actionBtns);

            // Start from bottom link (only when more than 3 posts present on page)
            $('<button>Review from bottom</button>')
                .click(function() {
                    reviewFromBottom = true;
                    $(this).remove();
                    $('.flagged-posts.moderator').css('margin-top', '600px');
                    window.scrollTo(0,999999);
                })
                .appendTo(actionBtns);

            if(superusers.includes(StackExchange.options.user.userId)) {

                // Delete chatty comments on page
                $('<button class="btn-warning">Delete Chatty</button>')
                    .click(function() {
                        $(this).remove();
                        const chattyComments = $('.cmmt-chatty, .cmmt-rude').filter(':visible').parents('.js-flagged-comment').find('.js-comment-delete');
                        $('body').showAjaxProgress(chattyComments.length, { position: 'fixed' });
                        chattyComments.click();
                    })
                    .appendTo(actionBtns);

                // Delete all comments left on page
                $('<button class="btn-warning">Delete ALL</button>')
                    .click(function() {
                        if(!confirm('Confirm Delete ALL?')) return false;

                        $(this).remove();
                        const visibleComments = $('.js-comment-delete:visible');
                        $('body').showAjaxProgress(visibleComments.length, { position: 'fixed' });
                        visibleComments.click();
                    })
                    .appendTo(actionBtns);
            }

            actionBtns.insertBefore('.js-mod-history-container');
        }

        // Convert urls in comments to clickable links that open in a new window
        $('.comment-summary')
            .html(function(i, v) {
                return v.replace(/(https?:\/\/[^\s\)]+)\b/gi, '<a href="$1" target="_blank" class="comment-link">$1</a>');
            })
            .on('click', 'a.comment-link', function(ev) {
                ev.stopPropagation();
            });

        // Highlight comments from last year or older
        const thisYear = new Date().getFullYear();
        $('.js-comment-link .relativetime').filter((i, el) => Number(el.title.substr(0,4)) < thisYear).addClass('old-comment');

        // On delete/dismiss comment action
        $('.js-comment-delete, .js-dismiss-flags', '.js-flagged-comment').on('click', function() {

            const $post = $(this).parents('.js-flagged-post');

            // Sanity check
            if($post.length !== 1) return;

            // Remove current comment from DOM
            const $comm = $(this).parents('tr.message-divider').next('tr.comment').addBack();
            $comm.addClass('js-comment-deleted');

            // Hide post immediately if no comments remaining
            setTimeout(function($post) {
                let $remainingComms = $post.find('.js-flagged-comments tr.comment').not('.js-comment-deleted');
                if($remainingComms.length === 0) $post.remove();
            }, 50, $post);
        });

        // On dismiss + delete comment action
        $('.cancel-delete-comment-flag', '.js-flagged-comment').on('click', function(evt) {
            evt.stopPropagation(); // we don't want to bubble the event, but trigger it manually

            const $post = $(this).parents('.js-flagged-post');
            const cid = $(this).closest('.js-flagged-comment').attr('data-comment-id');

            // Sanity check
            if($post.length !== 1) return;

            // Dismiss flag by clicking on parent element
            $(this).parent().click();

            // Delete comment after a short delay
            setTimeout(function() {
                $.post(`https://${location.hostname}/posts/comments/${cid}/vote/10`, {
                    fkey: fkey
                });
            }, 500);

            return false;
        });

        // On purge all comments link click
        $('.js-flagged-post').on('click', '.purge-comments-link', function() {

            const pid = this.dataset.postId;
            const $post = $(`#flagged-${pid}`);

            if(confirm('Delete ALL comments? (mark as helpful)')) {

                // Delete comments
                $.post({
                    url: `https://${location.hostname}/admin/posts/${pid}/delete-comments`,
                    data: {
                        'fkey': fkey,
                        'mod-actions': 'delete-comments'
                    },
                    success: function() {
                        $post.remove();
                    }
                });

                // Hide post immediately so we can move on
                $post.hide();
            }
        });

        // On skip post link click
        $('.js-flagged-post').on('click', '.skip-post', function() {

            // Hide post immediately so we can move on
            $(this).parents('.js-flagged-post').remove();

            return false;
        });

        // On user comments history page
        if(location.pathname.includes('/admin/users/') && location.pathname.includes('/post-comments')) {

            initCommentFilters();
        }
    }


    function listenToPageUpdates() {

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {

            // Highlight flagged comments in expanded posts
            const $flaggedComms = $('.js-flagged-comment .js-comment').not('.roa-comment');
            $flaggedComms.each(function() {
                let cid = this.dataset.commentId;
                $('#comment-'+cid).children().css('background', '#ffc');
            });

            // Always expand comments if post is expanded, if comments have not been expanded yet
            $('.question, .answer').find('.js-comments-container').not('.js-del-loaded').each(function() {

                const postId = this.dataset.postId;

                // So we only load deleted comments once
                $(this).addClass('js-del-loaded').removeClass('dno');

                // Remove default comment expander
                const elems = $(this).next().find('.js-show-link.comments-link').prev().addBack();

                // Get all including deleted comments
                const commentsUrl = `/posts/${postId}/comments?includeDeleted=true&_=${Date.now()}`;
                $('#comments-'+postId).children('ul.comments-list').load(commentsUrl, function() {
                    elems.remove();
                });
            });

            // Continue reviewing from bottom of page if previously selected
            if(reviewFromBottom) {
                const scrLeft = document.documentElement.scrollLeft || document.body.scrollLeft || window.pageXOffset;
                window.scrollTo(scrLeft, 999999);
            }

            // Simple throttle
            if(typeof ajaxTimeout !== undefined) clearTimeout(ajaxTimeout);
            ajaxTimeout = setTimeout(insertCommentLinks, 500);
        });
    }


    function insertCommentLinks() {

        $('.question, .answer').find('.js-comments-container').not('.js-comment-links').addClass('js-comment-links').each(function() {

            const pid = this.dataset.postId;

            // Insert additional comment actions
            const commentActionLinks = `<div class="mod-action-links" style="float:right; padding-right:10px">` +
                  `<a data-post-id="${pid}" class="purge-comments-link comments-link red-mod-link" title="delete all comments">purge all</a></div>`;
            $('#comments-link-'+pid).append(commentActionLinks);
        });
    }


    function appendUserCommentsFilterstyles() {

        const styles = `
<style>
table.admin-user-comments {
    width: 100%;
}
#user-comments-tabs {
    width: 100%;
}
table.sorter > tbody > tr.odd > td {
    background-color: #f9f9f9;
}
.admin-user-comments .meta-row {
    border-top: 1px dashed rgba(0,0,0,0.1);
}
.admin-user-comments .meta-row.dno + .text-row {
    display: none;
}
</style>
`;
        $('body').append(styles);
    }


    function appendCTMDRNCAstyles() {

        const styles = `
<style>
#mod-history {
    position: relative;
    top: 0;
}
.flagged-posts.moderator {
    margin-top: 0;
}
.js-flagged-post > td {
    padding-bottom: 50px !important;
}
.js-flagged-post > td > table:first-child {
    display: none;
}
table.mod-message {
    font-size: 1.1em;
}
table.mod-message .flagcell {
    display: none;
}
table.comments {
    width: 100%;
}
table.comments {
    border: 1px solid #ddd;
}
table.comments > tr:last-child > td {
    border-bottom: 1px solid #ddd;
}
table.comments > tr:nth-child(even) {
    background: #f8f8f8;
}
table.comments tr.roa-comment > td {
    height: auto;
    padding: 4px 10px;
    line-height: 1.4;
}
.roa-comment .relativetime {
    float: right;
}
.ra-userlinks {
    margin: 18px 0 0;
}
.tagged-ignored {
    opacity: 1 !important;
}
</style>
`;
        $('body').append(styles);
    }


    function appendStyles() {

        const styles = `
<style>
#footer,
.s-sidebarwidget.module,
.s-sidebarwidget.module ~ .module {
    display: none !important;
}
.js-admin-dashboard {
    position: relative;
}
.js-mod-history-container {
    display: block !important;
    height: 150px;
    overflow-y: auto;
    background: white;
    z-index: 1;
}
.js-flagged-comment > .js-comment > .comment-form > .js-comment-edit-hide {
    display: block;
    min-height: 6em;
    word-break: break-word;
}
.js-flagged-comment .relativetime.old-comment {
    color: coral;
}
.js-flagged-comment .js-comment-edit {
    display: none;
}
.js-flagged-post { /* for skip-post button */
    position: relative;
    padding-bottom: 25px;
}
.js-flagged-comment .js-comment-delete,
.js-flagged-comment .js-dismiss-flags,
.skip-post {
    margin-left: 20px;
    padding: 5px 8px;
    font-size: 1rem;
    background: #eee;
}
.skip-post {
    position: absolute !important;
    bottom: 0;
    right: 0;
    white-space: nowrap;
    opacity: 0.3;
}
.skip-post:hover {
    background: #07C;
    color: white;
    opacity: 1;
}
.cancel-comment-flag:hover {
    color: white;
    background: red;
    z-index: 1;
}
.js-del-all-comments {
    color: red !important;
    font-weight: bold;
}
.js-comment-deleted {
    display: none !important;
}
table.flagged-posts tr.js-flagged-post:first-child > td {
    border-top: 1px solid transparent;
}
.js-dismiss-flags {
    position: relative;
}
.js-dismiss-flags .cancel-delete-comment-flag {
    position: absolute;
    top: 0;
    left: 100%;
    display: none;
    width: auto;
    height: 100%;
    padding: 5px 8px;
    color: white;
    background: red;
    border-left: 1px solid #eee;
}
.js-dismiss-flags:hover .cancel-delete-comment-flag {
    display: block;
}
.cmmt-rude {
    font-weight: bold;
    color: red;
}
.cmmt-chatty {
    font-weight: bold;
    color: coral;
}

#actionBtns button {
    margin-top: 10px;
    margin-bottom: 10px;
    margin-right: 10px;
}

/* General new mod interface stuff */
.js-admin-dashboard > div.grid--cell {
    /* so the decline + delete option goes over the sidebar */
    position: relative;
    z-index: 1;
}
.js-mod-history-container {
    margin: 0 !important;
    background: #f6f6f6;
}
.visited-post {
    opacity: 0.7;
}
.js-flagged-post .bc-black-3 {
    border-color: #eee !important;
}
.js-post-flag-group > .grid--cell {
    padding: 8px 12px;
}
.js-post-flag-group > .grid--cell.ta-right {
    padding: 18px 8px !important;
}
.js-post-flag-group > .grid--cell > div {
    padding: 2px 0;
}

/* Other new mod interface stuff */
.comment-form .grid--cell.ta-right.py8.fl-shrink0 {
    width: auto !important;
}
.js-comment-flag-options {
    min-width: 142px;
    padding-bottom: 0 !important;
}
.js-comment-flag-options button,
.js-dismiss-flags {
    text-transform: lowercase;
}
.js-comment-flag-options button:hover {
    background: #ccc;
}
.js-comment-flag-options .js-dismiss-flags:hover {
    background: red;
    color: white;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();
    listenToPageUpdates();

})();
