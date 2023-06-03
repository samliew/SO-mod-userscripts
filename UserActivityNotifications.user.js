// ==UserScript==
// @name         User Activity Notifications
// @description  Display notifications on user profile when new activity is detected since page load
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      2.0.10
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

const apikey = 'dhFaTnM59qx5gK807L7dNw((';
const pollInterval = 60;  // How often script checks for new activity
const startFromMins = 20; // On page load, show recent activity from x minutes ago

let lastCheckedDate = Math.floor(Date.now() / 1000) - startFromMins * 60;
let interval;
let currUserId, username, shortname;


// If user accepts, we can show native notifications
function initNotify(callback) {
  if ("Notification" in window && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
}
if ("Notification" in window === false) {
  console.error("This browser does not support notifications.");
}
else if (Notification.permission !== 'granted') {
  initNotify();
}


// Get site favicon, adapted from https://stackoverflow.com/a/10283308
let siteIcon = (function () {
  let ico = undefined;
  const nodeList = document.getElementsByTagName("link");
  for (var i = 0; i < nodeList.length; i++) {
    if (nodeList[i].getAttribute("rel") == "icon" || nodeList[i].getAttribute("rel") == "shortcut icon") {
      ico = nodeList[i].getAttribute("href");
      break;
    }
  }
  return ico;
})();


// Show native notification
function notify(title, link, options = {}, dismissAfter = 15) {

  // User has not enabled notifications yet, try to request
  if (Notification.permission === 'default') {
    console.log('Notifications permission not granted yet.');
    initNotify(function () {
      notify(title, link, options, dismissAfter);
    });
    return false;
  }

  // Sanitize
  title = htmlDecode(title);
  options.body = htmlDecode(options.body);

  $.extend(options, {
    silent: true,
    noscreen: true,
    icon: siteIcon,
    badge: siteIcon,
  });
  //console.log(title, options);

  let n = new Notification(title, options);

  // Open content if notification clicked
  if (typeof link !== 'undefined' && link != null) {
    n.onclick = function (evt) {
      evt.preventDefault(); // prevent the browser from focusing the triggering Notification's tab
      window.open(link, '_blank');
    };
  }
  else {
    n.onclick = function (evt) {
      evt.preventDefault(); // prevent the browser from focusing the triggering Notification's tab
    };
  }

  // Auto-dismiss notification
  if (dismissAfter > 0) setTimeout(n.close.bind(n), dismissAfter * 1000, n);

  // Dismiss notification on page unload
  window.addEventListener('beforeunload', function (evt) {
    try { n.close(); }
    catch (e) { }
  });

  return n;
}


// Get user timeline
function getUserInfo(uid, fromdate = 0) {
  return new Promise(function (resolve, reject) {
    if (hasBackoff()) { reject(); return; }
    if (typeof uid === 'undefined' || uid === null) { reject(); return; }
    $.get(`${seApiUrl}/users/${uid}/timeline?pagesize=${Math.ceil(pollInterval / 2)}&fromdate=${lastCheckedDate}&site=${location.hostname}&filter=!))yem8S&key=${apikey}`)
      .done(function (data) {
        lastCheckedDate = Math.floor(Date.now() / 1000);
        if (data.backoff) backoff = addBackoff(data.backoff);
        resolve(data.items);
        return;
      })
      .fail(function () {
        addBackoff(5);
        reject();
      });
  });
}


function scheduledTask() {
  getUserInfo(currUserId).then(function (v) {
    // Take latest three
    v.slice(-3).forEach(function (w) {
      let action = w.timeline_type;
      let text = w.title;
      let url = w.link;
      switch (w.timeline_type) {
        case 'commented': action = 'commented'; text = w.detail;
          break;
        case 'revision': action = 'edited post';
          break;
        case 'suggested': action = 'suggested edit';
          break;
        case 'reviewed': action = 'reviewed edit';
          break;
        case 'answer': action = 'posted answer';
          break;
        case 'question': action = 'asked question';
          break;
        case 'accepted': action = 'accepted answer';
          break;
        case 'badge': action = 'earned badge'; text = w.detail; url = null;
          break;
      }
      notify(`${shortname} ${action}`, url, {
        body: text
      });
    });
  });
}


// On script run
(function init() {

  // Do not run if not on user page
  if (!document.body.classList.contains('user-page') || !location.pathname.includes('/users/')) return;
  // Do not run if user is deleted
  if (document.title.contains('User deleted')) return;

  // Get user details
  currUserId = Number(location.pathname.match(/\/\d+/)[0].replace('/', ''));
  username = $('.profile-user--name > div:first, .mini-avatar .name').text().replace('♦', '').replace(/\s+/g, ' ').trim();
  shortname = username.split(' ')[0].substr(0, 12).trim();

  // Run once on page load, then start polling API occasionally
  scheduledTask();
  interval = setInterval(scheduledTask, pollInterval * 1000);
})();