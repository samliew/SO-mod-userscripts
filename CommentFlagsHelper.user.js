// ==UserScript==
// @name         Comment Flags Helper
// @description  Always expand comments (with deleted) and highlight expanded flagged comments, Highlight common chatty and rude keywords
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.4
//
// @include      https://stackoverflow.com/admin/dashboard?flag*=comment*
// @include      https://serverfault.com/admin/dashboard?flag*=comment*
// @include      https://superuser.com/admin/dashboard?flag*=comment*
// @include      https://askubuntu.com/admin/dashboard?flag*=comment*
// @include      https://mathoverflow.net/admin/dashboard?flag*=comment*
// @include      https://stackexchange.com/admin/dashboard?flag*=comment*
//
// @include      https://meta.stackoverflow.com/admin/dashboard?flag*=comment*
// @include      https://meta.serverfault.com/admin/dashboard?flag*=comment*
// @include      https://meta.superuser.com/admin/dashboard?flag*=comment*
// @include      https://meta.askubuntu.com/admin/dashboard?flag*=comment*
// @include      https://meta.mathoverflow.net/admin/dashboard?flag*=comment*
// @include      https://meta.stackexchange.com/admin/dashboard?flag*=comment*
//
// @include      https://stackoverflow.com/admin/users/*/post-comments*
// @include      https://serverfault.com/admin/users/*/post-comments*
// @include      https://superuser.com/admin/users/*/post-comments*
// @include      https://askubuntu.com/admin/users/*/post-comments*
// @include      https://mathoverflow.net/admin/users/*/post-comments*
// @include      https://stackexchange.com/admin/users/*/post-comments*
//
// @include      https://meta.stackoverflow.com/admin/users/*/post-comments*
// @include      https://meta.serverfault.com/admin/users/*/post-comments*
// @include      https://meta.superuser.com/admin/users/*/post-comments*
// @include      https://meta.askubuntu.com/admin/users/*/post-comments*
// @include      https://meta.mathoverflow.net/admin/users/*/post-comments*
// @include      https://meta.stackexchange.com/admin/users/*/post-comments*
// ==/UserScript==

(function() {
    'use strict';

    var reviewFromBottom = false;
    var fkey = window.localStorage.getItem('se:fkey').split(',')[0];

    // Special characters must be escaped with \\
    const rudeKeywords = [
        'fuck', '\\barse', 'cunt', 'dick', '\\bcock', 'pussy', '\\bhell', 'stupid', 'idiot', '!!+', '\\?\\?+',
        'grow\\s?up', 'shame', 'wtf', 'garbage', 'trash', 'spam', 'damn', 'stop', 'horrible', 'inability', 'bother',
        'nonsense', 'never\\s?work', 'illogical', 'fraud', 'crap', 'reported', 'get\\s?lost', 'go\\s?away',
        'useless', 'delete[\\w\\s]+(answer|question|comment)', 'move on', 'learn', 'gay', 'lesbian', 'sissy',
    ];

    // Special characters must be escaped with \\
    const chattyKeywords = [
        'thanks?', 'welcome', 'up-?voted?', 'updated', 'edited', 'added', '(in)?correct(ed)?', 'done', 'worked', 'works', 'glad',
        'appreciated?', 'my email', 'email me', 'contact', 'good', 'great', 'sorry', '\\+1', 'love', 'wow', 'pointless', 'no\\s?(body|one)',
        'homework', 'no\\s?idea', 'your\\s?mind', 'try\\s?it', 'typo', 'wrong', 'unclear', 'regret', 'we\\b', 'every\\s?(body|one)',
        'exactly', 'check', 'lol', '\\bha(ha)+', 'women', 'girl',
    ];


    function doPageload() {

        $('.comment-summary, tr.deleted-row > td > span').each(function() {

            // Highlight common chatty keywords
            this.innerHTML = this.innerHTML.replace(new RegExp('(' + chattyKeywords.join('|') + ')', 'gi'), '<b style="color:coral">$1</b>');

            // Highlight common rude keywords
            this.innerHTML = this.innerHTML.replace(new RegExp('(' + rudeKeywords.join('|') + ')', 'gi'), '<b style="color:red">$1</b>');
        });

        // Change "dismiss" link to "decline"
        $('.cancel-comment-flag').text('decline');

        // Start from bottom link (only when more than 3 posts present on page
        if($('.flagged-post-row').length > 3) {
            $('<button>Review from bottom</button>')
                .click(function() {
                    reviewFromBottom = true;
                    $(this).remove();
                    $('.flagged-posts.moderator').css('margin-top', '600px');
                    window.scrollTo(0,999999);
                })
                .prependTo('.flag-container');
        }

        // Highlight rude or abusive flag comments
        $('.revision-comment').filter((i, el) => el.innerText.indexOf('rude or abusive') >= 0).addClass('roa-flag');

        // Highlight comments from last year or older
        const thisYear = new Date().getFullYear();
        $('.comment-link .relativetime').filter((i, el) => Number(el.title.substr(0,4)) < thisYear).addClass('old-comment');

        // On delete/dismiss comment action
        $('.delete-comment, .cancel-comment-flag').on('click', function() {

            let $post = $(this).parents('.flagged-post-row');

            // Sanity check
            if($post.length !== 1) return;

            // Remove current comment from DOM
            let $comm = $(this).parents('tr.message-divider').next('tr.comment').addBack();
            $comm.remove();

            // Hide post immediately if no comments remaining
            let $remainingComms = $post.find('.js-flagged-comments tr.comment');
            if($remainingComms.length === 0) $post.remove();
        });

        // On purge all comments link click
        $('.flagged-post-row').on('click', '.js-del-all-comments', function() {

            if(confirm('Delete ALL comments? (mark as helpful)')) {

                // Delete each comment
                $(this).parents('.post-layout').find('.comment-delete').parents('.comment').each(function() {
                    var cid = this.dataset.commentId;
                    $.post({
                        url: 'https://stackoverflow.com/posts/comments/'+cid+'/vote/10',
                        data: { 'fkey': fkey },
                        success: function(data) {
                            console.log(data);
                        },
                    });
                });

                // Hide post immediately so we can move on
                $(this).parents('.flagged-post-row').hide();
            }
        });
    }

    function listenToPageUpdates() {

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {

            // Highlight flagged comments in expanded posts
            let $flaggedComms = $('.js-flagged-comments .comment');
            $flaggedComms.each(function() {
                let cid = this.id.match(/\d+$/)[0];
                $('#comment-'+cid).children().css('background', '#ffc');
            });

            // Always expand comments if post is expanded, if comments have not been expanded yet
            $('.js-comments-container').not('.js-del-loaded').each(function() {

                // So we only load deleted comments once
                $(this).addClass('js-del-loaded').removeClass('dno');

                // Remove default comment expander
                $(this).next().find('.js-show-link.comments-link').remove();

                // Insert delete all comments link
                $(this).next().append(`<a class="js-del-all-comments">purge all comments</a>`);

                // Get all including deleted comments
                let postId = this.id.match(/\d+/)[0];
                let commentsUrl = `/posts/${postId}/comments?includeDeleted=true&_=${Date.now()}`;
                $('#comments-'+postId).children('ul.comments-list').load(commentsUrl);
                console.log("Loading comments for " + postId);
            });

            // Continue reviewing from bottom of page if previously selected
            if(reviewFromBottom) {
                let scrLeft = document.documentElement.scrollLeft || document.body.scrollLeft || window.pageXOffset;
                window.scrollTo(scrLeft, 999999);
            }
        });
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
    top: 0;
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
    height: 4.8em;
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
    padding: 5px 0 20px;
    font-size: 0;
}
.delete-comment,
.cancel-comment-flag {
    margin-left: 20px;
    padding: 5px 8px;
    font-size: 1rem;
    background: #eee;
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
</style>
`;
        $('body').append(styles);
    }

    // On page load
    appendStyles();
    doPageload();
    listenToPageUpdates();

})();
