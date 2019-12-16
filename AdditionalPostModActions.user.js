// ==UserScript==
// @name         Additional Post Mod Actions
// @description  Adds a menu with mod-only quick actions in post sidebar
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.1.1
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


    const newlines = '\n\n';
    const fkey = StackExchange.options.user.fkey;
    const getQueryParam = key => new URLSearchParams(window.location.search).get(key);
    const isSO = location.hostname == 'stackoverflow.com';
    const isSOMeta = location.hostname == 'meta.stackoverflow.com';
    const isMeta = typeof StackExchange.options.site.parentUrl !== 'undefined';

    // Manually switch this variable to true when site under spam attack so you can delete accounts as fast as possible without distractions and multiple confirmations
    const underSpamAttackMode = false;


    function goToPost(pid) {
        if(typeof pid === 'undefined' || pid === null) { return; }

        // If in mod queues, open in new tab/window
        if(location.pathname.includes('/admin/dashboard')) {
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
        if(location.pathname.includes('/admin/dashboard')) return false;
        location.reload(true);
    }
    function reloadWhenDone() {

        // Triggers when all ajax requests have completed
        $(document).ajaxStop(function() {

            // Stop subsequent calls
            $(this).off("ajaxStop");

            reloadPage();
        });
    }


    // Close individual post
    // closeReasonId: 'TooBroad', 'OffTopic', 'Unclear', 'OpinionBased', 'Duplicate'
    // if closeReasonId is 'OffTopic', offtopicReasonId : 11-norepro, 13-nomcve, 16-toolrec, 3-custom
    function closeQuestionAsOfftopic(pid, closeReasonId = 'OffTopic', offtopicReasonId = 3, offTopicOtherText = '', duplicateOfQuestionId = null) {
        return new Promise(function(resolve, reject) {
            if(!isSO) { reject(); return; }
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }
            if(typeof closeReasonId === 'undefined' || closeReasonId === null) { reject(); return; }
            if(closeReasonId === 'OffTopic' && (typeof offtopicReasonId === 'undefined' || offtopicReasonId === null)) { reject(); return; }

            if(closeReasonId === 'Duplicate') offtopicReasonId = null;

            $.post({
                url: `https://${location.hostname}/flags/questions/${pid}/close/add`,
                data: {
                    'fkey': fkey,
                    'closeReasonId': closeReasonId,
                    'closeAsOffTopicReasonId': offtopicReasonId,
                    'duplicateOfQuestionId': duplicateOfQuestionId,
                    'offTopicOtherText': offtopicReasonId == 3 && isSO ? 'This question does not appear to be about programming within the scope defined in the [help]' : offTopicOtherText,
                    //'offTopicOtherCommentId': '',
                    'originalOffTopicOtherText': 'I\'m voting to close this question as off-topic because ',
                }
            })
            .done(resolve)
            .fail(reject);
        });
    }
    function closeQuestionAsDuplicate(pid, targetPid) {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }
            if(typeof targetPid === 'undefined' || targetPid === null) { reject(); return; }
            closeQuestionAsOfftopic(pid, 'Duplicate', null, 'I\'m voting to close this question as off-topic because ', targetPid)
               .then(resolve)
               .catch(reject);
        });
    }
    function closeSOMetaQuestionAsOfftopic(pid, closeReason = 'OffTopic', offtopicReasonId = 6) {
        return new Promise(function(resolve, reject) {
            if(!isSOMeta) { reject(); return; }
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }
            if(typeof closeReason === 'undefined' || closeReason === null) { reject(); return; }
            if(closeReason === 'OffTopic' && (typeof offtopicReasonId === 'undefined' || offtopicReasonId === null)) { reject(); return; }

            $.post({
                url: `https://${location.hostname}/flags/questions/${pid}/close/add`,
                data: {
                    'fkey': fkey,
                    'closeReasonId': closeReason,
                    'closeAsOffTopicReasonId': offtopicReasonId
                }
            })
            .done(resolve)
            .fail(reject);
        });
    }
    // Reopen individual post
    function reopenQuestion(pid) {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }

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
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }

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
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }

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
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }
            if(typeof type === 'undefined' || type === null) { reject(); return; }

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
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }

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
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }

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
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }

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


    // Convert to comment
    function convertToComment(pid, targetId) {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }
            if(typeof targetId === 'undefined' || targetId === null) { reject(); return; }

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
    }
    // Convert to edit
    function convertToEdit(pid, targetId) {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }
            if(typeof targetId === 'undefined' || targetId === null) { reject(); return; }

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
                $('#comments-' + pid).remove();
                $('#comments-link-' + pid).html('<b>Comments deleted.</b>');
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
                    'deleteMovedComments': 'true'
                }
            })
            .done(function(data) {
                $('#comments-' + pid).remove();
                $('#comments-link-' + pid).html(`<span>${data.info}</span>`);
                resolve();
            })
            .fail(reject);
        });
    }


    // Undelete and re-delete post (prevent user from undeleting)
    function modUndelDelete(pid) {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid == null) { reject(); return; }

            undeletePost(pid).then(function() {
                deletePost(pid).then(resolve, reject);
            }, reject);
        });
    }


    // Destroy spammer
    function destroySpammer(uid, destroyDetails = null) {
        return new Promise(function(resolve, reject) {
            if(typeof uid === 'undefined' || uid === null) { reject(); return; }

            // If details is null or whitespace, get optional details
            if(destroyDetails == null || destroyDetails.trim().length == 0) {

                // Prompt for additional details if userscript is not under spam attack mode
                if(underSpamAttackMode) destroyDetails = '';
                else destroyDetails = prompt('Additional details for destroying user (if any). Cancel button terminates destroy action.');

                // If still null, reject promise and return early
                if(destroyDetails == null) { alert('Destroy cancelled. User was not destroyed.'); reject(); return; }
            }

            $.post({
                url: `https://${location.hostname}/admin/users/${uid}/destroy`,
                data: {
                    'annotation': '',
                    'deleteReasonDetails': '',
                    'mod-actions': 'destroy',
                    'destroyReason': 'This user was created to post spam or nonsense and has no other positive participation',
                    'destroyReasonDetails': destroyDetails.trim(),
                    'fkey': fkey
                }
            })
            .done(resolve)
            .fail(reject);
        });
    }


    function updateModTemplates() {

        const template = $('.popup input[name=mod-template]').filter((i,el) => $(el).next().text().includes('post disassociation'));
        const pids = getQueryParam('pid').split('|');
        let addstr = '';

        // Build list of posts
        pids.forEach(function(v) {
            addstr += `https://${location.hostname}/a/${v}` + newlines;
        });

        // Insert to template
        template.val(
            template.val()
            .replace(/:\n/, ':<br>') // remove newline after :
            .replace(/{todo}/, addstr) // replace todo with additional information
        ).click();

        $('.popup-submit').click();

        // Failsafe
        $('#templateName').val('post disassociation');
    }


    function initPostDissociationHelper() {

        // Only on main sites
        if(isMeta) return;

        // If on contact CM page and action = dissocciate
        if(location.pathname.includes('/admin/cm-message/create/') && getQueryParam('action') == 'dissociate') {

            // On any page update
            $(document).ajaxComplete(function(event, xhr, settings) {

                // If CM templates loaded on contact CM page, and action = dissocciate, update templates
                if(settings.url.includes('/admin/contact-cm/template-popup/')) {

                    // Run once only. Unbind ajaxComplete event
                    $(event.currentTarget).unbind('ajaxComplete');

                    // Update CM mod templates
                    setTimeout(updateModTemplates, 500);
                }
            });

            // click template link
            $('#show-templates').click();

            return;
        }

        // If on mod flag queues, remove close question and convert to comment buttons when flag message contains "di(sa)?ssociate", and add "dissociate" button
        if(location.pathname.includes('/admin/dashboard')) {
            const dissocFlags = $('.revision-comment.active-flag').filter((i,v) => v.innerText.match(/di(sa)?ssociate/));
            const dissocPosts = dissocFlags.closest('.js-flagged-post');
            dissocPosts.each(function() {
                const post = $(this);
                const userlink = post.find('.mod-audit-user-info a').attr('href');

                // User not found, prob already deleted
                if(userlink == null) return;

                const uid = Number(userlink.match(/\/(\d+)\//)[0].replace(/\//g, ''));
                const pid = post.attr('data-post-id') || post.attr('data-questionid') || post.attr('data-answerid');
                $('.js-post-flag-options', this).prepend(`<a href="https://${location.hostname}/admin/cm-message/create/${uid}?action=dissociate&pid=${pid}" class="btn" target="_blank">dissociate</a>`);

                $('.close-question-button, .js-convert-to-comment', this).hide();
            });
            return;
        }
    }


    function appendPostModMenus() {

        // Add post issues container in mod flag queues, as expanded posts do not have this functionality
        $('.js-flagged-post .votecell .vote').filter(function() {
            return $(this).children('.js-post-issues').length == 0;
        }).each(function() {
            const post = $(this).closest('.answer, .question');
            const pid = post.attr('data-questionid') || post.attr('data-answerid') || post.attr('data-post-id');
            $(this).append(`
<div class="js-post-issues grid fd-column ai-stretch gs4 mt16">
  <a class="grid--item s-btn s-btn__muted" href="/posts/${pid}/timeline" data-shortcut="T" title="Timeline" target="_blank">
    <svg aria-hidden="true" class="svg-icon mln1 mr0 iconHistory" width="19" height="18" viewBox="0 0 19 18">
      <path d="M3 9a8 8 0 1 1 3.73 6.77L8.2 14.3A6 6 0 1 0 5 9l3.01-.01-4 4-4-4h3zm7-4h1.01L11 9.36l3.22 2.1-.6.93L10 10V5z"></path>
  </svg></a>
</div>
`);
        });

        // Append link to post sidebar if it doesn't exist yet
        $('.js-voting-container').not('.js-post-mod-menu').addClass('js-post-mod-menu').each(function() {
            const post = $(this).closest('.question, .answer');
            const postStatus = post.find('.js-post-notice, .special-status, .question-status').text().toLowerCase();
            const isQuestion = post.hasClass('question');
            const isDeleted = post.hasClass('deleted-answer');
            const isModDeleted = post.find('.deleted-answer-info').text().includes('♦') || (postStatus.includes('deleted') && postStatus.includes('♦'));
            const isClosed = postStatus.includes('closed') || postStatus.includes('on hold') || postStatus.includes('duplicate') || postStatus.includes('already has');
            const isMigrated = postStatus.includes('migrated');
            const isLocked = isMigrated || postStatus.includes('locked');
            const isOldDupe = isQuestion && post.find('.post-text blockquote').first().find('strong').text().includes('Possible Duplicate');
            const hasComments = post.find('.comment, .comments-link.js-show-link:not(.dno)').length > 0;
            const pid = post.attr('data-questionid') || post.attr('data-answerid');
            const userbox = post.find('.post-layout .user-info:last .user-action-time').filter((i, el) => el.innerText.includes('answered') || el.innerText.includes('asked')).parent();
            const userlink = userbox.find('a').attr('href');
            const userrep = userbox.find('.reputation-score').text();
            const username = userbox.find('.user-details a').first().text();
            const postdate = userbox.find('.relativetime').attr('title');
            const postage = (Date.now() - new Date(postdate)) / 86400000;

            // Create menu based on post type and state
            let menuitems = '';

            if(isSO && isOldDupe) { // Q-only
                const oldDupePid = isOldDupe ? post.find('.post-text > blockquote:first a').attr('href').match(/\/\d+\//)[0].replace(/\D/g, '') : null;

                menuitems += `<a data-action="old-redupe" data-redupe-pid="${oldDupePid}">close as proper duplicate</a>`;
                menuitems += `<div class="separator"></div>`;
            }

            menuitems += `<a data-action="move-comments" class="${isDeleted || !hasComments ? 'disabled' : ''}" title="${hasComments ? '' : 'no comments to move!'}">move comments to chat</a>`; // when there are comments only?
            menuitems += `<a data-action="purge-comments" class="${!hasComments ? 'disabled' : ''}" title="${hasComments ? '' : 'no comments to purge!'}">purge comments</a>`; // when there are comments only?

            if(!isQuestion) { // A-only
                menuitems += `<a data-action="convert-comment" title="convert only the post to a comment on the question">convert post to comment</a>`;
                menuitems += `<a data-action="convert-edit" title="append the post as an edit to the question">convert post to edit</a>`;
            }
            else { // Q-only
                menuitems += `<a data-action="toggle-protect" class="${isDeleted ? 'disabled' : ''}" title="${isDeleted ? 'question is deleted!' : ''}">toggle protect</a>`;
            }

            if(isSO && isQuestion && !isClosed && !isDeleted) {
                menuitems += `<a data-action="close-offtopic" title="close with default off-topic reason">close (offtopic)</a>`;
            }

            menuitems += `<div class="separator"></div>`;

            // Incorrectly posted question on SO Meta
            if(isSOMeta && isQuestion && !isDeleted) {
                menuitems += `<a data-action="meta-incorrect">close + delete (incorrectly posted)</a>`;
            }
            else {
                menuitems += `<a data-action="mod-delete" title="redelete post as moderator to prevent undeletion">mod-delete post</a>`;
            }

            menuitems += `<a data-action="lock-dispute" class="${isLocked ? 'dno' : ''}" title="prompts for number of days to dispute lock">lock - dispute (custom days)</a>`; // unlocked-only
            menuitems += `<a data-action="lock-comments" class="${isLocked ? 'dno' : ''}" title="prompts for number of days to comment lock">lock - comments (custom days)</a>`; // unlocked-only

            if(isQuestion) { // Q-only
                // menuitems += `<a data-action="lock-historical" class="${isLocked ? 'dno' : ''}">lock - historical (perm)</a>`; // unlocked-only
            }

            menuitems += `<a data-action="unlock" class="${!isLocked || isMigrated ? 'dno' : ''}">unlock</a>`; // L-only

            // CM message and destroy options won't work on Meta
            if(userlink && /.*\/\d+\/.*/.test(userlink) && !isMeta) {
                const uid = Number(userlink.match(/\/\d+\//)[0].replace(/\D+/g, ''));

                menuitems += `<div class="separator"></div>`;
                menuitems += `<a href="https://${location.hostname}/admin/cm-message/create/${uid}?action=dissociate&pid=${pid}" target="_blank" title="compose CM dissociation message in a new window">request dissociation</a>`; // non-deleted user only

                // Allow destroy option only if < 30 days
                if(postage < 30) {

                    // Allow destroy option only if user < 200 rep
                    if(/^\d+$/.test(userrep) && Number(userrep) < 200) {
                        menuitems += `<a data-action="destroy-spammer" data-uid="${uid}" data-username="${username}" class="danger" title="confirms whether you want to destroy the account">DESTROY spammer (confirm)</a>`; // non-deleted user only
                    }
                    // Display disabled destroy menu item with description
                    else {
                        menuitems += `<a class="danger disabled" title="user rep too high to use this option">DESTROY spammer</a>`; // non-deleted user only
                    }
                }
            }

            $(this).append(`
<div class="js-post-issue grid--cell s-btn s-btn__unset ta-center py8 post-mod-menu-link" data-shortcut="O" title="Other mod actions">
  <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 512" class="svg-icon mln1 mr0"><path fill="currentColor"
       d="M64 208c26.5 0 48 21.5 48 48s-21.5 48-48 48-48-21.5-48-48 21.5-48 48-48zM16 104c0 26.5 21.5 48 48 48s48-21.5 48-48-21.5-48-48-48-48 21.5-48 48zm0 304c0 26.5 21.5 48 48 48s48-21.5 48-48-21.5-48-48-48-48 21.5-48 48z"></path>
  </svg>
  <div class="post-mod-menu" title="" data-pid="${pid}" role="dialog">
    <div class="post-mod-menu-header">Post mod actions:</div>
    ${menuitems}
  </div>
</a>`);
        });
    }


    function initPostModMenuLinkActions() {

        // Handle mod actions menu link click
        $('#content').on('click', '.post-mod-menu a', function() {

            if($(this).hasClass('disabled')) return false;

            // Get question link if in mod queue
            const qlink = $(this).closest('.js-flagged-post').find('.js-body-loader a').first().attr('href');
            const reviewlink = $('.question-hyperlink').attr('href');

            const menuEl = this.parentNode;
            const pid = Number(menuEl.dataset.postId || menuEl.dataset.pid);
            const qid = Number($('#question').attr('data-questionid') || getPostId(qlink) || getPostId(reviewlink)) || null;
            const redupePid = Number(this.dataset.redupePid);
            const uid = Number(this.dataset.uid);
            const uName = this.dataset.username;
            //console.log(pid, qid);
            if(isNaN(pid) || isNaN(qid)) return false;

            const post = $(this).closest('.answer, .question');
            const isQuestion = post.hasClass('question');
            const isDeleted = post.hasClass('deleted-answer');
            const action = this.dataset.action;
            console.log(action);

            function removePostFromModQueue() {
                if(location.pathname.includes('/admin/dashboard')) {
                    post.parents('.js-flagged-post').remove();
                }
            }

            switch(action) {
                case 'old-redupe':
                    console.log();
                    reopenQuestion(pid).then(function(v) {
                        closeQuestionAsDuplicate(pid, redupePid).finally(reloadPage);
                    });
                    break;
                case 'move-comments':
                    if(confirm('Really move comments to chat?')) {
                        moveCommentsOnPostToChat(pid).then(function(v) {
                            post.find('.comments-list').html('');
                            post.find('.comments-link').prev().addBack().remove();
                            removePostFromModQueue();
                            reloadPage();
                        });
                    }
                    break;
                case 'purge-comments':
                    deleteCommentsOnPost(pid).then(function(v) {
                        post.find('.comments-list').html('');
                        post.find('.comments-link').prev().addBack().remove();
                        removePostFromModQueue();
                        reloadPage();
                    });
                    break;
                case 'convert-comment':
                    undeletePost(pid).then(function() {
                        convertToComment(pid, qid).then(function() {
                            removePostFromModQueue();
                            reloadPage();
                        });
                    });
                    break;
                case 'convert-edit':
                    undeletePost(pid).then(function() {
                        convertToEdit(pid, qid).then(function() {
                            removePostFromModQueue();
                            goToPost(qid);
                        });
                    });
                    break;
                case 'toggle-protect': {
                        if(post.find('.question-status b').text().includes('protect')) unprotectPost(pid).finally(reloadPage);
                        else protectPost(pid).finally(reloadPage);
                    }
                    break;
                case 'meta-incorrect':
                    closeSOMetaQuestionAsOfftopic(pid).then(function() {
                        deletePost(pid).finally(reloadPage);
                    });
                    break;
                case 'close-offtopic':
                    closeQuestionAsOfftopic(pid).then(function() {
                        removePostFromModQueue();
                        goToPost(qid);
                    });
                    break;
                case 'mod-delete':
                    modUndelDelete(pid).then(reloadPage);
                    break;
                case 'lock-dispute': {
                    let d = Number(prompt('Lock for how many days?', '3').trim());
                    if(!isNaN(d)) lockPost(pid, 20, 24 * d).then(reloadPage);
                    else StackExchange.helpers.showErrorMessage(menuEl.parentNode, 'Invalid number of days');
                    break;
                }
                case 'lock-comments': {
                    let d = Number(prompt('Lock for how many days?', '1').trim());
                    if(!isNaN(d)) lockPost(pid, 21, 24 * d).then(reloadPage);
                    else StackExchange.helpers.showErrorMessage(menuEl.parentNode, 'Invalid number of days');
                    break;
                }
                case 'lock-historical':
                    lockPost(pid, 22, -1).then(reloadPage);
                    break;
                case 'unlock':
                    unlockPost(pid).then(reloadPage);
                    break;
                case 'destroy-spammer':
                    if(confirm(`Confirm DESTROY the spammer "${uName}" (id: ${uid}) irreversibly???`) &&
                       (underSpamAttackMode || confirm(`Are you VERY SURE you want to DESTROY the account "${uName}"???`))) {
                        destroySpammer(uid).then(function() {
                            if(!underSpamAttackMode) window.open(`https://${location.hostname}/users/${uid}`);
                            removePostFromModQueue();
                            if(!underSpamAttackMode) reloadPage();
                        });
                    }
                    break;
                default:
                    return true;
            }

            return false;
        });

        // Once on page load
        appendPostModMenus();
    }


    function doPageload() {

        // Election page - allow loading of comments under nominations
        if(document.body.classList.contains('election-page')) {

            const posts = $('#mainbar table').find('div[id^="post-"]');

            posts.each(function() {
                const pid = this.id.match(/\d+$/)[0];
                const cmmts = $(this).find('.js-comments-container');
                const cmmtlinks = $(this).find('[id^="comments-link-"]');
                cmmtlinks.append(`<span class="js-link-separator">|&nbsp;</span><a class="s-link__danger comments-link js-load-deleted-comments-link" data-pid="${pid}">show deleted comments</a>`);
            });

            $('.js-load-deleted-comments-link').click(function() {
                const pid = this.dataset.pid;
                const elems = $(this).prevAll('.comments-link, .js-link-separator').addBack().not('.js-add-link');
                const commentsUrl = `/posts/${pid}/comments?includeDeleted=true&_=${Date.now()}`;
                $('#comments-' + pid).children('ul.comments-list').load(commentsUrl, function() {
                    elems.remove();
                });
            });

            // Stop rest of script
            return false;
        }

        // If spam mode is switched on
        if(underSpamAttackMode) {
            document.body.classList.add('js-spam-mode');

            // If filtered to spamoffensive in mod dashboard, expand all flagged posts
            if(location.search.includes('flags=spamoffensive')) {
                setTimeout(function() {
                    $('.js-expand-body:visible').click();
                }, 1000); // short wait for dashboard scripts to init
            }
        }

        initPostModMenuLinkActions();
        initPostDissociationHelper();

        // After requests have completed
        $(document).ajaxStop(function() {
            appendPostModMenus();
        });
    }


    function appendStyles() {

        const styles = `
<style>
/* Disable transitions so z-index will work instantly */
.downvoted-answer .comment-body,
.downvoted-answer .post-signature,
.downvoted-answer .post-text,
.downvoted-answer .vote > * {
    transition: unset;
}

.post-mod-menu-link {
    position: relative;
    display: inline-block;
    color: inherit;
    cursor: pointer;
}
.post-mod-menu-link svg {
    max-width: 19px;
    max-height: 18px;
}
.post-mod-menu-link:hover .post-mod-menu,
.post-mod-menu-link .post-mod-menu:hover {
    display: block;
}
.post-mod-menu-link:hover svg {
    visibility: hidden;
}
.post-mod-menu-link .post-mod-menu {
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    padding: 0 0 6px;
    z-index: 3;
    cursor: auto;

    background: white;
    border-radius: 2px;
    border: 1px solid transparent;
    box-shadow: 0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12), 0 5px 5px -3px rgba(0,0,0,0.2);

    text-align: left;
    font-size: 0.923rem;
    font-family: Roboto,RobotoDraft,Helvetica,Arial,sans-serif;
    letter-spacing: .2px;
    line-height: 20px;

    user-select: none;
    white-space: nowrap;
}
.post-mod-menu-header {
    display: block;
    margin-bottom: 5px;
    padding: 8px 0;
    padding-left: 26px;
    padding-right: 48px;
    background-color: #fbf2d4;
    border-bottom: 1px solid #f1e5bc;
    color: black;
    font-weight: bold;
}
.post-mod-menu a {
    display: block;
    min-width: 120px;
    padding: 5px 0;
    padding-left: 26px;
    padding-right: 48px;
    cursor: pointer;
    color: #202124;
}
.post-mod-menu a.dno {
    display: none;
}
.post-mod-menu a:hover {
    background-color: #e6e6e6;
}
.post-mod-menu a.disabled {
    background-color: #f6f6f6 !important;
    color: #bbb !important;
    cursor: not-allowed;
}
.post-mod-menu a.danger:hover {
    background-color: red;
    color: white;
}
.post-mod-menu .separator {
    display: block;
    border-top: 1px solid #ddd;
    margin: 5px 0;
}

/* Additional things for mod dashboard */
.js-loaded-body,
.js-loaded-body.overflow-x-auto {
    overflow: initial !important;
}

/* Hide question summary if in spam mode */
body.js-spam-mode .post-layout.expandable-question-summary {
    display: none !important;
}
body.js-spam-mode .visited-post {
    opacity: 1 !important;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();

})();
