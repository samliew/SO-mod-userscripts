// ==UserScript==
// @name         Comment Flags Helper
// @description  Always expand comments (with deleted) and highlight expanded flagged comments, Highlight common chatty and rude keywords
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.7
//
// @include      https://*stackoverflow.com/admin/dashboard?flag*=comment*
// @include      https://*serverfault.com/admin/dashboard?flag*=comment*
// @include      https://*superuser.com/admin/dashboard?flag*=comment*
// @include      https://*askubuntu.com/admin/dashboard?flag*=comment*
// @include      https://*mathoverflow.net/admin/dashboard?flag*=comment*
// @include      https://*.stackexchange.com/admin/dashboard?flag*=comment*
//
// @include      https://*stackoverflow.com/admin/users/*/post-comments*
// @include      https://*serverfault.com/admin/users/*/post-comments*
// @include      https://*superuser.com/admin/users/*/post-comments*
// @include      https://*askubuntu.com/admin/users/*/post-comments*
// @include      https://*mathoverflow.net/admin/users/*/post-comments*
// @include      https://*.stackexchange.com/admin/users/*/post-comments*
// ==/UserScript==

(function() {
    'use strict';

    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;


    let ajaxTimeout;
    let reviewFromBottom = false;
    const fkey = StackExchange.options.user.fkey;
    const newMins = 7 * 24 * 60 * 60000;

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
        'thanks?', 'welcome', 'up-?voted?', 'updated', 'edited', 'added', '(in)?correct(ed)?', 'done', 'worked', 'works', 'glad',
        'appreciated?', 'my email', 'email me', 'contact', 'good', 'great', 'sorry', '\\+1', 'love', 'wow', 'pointless', 'no\\s?(body|one)',
        'homework', 'no idea', 'your mind', 'try it', 'typo', 'wrong', 'unclear', 'regret', 'every\\s?(body|one)',
        'exactly', 'check', 'lol', 'ha(ha)+', 'women', 'girl', 'effort', 'understand', 'want', 'need', 'little',
        'give up', 'documentation', 'google\\s', 'what[\\w\\s]+(try|tried)[\\w\\s]*\\?*', 'free', 'obvious',
    ];
    const chattyRegex = new RegExp('\\s(' + rudeKeywords.join('|') + ')(?![/-])', 'gi');


    function replaceKeywords(jqElem) {
        this.innerHTML = this.innerHTML.replace(rudeRegex, ' <b style="color:red">$1</b>');
        this.innerHTML = this.innerHTML.replace(chattyRegex, ' <b style="color:coral">$1</b>');
    }


    function doPageload() {

        // For Too Many Rude/Abusive queue, load user's R/A flagged comments
        if(location.href.indexOf('commenttoomanydeletedrudenotconstructiveauto') >= 0) {

            // Additional styles for this page
            appendCTMDRNCAstyles();

            $('span.revision-comment a').each(function() {
                const uid = Number(this.href.match(/\d+/)[0]);
                const post = $(this).closest('.flagged-post-row');
                const modMessageContent = $(this).closest('td');
                const cmmtsContainer = $(`<table class="comments"></table>`).appendTo($(this).parents('.js-dashboard-row '));

                // Add links to user and comment history
                modMessageContent
                    .append(`<div class="ra-userlinks">[ ` +
                                `<a href="https://stackoverflow.com/users/${uid}" target="_blank">Profile</a> | ` +
                                `<a href="https://stackoverflow.com/users/account-info/${uid}" target="_blank">Dashboard</a> | ` +
                                `<a href="https://stackoverflow.com/users/history/${uid}?type=User+suspended" target="_blank">Susp. History</a> | ` +
                                `<a href="https://stackoverflow.com/users/message/create/${uid}" target="_blank">Message/Suspend</a> | ` +
                                `<a href="http://stackoverflow.com/admin/users/${uid}/post-comments?state=flagged" target="_blank">Comments</a>` +
                            ` ]</div>`);

                // Move action button
                modMessageContent
                    .append(post.find('.post-options.keep'));

                // Load latest R/A helpful comments
                $.get(this.href.replace('http:', 'https:'), function(data) {

                    // Filter and Transform
                    $('.deleted-info', data)
                        .filter((i, el) => el.innerText.indexOf('Rude Or Offensive') >= 0 && el.innerText.indexOf('Helpful') >= 0)
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
        $('.flagged-post-row').append(`<a class="skip-post" title="skip (hide) this post" href="#">skip post</a>`);

        // Highlight chatty/rude keywords in comments
        $('.comment-summary, tr.deleted-row > td > span').each(replaceKeywords);

        // Change "dismiss" link to "decline", insert alternate action
        $('.cancel-comment-flag').text('decline').append(`<span class="cancel-delete-comment-flag" title="dismiss flags AND delete comment">+delete</span>`);

        // If there are lots of comment flags
        if($('.flagged-post-row').length > 3) {

            // Start from bottom link (only when more than 3 posts present on page)
            $('<button>Review from bottom</button>')
                .click(function() {
                    reviewFromBottom = true;
                    $(this).remove();
                    $('.flagged-posts.moderator').css('margin-top', '600px');
                    window.scrollTo(0,999999);
                })
                .prependTo('.flag-container');

            // Hide recent comments button
            $('<button style="margin-right:10px;">Ignore new comments</button>')
                .click(function() {
                    $(this).remove();
                    let now = Date.now();
                    // Remove comments < newMins
                    $('.comment-link').filter(function() {
                        return now - new Date($(this).children('.relativetime').attr('title')).getTime() <= newMins;
                    }).parent().parent().next().addBack().remove();
                    // Remove posts without comment flags
                    $('.comments').filter(function() {
                        return $(this).children().children().length === 0;
                    }).parents('.flagged-post-row').remove();
                })
                .prependTo('.flag-container');
        }

        // Convert urls in comments to clickable links that open in a new window
        $('.comment-summary')
            .html(function(i, v) {
                return v.replace(/(https?:\/\/[^\s\)]+)\b/gi, '<a href="$1" target="_blank" class="comment-link">$1</a>');
            })
            .on('click', 'a.comment-link', function(ev) {
                ev.stopPropagation();
            });

        // Highlight rude or abusive flag comments
        $('.revision-comment').filter((i, el) => el.innerText.indexOf('rude or abusive') >= 0).addClass('roa-flag');

        // Highlight comments from last year or older
        const thisYear = new Date().getFullYear();
        $('.comment-link .relativetime').filter((i, el) => Number(el.title.substr(0,4)) < thisYear).addClass('old-comment');

        // Highlight OP comments (owner blue background)
        $('.user-action-time').filter((i, el) => el.innerText.indexOf('asked') >= 0).each(function() {
            const op = $(this).siblings('.user-details').children('a').first().text();
            $(this).parents('.flagged-post-row').find('.comment-link').next('a').each(function() {
                if(this.innerText === op) {
                    $(this).addClass('comment-user owner');
                }
            });
        });

        // On delete/dismiss comment action
        $('.delete-comment, .cancel-comment-flag').on('click', function() {

            const $post = $(this).parents('.flagged-post-row');

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
        $('.cancel-delete-comment-flag').on('click', function(evt) {
            evt.stopPropagation(); // we don't want to bubble the event, but trigger it manually

            const $post = $(this).parents('.flagged-post-row');
            const cid = $(this).closest('.flag-issue').attr('id').match(/\d+$/)[0];

            // Sanity check
            if($post.length !== 1) return;

            // Dismiss flag
            $(this).parent('.cancel-comment-flag').click();

            // Delete comment after a short delay
            setTimeout(function() {
                $.post(`https://stackoverflow.com/posts/comments/${cid}/vote/10`, {
                    fkey: fkey
                });
            }, 1000);

            return false;
        });

        // On purge all comments link click
        $('.flagged-post-row').on('click', '.purge-comments-link', function() {

            const pid = this.dataset.postId;
            const $post = $(`#flagged-${pid}`);

            if(confirm('Delete ALL comments? (mark as helpful)')) {

                // Delete comments
                $.post({
                    url: `https://stackoverflow.com/admin/posts/${pid}/delete-comments`,
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
        $('.flagged-post-row').on('click', '.skip-post', function() {

            // Hide post immediately so we can move on
            $(this).parent().hide();

            return false;
        });
    }


    function listenToPageUpdates() {

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {

            // Highlight flagged comments in expanded posts
            const $flaggedComms = $('.js-flagged-comments .comment').not('.roa-comment');
            $flaggedComms.each(function() {
                let cid = this.id.match(/\d+$/)[0];
                $('#comment-'+cid).children().css('background', '#ffc');
            });

            // Highlight OP comments (owner blue background)
            $('.js-comments-container.js-del-loaded').each(function() {
                const op = $(this).find('.owner').first().text();
                $(this).parents('.flagged-post-row').find('.comment-link').next('a').each(function() {
                    if(this.innerText === op) {
                        $(this).addClass('comment-user owner');
                    }
                });
            });

            // Always expand comments if post is expanded, if comments have not been expanded yet
            $('.js-comments-container').not('.js-del-loaded').each(function() {

                const postId = this.id.match(/\d+/)[0];

                // So we only load deleted comments once
                $(this).addClass('js-del-loaded').removeClass('dno');

                // Remove default comment expander
                $(this).next().find('.js-show-link.comments-link').prev().addBack().remove();

                // Get all including deleted comments
                const commentsUrl = `/posts/${postId}/comments?includeDeleted=true&_=${Date.now()}`;
                $('#comments-'+postId).children('ul.comments-list').load(commentsUrl);
                //console.log("Loading comments for " + postId);
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

        $('.js-comments-container').not('.js-comment-links').addClass('js-comment-links').each(function() {

            const pid = this.id.match(/\d+$/)[0];

            // Insert additional comment actions
            const commentActionLinks = `<div class="mod-action-links" style="float:right; padding-right:10px">` +
                  `<a data-post-id="${pid}" class="purge-comments-link comments-link red-mod-link" title="delete all comments">purge all</a></div>`;
            $('#comments-link-'+pid).append(commentActionLinks);
        });
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
.flagged-post-row > td {
    padding-bottom: 50px !important;
}
.flagged-post-row > td > table:first-child {
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
.revision-comment {
    font-style: normal;
}
</style>
`;
        $('body').append(styles);
    }


    function appendStyles() {

        const styles = `
<style>
#footer,
.t-flag,
.t-flag ~ .module,
.module p.more-info,
#mod-history + div:not([class]),
.undelete-comment {
    display: none !important;
}
.flag-container {
    position: relative;
}
#mod-history {
    position: absolute;
    top: 40px;
    max-height: 150px;
    overflow-y: auto;
    background: white;
    z-index: 1;
}
.flagged-posts.moderator {
    margin-top: 150px;
}
.expander-arrow-small-hide {
    transform: scale3d(2,2,1);
    margin-right: 10px;
}
tr.message-divider>td:last-child {
    position: relative;
    padding-right: 140px;
}
tr.comment > td {
    height: 6em;
    word-break: break-word;
}
.revision-comment {
    color: #663;
    font-style: italic;
}
.revision-comment.roa-flag {
    color: red;
}
table.flagged-posts .relativetime.old-comment {
    color: coral;
}
.flag-issue.comment {
    float: none !important;
    position: absolute;
    display: inline-block;
    top: 0;
    right: 0;
    width: 149px;
    padding: 5px 0 15px;
    font-size: 0;
    white-space: nowrap;
}
.edit-comment {
    display: none;
}
.delete-comment,
.cancel-comment-flag,
.skip-post {
    margin-left: 20px;
    padding: 5px 8px;
    font-size: 1rem;
    background: #eee;
}
.skip-post {
    position: absolute !important;
    left: 100%;
    white-space: nowrap;
}
.cancel-comment-flag:hover {
    color: white;
    background: red;
}
.comment-edit-hide,
.comment-delete {
    visibility: visible;
}
.js-del-all-comments {
    color: red !important;
    font-weight: bold;
}
.js-comment-deleted {
    display: none !important;
}
table.flagged-posts tr.flagged-post-row:first-child > td {
    border-top: 1px solid transparent;
}
.cancel-comment-flag {
    position: relative;
}
.cancel-comment-flag .cancel-delete-comment-flag {
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
.cancel-comment-flag:hover .cancel-delete-comment-flag {
    display: block;
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
