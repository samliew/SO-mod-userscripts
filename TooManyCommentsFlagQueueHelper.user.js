// ==UserScript==
// @name         Too Many Comments Flag Queue Helper
// @description  Inserts quicklinks to "Move comments to chat + delete" and "Delete all comments"
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      4.6
// 
// @updateURL    https://github.com/samliew/SO-mod-userscripts/raw/master/TooManyCommentsFlagQueueHelper.user.js
// @downloadURL  https://github.com/samliew/SO-mod-userscripts/raw/master/TooManyCommentsFlagQueueHelper.user.js
//
// @match        */admin/dashboard?flagtype=posttoomanycommentsauto*
//
// @require      https://raw.githubusercontent.com/samliew/ajax-progress/master/jquery.ajaxProgress.js
// ==/UserScript==

(function() {
    'use strict';

    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;


    const fkey = StackExchange.options.user.fkey;
    const superusers = [ 584192 ];
    const delCommentThreshold = 40;
    let ajaxTimeout;

    const pluralize = n => n && Number(n) !== 1 ? 's' : '';


    // Undelete individual comment
    function undeleteComment(pid, cid) {
        if(typeof pid === 'undefined' || pid == null) return;
        if(typeof cid === 'undefined' || cid == null) return;
        $.post({
            url: `https://${location.hostname}/admin/posts/${pid}/comments/${cid}/undelete`,
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
                url: `https://${location.hostname}/posts/comments/${cid}/vote/10`,
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
                url: `https://${location.hostname}/admin/posts/${pid}/delete-comments`,
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
                url: `https://${location.hostname}/admin/posts/${pid}/move-comments-to-chat`,
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
                url: `https://${location.hostname}/messages/delete-moderator-messages/${pid}/${StackExchange.moderator.renderTimeTicks}?valid=true`,
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
        const unhandledPosts = $('.js-flagged-post').filter((i,el) => $('.mod-post-actions', el).text().indexOf('ModMovedCommentsToChat') === -1);
        const handledPosts = $('.js-flagged-post').not(unhandledPosts).addClass('comments-handled');
        setTimeout((unhandledPosts) => $('.js-body-loader:last .js-expand-body', unhandledPosts).click(), 1000, unhandledPosts);

        // Add "done" (no further action (helpful)) button
        $('.js-post-flag-options > .grid').append(`<input class="immediate-dismiss-all" type="button" value="done (helpful)" title="dismiss all flags (helpful)" />`);

        // On move comments to chat link click
        $('.js-flagged-post').on('click handle', '.move-comments-link', function(evt) {
            if(evt.type == 'click' && !confirm('Move all comments to chat & purge?')) return;

            const pid = this.dataset.postId;
            const flaggedPost = $(this).closest('.js-flagged-post');
            const possibleDupeCommentIds = $(`#comments-${pid} .comment`).not('.deleted-comment')
            .filter(function(i, el) {
                const cmmtText = $(el).find('.comment-copy').text().toLowerCase();
                return cmmtText.indexOf('possible duplicate of ') === 0;
            })
            .map((i, el) => el.dataset.commentId).get();

            moveCommentsOnPostToChat(pid)
                .then(function(v) {
                    undeleteComments(pid, possibleDupeCommentIds);
                    flaggedPost.addClass('comments-handled');
                });
        });

        // On purge all comments link click
        $('.js-flagged-post').on('click handle', '.purge-comments-link', function(evt) {
            if(evt.type == 'click' && !confirm('Delete ALL comments?')) return;

            const pid = this.dataset.postId;
            const flaggedPost = $(this).closest('.js-flagged-post');
            const possibleDupeCommentIds = $(`#comments-${pid} .comment`).not('.deleted-comment')
                .filter(function(i, el) {
                    const cmmtText = $(el).find('.comment-copy').text().toLowerCase();
                    return cmmtText.indexOf('possible duplicate of ') === 0 || cmmtText.indexOf('let us continue this discussion ') === 0;
                })
                .map((i, el) => el.dataset.commentId).get();

            deleteCommentsOnPost(pid)
                .then(function(v) {
                    undeleteComments(pid, possibleDupeCommentIds);
                    flaggedPost.addClass('comments-handled');
                });
        });

        // On "done" button click
        $('.js-flagged-post').on('click', '.immediate-dismiss-all', function() {
            const $post = $(this).closest('.js-flagged-post');
            const pid = $post[0].dataset.postId;
            dismissAllHelpful(pid);

            // Hide post immediately so we can move on
            $post.hide();
        });

        // If there are lots of comment flags
        if($('.js-flagged-post').length > 1) {

            const actionBtns = $('<div id="actionBtns"></div>');
            $('.js-flagged-post').first().parent().prepend(actionBtns);

            // Start from bottom link
            $('<button>Review from bottom</button>')
                .click(function() {
                    window.scrollTo(0,999999);
                })
                .appendTo(actionBtns);

            if(superusers.includes(StackExchange.options.user.userId)) {

                // Move all comments on page to chat
                $('<button class="btn-warning">Move ALL to chat</button>')
                    .click(function() {
                        $(this).remove();
                        const moveLinks = $('.move-comments-link:visible');
                        $('body').showAjaxProgress(moveLinks.length, { position: 'fixed' });
                        moveLinks.trigger('handle');
                    })
                    .appendTo(actionBtns);

                // Dismiss all handled ones
                $('<button class="btn-warning">Dismiss ALL handled</button>')
                    .click(function() {
                        const dismissLinks = $('.immediate-dismiss-all:visible');
                        dismissLinks.click();
                    })
                    .appendTo(actionBtns);
            }
        }
    }


    function listenToPageUpdates() {

        // On any page update
        $(document).ajaxStop(function(event, xhr, settings) {

            // Closed questions
            $('.question-status').each(function() {
                $(this).closest('.js-flagged-post').addClass('already-closed');
            });

            // Always expand comments if post is expanded, if comments have not been expanded yet
            $('.comments.js-comments-container').not('.js-del-loaded').each(function() {

                const postId = this.id.match(/\d+/)[0];

                // So we only load deleted comments once
                $(this).addClass('js-del-loaded').removeClass('dno');

                // Remove default comment expander
                $(this).next().find('.js-show-link.comments-link').prev().addBack().remove();

                // Get all including deleted comments
                let commentsUrl = `/posts/${postId}/comments?includeDeleted=true&_=${Date.now()}`;
                $('#comments-'+postId).children('ul.comments-list').load(commentsUrl, function() {

                    // Display post stats near action buttons, so we don't have to scroll back up
                    const el = $(this);
                    const post = $(this).closest('.js-flagged-post');
                    const postFlags = post.find('.js-post-flags');

                    const postCreated = post.find('.post-signature .relativetime').last().get(0).outerHTML;
                    const numAnswers = post.find('.js-post-header span.s-badge').last().text();
                    const isAccepted = post.find('.js-post-header .s-badge__answered').length > 0;
                    const numAnswersText = numAnswers ? `<div>post type: question (${numAnswers} answer${pluralize(numAnswers)})</div>` : `<div>post type: answer ${isAccepted ? '(accepted)' : ''}</div>`;
                    const closeReasonElem = post.find('.question-status:not(.bounty)');
                    const closeReason = closeReasonElem.length ? closeReasonElem[0].children[0].childNodes[2].nodeValue.replace(/\s*\b(as|by)\b\s*/g, '') : '';
                    const closeReasonText = closeReasonElem.length && closeReason.length ? `<div>closed: ${closeReason}</div>` : '';
                    const cmmts = el.find('.comment-body');
                    const cmmtsDel = el.find('.deleted-comment');
                    const percDel = Math.ceil(cmmtsDel.length / cmmts.length * 100);
                    const cmmtUsers = el.find('.comment-body').find('.comment-user:first').map((i, el) => el.href).get().filter((v, i, self) => self.indexOf(v) === i); // unique users
                    const infoDiv = $(`
<div class="post-comment-stats">
  <h3><b>Post info:</b></h3>
  <div>created: ${postCreated}</div>
  ${numAnswersText}
  ${closeReasonText}
  <div>${cmmtUsers.length} commentators</div>
  <div>${cmmts.length} comments, ${cmmtsDel.length} deleted (<span class="${percDel >= delCommentThreshold ? 'red' : ''}">${percDel}%</span>)</div>
</div>`).appendTo(postFlags);

                    if(percDel >= delCommentThreshold) {
                        post.addClass('too-many-deleted');
                    }
                });
            });

            // Simple throttle
            if(typeof ajaxTimeout !== undefined) clearTimeout(ajaxTimeout);
            ajaxTimeout = setTimeout(insertCommentLinks, 500);
        });
    }


    function insertCommentLinks() {

        $('.comments.js-comments-container').not('.js-comment-links').addClass('js-comment-links').each(function() {

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
.js-post-flag-options input,
.dismiss-options,
.mod-message {
    display: none !important;
}
.js-flagged-post.too-many-deleted .immediate-dismiss-all,
.js-flagged-post.already-closed .immediate-dismiss-all,
.js-flagged-post.comments-handled .immediate-dismiss-all {
    display: inline-block !important;
}
.tagged-ignored {
    opacity: 1 !important;
}
.post-comment-stats {
    padding: 15px 0;
    text-align: right;
}
.post-comment-stats .red {
    color: red;
    font-weight: bold;
}
.red-mod-link {
    color: red;
}

#actionBtns {
    margin: 40px 24px 0px;
}
#actionBtns button {
    margin-right: 10px;
}

/* New mod interface */
.js-post-header .js-loaded-body {
    margin-left: -44px !important;
    margin-right: -3px !important;
}
.visited-post {
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
