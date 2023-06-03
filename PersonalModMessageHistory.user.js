// ==UserScript==
// @name         Personal Mod Message History
// @description  Displays your sent mod messages
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      3.1.10
//
// @match        https://*.stackoverflow.com/*
// @match        https://*.serverfault.com/*
// @match        https://*.superuser.com/*
// @match        https://*.askubuntu.com/*
// @match        https://*.mathoverflow.net/*
// @match        https://*.stackapps.com/*
// @match        https://*.stackexchange.com/*
// @match        https://stackoverflowteams.com/*
//
// @exclude      https://api.stackexchange.com/*
// @exclude      https://data.stackexchange.com/*
// @exclude      https://contests.stackoverflow.com/*
// @exclude      https://winterbash*.stackexchange.com/*
// @exclude      *chat.*
// @exclude      *blog.*
// @exclude      *meta.*
// @exclude      */tour
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/se-ajax-common.js
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

/* globals StackExchange */
/// <reference types="./globals" />

'use strict';

// This is a moderator-only userscript
if (!isModerator()) return;

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


// Append styles
addStylesheet(`
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
`); // end stylesheet


// On script run
(function init() {

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
})();