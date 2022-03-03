// ==UserScript==
// @name         Comment Undeleter
// @description  Allows moderators to undelete user-deleted comments
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.2
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
                const cmmt = $('#comment-' + cid).replaceWith(data);
                cmmt[0].dataset.postId = pid;
                resolve(cid);
            })
            .fail(reject);
    });
}


// Add undelete link to deleted comment info if not found
function addUndeleteButtons() {
    $('.deleted-comment-info').filter(function () {
        return $(this).children('.js-comment-undelete').length == 0;
    }).append(`<button class="js-comment-undelete undelete-comment s-btn s-btn__link">Undelete</button>`);
}

function doPageLoad() {

    // Only on mod flag queue "commentvandalismdeletionsauto"
    if(location.pathname.includes('/admin/dashboard') && location.search.includes('flagtype=commentvandalismdeletionsauto')) {

        // Add global event for undelete button clicks
        $(document).on('click', '.js-comment-undelete', function () {
            const cmmt = $(this).closest('.comment');
            const pid = cmmt[0].dataset.postId ?? cmmt.closest('.comments')[0]?.id.split('-')[1];
            const cid = cmmt.attr('id').split('-')[1];

            undeleteComment(pid, cid);
            return false;
        });

        // Add global event for delete button clicks
        $(document).on('click', '.js-comment-delete', function () {
            const cmmt = $(this).closest('.comment');
            const pid = cmmt[0].dataset.postId ?? cmmt.closest('.comments')[0]?.id.split('-')[1];
            const cid = cmmt.attr('id').split('-')[1];

            deleteComment(cid).then(() => {
                // Set post id to comment so we can undelete
                cmmt[0].dataset.postId = pid;
            });
            return false;
        });
    }
}

function listenToPageUpdates() {
    $(document).ajaxStop(function (event, xhr, settings) {
        setTimeout(addUndeleteButtons, 100);
    });
}


// On page load
doPageLoad();
listenToPageUpdates();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
/* Show undelete link even on deleted answers */
.deleted-answer .comments .deleted-comment .undelete-comment,
.deleted-answer .comments .deleted-comment:hover .undelete-comment {
    display: inline-block;
}
`;
document.body.appendChild(styles);