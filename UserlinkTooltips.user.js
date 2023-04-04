// ==UserScript==
// @name         Userlink Tooltips
// @description  Display reputation in tooltip upon user link mouseover
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      3.0
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
// @exclude      */tour
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/se-ajax-common.js
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

/* globals StackExchange */
/// <reference types="./globals" />

'use strict';

const apikey = '6WNNW7fOBHWKrUmONL3Row((';
const ownId = StackExchange.options.user.userId;
let cachedResults = [], userlinks;
let isRunning = false; // simple throttle


// Get user info
function getUserInfo(arrUids) {
  return new Promise(function (resolve, reject) {
    if (hasBackoff() || isRunning) { reject(); return; }
    if (typeof arrUids === 'undefined' || arrUids === null || arrUids.length == 0) { reject(); return; }
    if (arrUids.length > 100) arrUids = arrUids.slice(0, 100); // API supports up to 100 ids only

    isRunning = true;

    $.get(`https://api.stackexchange.com/2.2/users/${arrUids.join(';')}/?pagesize=100&order=desc&sort=reputation&site=${location.hostname}&filter=!40D5EWXuPI9Z0caGy&key=${apikey}`)
      .done(function (data) {
        addBackoff(data.backoff);
        resolve(data.items);
        return;
      })
      .fail(function () {
        addBackoff(30);
        reject();
      })
      .always(function () {
        isRunning = false;
      });
  });
}

function processResults(user) {
  userlinks
    .filter((i, el) => user.user_id == el.dataset.uid)
    .attr('title', `${user.reputation.toLocaleString('en-US')} reputation`)
    .attr('data-rep', `${user.reputation}`);
}

function processUserlinks() {

  // Only userlinks without title and from same hostname
  userlinks = $('#content a[href*="/users/"]')
    .filter((i, el) => el.title === '' && typeof el.dataset.rep === 'undefined' && el.href.includes(location.hostname))
    .each(function (i, el) {
      const id = (el.href.match(/-?\d+/) || ['']).pop();
      el.dataset.uid = id; // set computed data-uid
      if (id == '-1') el.dataset.rep = '1'; // community user
    });

  // Re-process new userlinks which were already previously cached (i.e.: more comments loaded)
  cachedResults.forEach(function (user) {
    processResults(user);
  });

  // Now get userlinks which rep is still unknown
  userlinks = userlinks.filter((i, el) => typeof el.dataset.rep === 'undefined');

  // Get array of non-empty and unique uids, ignoring own profile id
  const uids = userlinks.map((i, el) => el.dataset.uid).get().filter((v, i, self) => v !== '' && v != ownId && self.indexOf(v) === i);

  if (uids.length == 0) return;
  if (uids.length > 300) return; // hard limit

  getUserInfo(uids).then(function (users) {
    users.forEach(function (user) {
      cachedResults[user.user_id] = user;
      processResults(user);
    });

    $(document).one('ajaxStop', processUserlinks);
  });
}


// On page load
processUserlinks();
$(document).one('ajaxStop', processUserlinks);