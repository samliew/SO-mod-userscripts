// ==UserScript==
// @name         Comment Flags Helper
// @description  Always expand comments (with deleted) and highlight expanded flagged comments, Highlight common chatty and rude keywords
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      5.0
// 
// @updateURL    https://github.com/samliew/SO-mod-userscripts/raw/master/CommentFlagsHelper.user.js
// @downloadURL  https://github.com/samliew/SO-mod-userscripts/raw/master/CommentFlagsHelper.user.js
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
        'grow up', 'shame', 'wtf', 'garbage', 'trash', 'spam', 'damn', 'horrible', '(in)?ability',
        'nonsense', 'never work', 'illogical', 'fraud', 'crap', '(bull|cow|horse)?\\s?shit', 'screw',
        'reported', 'get lost', 'useless', 'deleted?', 'delete[\\w\\s]+(answer|question|comment)',
        'gay', 'lesbian', 'sissy', 'brain', 'rtfm', 'blind', 'retard(ed)?', 'jerks?', 'bitch\\w*', 'silly',
        'read[\\w\\s]+(tutorial|docs|manual)', 'lack[\\w\\s]+research', 'https?:\\/\\/idownvotedbecau.se/\\w+/?',
    ];
    const rudeRegex = new RegExp('\\s(' + rudeKeywords.join('|') + ')(?![/-])', 'gi');

    // Special characters must be escaped with \\
    const chattyKeywords = [
        'thanks?', 'thx', 'welcome', 'updated', 'edited', 'added', '(in)?correct(ed)?', 'done', 'worked', 'works', 'glad',
        'appreciated?', 'my email', 'email me', 'contact', 'good', 'great', 'sorry', '\\+1', 'love', 'wow', 'pointless', 'no\\s?(body|one)',
        'homework', 'no idea', 'your mind', 'try it', 'typo', 'wrong', 'unclear', 'regret', 'every\\s?(body|one)',
        'exactly', 'check', 'lol', 'ha(ha)+', 'women', 'girl', 'dude', 'effort', 'understand', 'want', 'need', 'little',
        'give up', 'documentation', 'what[\\w\\s]+(try|tried)[\\w\\s]*\\?*', 'free', 'obvious', 'tried',
        'move on', 'go away', 'stop', 'bad', 'bother', 'no sense', 'sense', 'learn', 'ugly', 'read', 'pay(ing)?',
        '(down|up)[-\\s]?vot(er|ed|e|ing)', '\\w+ off', 'jesus', 'allah', 'unnecessary', 'code(-\s)writing',
        'googl(ed?|ing)\\s?', 'https:\\/\\/www.google[^\\s]+',
    ];
    const chattyRegex = new RegExp('\\s(' + chattyKeywords.join('|') + ')(?![/-])', 'gi');


    function replaceKeywords(jqElem) {
        let text = ' ' + this.innerHTML;
        text = text.replace(/[*]+/g, ' * ').replace(rudeRegex, ' <span class="cmmt-rude">$1</span>');
        text = text.replace(/[*]+/g, ' * ').replace(chattyRegex, ' <span class="cmmt-chatty">$1</span>');
        this.innerHTML = text;
    }


    // Dismiss all flags on comment
    function dismissCommentFlags(cid) {
        return new Promise(function(resolve, reject) {
            if(typeof cid === 'undefined' || cid == null) { reject(); return; }

            $.post({
                url: `https://${location.hostname}/admin/comment/${cid}/clear-flags`,
                data: {
                    fkey: fkey
                }
            })
            .done(resolve)
            .fail(reject);
        });
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

        // For Too Many Rude/Abusive queue, load user's R/A flagged comments
        if(location.search.includes('commenttoomanydeletedrudenotconstructiveauto')) {

            // Additional styles for this page
            appendCTMDRNCAstyles();

            $('.js-flag-text a[href*="/post-comments"]').attr('target', '_blank').each(function() {
                const uid = Number(this.href.match(/\/(\d+)\//)[1]);
                const post = $(this).closest('.js-flagged-post');
                const postheader = post.find('.js-post-header').hide();
                const flagText = $(this).parents('.js-flag-text');

                // Add links to user and comment history
                const userinfo = $(`<div class="ra-userlinks">[ ` +
                                `<a href="https://${location.hostname}/users/${uid}" target="_blank">Profile</a> | ` +
                                `<a href="https://${location.hostname}/users/account-info/${uid}" target="_blank">Dashboard</a> | ` +
                                `<a href="https://${location.hostname}/users/history/${uid}?type=User+suspended" target="_blank">Susp. History</a> | ` +
                                `<a href="https://${location.hostname}/users/message/create/${uid}" target="_blank">Message/Suspend</a> | ` +
                                `<a href="http://${location.hostname}/admin/users/${uid}/post-comments?state=flagged" target="_blank">Comments</a>` +
                            ` ]</div>`).appendTo(flagText);

                const flaggroup = post.find('.js-post-flag-group');
                const cmmtsContainer = $(`<table class="comments"></table>`).insertAfter(flaggroup);

                const flagpage = this.href.replace('http:', 'https:').replace('?state=flagged', '?state=All&flagState=all');

                // Load latest R/A helpful comments
                $.get(flagpage, function(data) {

                    // Filter and Transform
                    const result = $('tbody tr', data)
                        .filter((i, el) => el.innerText.indexOf('Rude/Abusive') >= 0 || el.innerText.indexOf('Unfriendly') >= 0)
                        .each(function() {
                            const commentCell = $(this).children().eq(1).children(0).html();

                            // Create new element and add data as attributes
                            $('<tr class="comment roa-comment"></tr>')
                                .html('<td>'+commentCell+'</td>')
                                .toggleClass('deleted-comment', $(this).hasClass('bg-red-050'))
                                .attr({
                                    'data-postid': this.dataset.postid,
                                    'data-id': this.dataset.id,
                                    'data-date': $(this).find('.relativetime').text(),
                                })
                                .appendTo(cmmtsContainer)
                                .each(replaceKeywords)
                                .each(function() {
                                    $(`<a class="relativetime" href="/q/${this.dataset.postid}" target="_blank">${this.dataset.date}</a>`).appendTo(this.children[0]);
                                });
                        })

                    // Remove old comments
                    $('.comments .relativetime').filter((i, el) => el.innerText.indexOf("'") >= 0).closest('.roa-comment').remove();
                });
            });
        }

        // Insert 'skip' button to temporarily hide current post
        $('.js-flagged-post').append(`<a class="skip-post" title="skip (hide) this post" href="#">skip post</a>`);

        // Highlight chatty/rude keywords in comments
        $('.comment-copy, tr.text-row > td > span').each(replaceKeywords);

        // Change "dismiss" link to "decline", insert alternate action
        $('.js-flagged-comment .js-dismiss-flags').text('decline').append(`<span class="js-cancel-delete-comment-flag" title="dismiss flags AND delete comment">+delete</span>`);

        // If there are comment flags
        if($('.js-comments-container').length > 0) {

            const actionBtns = $('<div id="actionBtns"></div>');
            $('.js-flagged-post').first().parent().prepend(actionBtns);

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
            $('<button>Ignore 12h</button>')
                .click(function() {
                    $(this).prev().remove();
                    $(this).remove();
                    let now = Date.now();
                    // Remove comments < oneday
                    $('.js-comment-link').filter(function() {
                        return now - new Date($(this).children('.relativetime').attr('title')).getTime() <= (oneday / 2);
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

            if(superusers.includes(StackExchange.options.user.userId)) {

                // Delete chatty comments on page
                $('<button class="btn-warning" title="Delete comments with chatty keywords">Chatty Only</button>')
                    .click(function() {
                        $(this).remove();
                        const chattyComments = $('.cmmt-chatty, .cmmt-rude').filter(':visible').parents('.js-flagged-comment').find('.js-comment-delete');
                        $('body').showAjaxProgress(chattyComments.length, { position: 'fixed' });
                        chattyComments.click();
                    })
                    .appendTo(actionBtns);

                // Delete all comments left on page
                $('<button class="btn-warning" title="Delete all comments left on page">Delete</button>')
                    .click(function() {
                        if(!confirm('Confirm Delete ALL?')) return false;

                        $(this).remove();
                        const visibleComments = $('.js-comment-delete:visible');
                        $('body').showAjaxProgress(visibleComments.length, { position: 'fixed' });
                        visibleComments.click();
                    })
                    .appendTo(actionBtns);

                // Decline all comments left on page
                $('<button class="btn-warning" title="Decline all comments left on page">Decline</button>')
                    .click(function() {
                        if(!confirm('Confirm Decline ALL?')) return false;

                        $(this).remove();
                        const visibleComments = $('.js-dismiss-flags:visible');
                        $('body').showAjaxProgress(visibleComments.length, { position: 'fixed' });
                        visibleComments.click();
                    })
                    .appendTo(actionBtns);

                // Decline + Delete all comments left on page
                $('<button class="btn-warning" title="Decline + Delete all comments left on page">DD ALL</button>')
                    .click(function() {
                        if(!confirm('Confirm Decline + Delete ALL?')) return false;

                        $(this).remove();
                        const visibleComments = $('.js-dismiss-flags:visible .js-cancel-delete-comment-flag');
                        $('body').showAjaxProgress(visibleComments.length * 2, { position: 'fixed' });
                        visibleComments.click();
                    })
                    .appendTo(actionBtns);
            }
            else {

                // Start from bottom link (only when more than 3 posts present on page)
                $('<button>Review from bottom</button>')
                    .click(function() {
                        reviewFromBottom = true;
                        $(this).remove();
                        $('.flagged-posts.moderator').css('margin-top', '600px');
                        window.scrollTo(0,999999);
                    })
                    .appendTo(actionBtns);
            }
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

        // Shorten additional actions descriptions after flag
        $('.js-flag-text > span:last-child').not('[title]').not('.js-abbrev').addClass('js-abbrev').html(function(i, v) {
            return v.replace(/(added (\d+) comments?)/, '<span title="$1">$2C</span>')
                .replace(/(Vote Up)/gi, '<span title="$1">VU</span>')
                .replace(/(Vote Down)/gi, '<span title="$1">VD</span>')
                .replace(/(Deletion)/gi, '<span title="voted to delete">Deletion</span>')
                .replace(/(Moderator Review)/gi, '<span title="a moderator took previous action in the mod queue">Mod</span>');
        });

        // On delete/dismiss comment action
        $('.js-comment-delete, .js-dismiss-flags', '.js-flagged-comment').on('click', function() {

            const $post = $(this).parents('.js-flagged-post');

            // Sanity check
            if($post.length !== 1) return;

            // Remove current comment from DOM
            const $comm = $(this).closest('.js-flagged-comment').addClass('js-comment-deleted').hide();

            // Hide post immediately if no comments remaining
            setTimeout(function($post) {
                let $remainingComms = $post.find('.js-flagged-comment').not('.js-comment-deleted');
                if($remainingComms.length === 0) $post.remove();
            }, 50, $post);
        });

        // On dismiss + delete comment action
        $('.js-cancel-delete-comment-flag', '.js-flagged-comment').on('click', function(evt) {
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
            const $post = $(this).parents('.js-flagged-post');

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

            // Init decline buttons (clear-flags) on user comments page for active flags
            $('.comment-flag-on').append(`<a class="dismiss-comment" href="#" title="decline flags on comment">decline</a>`);
            $('.admin-user-comments').on('click', '.dismiss-comment', function() {
                const cid = Number($(this).closest('tr.text-row').attr('data-id'));
                if(isNaN(cid)) return;
                $(this).remove();
                dismissCommentFlags(cid);
                return false;
            });
        }
    }


    function listenToPageUpdates() {

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {

            // Highlight flagged comments in expanded posts
            const $flaggedComms = $('.js-flagged-comment .js-comment').not('.roa-comment');
            $flaggedComms.each(function() {
                let cid = this.dataset.commentId;
                $('#comment-'+cid).addClass('js-active-flag');
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
.js-loaded-body,
.js-body-summary,
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
    word-break: break-word;
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
.visited-post,
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
    position: relative;
    display: block !important;
    max-height: 150px;
    margin: 10px 8px 15px !important;
    overflow-y: auto;
    background: #fafafa;
    z-index: 1;
}
.js-mod-history-container:after {
    content: 'flag action history';
    font-size: 10px;
    position: absolute;
    bottom: 2px;
    right: 3px;
    font-style: italic;
    color: #888;
    opacity: 0.5;
}
.js-flagged-comment > .js-comment > .comment-form > .js-comment-edit-hide {
    min-height: 6em;
}
.js-flagged-comment > .js-comment .comment-copy {
    word-break: break-word;
}
.js-flagged-comment .relativetime.old-comment {
    color: coral;
}
.js-comment-flag-options > div,
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
.meta-row .delete-comment,
.meta-row .edit-comment,
.text-row .comment-flag-on .dismiss-comment {
    float: right;
    margin-top: -5px;
    margin-left: 10px;
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
.text-row .comment-flag-on .dismiss-comment:hover,
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
.js-dismiss-flags .js-cancel-delete-comment-flag {
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
.js-dismiss-flags:hover .js-cancel-delete-comment-flag {
    display: block;
}
.comment.js-active-flag .js-comment-actions {
    position: relative;
}
.comment.js-active-flag .js-comment-actions:before {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    left: -3px;
    bottom: 0;
    width: 3px;
    background: #F48024 !important;
}
.cmmt-rude {
    font-weight: bold;
    color: red;
}
.cmmt-chatty {
    font-weight: bold;
    color: coral;
}

#actionBtns {
    margin: 40px 24px 0px;
}
#actionBtns button {
    margin-right: 10px;
}

/* General new mod interface stuff */
.js-admin-dashboard > div.grid--cell {
    /* so the decline + delete option goes over the sidebar */
    position: relative;
    z-index: 1;
}
.visited-post {
    opacity: 0.7;
}
.js-flagged-post .bc-black-3 {
    border-color: #e3e3e3 !important;
}
.js-admin-dashboard span[title]:hover {
    cursor: help !important;
}

/* Other new mod interface stuff */
.js-comment-flag-options {
    margin-left: 0 !important;
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
