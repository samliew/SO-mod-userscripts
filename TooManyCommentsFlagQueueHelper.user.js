// ==UserScript==
// @name         Too Many Comments Flag Queue Helper
// @description  Inserts quicklinks to "Move comments to chat + delete" and "Delete all comments"
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      3.1.2
//
// @match        */admin/dashboard?flagtype=posttoomanycommentsauto*
// ==/UserScript==

(function() {
    'use strict';

    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;


    const fkey = StackExchange.options.user.fkey;
    let ajaxTimeout;


    // Undelete individual comment
    function undeleteComment(pid, cid) {
        if(typeof pid === 'undefined' || pid == null) return;
        if(typeof cid === 'undefined' || cid == null) return;
        $.post({
            url: `https://stackoverflow.com/admin/posts/${pid}/comments/${cid}/undelete`,
            data: {
                'fkey': fkey
            }
        });
    }


    // Undelete comments
    function undeleteComments(pid, cids) {
        if(typeof pid === 'undefined' || pid == null) return;
        if(typeof cids === 'undefined' || cids.length === 0) return;
        cids.forEach(v => undeleteComment(pid, v));
    }


    // Delete individual comment
    function deleteComment(cid) {
        return new Promise(function(resolve, reject) {
            if(typeof cid === 'undefined' || cid == null) { reject(); return; }

            $.post({
                url: `https://stackoverflow.com/posts/comments/${cid}/vote/10`,
                data: {
                    'fkey': fkey
                }
            })
            .done(function(data) {
                $('#comment-'+pid).remove();
                resolve();
            })
            .fail(reject);
        });
    }


    // Delete all comments on post
    function deleteCommentsOnPost(pid) {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid == null) { reject(); return; }

            $.post({
                url: `https://stackoverflow.com/admin/posts/${pid}/delete-comments`,
                data: {
                    'fkey': fkey,
                    'mod-actions': 'delete-comments'
                }
            })
            .done(function(data) {
                $('#comments-'+pid).remove();
                $('#comments-link-'+pid).html('<b>Comments deleted.</b>');
                resolve();
            })
            .fail(reject);
        });
    }


    // Move all comments on post to chat
    function moveCommentsOnPostToChat(pid) {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid == null) { reject(); return; }

            $.post({
                url: `https://stackoverflow.com/admin/posts/${pid}/move-comments-to-chat`,
                data: {
                    'fkey': fkey,
                    'delete-moved-comments': 'true'
                }
            })
            .done(function(data) {
                $('#comments-'+pid).remove();
                $('#comments-link-'+pid).html('<b>Comments moved to chat and purged.</b>');
                resolve();
            })
            .fail(reject);
        });
    }


    // Mark all flags on post as helpful
    function dismissAllHelpful(pid, comment = "") {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid == null) { reject(); return; }

            $.post({
                url: `https://stackoverflow.com/messages/delete-moderator-messages/${pid}/${unsafeWindow.renderTimeTicks}?valid=true`,
                data: {
                    'fkey': fkey,
                    'comment': comment
                }
            })
            .done(function(data) {
                $('#flagged-'+pid).remove();
                resolve();
            })
            .fail(reject);
        });
    }


    function doPageLoad() {

        // Expand unhandled posts
        const unhandledPosts = $('.flagged-post-row').filter((i,el) => $('.mod-post-actions', el).text().indexOf('ModMovedCommentsToChat') === -1);
        const handledPosts = $('.flagged-post-row').not(unhandledPosts).addClass('comments-handled');
        setTimeout((unhandledPosts) => $('.expand-body', unhandledPosts).click(), 300, unhandledPosts);

        // Add "done" (no further action (helpful)) button
        $('.delete-options').append(`<input class="immediate-dismiss-all" type="button" value="done (helpful)" title="dismiss all flags (helpful)" />`);

        // On move comments to chat link click
        $('.flagged-post-row').on('click', '.move-comments-link', function() {
            if(confirm('Move all comments to chat & purge?')) {
                const pid = this.dataset.postId;
                const flaggedPost = $('#flagged-'+pid);
                const possibleDupeCommentIds = $(`#comments-${pid} .comment`)
                    .filter((i, el) => $(el).find('.comment-copy').text().indexOf('Possible duplicate of ') === 0)
                    .map((i, el) => el.dataset.commentId).get();

                moveCommentsOnPostToChat(pid)
                    .then(function(v) {
                        undeleteComments(pid, possibleDupeCommentIds);
                        flaggedPost.addClass('comments-handled');
                    });
            }
        });

        // On purge all comments link click
        $('.flagged-post-row').on('click', '.purge-comments-link', function() {
            if(confirm('Delete ALL comments?')) {
                const pid = this.dataset.postId;
                const flaggedPost = $('#flagged-'+pid);
                const possibleDupeCommentIds = $(`#comments-${pid} .comment`)
                    .filter((i, el) => $(el).find('.comment-copy').text().indexOf('Possible duplicate of ') === 0)
                    .map((i, el) => el.dataset.commentId).get();

                deleteCommentsOnPost(pid)
                    .then(function(v) {
                        undeleteComments(pid, possibleDupeCommentIds);
                        flaggedPost.addClass('comments-handled');
                    });
            }
        });

        // On "done" button click
        $('.flagged-post-row').on('click', '.immediate-dismiss-all', function() {
            const pid = $(this).closest('.flagged-post-row').get(0).dataset.postId;
            dismissAllHelpful(pid);
        });
    }


    function listenToPageUpdates() {

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {

            // Closed questions
            $('.question-status').each(function() {
                $(this).closest('.flagged-post-row').addClass('already-closed');
            });

            // Always expand comments if post is expanded, if comments have not been expanded yet
            $('.js-comments-container').not('.js-del-loaded').each(function() {

                const postId = this.id.match(/\d+/)[0];

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
            const commentActionLinks = `<div class="mod-action-links" style="float:right; padding-right:10px"><a data-post-id="${pid}" class="move-comments-link comments-link red-mod-link" title="move all comments to chat &amp; purge">move to chat</a><span>&nbsp;|&nbsp;</span><a data-post-id="${pid}" class="purge-comments-link comments-link red-mod-link" title="delete all comments">purge all</a></div></div>`;
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
.flagged-post-row.already-closed .immediate-dismiss-all,
.flagged-post-row.comments-handled .immediate-dismiss-all {
    display: inline-block !important;
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
