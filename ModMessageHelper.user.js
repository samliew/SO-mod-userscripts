// ==UserScript==
// @name         Mod Message Helper
// @description  Adds menu to quickly send mod messages to users
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.1.1
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
// @require      https://github.com/samliew/SO-mod-userscripts/raw/master/lib/common.js
// ==/UserScript==

(function() {
    'use strict';

    // Moderator check
    if(!isModerator()) return;


    const superusers = [ 584192 ];
    const isSuperuser = () => superusers.includes(StackExchange.options.user.userId);

    const newlines = '\n\n';
    const fkey = StackExchange.options.user.fkey;
    const getQueryParam = key => new URLSearchParams(window.location.search).get(key);
    const isSO = location.hostname == 'stackoverflow.com';
    const isSOMeta = location.hostname == 'meta.stackoverflow.com';
    const isMeta = typeof StackExchange.options.site.parentUrl !== 'undefined';


    // Only on main sites
    if(isMeta) return;


    // Send mod message + optional suspension
    function modMessage(uid, message = '', sendEmail = true, suspendDays = 0) {
        return new Promise(function(resolve, reject) {
            if(typeof uid === 'undefined' || uid === null) { reject(); return; }
            if(suspendDays < 0 || suspendDays > 365) { reject(); return; }

            // Message cannot be empty
            if(message == null || message.trim().length == 0) {
                alert('Mod message cannot be empty.'); reject(); return;
            }

            let suspendUser = false;
            let suspendChoice = 0;
            if(suspendDays > 0) {
                suspendUser = true;
                suspendChoice = suspendDays;
            }

            let templateName = 'something else...';
            let suspendReason = 'for rule violations';
            if(message == 'goodbye') {
                templateName = 'a farewell';
            }

            $.post({
                url: `https://${location.hostname}/users/message/save`,
                data: {
                    'userId': uid,
                    'lastMessageDate': 0,
                    'email': sendEmail,
                    'suspendUser': suspendUser,
                    'suspend-choice': suspendChoice,
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

            // Apply max suspension before deletion
            if(isSuperuser()) {
                modMessage(uid, 'goodbye', false, 365);
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


    function initModMessageHelper() {

        if(location.pathname.includes('/users/message/')) {

            // We do not need chat in the sidebar, thanks.
            $('.js-chat-ad-rooms').closest('.s-sidebarwidget').remove();

            // Move generic warning to sidebar
            $('#mainbar > .module.system-alert').prependTo($('#sidebar'));

            // Show hidden email field
            $('#send-email').attr('type', 'checkbox').prop('checked', true).change(function() {
                $('#to_warning').toggleClass('hidden', !this.checked);
            }).wrap('<label>send email: </label>');
        }

        // The rest of this function is for creating new messages
        if(!location.pathname.includes('/users/message/create/')) return;

        const template = getQueryParam('action');

        // Restrict max suspension days to 365, otherwise it fails rudely
        $('#suspendDays').attr('type', 'number').attr('max', '365');

        // If template selected via querystring
        if(template != null) {

            // On any page update
            $(document).ajaxComplete(function(event, xhr, settings) {

                // Once templates loaded , update templates
                if(settings.url.includes('/admin/contact-user/template-popup/')) {

                    // Run once only. Unbind ajaxComplete event
                    $(event.currentTarget).unbind('ajaxComplete');

                    // Update CM mod templates
                    setTimeout(selectModMessage, 500, template);
                }
            });

            // click template link
            $('#show-templates').click();
        }

        function selectModMessage(template) {

            switch(template) {
                case 'low-quality-questions':
                    $('#template-0').click().triggerHandler('click');
                    break;
                case 'question-repetition':
                    $('#template-1').click().triggerHandler('click');
                    break;
                case 'sockpuppet-upvoting':
                    $('#template-2').click().triggerHandler('click');
                    break;
                case 'targeted-votes':
                    $('#template-3').click().triggerHandler('click');
                    break;
                case 'abusive':
                    $('#template-4').click().triggerHandler('click');
                    break;
                case 'revenge-downvoting':
                    $('#template-5').click().triggerHandler('click');
                    break;
                case 'vandalism':
                    $('#template-6').click().triggerHandler('click');
                    break;
                case 'signatures-taglines':
                    $('#template-7').click().triggerHandler('click');
                    break;
                case 'promotion':
                    $('#template-8').click().triggerHandler('click');
                    break;
                case 'excessive-discussion':
                    $('#template-9').click().triggerHandler('click');
                    break;
                case 'plagiarism':
                    $('#template-10').click().triggerHandler('click');
                    break;
                case 'other':
                    $('#template-11').click().triggerHandler('click');
                    break;
            }

            $('#show-templates').next('.popup').find('.popup-submit').click();
        }
    }


    function appendModMessageMenu() {

        // Append link to post sidebar if it doesn't exist yet
        $('.post-signature.owner').not('.js-mod-message-menu').addClass('js-mod-message-menu').each(function() {

            const uid = ($(this).find('a[href^="/users/"]').attr('href') || '').match(/\/(\d+)\//)[1];
            this.dataset.uid = uid;

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
            const isOldDupe = isQuestion && post.find('.post-text blockquote').first().find('strong').text().includes('Possible Duplicate');
            const needsRedupe = postStatus.match(/This question already has( an)? answers? here:(\s|\n|\r)+Closed/i) != null;
            const hasComments = post.find('.comment, .comments-link.js-show-link:not(.dno)').length > 0;
            const pid = post.attr('data-questionid') || post.attr('data-answerid');
            const userbox = post.find('.post-layout .user-info:last .user-action-time').filter((i, el) => el.innerText.includes('answered') || el.innerText.includes('asked')).parent();
            const userlink = userbox.find('a').attr('href');
            const userrep = userbox.find('.reputation-score').text();
            const username = userbox.find('.user-details a').first().text();
            const postdate = userbox.find('.relativetime').attr('title');
            const postage = (Date.now() - new Date(postdate)) / 86400000;

            const modMessageLink = '/users/message/create/' + uid;

            // Create menu based on post type and state
            let menuitems = '';


            menuitems += `<a target="_blank" href="${modMessageLink}?action=low-quality-questions">low quality questions</a>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=question-repetition">question repetition</a>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=excessive-discussion">excessive comments</a>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=abusive">abusive to others</a>`;

            menuitems += `<div class="separator"></div>`;

            menuitems += `<a target="_blank" href="${modMessageLink}?action=sockpuppet-upvoting">sockpuppet upvoting</a>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=targeted-votes">targeted votes</a>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=revenge-downvoting">revenge downvoting</a>`;

            menuitems += `<div class="separator"></div>`;

            menuitems += `<a target="_blank" href="${modMessageLink}?action=promotion">excessive self-promotion</a>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=signatures-taglines">using signatures</a>`;

            menuitems += `<div class="separator"></div>`;

            menuitems += `<a target="_blank" href="${modMessageLink}?action=vandalism">vandalism</a>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=plagiarism">plagiarism</a>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=other">other...</a>`;


            $(this).append(`
<div class="js-mod-message-link grid--cell s-btn s-btn__unset ta-center py8 somu-mod-message-link" data-shortcut="O" title="Other mod actions">
  <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 512" class="svg-icon mln1 mr0"><path fill="currentColor"
       d="M64 208c26.5 0 48 21.5 48 48s-21.5 48-48 48-48-21.5-48-48 21.5-48 48-48zM16 104c0 26.5 21.5 48 48 48s48-21.5 48-48-21.5-48-48-48-48 21.5-48 48zm0 304c0 26.5 21.5 48 48 48s48-21.5 48-48-21.5-48-48-48-48 21.5-48 48z"></path>
  </svg>
  <div class="somu-mod-message-menu" title="" data-pid="${pid}" role="dialog">
    <div class="somu-mod-message-header">Message (${username}):</div>
    ${menuitems}
  </div>
</a>`);

        });

    }


    function doPageload() {

        appendModMessageMenu();

        initModMessageHelper();

        // After requests have completed
        $(document).ajaxStop(function() {
            appendModMessageMenu();
        });
    }


    function appendStyles() {

        const styles = `
<style>
.post-signature {
    position: relative;
}
.somu-mod-message-link {
    position: absolute !important;
    bottom: 0;
    left: 0;
    display: inline-block;
    padding: 5px !important;
    color: inherit;
    cursor: pointer;
}
.somu-mod-message-link svg {
    max-width: 15px;
    max-height: 14px;
    width: 15px;
    height: 14px;
}
.somu-mod-message-link:hover .somu-mod-message-menu,
.somu-mod-message-link .somu-mod-message-menu:hover {
    display: block;
}
.somu-mod-message-link:hover svg {
    visibility: hidden;
}
.somu-mod-message-link .somu-mod-message-menu {
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    padding: 0 0 6px;
    z-index: 3;
    cursor: auto;

    background: var(--white);
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
.somu-mod-message-header {
    display: block !important;
    margin-bottom: 5px;
    padding: 8px 0;
    padding-left: 26px;
    padding-right: 48px;
    background-color: var(--yellow-050);
    border-bottom: 1px solid var(--yellow-100);
    color: var(--black);
    font-weight: bold;
}
.somu-mod-message-menu a {
    display: block;
    min-width: 120px;
    padding: 5px 0;
    padding-left: 26px;
    padding-right: 48px;
    cursor: pointer;
    color: var(--black-900);
}
.somu-mod-message-menu a.dno {
    display: none;
}
.somu-mod-message-menu a:hover {
    background-color: var(--black-100);
}
.somu-mod-message-menu a.disabled {
    background-color: var(--black-050) !important;
    color: var(--black-200) !important;
    cursor: not-allowed;
}
.somu-mod-message-menu a.danger:hover {
    background-color: var(--red-500);
    color: var(--white);
}
.somu-mod-message-menu .separator {
    display: block;
    border-top: 1px solid var(--black-100);
    margin: 5px 0;
}



/* Mod message page */
#msg-form #addressing {
    margin-bottom: 15px;
}
#msg-form #copyPanel > span + table > tbody > tr:first-child td:first-child {
    width: 170px;
}
#msg-form #suspendDays {
    width: 70px;
}
#msg-form #copyPanel > .suspend-info {
    padding: 10px;
    font-weight: bold;
    margin-bottom: 10px;
    margin-top: 5px;
    border: 1px dotted #AE0000;
}
#msg-form #copyPanel textarea#wmd-input {
    min-height: 550px;
}
#sidebar .module {
    margin-bottom: 30px;
}

</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();


})();
