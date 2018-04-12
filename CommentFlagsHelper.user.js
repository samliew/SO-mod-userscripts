// ==UserScript==
// @name         Comment Flags Helper
// @description  Highlights flagged user comments in expanded posts, Always expand comments if post is expanded, Highlight common chatty and rude keywords
// @match        https://*stackoverflow.com/admin/dashboard?flag*=comment*
// @match        https://stackoverflow.com/admin/users/*/post-comments*
// @match        https://meta.stackoverflow.com/admin/dashboard?flag*=comment*
// @match        https://meta.stackoverflow.com/admin/users/*/post-comments*
// @match        https://*.stackexchange.com/admin/dashboard?flag*=comment*
// @match        https://*.stackexchange.com/admin/users/*/post-comments*
// @author       @samliew
// ==/UserScript==

(function() {
    'use strict';

    var reviewFromBottom = false;

    function doPageload() {

        // Special characters must be escaped with \\
        var rudeKeywords = [
            'fuck', '\\barse', 'cunt', 'dick', '\\bcock', 'pussy', '\\bhell', 'stupid', 'idiot', '!!+', '\\?\\?+',
            'grow\\s?up', 'shame', 'wtf', 'garbage', 'trash', 'spam', 'damn', 'stop', 'horrible', 'inability', 'bother',
            'nonsense', 'never\\s?work', 'illogical', 'fraud', 'crap', 'reported', 'get\\s?lost', 'go\\s?away',
            'useless', 'delete[\\w\\s]+(answer|question|comment)', 'move on', 'learn',
        ];

        // Special characters must be escaped with \\
        var chattyKeywords = [
            'thanks?', 'welcome', 'up-?voted?', 'updated', 'edited', 'added', '(in)?correct(ed)?', 'done', 'worked', 'works', 'glad',
            'appreciated?', 'my email', 'email me', 'contact', 'good', 'great', 'sorry', '\\+1', 'love', 'wow', 'pointless', 'no\\s?(body|one)',
            'homework', 'no\\s?idea', 'your\\s?mind', 'try\\s?it', 'typo', 'wrong', 'unclear', 'regret', 'we\\b', 'every\\s?(body|one)',
            'exactly', 'check', 'lol', '\\bha(ha)+',
        ];

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

        // On delete/dismiss comment action
        $('.delete-comment, .cancel-comment-flag').click(function() {

            var $post = $(this).parents('.flagged-post-row');

            // Remove current comment from DOM
            $(this).parents('tr.message-divider').next('tr.comment').addBack().remove();

            // Remove post immediately if no comments remaining
            if($post.find('.js-flagged-comments tr.comment').length === 0) $post.remove();
        });
    }

    function listenToPageUpdates() {

        // On any page update
        $(document).ajaxComplete(function() {

            // Always expand comments if post is expanded
            $('.js-show-link.comments-link').trigger('click');

            // Highlight flagged user comments in expanded posts
            var $user = $('.js-flagged-comments .comment-link + a');
            $user.each(function() {
                $(this).parents('.messageDivider')
                    .find('.comment-user').filter((i,e) => e.href === this.href)
                    .closest('.comment').children().css('background', '#ffc');
            });

            // Continue reviewing from bottom of page if previously selected
            if(reviewFromBottom) {
                window.scrollTo(0,999999);
            }
        });
    }

    function appendStyles() {

        var styles = `
<style>
#footer,
.t-flag,
.t-flag ~ .module,
.module p.more-info,
#mod-history + div:not([class]) {
    display: none;
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
tr.comment>td {
    height: 48px;
}
.revision-comment {
    color: #663;
    font-style: italic;
}
.flag-issue.comment {
    float: none !important;
    position: absolute;
    display: inline-block;
    top: 0;
    right: 0;
    padding: 5px 0;
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
</style>
`;
        $('body').append(styles);
    }

    // On page load
    appendStyles();
    doPageload();
    listenToPageUpdates();

})();
