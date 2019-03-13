// ==UserScript==
// @name         Comment Undeleter
// @description  Allows moderators to undelete user-deleted comments
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.1.4
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
// @require      https://github.com/samliew/SO-mod-userscripts/raw/master/lib/common.js
// ==/UserScript==

(function() {
    'use strict';

    // Moderator check
    if(!isModerator()) return;


    const fkey = StackExchange.options.user.fkey;


    // Delete individual comment
    function deleteComment(cid) {
        return new Promise(function(resolve, reject) {
            if(hasInvalidIds(cid)) { reject(); return; }

            $.post({
                url: `https://${location.hostname}/posts/comments/${cid}/vote/10`,
                data: {
                    'fkey': fkey,
                    'sendCommentBackInMessage': true
                }
            })
            .done(function(json) {
                if(json.Success) $('#comment-'+cid).replaceWith(json.Message);
                resolve();
            })
            .fail(reject);
        });
    }
    // Undelete individual comment
    function undeleteComment(pid, cid) {
        return new Promise(function(resolve, reject) {
            if(hasInvalidIds(pid, cid)) { reject(); return; }

            $.post({
                url: `https://${location.hostname}/admin/posts/${pid}/comments/${cid}/undelete`,
                data: {
                    'fkey': fkey
                }
            })
            .done(function(data) {
                $('#comment-'+cid).replaceWith(data);
                resolve();
            })
            .fail(reject);
        });
    }


    function doPageload() {

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {

            // If deleted comments loaded
            if(settings.url.includes('/comments?includeDeleted=true')) {

                // Add undelete link to deleted comment info if not found
                $('.deleted-comment-info').filter(function() {
                    return $(this).children('.undelete-comment').length == 0;
                }).append(`<a class="mod-undelete-comment">Undelete</a>`);
            }
        });

        // Undelete comment when link clicked
        $(document).on('click', '.mod-undelete-comment', function() {
            const cmmt = $(this).closest('.comment');
            const pid = cmmt.closest('.comments').attr('id').split('-')[1];
            const cid = cmmt.attr('id').split('-')[1];

            undeleteComment(pid, cid);
            return false;
        });
    }


    // On page load
    doPageload();

})();
