// ==UserScript==
// @name         Flag Retractor
// @description  Implements retract flag button on own flag history page
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      3.0.10
//
// @match        https://*.stackoverflow.com/users/flag-summary/*
// @match        https://*.serverfault.com/users/flag-summary/*
// @match        https://*.superuser.com/users/flag-summary/*
// @match        https://*.askubuntu.com/users/flag-summary/*
// @match        https://*.mathoverflow.net/users/flag-summary/*
// @match        https://*.stackapps.com/users/flag-summary/*
// @match        https://*.stackexchange.com/users/flag-summary/*
// @match        https://stackoverflowteams.com/c/*/users/flag-summary/*
//
// @exclude      https://api.stackexchange.com/*
// @exclude      https://data.stackexchange.com/*
// @exclude      https://contests.stackoverflow.com/*
// @exclude      https://winterbash*.stackexchange.com/*
// @exclude      *chat.*
// @exclude      *blog.*
// @exclude      */tour
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/se-ajax-common.js
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

/* globals StackExchange, fkey, userId */
/// <reference types="./globals" />

'use strict';

const flagTypes = {
  CommentNoLongerNeeded: 'no longer needed',
  CommentUnwelcoming: 'unfriendly or unkind',
  CommentRudeOrOffensive: 'harassment, bigotry, or abuse',

  PostSpam: 'spam',
  PostOffensive: 'rude or abusive',
  PostLowQuality: 'very low quality',
  AnswerNotAnAnswer: 'not an answer',
};

const mapFlagTypeToName = flagtype => flagTypes[flagtype] || 'PostOther';
const mapFlagNameToType = flagname => Object.keys(flagTypes).find(key => flagTypes[key] === flagname.toLowerCase()) || 'PostOther';


// Retract post flag
function retractFlag(pid, flagType) {
  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid === null) { reject(); return; }
    if (typeof flagType === 'undefined' || flagType === null) { reject(); return; }

    $.post({
      url: `${location.origin}/flags/posts/${pid}/retract/${flagType}`,
      data: {
        'fkey': fkey,
        'otherText': '',
      }
    })
      .done(resolve)
      .fail(reject);
  });
}


// Append styles
addStylesheet(`
.user-flag-history .mod-flag button {
  font-size: 0.8em !important;
}
`); // end stylesheet


// On script run
(function init() {
  // Works only on OWN flag history page
  if (location.pathname !== `/users/flag-summary/${userId}`) return;

  // Cannot work on comment flags
  if (location.search.includes('group=4')) return;

  $('.user-flag-history').on('click', '[data-retractflagtype]', function () {
    retractFlag(this.dataset.postid, this.dataset.retractflagtype);
    $(this).remove();
    return false;
  });

  $('.user-flag-history .mod-flag-indicator').parent('.mod-flag').each(function () {
    const link = $(this).closest('.flagged-post').find('.answer-hyperlink').attr('href');
    const pid = getPostId(link);
    const flagname = $(this).children('.revision-comment, .bounty-indicator-tab').first().text().toLowerCase(); // spam flags still use class ".bounty-indicator-tab"
    const flagtype = mapFlagNameToType(flagname);
    $(this).append(`<button class="s-btn s-btn__xs s-btn__github" data-retractflagtype="${flagtype}" data-postid="${pid}">Retract ${flagtype} flag</button>`);
  });
})();