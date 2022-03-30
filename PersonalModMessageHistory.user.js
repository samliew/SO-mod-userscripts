// ==UserScript==
// @name         Personal Mod Message History
// @description  Displays your sent mod messages
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.2
//
// @include      https://stackoverflow.com/*
// @include      https://serverfault.com/*
// @include      https://superuser.com/*
// @include      https://askubuntu.com/*
// @include      https://mathoverflow.net/*
// @include      https://stackexchange.com/*
//
// @include      *.stackexchange.com/*
//
// @exclude      *.meta.stackexchange.com/*
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';

// Moderator check
if (typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator) return;


const displayName = $('.s-topbar--item.s-user-card .s-user-card--avatar').attr('title');
let inboxLink;


function getModMessages(pageNum = 1, pagesize = 100) {
    const $modMessagesList = $('.your-history ul');
    if ($modMessagesList.length === 0) return;

    $.ajax({
        url: `https://stackoverflow.com/admin/users/messages?page=${pageNum}&pagesize=${pagesize}`,
        xhr: jQueryXhrOverride,
        success: function (data) {

            // Parse messages
            let html = '';
            const $messages = $('<span></span>').html(data).find('table:first tr');
            $messages.filter((i, el) => $(el).find('.annotime').get(0).childNodes[0].nodeValue.indexOf(displayName) > -1).each(function () {
                const text = $(this).find('.textcell a:first').text().replace(/^[\w',.:\s]+(https:\/\/[\w.\/-]+)\s+/, '');
                const user = $(this).find('.user-details a');
                const msg = $('.inbox-item:first').clone(true, true);

                // Map to cloned element
                msg.find('.item-type').text('moderator message');
                msg.find('.relativetime').replaceWith($(this).find('.relativetime'));
                msg.children('a').attr('href', $(this).find('.textcell a:first').attr('href'));
                msg.find('.item-location').text('You sent ' + user.text() + ':');
                msg.find('.item-summary').text(text);

                html += msg[0].outerHTML;
            });

            $modMessagesList.html(html);
        }
    });
}

function togglePersonalModHistory() {

    // Add mod history results if not added yet
    if ($('.modInbox-dialog .your-history').length == 0) {
        const $yourHistory = $('.modInbox-dialog').append('<div class="modal-content your-history"><ul></ul></div>');
        getModMessages(1, 1000);
    }

    // Toggle display
    $('.modInbox-dialog .modal-content').first().toggleClass('hidden');

    // Toggle link text
    inboxLink.text((i, t) => t === 'Your messages' ? 'All messages' : 'Your messages');

    // Toggle mod inbox header text
    $('.modInbox-dialog .header h3').first().text((i, t) => t === 'mod messages' ? 'your messages' : 'mod messages');
}

function doPageLoad() {

    // If on account info dashboard page, show username in page title
    if (location.pathname.includes('/users/account-info/')) {
        const username = $('#mod-content h1').text().trim().replace(/\s+\(.+$/g, '').trim();
        document.title = username + ' - Account Information';
    }
}

function listenToPageUpdates() {

    // On any page update
    $(document).ajaxComplete(function (event, xhr, settings) {

        // Loaded mod messages popup
        if (settings.url.indexOf('/topbar/mod-inbox') >= 0) {

            // Add link once if mod inbox has loaded
            if (!inboxLink) {
                const modInboxDialog = $('.modInbox-dialog .-right:last').prepend('<span> •</span>');
                inboxLink = $('<a id="js-personalModInboxLink" href="#">Your messages</a>').prependTo(modInboxDialog);
                inboxLink.on('click', togglePersonalModHistory);
            }
        }
    });
}


// On page load
doPageLoad();
listenToPageUpdates();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
.modal-content + .modal-content {
    display: none;
}
.modInbox-dialog .modal-content.hidden + .modal-content {
    display: block;
}
.topbar-dialog.modInbox-dialog {
    max-height: 50vh;
    width: 500px;
}
.topbar-dialog.modInbox-dialog .modal-content {
    max-height: calc(50vh - 32px);
}
`;
document.body.appendChild(styles);