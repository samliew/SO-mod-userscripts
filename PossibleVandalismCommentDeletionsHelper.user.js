// ==UserScript==
// @name         Possible Vandalism Comment Deletions Helper
// @description  Display deleted comments and user who deleted the comments
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0.1
//
// @include      https://*stackoverflow.com/admin/dashboard?flagtype=commentvandalismdeletionsauto*
// @include      https://*serverfault.com/admin/dashboard?flagtype=commentvandalismdeletionsauto*
// @include      https://*superuser.com/admin/dashboard?flagtype=commentvandalismdeletionsauto*
// @include      https://*askubuntu.com/admin/dashboard?flagtype=commentvandalismdeletionsauto*
// @include      https://*mathoverflow.net/admin/dashboard?flagtype=commentvandalismdeletionsauto*
// @include      https://*.stackexchange.com/admin/dashboard?flagtype=commentvandalismdeletionsauto*
// ==/UserScript==

(function() {
    'use strict';

    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;

    const fkey = StackExchange.options.user.fkey;
    let ajaxRequests = 0;


    // Highest occurance in array - https://stackoverflow.com/a/20762713/584192
    function mode(arr) {
        return arr.sort((a, b) => arr.filter(v => v===a).length - arr.filter(v => v===b).length).pop();
    }


    // Get all post comments
    function getPostComments(pid, inclDeleted = false) {
        ajaxRequests++;

        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid == null) { reject(); return; }

            $.get(`https://${location.hostname}/posts/${pid}/comments?includeDeleted=${inclDeleted}&fkey=${fkey}`)
                .done(function(data) {
                    const v = $(data).filter('.comment');
                    resolve(v);
                })
                .fail(reject)
                .always(() => ajaxRequests--);
        });
    }


    // Get deleted post comments only
    function getPostDeletedComments(pid) {
        ajaxRequests++;

        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid == null) { reject(); return; }

            $.get(`https://${location.hostname}/posts/${pid}/comments?includeDeleted=true&fkey=${fkey}`)
                .done(function(data) {
                    const v = $(data).filter('.deleted-comment');
                    resolve(v);
                })
                .fail(reject)
                .always(() => ajaxRequests--);
        });
    }


    // Get post comments by user
    function getPostCommentsByUser(uid, pid, inclDeleted = false) {
        ajaxRequests++;

        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid == null) { reject(); return; }

            $.get(`https://${location.hostname}/posts/${pid}/comments?includeDeleted=${inclDeleted}&fkey=${fkey}`)
                .done(function(data) {
                    const v = $(data).filter('.comment').filter(function() {
                        const user = $(this).find('.comment-user').first().get(0);
                        return (user.href || user.innerText).match(/\d+/, '')[0] == uid;
                    });
                    resolve(v);
                })
                .fail(reject)
                .always(() => ajaxRequests--);
        });
    }


    function processFlags(flags) {

        // Pre-parse user ids
        $('.comment-user').not('[data-uid]').each(function() {
            // No href if deleted user, fallback to innerText
            this.dataset.uid = (this.href || this.innerText).match(/\d+/, '')[0];
        });

        // For each flag
        flags.not('.js-comments-loaded').addClass('js-comments-loaded').each(function() {
            const post = $(this).closest('.flagged-post-row');
            const modMessageContent = $(this).closest('td');
            const cmmtsContainer = post.find('.comments-list');

            // Calculate the user (highest freq)
            const userIds = cmmtsContainer.find('.deleted-comment-info .comment-user').map((i, el) => el.dataset.uid).get();
            const uid = mode(userIds);

            // Remove deleted comments that were not deleted by user
            cmmtsContainer.children().filter(function() {
                return $(this).find('.deleted-comment-info .comment-user').attr('data-uid') != uid;
            }).remove();

            // Change deleted user link to "self"
            const userlinks = cmmtsContainer.find('.deleted-comment-info .comment-user');
            const username = userlinks.first().text();
            userlinks.replaceWith('user');

            // Add links to user and comment history
            modMessageContent
                .append(`<div class="ra-userlinks">[ ` +
                    `<a href="https://stackoverflow.com/users/${uid}" target="_blank"><b>${username}</b></a> | ` +
                    `<a href="https://stackoverflow.com/users/account-info/${uid}" target="_blank">Dashboard</a> | ` +
                    `<a href="https://stackoverflow.com/users/history/${uid}?type=User+suspended" target="_blank">Susp. History</a> | ` +
                    `<a href="https://stackoverflow.com/users/message/create/${uid}" target="_blank">Message/Suspend</a> | ` +
                    `<a href="http://stackoverflow.com/admin/users/${uid}/post-comments?state=flagged" target="_blank">Comments</a>` +
                ` ]</div>`);
        });

    }


    function doPageload() {

        const flags = $('.flagged-post-row span.revision-comment.active-flag')
            .filter((i, el) => el.innerText.indexOf('possible vandalism: comment deletions (auto)') >= 0)
            .each(function() {
                const post = $(this).closest('.flagged-post-row');
                const modMessageContent = $(this).closest('td');
                const cmmtsContainer = $(`<ul class="comments comments-list"></ul>`).appendTo($(this).parents('.js-dashboard-row '));

                // Move action buttons
                cmmtsContainer.before(post.find('.post-options.keep'));

                // For each post in list
                post.find('ul.post-list').hide().children().each(function() {
                    const postlink = $(this).find('a').first();
                    const posturl = postlink.get(0).href;
                    const pid = postlink.hasClass('question-hyperlink') ? posturl.match(/\d+/)[0] : posturl.match(/\d+$/)[0];

                    // Get post's deleted comments
                    getPostDeletedComments(pid)
                        .then(function(v) {
                            cmmtsContainer.append(v);
                        });
                });
            });

        // On all load complete
        $(document).ajaxStop(function() {
            setTimeout(processFlags, 100, flags);
        });
    }


    function appendStyles() {

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
table.flagged-posts .delete-options .no-further-action-popup {
    padding: 16px;
}
table.mod-message {
    font-size: 1.1em;
}
table.mod-message .flagcell {
    display: none;
}
.comments-list {
    width: 100%;
    padding: 0;
    border: 1px solid #ddd;
}
.comments-list > li {
    border-bottom: 1px solid #ddd;
}
.comments-list > li:nth-child(even) {
    background: #f8f8f8;
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
.post-list {
    margin-left: 0;
}
.post-list .title-divider {
    margin-top: 5px;
}
.post-list .load-body {
    display: none;
}
.tagged-ignored {
    opacity: 1;
}
.close-question-button,
.delete-post,
.undelete-post {
    display: none !important;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();

})();
