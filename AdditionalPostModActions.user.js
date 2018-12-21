// ==UserScript==
// @name         Additional Post Mod Actions
// @description  Adds a menu with mod-only quick actions in post sidebar
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.3
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
    // closeReason: 'TooBroad', 'OffTopic', 'Unclear', 'OpinionBased',
    // if 'OffTopic', offtopicReasonId : 11-norepro, 13-nomcve, 16-toolrec, 3-custom
    function closeQuestionAsOfftopic(pid, closeReason = 'OffTopic', offtopicReasonId = 3, offTopicOtherText = '') {
        return new Promise(function(resolve, reject) {
            if(!isSO) { reject(); return; }
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }
            if(typeof closeReason === 'undefined' || closeReason === null) { reject(); return; }
            if(closeReason === 'OffTopic' && (typeof offtopicReasonId === 'undefined' || offtopicReasonId === null)) { reject(); return; }

            $.post({
                url: `https://${location.hostname}/flags/questions/${pid}/close/add`,
                data: {
                    'fkey': fkey,
                    'closeReasonId': closeReason,
                    'closeAsOffTopicReasonId': offtopicReasonId,
                    //'duplicateOfQuestionId': null,
                    'offTopicOtherText': offtopicReasonId == 3 && isSO ? 'This question does not appear to be about programming within the scope defined in the [help]' : offTopicOtherText,
                    //'offTopicOtherCommentId': '',
                    'originalOffTopicOtherText': 'I\'m voting to close this question as off-topic because ',
                }
            })
            .done(resolve)
            .fail(reject);
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
    function destroySpammer(uid) {
        return new Promise(function(resolve, reject) {
            if(typeof uid === 'undefined' || uid === null) { reject(); return; }

            $.post({
                url: `https://${location.hostname}/admin/users/${uid}/destroy`,
                data: {
                    'annotation': '',
                    'deleteReasonDetails': '',
                    'mod-actions': 'destroy',
                    'destroyReason': 'This user was created to post spam or nonsense and has no other positive participation',
                    'destroyReasonDetails': '',
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
    }


    function initPostDissociationHelper() {

        // Only on main sites
        if(typeof StackExchange.options.site.parentUrl !== 'undefined') return;

        // If on contact CM page and action = dissocciate, click template link
        if(location.pathname.includes('/admin/cm-message/create/') && getQueryParam('action') == 'dissociate') {
            $('#show-templates').click();
            return;
        }

        // If on mod flag queues, remove close question and convert to comment buttons when flag message contains "di(sa)?ssociate", and add "dissociate" button
        if(location.pathname.includes('/admin/dashboard')) {
            const dissocFlags = $('.revision-comment.active-flag').filter((i,v) => v.innerText.match(/di(sa)?ssociate/));
            const dissocPosts = dissocFlags.closest('.flagged-post-row');
            dissocPosts.each(function() {
                const post = $(this);
                const userlink = post.find('.mod-audit-user-info a').attr('href');

                // User not found, prob already deleted
                if(userlink == null) return;

                const uid = Number(userlink.match(/\/(\d+)\//)[0].replace(/\//g, ''));
                const pid = post.attr('data-post-id') || post.attr('data-questionid') || post.attr('data-answerid');
                $('.delete-options', this).prepend(`<a href="https://${location.hostname}/admin/cm-message/create/${uid}?action=dissociate&pid=${pid}" class="btn" target="_blank">dissociate</a>`);

                $('.close-question-button, .convert-to-comment', this).hide();
            });
            return;
        }

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {

            // If CM templates loaded on contact CM page, and action = dissocciate, update templates
            if(settings.url.includes('/admin/contact-cm/template-popup/') && location.pathname.includes('/admin/cm-message/create/') && getQueryParam('action') == 'dissociate') {
                setTimeout(updateModTemplates, 200);
            }
        });
    }


    function appendPostModMenuLink() {

        // Add post issues container in mod flag queues, as expanded posts do not have this functionality
        $('.flagged-post-row .votecell .vote').filter(function() {
            return $(this).children('.js-post-issues').length == 0;
        }).each(function() {
            const post = $(this).closest('.answer, .question');
            const pid = post.attr('data-questionid') || post.attr('data-answerid');
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
            const postStatus = post.find('.special-status, .question-status').text();
            const isQuestion = post.hasClass('question');
            const isDeleted = post.hasClass('deleted-answer');
            const isModDeleted = post.find('.deleted-answer-info').text().includes('♦') || (postStatus.includes('deleted') && postStatus.includes('♦'));
            const isClosed = postStatus.includes('closed') || postStatus.includes('on hold') || postStatus.includes('duplicate');
            const isMigrated = postStatus.includes('migrated');
            const isLocked = isMigrated || postStatus.includes('locked');
            const hasComments = post.find('.comment, .comments-link.js-show-link:not(.dno)').length > 0;
            const pid = post.attr('data-questionid') || post.attr('data-answerid');
            const userbox = post.find('.post-layout .user-info:last .user-action-time').filter((i, el) => el.innerText.includes('answered') || el.innerText.includes('asked')).parent();
            const userlink = userbox.find('a').attr('href');
            const userrep = userbox.find('.reputation-score').text();
            const username = userbox.find('.user-details a').first().text();

            // Create menu based on post type and state
            let menuitems = '';

            menuitems += `<a data-action="move-comments" class="${isDeleted || !hasComments ? 'disabled' : ''}">move comments to chat</a>`; // when there are comments only?
            menuitems += `<a data-action="purge-comments" class="${!hasComments ? 'disabled' : ''}">purge comments</a>`; // when there are comments only?

            if(!isQuestion) { // A-only
                menuitems += `<a data-action="convert-comment" title="only the post, under the question">convert post to comment</a>`;
                menuitems += `<a data-action="convert-edit">convert post to edit</a>`;
            }
            else { // Q-only
                menuitems += `<a data-action="toggle-protect" class="${isDeleted ? 'disabled' : ''}">toggle protect</a>`;
            }

            if(isSO && isQuestion && !isClosed && !isDeleted) {
                menuitems += `<a data-action="close-offtopic">close (offtopic)</a>`;
            }

            menuitems += `<div class="separator"></div>`;

            // Incorrectly posted question on SO Meta
            if(isSOMeta && isQuestion && !isDeleted) {
                menuitems += `<a data-action="meta-incorrect">close + delete (incorrectly posted)</a>`;
            }
            else {
                menuitems += `<a data-action="mod-delete" class="${isModDeleted ? 'disabled' : ''}">mod-delete post</a>`; // Not currently deleted by mod only
            }

            menuitems += `<a data-action="lock-dispute" class="${isLocked ? 'dno' : ''}">lock - dispute (3d)</a>`; // unlocked-only
            menuitems += `<a data-action="lock-comments" class="${isLocked ? 'dno' : ''}">lock - comments (1d)</a>`; // unlocked-only

            if(isQuestion) { // Q-only
                menuitems += `<a data-action="lock-historical" class="${isLocked ? 'dno' : ''}">lock - historical (perm)</a>`; // unlocked-only
            }

            menuitems += `<a data-action="unlock" class="${!isLocked || isMigrated ? 'dno' : ''}">unlock</a>`; // L-only

            if(userlink && /.*\/\d+\/.*/.test(userlink)) {
                const uid = Number(userlink.match(/\/\d+\//)[0].replace(/\D+/g, ''));

                menuitems += `<div class="separator"></div>`;
                menuitems += `<a href="https://${location.hostname}/admin/cm-message/create/${uid}?action=dissociate&pid=${pid}" target="_blank" title="opens in a new window">request dissociation</a>`; // non-deleted user only

                if(/^\d+$/.test(userrep) && Number(userrep) < 500) {
                    menuitems += `<a data-action="destroy-spammer" data-uid="${uid}" data-username="${username}" class="danger" title="confirms whether you want to destroy the account">DESTROY spammer</a>`; // non-deleted user only
                }
                else {
                    menuitems += `<a class="danger disabled" title="user is above 500 reputation">DESTROY spammer</a>`; // non-deleted user only
                }
            }

            $(this).append(`
<div class="js-post-issue grid--cell s-btn s-btn__unset ta-center py8 post-mod-menu-link" data-shortcut="O" title="Other mod actions">
  <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 512" class="svg-icon mln1 mr0"><path fill="currentColor"
       d="M64 208c26.5 0 48 21.5 48 48s-21.5 48-48 48-48-21.5-48-48 21.5-48 48-48zM16 104c0 26.5 21.5 48 48 48s48-21.5 48-48-21.5-48-48-48-48 21.5-48 48zm0 304c0 26.5 21.5 48 48 48s48-21.5 48-48-21.5-48-48-48-48 21.5-48 48z"></path>
  </svg>
  <div class="post-mod-menu" title="" data-pid="${pid}">${menuitems}</div>
</a>`);
        });
    }


    function initPostModMenuLinks() {

        // Handle mod actions menu link click
        $('#content').on('click', '.post-mod-menu a', function() {

            if($(this).hasClass('disabled')) return false;

            const pid = Number(this.parentNode.dataset.pid);
            const qid = Number($('#question').attr('data-questionid') ||
                               $(this).parents('.mod-post-header').find('.answer-hyperlink, .question-hyperlink').attr('href').match(/\/(\d+)\//)[0].replace(/\//g, ''));
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
                    post.parents('.flagged-post-row').remove();
                }
            }

            switch(action) {
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
                        if(post.find('.question-status b').text().includes('protect')) unprotectPost(pid).then(reloadPage);
                        else protectPost(pid).then(reloadPage);
                    }
                    break;
                case 'meta-incorrect':
                    closeSOMetaQuestionAsOfftopic(pid).then(function() {
                        deletePost(pid).then(reloadPage);
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
                case 'lock-dispute':
                    lockPost(pid, 20, 24 * 3).then(reloadPage);
                    break;
                case 'lock-comments':
                    lockPost(pid, 21).then(reloadPage);
                    break;
                case 'lock-historical':
                    lockPost(pid, 22, -1).then(reloadPage);
                    break;
                case 'unlock':
                    unlockPost(pid).then(reloadPage);
                    break;
                case 'destroy-spammer':
                    if(confirm(`Confirm DESTROY the spammer "${uName}" (id: ${uid}) irreversibly???`) &&
                       confirm("Are you VERY SURE you want to DESTROY this account???")) {
                        destroySpammer(uid).then(reloadPage);
                    }
                    break;
                default:
                    return true;
            }

            return false;
        });

        // Once on page load
        appendPostModMenuLink();
    }


    function doPageload() {

        initPostModMenuLinks();
        initPostDissociationHelper();

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {

            appendPostModMenuLink();

            // If CM templates loaded on contact CM page, and action = dissocciate, update templates
            if(settings.url.includes('/admin/contact-cm/template-popup/') && location.pathname.includes('/admin/cm-message/create/') && getQueryParam('action') == 'dissociate') {
                setTimeout(updateModTemplates, 200);
            }
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
    padding: 6px 0;
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
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();

})();
