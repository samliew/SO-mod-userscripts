// ==UserScript==
// @name         Chat More Magic Links
// @description  Some magic links are not parsed in Stack Overflow Chat. This script parses and submit expanded magic links via an edit to your latest message.
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      3.0.10
//
// @match        https://chat.stackoverflow.com/rooms/*
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/se-ajax-common.js
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

'use strict';

/* globals fkey */
/// <reference types="./globals" />

const soDomain = 'https://stackoverflow.com';


function updateMessage(mid, message) {
  // Fire and forget
  $.post(`/messages/${mid}`, {
    fkey: fkey,
    text: message
  });
}

function getMessageRawString(mid) {
  return new Promise(function (resolve, reject) {
    $.get(`/messages/${mid}/history`)
      .done(function (data) {
        const str = $('.monologue b', data).filter((i, el) => el.innerText == 'said:').next('.message-source').text().trim();
        resolve(str);
      })
      .fail(reject);
  });
}


function convertMagicLinksInMessage(msg) {
  msg = msg.replace(/\[(mcve|mre)\](?!\()/gi, `[Minimal, Reproducible Example](${soDomain}/help/mcve)`);
  msg = msg.replace(/\[help\](?!\()/gi, `[help center](${soDomain}/help)`);
  msg = msg.replace(/\[help\/on-topic\](?!\()/gi, `[help center](${soDomain}/help/on-topic)`);
  msg = msg.replace(/\[help\/dont-ask\](?!\()/gi, `[help center](${soDomain}/help/dont-ask)`);
  msg = msg.replace(/\[help\/behavior\](?!\()/gi, `[help center](${soDomain}/help/behavior)`);
  msg = msg.replace(/\[meta-help\](?!\()/gi, `[help center](${soDomain}/help/whats-meta)`);
  msg = msg.replace(/\[tour\](?!\()/gi, `[tour](${soDomain}/tour)`);
  msg = msg.replace(/\[co(nduct|c)\](?!\()/gi, `[Code of Conduct](${soDomain}/conduct)`);
  msg = msg.replace(/\[chat\](?!\()/gi, `[Stack Overflow Chat](${location.origin})`);
  msg = msg.replace(/\[socvr\](?!\()/gi, `[SOCVR](https://chat.stackoverflow.com/rooms/41570/so-close-vote-reviewers)`);
  msg = msg.replace(/\[somu\](?!\()/gi, `[Stack Overflow Moderation Userscripts *by Samuel Liew*](https://github.com/samliew/SO-mod-userscripts/blob/master/README.md)`);
  return msg;
}


function checkLastMessage() {
  const lastMessage = $('.user-container.mine .message').last();

  // If last message has already been handled, ignore
  if (lastMessage.hasClass('js-magiclinks')) return;
  lastMessage.addClass('js-magiclinks');

  // If last message has already been deleted, ignore
  if (lastMessage.hasClass('cmmt-deleted')) return;

  // If last message has already been edited, ignore
  if (lastMessage.find('.edits').length > 0) return;

  // Required
  if (typeof lastMessage.attr('id') === 'undefined') return;
  const mid = Number(lastMessage.attr('id').replace(/[^\d]/g, ''));
  if (isNaN(mid)) return;

  getMessageRawString(mid)
    .then(function (rawMessage) {
      const parsedMessage = convertMagicLinksInMessage(rawMessage);
      //console.log(mid, rawMessage, parsedMessage);

      if (rawMessage.length !== parsedMessage.length && rawMessage !== parsedMessage) {
        updateMessage(mid, parsedMessage);
      }
    });
}


// On script run
(function init() {

  // Occasionally, check last message and parse it
  setInterval(checkLastMessage, 2000);
})();