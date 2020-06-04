// ==UserScript==
// @name         Mod Message Helper
// @description  Adds menu to quickly send mod messages to users
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.2.6
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
    const parentUrl = StackExchange.options.site.parentUrl || 'https://' + location.hostname;


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


    function initModMessageHelper() {

        if(location.pathname.includes('/users/message/')) {

            // We do not need chat in the sidebar, thanks.
            $('.js-chat-ad-rooms').closest('.s-sidebarwidget').remove();

            // Move generic warning to sidebar
            $('#mainbar > .module.system-alert').prependTo($('#sidebar')).find('#confirm-new').text((i, v) => v.trim());

            // Show hidden email field
            $('#send-email').attr('type', 'checkbox').prop('checked', true).change(function() {
                $('#to_warning').toggleClass('hidden', !this.checked);
            }).wrap('<label for="send-email" class="dblock">send email: </label>');
            // Show alternate message if no email
            $('#to_warning').after(`<div id="to_warning_2" class="system-alert">The user will only receive this message on Stack Overflow.</div>`);

            $('#copyPanel > table').first().addClass('mb12');

            if(isSuperuser()) {

                // Show hidden template name field
                $('#templateName').attr('type', 'text').wrap('<label for="templateName" class="dblock">template name: </label>');

                // Show hidden template name field
                $('#suspendReason').attr('type', 'text').wrap('<label for="suspendReason" class="dblock">suspend reason: </label>');

                // Show hidden email field
                $('#templateEdited').attr('type', 'text').wrap('<label for="templateEdited" class="dblock">template edited: </label>');
            }
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

                    // Update mod message templates
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


    function initCmMessageHelper() {

        if(!location.pathname.includes('/admin/cm-message/create/')) return;

        const template = getQueryParam('action');

        // If template selected via querystring
        if(template != null) {

            // On any page update
            $(document).ajaxComplete(function(event, xhr, settings) {

                // Once templates loaded , update templates
                if(settings.url.includes('/admin/contact-cm/template-popup/')) {

                    // Run once only. Unbind ajaxComplete event
                    $(event.currentTarget).unbind('ajaxComplete');

                    // Update mod message templates
                    setTimeout(selectCmMessage, 500, template);
                }
            });

            // click template link
            $('#show-templates').click();
        }

        function selectCmMessage(template) {

            switch(template) {
                case 'profile-merge':
                    $('#template-0').click().triggerHandler('click');
                    break;
                case 'post-dissociation':
                    $('#template-1').click().triggerHandler('click');
                    break;
                case 'suspicious-voting':
                    $('#template-2').click().triggerHandler('click');
                    break;
                case 'spam':
                    $('#template-3').click().triggerHandler('click');
                    break;
                case 'suicidal-user':
                    $('#template-4').click().triggerHandler('click');
                    break;
                case 'underage-user':
                    $('#template-5').click().triggerHandler('click');
                    break;
                case 'other':
                    $('#template-6').click().triggerHandler('click');
                    break;
            }

            $('#show-templates').next('.popup').find('.popup-submit').click();
        }
    }


    function appendModMessageMenu() {

        // Append link to post sidebar if it doesn't exist yet
        $('.user-info').not('.js-mod-message-menu').addClass('js-mod-message-menu').each(function() {

            let uid = 0;
            try {
                uid = ($(this).find('a[href^="/users/"]').attr('href') || '/0/').match(/\/(\d+)\//)[1];
                uid = Number(uid);
                this.dataset.uid = uid;
            }
            catch(ex) {} // can't put return statements in catch blocks?
            if(typeof uid === 'undefined' || uid == 0) return; // e.g.: deleted user

            // if user is self, ignore
            if(uid == StackExchange.options.user.userId) return;

            const post = $(this).closest('.question, .answer');
            const pid = post.attr('data-questionid') || post.attr('data-answerid');

            const userbox = $(this);
            const userlink = userbox.find('a').attr('href');
            const userrep = userbox.find('.reputation-score').text();
            const username = userbox.find('.user-details a').first().text();
            const modFlair = $(this).find('.mod-flair');

            if(uid == -1 || modFlair.length == 1) return;

            const postIdParam = pid ? '&' + (!isMeta ? `pid=${pid}` : `metapid=${pid}`) : '';

            const modMessageLink = parentUrl + '/users/message/create/' + uid;
            const cmMessageLink = parentUrl + '/admin/cm-message/create/' + uid;


            // Create menu based on post type and state
            let menuitems = '';

            menuitems += `<a target="_blank" href="${modMessageLink}?action=low-quality-questions">low quality questions</a>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=question-repetition">question repetition</a>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=promotion">excessive self-promotion</a>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=signatures-taglines">using signatures</a>`;

            menuitems += `<div class="separator"></div>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=excessive-discussion">excessive comments</a>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=abusive">abusive to others</a>`;

            menuitems += `<div class="separator"></div>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=vandalism">vandalism</a>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=plagiarism">plagiarism</a>`;

            menuitems += `<div class="separator"></div>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=sockpuppet-upvoting">sockpuppet upvoting</a>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=targeted-votes">targeted votes</a>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=revenge-downvoting">revenge downvoting</a>`;

            menuitems += `<div class="separator"></div>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=other">other...</a>`;


            // Create CM menu
            let cmMenuitems = '';

            cmMenuitems += `<a target="_blank" href="${cmMessageLink}?action=post-dissociation${postIdParam}">post dissociation</a>`;
            cmMenuitems += `<a target="_blank" href="${cmMessageLink}?action=suspicious-voting">suspicious voting</a>`;
            cmMenuitems += `<a target="_blank" href="${cmMessageLink}?action=suicidal-user">suicidal user</a>`;
            cmMenuitems += `<a target="_blank" href="${cmMessageLink}?action=underage-user">underage user</a>`;
            cmMenuitems += `<a target="_blank" href="${cmMessageLink}?action=profile-merge">user profile merge</a>`;
            cmMenuitems += `<a target="_blank" href="${cmMessageLink}?action=spam">spam</a>`;

            cmMenuitems += `<div class="separator"></div>`;
            cmMenuitems += `<a target="_blank" href="${cmMessageLink}?action=other">other...</a>`;


            $(this).append(`
<div class="js-mod-message-link grid--cell s-btn ta-center py8 somu-mod-message-link" data-shortcut="O" title="Contact...">
  <svg aria-hidden="true" role="img" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="svg-icon mln1 mr0">
    <path fill="currentColor" d="M464 64H48C21.5 64 0 85.5 0 112v288c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48zM48 96h416c8.8 0 16 7.2 16 16v41.4c-21.9 18.5-53.2 44-150.6 121.3-16.9 13.4-50.2 45.7-73.4 45.3-23.2.4-56.6-31.9-73.4-45.3C85.2 197.4 53.9 171.9 32 153.4V112c0-8.8 7.2-16 16-16zm416 320H48c-8.8 0-16-7.2-16-16V195c22.8 18.7 58.8 47.6 130.7 104.7 20.5 16.4 56.7 52.5 93.3 52.3 36.4.3 72.3-35.5 93.3-52.3 71.9-57.1 107.9-86 130.7-104.7v205c0 8.8-7.2 16-16 16z" class="" data-darkreader-inline-fill="" style="--darkreader-inline-fill:currentColor;"></path>
  </svg>
  <div class="somu-mod-message-menu grid" title="" data-pid="${pid}" role="dialog">
    <div class="grid--cell fl0 br bc-black-3">
      <div class="somu-mod-message-header">Message user:</div>
      ${menuitems}
    </div>
    <div class="grid--cell fl0">
    <div class="somu-mod-message-header">Contact CM:</div>
      ${cmMenuitems}
    </div>
  </div>
</a>`);

        });

    }


    function doPageload() {

        appendModMessageMenu();

        initModMessageHelper();
        initCmMessageHelper();

        // After requests have completed
        $(document).ajaxStop(function() {
            appendModMessageMenu();
        });
    }


    function appendStyles() {

        const styles = `
<style>
.user-info {
    position: relative;
    min-height: 88px;
    border: 1px solid transparent;
}
.user-info:hover {
    /*border-color: var(--black-200);*/
}
.user-info.js-mod-message-menu:not(.js-mod-quicklinks) {
    padding-bottom: 25px;
}
.user-action-time {
    min-height: 15px;
}
.somu-mod-message-link {
    position: absolute !important;
    bottom: 2px;
    left: 1px;
    display: inline-block;
    padding: 5px 6px !important;
    line-height: 0;
    color: inherit;
    cursor: pointer;
}
.somu-mod-message-link svg {
    width: 13px;
    height: 14px;
    color: var(--black-500);
}
.somu-mod-message-link:hover .somu-mod-message-menu,
.somu-mod-message-link .somu-mod-message-menu:hover {
    display: flex;
}
.somu-mod-message-link:hover svg {
    /*visibility: hidden;*/
}
.somu-mod-message-link .somu-mod-message-menu {
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    padding: 0;
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
.somu-mod-message-link .somu-mod-message-menu > div {
    min-width: 170px;
    padding: 0 0 6px;
}
.somu-mod-message-header {
    display: block !important;
    margin-top: 12px;
    margin-bottom: 5px;
    padding: 8px 0;
    padding-left: 26px;
    padding-right: 26px;
    background-color: var(--yellow-050);
    border-bottom: 1px solid var(--yellow-100);
    color: var(--black);
    font-weight: bold;
}
.somu-mod-message-header:first-child {
    margin-top: 0;
}
.somu-mod-message-menu a {
    display: block;
    min-width: 120px;
    padding: 2px 0;
    padding-left: 22px;
    padding-right: 22px;
    cursor: pointer;
    color: var(--black-900) !important;
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

/* Some elements hide overflow, need to undo */
.suggested-edit .summary {
    overflow: unset;
}



/* Mod message page */
.dbl, .dblock {
    display: block;
}
#msg-form #addressing {
    margin-bottom: 15px;
}
#msg-form #to_warning + #to_warning_2 {
    display: none;
    line-height: 100%;
}
#msg-form #to_warning,
#msg-form #to_warning.hidden + #to_warning_2 {
    display: inline-block;
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
#sidebar .module #confirm-new {
    white-space: break-spaces;
    line-height: 1.2;
}

</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();


})();
