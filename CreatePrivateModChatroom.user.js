// ==UserScript==
// @name         Create Private Mod Chatroom
// @description  One-click button to create private/mod chat room with user and grant write access
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      3.0.13
//
// @match        https://chat.stackoverflow.com/users/*
// @match        https://chat.stackexchange.com/users/*
// @match        https://chat.meta.stackexchange.com/users/*
//
// @match        https://chat.stackoverflow.com/rooms/*
// @match        https://chat.stackexchange.com/rooms/*
// @match        https://chat.meta.stackexchange.com/rooms/*
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/se-ajax-common.js
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

/* globals StackExchange, fkey */
/// <reference types="./globals" />

'use strict';

// This is a moderator-only userscript
if (!isModerator()) return;

const superpingText = `get in this chatroom please (click the "join this room" button)`;


unsafeWindow.removeFullPageBlocker = () => {
  $('.ajax-blocker').remove();
}
unsafeWindow.addFullPageBlocker = (msg = "") => {
  removeFullPageBlocker();
  $(`<div class="ajax-blocker">${msg}</div>`).appendTo('body');
}


// Append styles
addStylesheet(`
.ajax-blocker {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0 25px;
  padding-top: calc(50vh - 1em);
  z-index: 99999;

  background: rgba(255,255,255,0.8);
  text-align: center;
  font-style: italic;
  color: #333;
  cursor: wait;
  user-select: none;
}
.private-button {
  background-color: darkred;
}
.inline-buttons .button {
  margin-left: 10px;
}
`); // end stylesheet


// On script run
(function init() {

  // User general tab
  if (location.pathname.includes('/users/') && $('#tabs a').first().hasClass('youarehere')) {

    const curruserId = $('.topbar-menu-links a').attr('href').match(/\d+/)[0];
    const curruserName = $('.topbar-menu-links a').first().text().replace(/\s+♦$/, '');

    const userId = $('input[name="user"]').val();
    const username = $('.subheader h1').text();

    // Don't create a private room with yourself...
    if (curruserId == userId) return;

    // Clone search form and 'convert' it into create new private room form with userId set in description so we can retrieve it to grant access afterwards
    const sForm = $('.usercard-xxl form[action="/search"]');
    const pForm = sForm.clone(true, true).attr({
      'action': '/rooms/save',
      'method': 'post'
    });

    // Insert necessary fields into private form
    // The secret's in the "defaultAccess" and "noDupeCheck" params
    $('#fkey').clone().prependTo(pForm);
    pForm.find('.button').addClass('private-button').val('create a private room with user');
    pForm.find('input[name="user"]').attr('name', 'description').val((i, v) => 'grant-write:' + v);
    pForm.find('input[name="q"]').attr('name', 'name').val(`Room for ${curruserName} and ${username}`);
    pForm.append(`
      <input type="hidden" name="defaultAccess" value="request" />
      <input type="hidden" name="host" value="" />
      <input type="hidden" name="tags" value="" />
      <input type="hidden" name="noDupeCheck" value="true" />`);

    // Insert this private room form before the search form
    pForm.insertBefore(sForm);
    return;
  }

  // Room created with userId in room description
  else if (location.pathname.includes('/rooms/info/') && $('.roomcard-xxl p').text().includes('grant-write:')) {
    const roomId = location.pathname.match(/\d+/)[0];
    const userId = $('.roomcard-xxl p').text().match(/\d+/)[0];
    const username = $('#name').val().split(' and ')[1];

    // Simple validation
    if (!fkey || !roomId || !userId || !username) return;

    // Remove from view
    $('.roomcard-xxl p').first().css('color', 'transparent');

    // Add spinner
    addFullPageBlocker("granting write access to user. please wait...");

    // Grant access to user
    $.post(`/rooms/setuseraccess/${roomId}`, {
      'fkey': fkey,
      'userAccess': 'read-write',
      'aclUserId': userId
    }, function () {

      // Then send a message into the room with the userId
      $.post(`/chats/${roomId}/messages/new`, {
        'fkey': fkey,
        'text': `*private room created with user ${userId}*`
      });

      // Then clear description, which will also reload page
      $('#description').val('').closest('form').submit();
    });

    return;
  }

  // If in chat room with first two messages containing userId, show superping button
  else if (location.pathname.includes('/rooms/') && $('body#chat-body').length > 0) {
    const roomId = CHAT.CURRENT_ROOM_ID;

    let findShowSuperping = function () {

      // This function shall be run once only
      findShowSuperping = function () { return; }

      // look for user id message in first two messages
      const msgs = $('.message .content').slice(0, 2).filter((i, el) => /\d{5,}$/.test(el.innerText));
      const userId = Number(msgs.text().match(/\d+$/));

      // Simple validation
      if (!userId) return;

      // Show profile and superping button
      // <i>&nbsp;</i> is a spacer so highlighting the uid doesn't select the button text as well
      const inlineButtons = $(`<span class="inline-buttons">&nbsp;<a href="${location.origin}/users/${userId}" target="_blank" class="button" title="view chat profile">profile</a><a class="button superpinger" title="mod superping user">superping</a></span>`);
      inlineButtons.on('click', '.superpinger', function () {
        $(this).remove();
        $.post(`/chats/${CHAT.CURRENT_ROOM_ID}/messages/new`, {
          'fkey': fkey,
          'text': `@@${userId} ${superpingText}`
        });
        return false;
      }).appendTo(msgs);
    }

    // On any page update
    $(document).ajaxComplete(function (event, xhr, settings) {
      // When messages are loaded
      if (settings.url.includes('/messages/') || settings.url.includes('/events')) {
        findShowSuperping();
      }
    });

    // If messages were already loaded, immediately process
    if ($('.message .content').length > 0) findShowSuperping();
  }
})();