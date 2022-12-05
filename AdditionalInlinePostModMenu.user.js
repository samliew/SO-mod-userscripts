// ==UserScript==
// @name         Additional Inline Post Mod Menu
// @description  Adds mod-only quick actions in existing post menu
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.3
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*.stackexchange.com/*
//
// @exclude      *chat.*
// @exclude      *blog.*
// @exclude      https://stackoverflow.com/c/*
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';

// Moderator check
if (!isModerator()) return;

const superusers = [584192, 366904, 6451573];
const isSuperuser = superusers.includes(StackExchange.options.user.userId);

const newlines = '\n\n';
const fkey = StackExchange.options.user.fkey;
const getQueryParam = key => new URLSearchParams(window.location.search).get(key) || '';
const isSO = location.hostname == 'stackoverflow.com';
const isSOMeta = location.hostname == 'meta.stackoverflow.com';
const isMeta = typeof StackExchange.options.site.parentUrl !== 'undefined';
const parentUrl = StackExchange.options.site.parentUrl || 'https://' + location.hostname;
const metaUrl = StackExchange.options.site.childUrl;

// Manually switch this variable to true when site under spam attack so you can delete accounts as fast as possible without distractions and multiple confirmations
const underSpamAttackMode = isSuperuser || false;


function goToPost(pid) {
    if (typeof pid === 'undefined' || pid === null) { return; }

    // If in mod queues, open in new tab/window
    if (location.pathname.includes('/admin/dashboard')) {
        const link = $(`<a href="https://${location.hostname}/q/${pid}" target="_blank" style="display:none !important;">&nbsp;</a>`).appendTo('body');
        link[0].click();
        link.remove();
    }
    else {
        location.href = `https://${location.hostname}/q/${pid}`;
    }
}
function reloadPage() {
    // If in mod queues, do not reload
    if (location.pathname.includes('/admin/dashboard')) return false;
    location.reload();
}
function reloadWhenDone() {

    // Triggers when all ajax requests have completed
    $(document).ajaxStop(function () {

        // Stop subsequent calls
        $(this).off("ajaxStop");

        reloadPage();
    });
}


// Post comment on post
function addComment(pid, commentText) {
    return new Promise(function (resolve, reject) {
        if (typeof pid === 'undefined' || pid === null) { reject(); return; }
        if (typeof commentText !== 'string' || commentText.trim() === '') { reject(); return; }

        $.post({
            url: `https://${location.hostname}/posts/${pid}/comments`,
            data: {
                'fkey': fkey,
                'comment': commentText,
            }
        })
            .done(resolve)
            .fail(reject);
    });
}


// Close individual post
// closeReasonId: 'NeedMoreFocus', 'SiteSpecific', 'NeedsDetailsOrClarity', 'OpinionBased', 'Duplicate'
// if closeReasonId is 'SiteSpecific', offtopicReasonId : 11-norepro, 13-nomcve, 16-toolrec, 3-custom
function closeQuestionAsOfftopic(pid, closeReasonId = 'SiteSpecific', offtopicReasonId = 3, offTopicOtherText = 'I’m voting to close this question because ', duplicateOfQuestionId = null) {

    // OffTopic has been replaced with SiteSpecific
    if (closeReasonId === 'OffTopic') closeReasonId = 'SiteSpecific';

    return new Promise(function (resolve, reject) {
        if (!isSO) { reject(); return; }
        if (typeof pid === 'undefined' || pid === null) { reject(); return; }
        if (typeof closeReasonId === 'undefined' || closeReasonId === null) { reject(); return; }
        if (closeReasonId === 'SiteSpecific' && (typeof offtopicReasonId === 'undefined' || offtopicReasonId === null)) { reject(); return; }

        if (closeReasonId === 'Duplicate') offtopicReasonId = null;

        // Logging actual action
        console.log(`%c Closing ${pid} as ${closeReasonId}, reason ${offtopicReasonId}.`, 'font-weight: bold');

        $.post({
            url: `https://${location.hostname}/flags/questions/${pid}/close/add`,
            data: {
                'fkey': fkey,
                'closeReasonId': closeReasonId,
                'duplicateOfQuestionId': duplicateOfQuestionId,
                'siteSpecificCloseReasonId': offtopicReasonId,
                'siteSpecificOtherText': offtopicReasonId == 3 && isSO ? 'This question does not appear to be about programming within the scope defined in the [help]' : offTopicOtherText,
                //'offTopicOtherCommentId': '',
                'originalSiteSpecificOtherText': 'I’m voting to close this question because ',
            }
        })
            .done(resolve)
            .fail(reject);
    });
}
function closeQuestionAsDuplicate(pid, targetPid) {
    return new Promise(function (resolve, reject) {
        if (typeof pid === 'undefined' || pid === null) { reject(); return; }
        if (typeof targetPid === 'undefined' || targetPid === null) { reject(); return; }
        closeQuestionAsOfftopic(pid, 'Duplicate', null, 'I\'m voting to close this question as off-topic because ', targetPid)
            .then(resolve)
            .catch(reject);
    });
}
function closeSOMetaQuestionAsOfftopic(pid, closeReason = 'SiteSpecific', offtopicReasonId = 6) {
    return new Promise(function (resolve, reject) {
        if (!isSOMeta) { reject(); return; }
        if (typeof pid === 'undefined' || pid === null) { reject(); return; }
        if (typeof closeReason === 'undefined' || closeReason === null) { reject(); return; }
        if (closeReason === 'SiteSpecific' && (typeof offtopicReasonId === 'undefined' || offtopicReasonId === null)) { reject(); return; }

        addComment(pid, `You are on [Meta](/help/whats-meta). This question will not be answered here and you may want to go over the [Checklist](//meta.stackoverflow.com/q/260648) and [ask] before you repost on [main].`);

        $.post({
            url: `https://${location.hostname}/flags/questions/${pid}/close/add`,
            data: {
                'fkey': fkey,
                'closeReasonId': closeReason,
                'siteSpecificCloseReasonId': offtopicReasonId
            }
        })
            .done(resolve)
            .fail(reject);
    });
}
// Reopen individual post
function reopenQuestion(pid) {
    return new Promise(function (resolve, reject) {
        if (typeof pid === 'undefined' || pid === null) { reject(); return; }

        $.post({
            url: `https://${location.hostname}/flags/questions/${pid}/reopen/add`,
            data: {
                'fkey': fkey
            }
        })
            .done(resolve)
            .fail(reject);
    });
}


// Delete individual post
function deletePost(pid) {
    return new Promise(function (resolve, reject) {
        if (typeof pid === 'undefined' || pid === null) { reject(); return; }

        $.post({
            url: `https://${location.hostname}/posts/${pid}/vote/10`,
            data: {
                'fkey': fkey
            }
        })
            .done(resolve)
            .fail(reject);
    });
}
// Undelete individual post
function undeletePost(pid) {
    return new Promise(function (resolve, reject) {
        if (typeof pid === 'undefined' || pid === null) { reject(); return; }

        $.post({
            url: `https://${location.hostname}/posts/${pid}/vote/11`,
            data: {
                'fkey': fkey
            }
        })
            .done(resolve)
            .fail(reject);
    });
}


// Locks individual post
// Type: 20 - content dispute
//       21 - offtopic comments
function lockPost(pid, type, hours = 24) {
    return new Promise(function (resolve, reject) {
        if (typeof pid === 'undefined' || pid === null) { reject(); return; }
        if (typeof type === 'undefined' || type === null) { reject(); return; }

        $.post({
            url: `https://${location.hostname}/admin/posts/${pid}/lock`,
            data: {
                'mod-actions': 'lock',
                'noticetype': type,
                'duration': hours,
                'fkey': fkey
            }
        })
            .done(resolve)
            .fail(reject);
    });
}
// Unlock individual post
function unlockPost(pid) {
    return new Promise(function (resolve, reject) {
        if (typeof pid === 'undefined' || pid === null) { reject(); return; }

        $.post({
            url: `https://${location.hostname}/admin/posts/${pid}/unlock`,
            data: {
                'mod-actions': 'unlock',
                'fkey': fkey
            }
        })
            .done(resolve)
            .fail(reject);
    });
}


// Protect individual post
function protectPost(pid) {
    return new Promise(function (resolve, reject) {
        if (typeof pid === 'undefined' || pid === null) { reject(); return; }

        $.post({
            url: `https://${location.hostname}/admin/posts/${pid}/protect`,
            data: {
                'mod-actions': 'protect',
                'duration': 1,
                'fkey': fkey
            }
        })
            .done(resolve)
            .fail(reject);
    });
}
// Unprotect individual post
function unprotectPost(pid) {
    return new Promise(function (resolve, reject) {
        if (typeof pid === 'undefined' || pid === null) { reject(); return; }

        $.post({
            url: `https://${location.hostname}/admin/posts/${pid}/unprotect`,
            data: {
                'mod-actions': 'unprotect',
                'duration': 1,
                'fkey': fkey
            }
        })
            .done(resolve)
            .fail(reject);
    });
}


// Edit individual post to remove more than one @ symbols to be able to convert to comment without errors
function tryRemoveMultipleAtFromPost(pid) {
    return new Promise(function (resolve, reject) {
        if (typeof pid === 'undefined' || pid === null) { reject(); return; }

        $.get(`https://${location.hostname}/posts/${pid}/edit`)
            .done(function (data) {
                const editUrl = $('#post-form-' + pid, data).attr('action');
                let postText = $('#wmd-input-' + pid, data).val();

                const matches = postText.match(/[@]/g);
                if (matches === null || matches && matches.length <= 1) { resolve(); return; }

                postText = postText.replace(/ [@]([\w.-]+)\b/g, ' $1');
                console.log(editUrl, postText);

                $.post({
                    url: `https://${location.hostname}${editUrl}`,
                    data: {
                        'is-current': true,
                        'edit-comment': 'remove additional @ for converting to comment',
                        'post-text': postText,
                        'fkey': fkey
                    }
                })
                    .done(resolve)
                    .fail(reject);
            });
    });
}
// Convert to comment
function convertToComment(pid, targetId) {
    return new Promise(function (resolve, reject) {
        if (typeof pid === 'undefined' || pid === null) { reject(); return; }
        if (typeof targetId === 'undefined' || targetId === null) { reject(); return; }

        tryRemoveMultipleAtFromPost(pid).then(v => {
            $.post({
                url: `https://${location.hostname}/admin/posts/${pid}/convert-to-comment`,
                data: {
                    'mod-actions': 'convert-to-comment',
                    'duration': 1,
                    'target-post-id': targetId,
                    'fkey': fkey
                }
            })
                .done(resolve)
                .fail(reject);
        });
    });
}
// Convert to edit
function convertToEdit(pid, targetId) {
    return new Promise(function (resolve, reject) {
        if (typeof pid === 'undefined' || pid === null) { reject(); return; }
        if (typeof targetId === 'undefined' || targetId === null) { reject(); return; }

        $.post({
            url: `https://${location.hostname}/admin/posts/${pid}/convert-to-edit`,
            data: {
                'mod-actions': 'convert-to-edit',
                'duration': 1,
                'target-post-id': targetId,
                'fkey': fkey
            }
        })
            .done(resolve)
            .fail(reject);
    });
}


// Delete all comments on post
function deleteCommentsOnPost(pid) {
    return new Promise(function (resolve, reject) {
        if (typeof pid === 'undefined' || pid == null) { reject(); return; }

        $.post({
            url: `https://${location.hostname}/admin/posts/${pid}/delete-comments`,
            data: {
                'fkey': fkey,
                'mod-actions': 'delete-comments'
            }
        })
            .done(function (data) {
                $('#comments-' + pid).remove();
                $('#comments-link-' + pid).html('<b>Comments deleted.</b>');
                resolve();
            })
            .fail(reject);
    });
}


// Move all comments on post to chat
function moveCommentsOnPostToChat(pid) {
    return new Promise(function (resolve, reject) {
        if (typeof pid === 'undefined' || pid == null) { reject(); return; }

        $.post({
            url: `https://${location.hostname}/admin/posts/${pid}/move-comments-to-chat`,
            data: {
                'fkey': fkey,
                'deleteMovedComments': 'true'
            }
        })
            .done(function (data) {
                $('#comments-' + pid).remove();
                $('#comments-link-' + pid).html(`<span>${data.info}</span>`);
                resolve();
            })
            .fail(reject);
    });
}


// Undelete and re-delete post (prevent user from undeleting)
function modUndelDelete(pid) {
    return new Promise(function (resolve, reject) {
        if (typeof pid === 'undefined' || pid == null) { reject(); return; }

        undeletePost(pid).then(function () {
            deletePost(pid).then(resolve, reject);
        }, reject);
    });
}


// Spam/rude flag individual post
function flagPost(pid, rudeFlag) {
    return new Promise(function (resolve, reject) {
        if (typeof pid === 'undefined' || pid === null) { reject(); return; }

        const flagType = rudeFlag ? 'PostOffensive' : 'PostSpam';
        $.post({
            url: `https://${location.hostname}/flags/posts/${pid}/add/${flagType}`,
            data: {
                'otherText': null,
                'overrideWarning': true,
                'fkey': fkey
            }
        })
            .done(resolve)
            .fail(reject);
    });
}


function getUserDetails(uid) {
    return new Promise(function (resolve, reject) {
        if (typeof uid === 'undefined' || uid === null) { reject(); return; }

        $.post(`https://api.stackexchange.com/2.2/users/${uid}?order=desc&sort=reputation&site=${location.hostname.replace(/(\.stackexchange)?\.com$/, '')}&filter=!--1nZv)deGu1&key=lSrVEbQTXrJ4eb4c3NEMXQ((`)
            .done(function (data) {
                resolve(data);
            })
            .fail(reject);
    });
}


function getUserPii(uid) {
    return new Promise(function (resolve, reject) {
        if (typeof uid === 'undefined' || uid === null) { reject(); return; }

        $.post({
            url: `https://${location.hostname}/admin/all-pii`,
            data: {
                'id': uid,
                'fkey': fkey,
            }
        })
            .done(function (data) {
                const html = $(data).get();
                resolve({
                    email: html[1].children[1].innerText.trim(),
                    name: html[1].children[3].innerText.trim(),
                    ip: html[3].children[1].innerText.trim()
                });
            })
            .fail(reject);
    });
}


// Send mod message + optional suspension
function modMessage(uid, message = '', sendEmail = true, suspendDays = 0, templateName = 'something else...', suspendReason = 'for rule violations') {
    return new Promise(function (resolve, reject) {
        if (typeof uid === 'undefined' || uid === null) { reject(); return; }
        if (suspendDays < 0 || suspendDays > 365) { reject(); return; }

        // Message cannot be empty
        if (message == null || message.trim().length == 0) {
            alert('Mod message cannot be empty.'); reject(); return;
        }

        $.post({
            url: `https://${location.hostname}/users/message/save`,
            data: {
                'userId': uid,
                'lastMessageDate': 0,
                'email': sendEmail,
                'suspendUser': (suspendDays > 0),
                'suspend-choice': ((suspendDays > 0) ? suspendDays : 0),
                'suspendDays': suspendDays,
                'templateName': templateName,
                'suspendReason': suspendReason,
                'templateEdited': false,
                'post-text': message,
                'fkey': fkey,
                'author': null,
            }
        })
            .done(resolve)
            .fail(reject);
    });
}


const MODE_SUSPEND = 'suspend';
// Note: "delete" and "destroy" are used for both user-visible strings and URL-building.
const MODE_DELETE = 'delete';
const MODE_DESTROY = 'destroy';

// Suspend and optionally delete/destroy user
async function banUser(uid, mode, modMessageName, suspensionReason) {
    if (typeof uid === 'undefined' || uid === null) { throw new Error('null or undefined uid'); return; }

    // Action-specific strings
    let actionPastTense;
    let actionCapitalized;
    let actionGerund;

    // Other mode-specific config
    let removeUser;
    
    switch (mode) {
        case MODE_SUSPEND:
            removeUser = false;
            break;
        case MODE_DELETE:
            removeUser = true;
            actionGerund = 'deleting';
            actionCapitalized = "Delete";
            actionPastTense = 'deleted';
            break;
        case MODE_DESTROY:
            removeUser = true;
            actionGerund = 'destroying';
            actionCapitalized = "Destroy"
            actionPastTense = 'destroyed';
            break;
        default:
            throw new Error(`Invalid mode: ${mode}`);
    }

    // Get optional details if we're destroying the user
    let userRemovalDetails;
    if (removeUser) {
        // Prompt for additional details if userscript is not under spam attack mode
        if (underSpamAttackMode) {
            userRemovalDetails = '';
        } else {
            userRemovalDetails = prompt(`Additional details for ${actionGerund} user (if any). Cancel button terminates ${mode} action.`);
        }

        // If still null, reject promise and return early
        if (userRemovalDetails == null) {
            const errMsg = `${actionCapitalized} cancelled. User was not ${actionPastTense}.`;
            alert(errMsg);
            throw new Error(errMsg);
        }

        // If removing the user, use a long title to suppress the mod-inbox notification
        modMessageName += '                                                                                                        ';
    }

    // Apply max suspension
    await modMessage(uid,
        'Account removed for spamming and/or abusive behavior. You\'re no longer welcome to participate here.',
        false,
        365,
        modMessageName,
        suspensionReason
    );

    if (!removeUser) {
        return;
    }

    const v = await getUserPii(uid);

    const userDetails = `\n\nEmail:     ${v.email}\nReal Name: ${v.name}`;
    const destroyReasonDetails = userRemovalDetails.trim() + userDetails;

    // Delete/destroy user
    await $.post({
        url: `https://${location.hostname}/admin/users/${uid}/${mode}`,
        data: {
            'annotation': '',
            'mod-actions': mode,
            [`${mode}Reason`]: 'This user was created to post spam or nonsense and has no other positive participation',
            [`${mode}ReasonDetails`]: destroyReasonDetails,
            'fkey': fkey
        }
    });
}

function addPostCommentsModLinks() {

    $('div[id^="comments-link-"]').addClass('js-comments-menu');

    // Append link to post sidebar if it doesn't exist yet
    const allCommentMenus = $('.js-comments-menu');

    // Init those that are not processed yet
    allCommentMenus.not('.js-comments-menu-init').addClass('js-comments-menu-init').each(function () {

        const post = $(this).closest('.answer, .question');
        const pid = Number(post.attr('data-answerid') || post.attr('data-questionid')) || null;
        this.dataset.postId = pid;

        // If there are deleted comments, move from sidebar to bottom
        const delCommentsBtn = post.find('.js-fetch-deleted-comments');
        if (delCommentsBtn.length == 1) {
            const numDeletedComments = (delCommentsBtn.attr('title') || delCommentsBtn.attr('aria-label')).match(/\d+/)[0];
            $(this).append(`<span class="js-link-separator2">&nbsp;|&nbsp;</span> <a class="js-show-deleted-comments-link fc-red-600" title="expand to show all comments on this post (including deleted)" href="${delCommentsBtn.attr('href')}" role="button">load <b>${numDeletedComments}</b> deleted comment${numDeletedComments > 1 ? 's' : ''}</a>`);
            delCommentsBtn.hide();
        }

        // Add move to chat and purge links
        $(this).children('.mod-action-links').remove(); // in case added by another US
        $(this).append(`<div class="mod-action-links dno" style="float:right; padding-right:10px">
<a data-post-id="${pid}" class="js-move-comments-link fc-red-600" title="move all comments to chat + delete all">move to chat</a>
<a data-post-id="${pid}" class="js-purge-comments-link fc-red-600" title="delete all comments">purge all</a>
</div>`);

    });

    // Show move/purge links depending on comments
    allCommentMenus.each(function () {
        const hasComments = $(this).prev().find('.comment').length > 0;
        $(this).find('.mod-action-links').toggle(hasComments);
    });
}


function initPostCommentsModLinksEvents() {

    const d = $('body').not('.js-comments-menu-events').addClass('js-comments-menu-events');

    d.on('click', 'a.js-show-deleted-comments-link', function (e) {
        e.preventDefault();
        const post = $(this).closest('.answer, .question');
        post.find('.js-fetch-deleted-comments').click();
        $(this).prev('.js-link-separator2').addBack().remove();
    });

    d.on('click', 'a.js-move-comments-link', function (e) {
        e.preventDefault();
        const post = $(this).closest('.answer, .question');
        const pid = Number(this.dataset.postId) || null;
        $(this).remove();
        moveCommentsOnPostToChat(pid);
    });

    d.on('click', 'a.js-purge-comments-link', function (e) {
        e.preventDefault();
        const post = $(this).closest('.answer, .question');
        const pid = Number(this.dataset.postId) || null;
        deleteCommentsOnPost(pid);
    });
}


function appendInlinePostModMenus() {

    // Append link to post sidebar if it doesn't exist yet
    $('.js-post-menu').not('.preview-options').not('.js-init-better-inline-menu').addClass('js-init-better-inline-menu').each(function () {
        const post = $(this).closest('.question, .answer');
        const postScore = Number($(this).find('.js-vote-count').text());
        const postStatus = post.find('.js-post-notice, .special-status, .question-status').text().toLowerCase();
        const isQuestion = post.hasClass('question');
        const isDeleted = post.hasClass('deleted-answer');
        const isModDeleted = post.find('.deleted-answer-info').text().includes('♦') || (postStatus.includes('deleted') && postStatus.includes('♦'));
        const isClosed = postStatus.includes('closed') || postStatus.includes('on hold') || postStatus.includes('duplicate') || postStatus.includes('already has');
        const isProtected = post.find('.js-post-notice b').text().includes('Highly active question');
        const isMigrated = postStatus.includes('migrated to');
        const isLocked = isMigrated || postStatus.includes('locked');
        const isOldDupe = isQuestion && post.find('.js-post-body blockquote').first().find('strong').text().includes('Possible Duplicate');
        const needsRedupe = postStatus.match(/This question already has( an)? answers? here:(\s|\n|\r)+Closed/i) != null;
        const hasComments = post.find('.comment, .comments-link.js-show-link:not(.dno)').length > 0;
        const pid = post.attr('data-questionid') || post.attr('data-answerid');
        const userbox = post.find('.post-layout .user-info:last .user-action-time').filter((i, el) => el.innerText.includes('answered') || el.innerText.includes('asked')).parent();
        const userlink = userbox.find('a').attr('href');
        const userrep = userbox.find('.reputation-score').text();
        const username = userbox.find('.user-details a').first().text();
        const postdate = userbox.find('.relativetime').attr('title');
        const postage = (Date.now() - new Date(postdate)) / 86400000;

        // Wrap both post signatures into a single div, if it stacks due to lack of horizontal space, we can avoid having a large vertical space too due to the added post menu size (height)
        //$(this).closest('.grid').find('.post-signature').wrapAll('<div class="js-post-signatures"></div>');

        // Validation, since .js-post-menu is also found on post revisions page, which we do not want to touch
        if (typeof pid === 'undefined') return;

        // Create menu based on post type and state
        let menuitems = '';

        // Comment mod links are now added below the comments section
        //if(hasComments) { // when there are comments only?
        //    menuitems += '<span class="inline-label comments-label">comments: </span>';
        //    menuitems += `<a data-action="move-comments" class="inline-link ${isDeleted || !hasComments ? 'disabled' : ''}">move</a>`;
        //    menuitems += `<a data-action="purge-comments" class="inline-link ${!hasComments ? 'disabled' : ''}">purge</a>`;
        //    menuitems += '<div class="block-clear"></div>';
        //}

        if (isQuestion) { // Q-only
            menuitems += '<div class="block-clear"></div>';
            menuitems += '<span class="inline-label post-label">instant: </span>';

            if (isProtected) {
                menuitems += `<a data-action="unprotect" class="inline-link ${isDeleted ? 'disabled' : ''}" title="${isDeleted ? 'question is deleted!' : ''}">unprotect</a>`;
            }
            else {
                menuitems += `<a data-action="protect" class="inline-link ${isDeleted ? 'disabled' : ''}" title="${isDeleted ? 'question is deleted!' : ''}">protect</a>`;
            }

            if (isSO && !isClosed && !isDeleted) {
                menuitems += `<a data-action="close-offtopic" class="inline-link" title="close with default off-topic reason">close</a>`;
            }

            // Incorrectly posted question on SO Meta
            if (isSOMeta && !isDeleted) {
                menuitems += `<a data-action="meta-incorrect" class="inline-link">close + delete</a>`;
            }
            else {
                menuitems += `<a data-action="mod-delete" class="inline-link" title="redelete post as moderator to prevent undeletion">redelete</a>`;
            }
        }
        else { // A-only
            menuitems += '<span class="inline-label post-label">convert: </span>';
            menuitems += `<a data-action="convert-comment" class="inline-link" title="convert only the post to a comment on the question">to-comment</a>`;
            menuitems += `<a data-action="convert-edit" class="inline-link" title="append the post as an edit to the question">to-edit</a>`;

            menuitems += '<div class="block-clear"></div>';
            menuitems += '<span class="inline-label post-label">instant: </span>';
            menuitems += `<a data-action="mod-delete" class="inline-link" title="redelete post as moderator to prevent undeletion">redelete</a>`;
        }

        menuitems += '<div class="block-clear"></div>';
        menuitems += '<span class="inline-label lock-label">lock: </span>';
        if (!isLocked) { // unlocked-only
            menuitems += `<a data-action="lock-dispute" class="inline-link" title="prompts for number of days to dispute lock">dispute...</a>`;
            menuitems += `<a data-action="lock-comments" class="inline-link" title="prompts for number of days to comment lock">comments...</a>`;

            // Old good questions only
            if (isQuestion && postage >= 60 && postScore >= 20) {
                menuitems += `<a data-action="lock-historical" class="inline-link" title="historical perma-lock">historical</a>`;
            }
        }
        else { // locked-only
            menuitems += `<a data-action="unlock" class="inline-link">unlock</a>`;
        }

        // Need a user link for delete/destroy
        if (userlink && /.*\/\d+\/.*/.test(userlink)) {
            // Allow delete/destroy options only if < 60 days and not on Meta site
            if (!isMeta && (postage < 60 || isSuperuser)) {
                const uid = Number(userlink.match(/\/\d+\//)[0].replace(/\D+/g, ''));

                // Allow delete/destroy options only if user < 200 rep
                if (/^\d+$/.test(userrep) && Number(userrep) < 200) {
                    menuitems += '<div class="block-clear"></div>';
                    menuitems += '<span class="inline-label post-label">troll/sock: </span>';
                    menuitems += `<a data-action="suspend-delete" data-uid="${uid}" data-username="${username}" class="inline-link danger" title="delete post, suspend for 365 for rule violations,  and delete">delete...</a>`; // non-deleted user only
                    menuitems += `<a data-action="destroy-troll" data-uid="${uid}" data-username="${username}" class="inline-link danger" title="nuke post, suspend for 365 for rule violations, and destroy">destroy...</a>`; // non-deleted user only
                    menuitems += '<div class="block-clear"></div>';
                    menuitems += '<span class="inline-label post-label">spammer: </span>';
                    menuitems += `<a data-action="suspend-spammer" data-uid="${uid}" data-username="${username}" class="inline-link danger" title="nuke post, suspend for 365 for promotional content">suspend...</a>`; // non-deleted user only
                    menuitems += `<a data-action="destroy-spammer" data-uid="${uid}" data-username="${username}" class="inline-link danger" title="nuke post, suspend for 365 for promotional content, and destroy">destroy...</a>`; // non-deleted user only
                }
            }
        }

        $(this).append(`<div class="block-clear"></div><div class="js-better-inline-menu smaller" data-pid="${pid}">${menuitems}</div>`);
    });
}


function initPostModMenuLinkActions() {

    // Handle mod actions menu link click
    // have to use tag "main" for mobile web doesn't contain wrapping elem "#content"
    $('#content, main').on('click', '.js-better-inline-menu a[data-action]', function () {

        if ($(this).hasClass('disabled') || $(this).hasClass('dno')) return false;

        // Get question link if in mod queue
        const qlink = $(this).closest('.js-flagged-post').find('.js-body-loader a').first().attr('href');
        const reviewlink = $('.question-hyperlink').attr('href');

        const menuEl = this.parentNode;
        const pid = Number(menuEl.dataset.postId || menuEl.dataset.pid);
        const qid = Number($('#question').attr('data-questionid') || getPostId(qlink) || getPostId(reviewlink)) || null;
        const uid = Number(this.dataset.uid);
        const uName = this.dataset.username;
        //console.log(pid, qid);
        if (isNaN(pid) || isNaN(qid)) return false;

        const post = $(this).closest('.answer, .question');
        const isQuestion = post.hasClass('question');
        const isDeleted = post.hasClass('deleted-answer');
        const action = this.dataset.action;
        console.log(action);

        function removePostFromModQueue() {
            if (location.pathname.includes('/admin/dashboard')) {
                post.parents('.js-flagged-post').remove();
            }
        }

        function flagPostAndBanUser(prompt, rudeFlag, destroyUser, modMessageName, suspensionReason) {
            if (
                confirm(`${prompt} "${uName}" (id: ${uid})???`) &&
                (underSpamAttackMode ||
                    !destroyUser ||
                    confirm(`Are you VERY SURE you want to DESTROY the account "${uName}"???`))
            ) {
                flagPost(pid, rudeFlag);
                banUser(
                    uid,
                    destroyUser ? MODE_DESTROY : MODE_SUSPEND,
                    modMessageName,
                    suspensionReason
                ).then(function () {
                    debugger;
                    if (!isSuperuser && !underSpamAttackMode) window.open(`https://${location.hostname}/users/${uid}`);
                    removePostFromModQueue();
                    reloadPage();
                });
            }
        }

        switch (action) {
            case 'move-comments':
                if (confirm('Really move comments to chat?')) {
                    moveCommentsOnPostToChat(pid).then(function (v) {
                        post.find('.comments-list').html('');
                        post.find('.comments-link').prev().addBack().remove();
                        removePostFromModQueue();
                        reloadPage();
                    });
                }
                break;
            case 'purge-comments':
                deleteCommentsOnPost(pid).then(function (v) {
                    post.find('.comments-list').html('');
                    post.find('.comments-link').prev().addBack().remove();
                    removePostFromModQueue();
                    reloadPage();
                });
                break;
            case 'convert-comment':
                undeletePost(pid).then(function () {
                    convertToComment(pid, qid).then(function () {
                        removePostFromModQueue();
                        reloadPage();
                    });
                });
                break;
            case 'convert-edit':
                undeletePost(pid).then(function () {
                    convertToEdit(pid, qid).then(function () {
                        removePostFromModQueue();
                        goToPost(qid);
                    });
                });
                break;
            case 'protect': {
                protectPost(pid).finally(reloadPage);
            }
                break;
            case 'unprotect': {
                unprotectPost(pid).finally(reloadPage);
            }
                break;
            case 'meta-incorrect':
                closeSOMetaQuestionAsOfftopic(pid).then(function () {
                    deletePost(pid).finally(reloadPage);
                });
                break;
            case 'close-offtopic':
                closeQuestionAsOfftopic(pid).then(function () {
                    removePostFromModQueue();
                    goToPost(qid);
                });
                break;
            case 'mod-delete':
                modUndelDelete(pid).then(reloadPage);
                break;
            case 'lock-dispute': {
                let d = Number(prompt('Lock for how many days?', '3').trim());
                if (!isNaN(d)) lockPost(pid, 20, 24 * d).then(reloadPage);
                else StackExchange.helpers.showErrorMessage(menuEl.parentNode, 'Invalid number of days');
                break;
            }
            case 'lock-comments': {
                let d = Number(prompt('Lock for how many days?', '1').trim());
                if (!isNaN(d)) lockPost(pid, 21, 24 * d).then(reloadPage);
                else StackExchange.helpers.showErrorMessage(menuEl.parentNode, 'Invalid number of days');
                break;
            }
            case 'lock-historical':
                if (confirm(`Confirm apply a permanent historical lock on this question and answers?`)) {
                    lockPost(pid, 22, -1).then(reloadPage);
                }
                break;
            case 'unlock':
                unlockPost(pid).then(reloadPage);
                break;
            case 'suspend-delete':
                if (confirm(`Suspend for 365, and DELETE the user "${uName}" (id: ${uid})???`) &&
                    (underSpamAttackMode || confirm(`Are you VERY SURE you want to DELETE the account "${uName}"???`))) {
                    deletePost(pid);
                    banUser(uid, MODE_DELETE, 'no longer welcome', 'for rule violations').then(function () {
                        if (!isSuperuser && !underSpamAttackMode) window.open(`https://${location.hostname}/users/${uid}`);
                        removePostFromModQueue();
                        reloadPage();
                    });
                }
                break;
            case 'suspend-spammer':
                flagPostAndBanUser(
                    'Spam-nuke the post and SUSPEND for 365',
                    /* rudeFlag */ false,
                    /* alsoDestroy */ false,
                    /* modMessageName */ 'suspend spammer',
                    /* suspensionReason */ 'for promotional content'
                );
                break;
            case 'destroy-spammer':
                flagPostAndBanUser(
                    'Spam-nuke the post, suspend for 365, and DESTROY the spammer',
                    /* rudeFlag */ false,
                    /* alsoDestroy */ true,
                    /* modMessageName */ 'destroy spammer',
                    /* suspensionReason */ 'for promotional content'
                );
                break;
            case 'destroy-troll':
                flagPostAndBanUser(
                    'R/A-nuke the post, suspend for 365, and DESTROY the troll',
                    /* rudeFlag */ true,
                    /* alsoDestroy */ true,
                    /* modMessageName */ 'destroy troll',
                    /* suspensionReason */ 'for rule violations'
                );
                break;
            default:
                return true;
        }

        return false;
    });
}

function doPageLoad() {

    // Election page - allow loading of comments under nominations
    if (document.body.classList.contains('election-page')) {

        const posts = $('#mainbar').find('.candidate-row');

        posts.each(function () {
            const pid = this.id.match(/\d+$/)[0];
            const cmmts = $(this).find('.js-comments-container');
            const cmmtlinks = $(this).find('[id^="comments-link-"]');
            cmmtlinks.append(`<span class="js-link-separator">|&nbsp;</span><a class="s-link__danger comments-link js-load-deleted-comments-link" data-pid="${pid}">show deleted comments</a>`);
        });

        $('.js-load-deleted-comments-link').on('click', function () {
            const pid = this.dataset.pid;
            const elems = $(this).prevAll('.comments-link, .js-link-separator').addBack().not('.js-add-link');
            const commentsUrl = `/posts/${pid}/comments?includeDeleted=true&_=${Date.now()}`;
            $('#comments-' + pid).show().children('ul.comments-list').load(commentsUrl, function () {
                //elems.remove();
            });
        });

        // Stop rest of script
        return false;
    }

    // Once on page load
    initPostCommentsModLinksEvents();
    addPostCommentsModLinks();

    initPostModMenuLinkActions();
    appendInlinePostModMenus();

    // After requests have completed
    $(document).ajaxStop(function () {
        addPostCommentsModLinks();
        appendInlinePostModMenus();
    });
}


// On page load
doPageLoad();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
/* Better post menu links */
.js-post-menu .lsep {
    display: none;
}
.js-post-menu > a,
.js-post-menu > button {
    font-size: 0.95em;
    padding: 2px 0px;
    margin-right: 5px;
}

.post-signature {
    min-width: 180px;
    width: auto;
}
.block-clear {
    display: block !important;
}

.js-better-inline-menu {
    display: block;
    clear: both;
    float: left;
    min-width: 200px;
    margin: 5px 0 10px;
    padding-top: 5px;
    border-top: 1px solid var(--black-075);
}
.js-better-inline-menu.smaller {
    margin: 5px 0 5px;
    padding: 8px 6px 8px;
    font-size: 0.88em;
    line-height: 1;
}

.js-better-inline-menu .inline-label {
    display: inline-block;
    padding: 3px 4px;
    color: var(--black-700);
}
.js-better-inline-menu a {
    margin: 2px 2px;
    padding: 0px 2px;
    display: block;
    color: var(--black-400);
    text-decoration: none;
}
.js-better-inline-menu a.dno {
    display: none;
}
.js-better-inline-menu a:hover {
    color: var(--black-700);
}
.js-better-inline-menu a.inline-link {
    display: inline-block;
}
.js-better-inline-menu a.disabled {
    display: none;
    background-color: var(--black-050) !important;
    color: var(--black-200) !important;
    cursor: not-allowed;
}
.js-better-inline-menu a.danger:hover {
    background-color: var(--red-500);
    color: var(--white);
}
.js-better-inline-menu .separator {
    display: block;
    border-top: 1px solid var(--black-075);
    margin: 5px 0;
}


/* Comments form and links */
.js-comment-form-layout > div:nth-child(2),
.js-comments-menu {
    display: block !important;
}
.js-comment-form-layout > div:nth-child(2) br {
    display: none;
}
.js-edit-comment-cancel {
    display: block;
    margin-bottom: 5px;
}
.js-show-deleted-comments-link,
.js-move-comments-link,
.js-purge-comments-link {
    padding: 0 3px 2px 3px;
    text-decoration: none;
}
.comment-help {
    max-width: none;
}
`;
document.body.appendChild(styles);