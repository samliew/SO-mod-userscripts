// ==UserScript==
// @name         Comment Undeleter
// @description  Allows moderators to undelete user-deleted comments
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.0
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*.stackexchange.com/*
//
// @exclude      *chat.*
// @exclude      https://stackoverflow.com/c/*
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';

// Moderator check
if (!isModerator()) return;

const fkey = StackExchange.options.user.fkey;


// Delete individual comment
function deleteComment(cid) {
    return new Promise(function (resolve, reject) {
        if (hasInvalidIds(cid)) { reject(); return; }

        $.post({
            url: `https://${location.hostname}/posts/comments/${cid}/vote/10`,
            data: {
                'fkey': fkey,
                'sendCommentBackInMessage': true
            }
        })
            .done(function (json) {
                if (json.Success) $('#comment-' + cid).replaceWith(json.Message);
                resolve(cid);
            })
            .fail(reject);
    });
}
// Undelete individual comment
function undeleteComment(pid, cid) {
    return new Promise(function (resolve, reject) {
        if (hasInvalidIds(pid, cid)) { reject(); return; }

        $.post({
            url: `https://${location.hostname}/admin/posts/${pid}/comments/${cid}/undelete`,
            data: {
                'fkey': fkey
            }
        })
            .done(function (data) {
                $('#comment-' + cid).replaceWith(data);
                resolve(cid);
            })
            .fail(reject);
    });
}

function doPageload() {

    // On any page update
    $(document).ajaxComplete(function (event, xhr, settings) {

        // If deleted comments loaded
        if (settings.url.includes('/comments?includeDeleted=true')) {

            // Add undelete link to deleted comment info if not found
            $('.deleted-comment-info').filter(function () {
                return $(this).children('.undelete-comment, .mod-undelete-comment').length == 0;
            }).append(`<a class="mod-undelete-comment">Undelete</a>`);
        }

        // If comment was deleted while on user comments page
        else if (/\/admin\/comment\/\d+\/delete/.test(settings.url) && /\/admin\/users\/\d+\/post-comments/.test(location.pathname)) {

            // Add undelete links to meta-rows without delete/undelete links
            $('.deleted-row.meta-row').filter(function () {
                return $(this).find('.delete-comment, .mod-undelete-comment').length == 0;
            }).find('.creation-date').before(`<a class="mod-undelete-comment" href="#">undelete?</a>`);
        }
    });

    // User comments page
    if (/\/admin\/users\/\d+\/post-comments/.test(location.pathname)) {

        // Add undelete links
        $('.deleted-row.meta-row').find('.creation-date').before(`<a class="mod-undelete-comment" href="#">undelete?</a>`);

        // Handle undelete
        $('.admin-user-comments').on('click', '.mod-undelete-comment', function (evt) {
            const cmmt = $(this).closest('tr.meta-row').get(0);
            const pid = cmmt.dataset.postid;
            const cid = cmmt.dataset.id;

            undeleteComment(pid, cid).then(function (cid) {
                $(evt.target).replaceWith(`<a class="mod-redelete-comment" href="#">delete</a>`);
                $(cmmt).next('tr.text-row').addBack().removeClass('deleted-row');
            });
            return false;
        });

        // Handle re-delete
        $('.admin-user-comments').on('click', '.mod-redelete-comment', function (evt) {
            const cmmt = $(this).closest('tr.meta-row').get(0);
            const cid = cmmt.dataset.id;

            deleteComment(cid).then(function (cid) {
                $(evt.target).replaceWith(`<a class="mod-undelete-comment" href="#">undelete?</a>`);
                $(cmmt).next('tr.text-row').addBack().addClass('deleted-row');
            });
            return false;
        });

    }
    // all other (Q&A)
    else {

        // Undelete comment when link clicked
        $(document).on('click', '.mod-undelete-comment', function () {
            const cmmt = $(this).closest('.comment');
            const pid = cmmt.closest('.comments').attr('id').split('-')[1];
            const cid = cmmt.attr('id').split('-')[1];

            undeleteComment(pid, cid);
            return false;
        });
    }
}


// On page load
doPageload();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
/* Show undelete link even on deleted answers */
.deleted-answer .comments .deleted-comment .undelete-comment,
.deleted-answer .comments .deleted-comment:hover .undelete-comment {
    display: inline-block;
}

/* Same on CommentFlagsHelper userscript */
.meta-row .delete-comment,
.meta-row .edit-comment {
    float: right;
    margin-top: -5px;
    margin-left: 10px;
    padding: 5px 8px;
    font-size: 1rem;
    background: var(--black-050);
}

.meta-row.deleted-row .mod-undelete-comment,
.meta-row .mod-redelete-comment {
    float: right;
    margin-top: -5px;
    padding: 5px 8px;
    font-size: 1rem;
    background: var(--black-050);
}
.meta-row.deleted-row .mod-undelete-comment {
    margin-left: 35px;
    color: var(--red-500);
}
.meta-row .mod-redelete-comment {
    margin-left: 57px;
}
`;
document.body.appendChild(styles);