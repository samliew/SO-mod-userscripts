// ==UserScript==
// @name         Election Supporter Flairs
// @description  Flair users who voted in the elections when you were elected, or if non-mod, for the latest election
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      3.0.10
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
// @exclude      */show-user-votes/*
// @exclude      *?tab=questions*
// @exclude      *?tab=tags*
// @exclude      *?tab=following*
// @exclude      *?tab=activity*
// @exclude      *?tab=bounties*
// @exclude      *?tab=responses*
// @exclude      *?tab=votes*
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

/* globals StackExchange, store, _window */
/// <reference types="./globals" />

'use strict';

let electionNum, constituentBadgeId;


// Helper functions
const toInt = v => v == null || isNaN(Number(v)) ? null : Number(v);
const toBool = v => v == null ? null : v === true || v.toLowerCase() === 'true';


function getConstituentBadgeId() {
  const keyroot = 'ConstituentBadgeId';
  const fullkey = `${keyroot}`;
  let v = toInt(store.getItem(fullkey));

  return new Promise(function (resolve, reject) {
    if (v != null) { resolve(v); return; }

    $.ajax(`/help/badges`)
      .done(function (data) {
        const badges = $('.badge', data);
        const cBadge = badges.filter((i, el) => $(el).text().indexOf('Constituent') >= 0);
        v = Number(cBadge.attr('href').match(/\d+/)[0]);
        store.setItem(fullkey, v);
        resolve(v);
      })
      .fail(reject);
  });
}

function getLastElectionNum() {
  return new Promise(function (resolve, reject) {
    $.ajax(`/election/-1`)
      .done(function (data) {
        const elections = $('table.elections tr', data);
        const eLatest = elections.last().find('a').first().attr('href').match(/\d+$/)[0];
        let v = Number(eLatest);
        resolve(v);
      })
      .fail(reject);
  });
}

function getUserElectionNum(uid) {
  const keyroot = 'UserElectionNum';
  const fullkey = `${keyroot}:${uid}`;
  let v = toInt(store.getItem(fullkey));

  return new Promise(function (resolve, reject) {
    if (v != null) { resolve(v); return; }

    $.ajax(`/users/history/${uid}?type=Promoted+to+moderator+for+winning+an+election`)
      .done(function (data) {
        const hist = $('#user-history tbody tr', data);
        const eNum = hist.first().children().eq(2).text().match(/\d+/)[0];
        v = Number(eNum);
        store.setItem(fullkey, v);
        resolve(v);
      })
      .fail(reject);
  });
}

function getUserParticipationForElection(uid, electionNum) {
  const keyroot = 'UserParticipationForElection' + electionNum;
  const fullkey = `${keyroot}:${uid}`;
  let v = toBool(store.getItem(fullkey));

  return new Promise(function (resolve, reject) {
    if (v != null) { resolve(v); return; }

    $.get(`/help/badges/${constituentBadgeId}/constituent?userid=${uid}`)
      .done(function (data) {
        v = $(`.single-badge-reason a[href$="${electionNum}"]`, data).length == 1;
        store.setItem(fullkey, v);
        resolve(v);
      })
      .fail(reject);
  });
}

function getUsersParticipationForElection(uids, electionNum) {

  // For each group of userIds
  uids.forEach(uid =>
    // Get user participation for each user
    getUserParticipationForElection(uid, electionNum).then(function (v) {
      // Flair user if voted in the elections
      if (v) {
        $('.user-details, .comment-body, .question-status').find(`a[href^="/users/${uid}/"]`).addClass('election-supporter').attr('title', 'election supporter!');
        $('.user-page').find('.user-card-name .top-badge, h1 span').before(`<span class="election-supporter large" title="election supporter!"></span>`);
      }
    })
  );
}

function initUserElectionParticipation() {

  // Get all unique users on page except own
  let userIds = $('a[href^="/users/"]').map((i, el) => $(el).attr('href').match(/\d+/)[0]).get();
  userIds = userIds.filter(function (value, index, self) {
    return self.indexOf(value) === index && value !== selfId.toString();
  });

  // Stagger ajax calls using timeouts
  for (var i = 0; i < Math.ceil(userIds.length / 10); i++) {
    setTimeout(
      uids => getUsersParticipationForElection(uids, electionNum),
      3000 * i,
      userIds.slice(i * 10, i * 10 + 10)
    );
  }
}


// Append styles
addStylesheet(`
.election-supporter:after {
  content: '■';
  position: relative;
  top: -2px;
  margin-left: 3px;
  font-size: 12px;
  line-height: 1;
  color: var(--green-300);
}
.election-supporter.large:after {
  top: -4px;
  margin-left: 0;
  margin-right: 10px;
  font-size: 16px;
}
`); // end stylesheet


// On script run
(function init() {

  // We need the site's constituentBadgeId to proceed
  getConstituentBadgeId().then(function (v) {
    constituentBadgeId = v;

    // Which election number to use depends whether user is mod
    let promise = isModerator() ? getUserElectionNum(selfId) : getLastElectionNum();
    promise.then(function (v) {
      electionNum = v;

      console.log('constituentBadgeId: ' + constituentBadgeId);
      console.log('electionNum: ' + electionNum);

      // Validate required ids before continuing
      if (!isNaN(constituentBadgeId) && !isNaN(electionNum)) initUserElectionParticipation();
    });
  });
})();


// Debug functions to clear localStorage
_window.purgeElectionSupporterFlairs = () => {
  _window.lsRemoveItemsWithPrefix('LastElectionNum');
  _window.lsRemoveItemsWithPrefix('UserElectionNum');
  _window.lsRemoveItemsWithPrefix('UserParticipationForElection');
};