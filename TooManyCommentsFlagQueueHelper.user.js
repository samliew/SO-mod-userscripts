// ==UserScript==
// @name         Too Many Comments Flag Queue Helper
// @description  Inserts quicklinks to "Move comments to chat + delete" and "Delete all comments"
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.0.1
//
// @match        */admin/dashboard?flagtype=posttoomanycommentsauto*
// ==/UserScript==

(function() {
    'use strict';

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
            // Simple throttle
            if(typeof ajaxTimeout !== undefined) clearTimeout(ajaxTimeout);
            ajaxTimeout = setTimeout(insertCommentLinks, 500);
        });
    }


    function insertCommentLinks() {

        var posts = $('.flagged-post-row').not('.js-comment-links').addClass('js-comment-links').each(function() {

            const pid = this.dataset.postId;

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
