// ==UserScript==
// @name         Too Many Comments Flag Queue Helper
// @description  Inserts quicklinks to "Move comments to chat + delete" and "Delete all comments"
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.2
//
// @match        */admin/dashboard?flagtype=posttoomanycommentsauto*
// ==/UserScript==

(function() {
    'use strict';

    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;


    const fkey = StackExchange.options.user.fkey;
    let ajaxTimeout;


    function doPageLoad() {

        // Expand unhandled posts
        var unhandledPosts = $('.flagged-post-row').filter((i,el) => $('.mod-post-actions', el).text().indexOf('ModMovedCommentsToChat') === -1);
        setTimeout((unhandledPosts) => $('.expand-body', unhandledPosts).click(), 300, unhandledPosts);

        // On move comments to chat link click
        $('.flagged-post-row').on('click', '.move-comments-link', function() {

            let pid = this.dataset.postId;

            if(confirm('Move all comments to chat & purge?')) {

                // Move comments to chat
                $.post({
                    url: `https://stackoverflow.com/admin/posts/${pid}/move-comments-to-chat`,
                    data: {
                        'fkey': fkey,
                        'delete-moved-comments': 'true'
                    },
                    success: function() {
                        $('#comments-'+pid).hide();
                        $('#comments-link-'+pid).html('<b>Comments moved to chat and purged.</b>');
                    }
                });
            }
        });

        // On purge all comments link click
        $('.flagged-post-row').on('click', '.purge-comments-link', function() {

            let pid = this.dataset.postId;

            if(confirm('Delete ALL comments?')) {

                // Delete comments
                $.post({
                    url: `https://stackoverflow.com/admin/posts/${pid}/delete-comments`,
                    data: {
                        'fkey': fkey,
                        'mod-actions': 'delete-comments'
                    },
                    success: function() {
                        $('#comments-'+pid).hide();
                        $('#comments-link-'+pid).html('<b>Comments deleted.</b>');
                    }
                });
            }
        });
    }


    function listenToPageUpdates() {

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {

            // Always expand comments if post is expanded, if comments have not been expanded yet
            $('.js-comments-container').not('.js-del-loaded').each(function() {

                let postId = this.id.match(/\d+/)[0];

                // So we only load deleted comments once
                $(this).addClass('js-del-loaded').removeClass('dno');

                // Remove default comment expander
                $(this).next().find('.js-show-link.comments-link').prev().addBack().remove();

                // Get all including deleted comments
                let commentsUrl = `/posts/${postId}/comments?includeDeleted=true&_=${Date.now()}`;
                $('#comments-'+postId).children('ul.comments-list').load(commentsUrl);
                console.log("Loading comments for " + postId);
            });

            // Simple throttle
            if(typeof ajaxTimeout !== undefined) clearTimeout(ajaxTimeout);
            ajaxTimeout = setTimeout(insertCommentLinks, 500);
        });
    }


    function insertCommentLinks() {

        $('.js-comments-container').not('.js-comment-links').addClass('js-comment-links').each(function() {

            const pid = this.id.match(/\d+$/)[0];

            // Insert additional comment actions
            let commentActionLinks = `<div class="mod-action-links" style="float:right; padding-right:10px"><a data-post-id="${pid}" class="move-comments-link comments-link red-mod-link" title="move all comments to chat &amp; purge">move to chat</a><span>&nbsp;|&nbsp;</span><a data-post-id="${pid}" class="purge-comments-link comments-link red-mod-link" title="delete all comments">purge all</a></div></div>`;
            $('#comments-link-'+pid).append(commentActionLinks);
        });
    }


    function appendStyles() {

        const styles = `
<style>
.post-text,
.post-taglist,
.post-options.keep .delete-options > input,
.dismiss-options,
.mod-message {
    display: none;
}
.post-options.keep .delete-options > input[class="dismiss-all"] {
    display: inline-block;
}
.tagged-ignored {
    opacity: 1;
}
</style>
`;
        $('body').append(styles);
    }

    // On page load
    appendStyles();
    doPageLoad();
    listenToPageUpdates();

})();
