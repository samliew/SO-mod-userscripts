// ==UserScript==
// @name         User Info Sidebar
// @description  Adds user moderation links sidebar with quicklinks & user details (from Mod Dashboard) to user-specific pages
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      4.1.2
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
// @match        https://chat.stackexchange.com/*
// @match        https://chat.meta.stackexchange.com/*
// @match        https://chat.stackoverflow.com/*
//
// @exclude      */admin/user-activity*
// @exclude      */admin/dashboard*
//
// @exclude      https://api.stackexchange.com/*
// @exclude      https://data.stackexchange.com/*
// @exclude      https://contests.stackoverflow.com/*
// @exclude      https://winterbash*.stackexchange.com/*
// @exclude      *blog.*
// @exclude      */tour
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/se-ajax-common.js
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
//
// @grant        GM_xmlhttpRequest
// ==/UserScript==

/* globals StackExchange, isMetaSite, parentUrl */
/// <reference types="./globals" />

'use strict';

// This is a moderator-only userscript
if (!isModerator()) return;

let uid;


function getChatParentUser() {
  const parentuser = $('.user-stats a').last().attr('href');
  return parentuser ? 'https:' + parentuser : '';
}

function getCurrentUserId() {

  // Mod & CM messages
  if (location.pathname.includes('/users/message/') || location.pathname.includes('/admin/cm-message/')) {
    const userLink = $('.msg-moderator:first a[href^="/users/"], #js-msg-form .user-details a, #msg-form .user-details a:first').last();
    return userLink.attr('href').match(/\d+/)?.shift() ?? null;
  }

  // User & user admin pages
  if (document.body.classList.contains('user-page') || (/[/-]users?[/-]/.test(location.href)) && document.body.classList.contains('mod-page')) {
    return location.href.match(/\d+/)?.shift() ?? null;
  }

  // Chat
  if (isChat && location.pathname.includes('/users/')) {
    const parentuser = getChatParentUser();
    return parentuser?.match(/\d+/)?.shift() ?? null;
  }

  // Question asker
  const questionUser = $('#question .post-signature:last a[href*="/users/"]').first();
  if (questionUser.length) {
    return questionUser.attr('href').match(/\d+/)?.shift() ?? null;
  }

  // Default
  return null;
}


function doChatSidebar() {

  const userDashboardPage = getChatParentUser().replace('/users/', '/users/account-info/').replace(/\D+$/, '');
  const mainSiteHostname = userDashboardPage.split('/users/')[0];

  ajaxPromise(userDashboardPage).then(function (data) {

    const modContent = $('#mod-content', data);

    // Get username
    const username = $('h1', modContent).first().get(0).childNodes[0].nodeValue.trim();

    // Modify quicklinks and user details, then append to page
    const quickLinks = $('div.mod-links', modContent).attr('id', 'usersidebar');
    const modActions = quickLinks.find('.mod-actions');

    // Move contact links
    modActions.find('li').slice(-4, -2).appendTo(quickLinks.find('ul:first'));

    // Remove other actions as they need additional work to get popup working
    modActions.last().remove();

    // Headers
    const infoHeader = quickLinks.find('h3').last().text(username).prependTo(quickLinks);

    // Insert user details
    const info = $('.mod-section .details', modContent).insertAfter(infoHeader);
    info.children('.row').each(function () {
      $(this).children().first().unwrap();
    });

    // Transform user details to list format
    info.children('.col-2').removeClass('col-2').addClass('info-header');
    info.children('.col-4').removeClass('col-4').addClass('info-value');

    // Change xref link to month to be more useful (default was week)
    quickLinks.find('a[href*="xref-user-ips"]').attr('href', (i, v) => v += '?daysback=30&threshold=2');

    // Prepend Mod dashboard link
    quickLinks.find('ul').prepend(`<li><a href="/users/account-info/${uid}">mod dashboard</a></li>`);

    // Since we are on chat, transform links to main links
    $('a[href^="/"]', info).attr('href', (i, v) => mainSiteHostname + v);
    $('.mod-quick-links a', quickLinks).attr('href', (i, v) => mainSiteHostname + v);

    // Check if user is currently suspended, highlight username
    const susMsg = $('.system-alert', data).first().text();
    if (susMsg.indexOf('suspended') >= 0) {
      const susDur = susMsg.split('ends')[1].replace(/(^\s|(\s|\.)+$)/g, '');
      quickLinks.find('h3').first().attr({ style: 'color: var(--red-500) !important;' }).attr('title', `currently suspended (ends ${susDur})`);
    }

    // Add links to all three chat domains
    const chatlinkSO = info.find('a[href^="https://chat."]').text('SO').attr('href', function (i, href) {
      return href.replace('//accounts', '/accounts').replace(/(?:meta\.)?stackexchange\.com/, 'stackoverflow.com');
    }).addClass('d-inline-block mr12 fs-body2');

    const chatlinkSE = chatlinkSO.clone(true).attr('href', function (i, href) {
      return href.replace('stackoverflow.com', 'stackexchange.com');
    }).text('SE').insertAfter(chatlinkSO);

    const chatlinkMSE = chatlinkSO.clone(true).attr('href', function (i, href) {
      return href.replace('stackoverflow.com', 'meta.stackexchange.com');
    }).text('MSE').insertAfter(chatlinkSE);

    // Links in sidebar open in new tabs
    quickLinks.find('a').attr('target', '_blank');

    // Add bgcolor to num of annotations and flags for user
    $('.bounty-indicator-tab', quickLinks).slice(0, 2).each(function (i, el) {
      const linkText = $(this).next('a').text();
      el.classList.add(linkText.includes('annotations') ? 'supernovabg' : 'hotbg');
    });

    // Append to page
    $('body').append(quickLinks);
  });

  // Show sidebar on desktop
  const isDesktop = () => $(document).width() >= 1400;
  const updateOpenSidebar = () => {
    $('body').toggleClass('usersidebar-open', isDesktop());
  };

  // On page load and resize
  updateOpenSidebar();
  $(document).on('ready', updateOpenSidebar);
  $(window).on('load resize', updateOpenSidebar);
}


function doMainSidebar() {

  // If on user dashboard page
  if (location.pathname.includes('/users/account-info/')) {

    // Add bgcolor to num of annotations and flags for user
    $('.mod-links .bounty-indicator-tab').slice(0, 2).each(function (i, el) {
      const linkText = $(this).next('a').text();
      el.classList.add(linkText.includes('annotations') ? 'supernovabg' : 'hotbg');
    });

    // If on meta,
    if (isMetaSite) {

      // Enable contact user link (auto redirects to main)
      $('.mod-links span.disabled').filter((i, v) => v.innerText.includes('contact user')).replaceWith(`<a title="use to contact this user and optionally suspend them" href="/users/message/create/${uid}">contact user</a>`);
    }

    // Don't do sidebar
    //return;
  }

  // Get user's mod dashboard page
  $.get('/users/account-info/' + uid, function (data) {

    // If deletion record not found, do nothing
    if (data.includes('Could not find a user or deletion record')) return;

    const modContent = $('#mod-content', data);

    // Get username
    const username = $('h1', modContent).first().get(0)?.childNodes[0].nodeValue.trim();
    if(!username) return; // deleted user

    // Modify quicklinks and user details, then append to page
    const quickLinks = $('div.mod-links', modContent).attr('id', 'usersidebar');
    const modActions = quickLinks.find('.mod-actions');

    // Move contact links
    modActions.find('li').slice(-4, -2).appendTo(quickLinks.find('ul:first'));

    // Remove other actions as they need additional work to get popup working
    modActions.last().remove();

    // Headers
    const infoHeader = quickLinks.find('h3').last().text(username).prependTo(quickLinks);

    // Insert user details
    const info = $('.mod-section .details', modContent).insertAfter(infoHeader);
    info.children('.row').each(function () {
      $(this).children().first().unwrap();
    });

    // Transform user details to list format
    info.children('.col-2').removeClass('col-2').addClass('info-header');
    info.children('.col-4').removeClass('col-4').addClass('info-value');

    // Change xref link to month to be more useful (default was week)
    quickLinks.find('a[href*="xref-user-ips"]').attr('href', (i, v) => v += '?daysback=30&threshold=2');

    // Prepend Mod dashboard link
    quickLinks.find('ul').prepend(`<li><a href="/users/account-info/${uid}">mod dashboard</a></li>`);

    // If on meta,
    if (isMetaSite) {
      // Enable contact user link
      $('.mod-quick-links span.disabled', quickLinks).replaceWith(`<a title="use to contact this user and optionally suspend them" href="/users/message/create/${uid}">contact user</a>`);

      // change links to main
      $('.mod-quick-links a', quickLinks).attr('href', (i, v) => parentUrl + v);
    }

    // Check if user is currently suspended, highlight username
    const susMsg = $('.system-alert', data).first().text();
    if (susMsg.indexOf('suspended') >= 0) {
      const susDur = susMsg.split('ends')[1].replace(/(^\s|(\s|\.)+$)/g, '');
      quickLinks.find('h3').first().attr({ style: 'color: var(--red-500) !important;' }).attr('title', `currently suspended (ends ${susDur})`);
    }

    // Add links to all three chat domains
    const chatlinkSO = info.find('a[href^="https://chat."]').text('SO').attr('href', function (i, href) {
      return href.replace('//accounts', '/accounts').replace(/(?:meta\.)?stackexchange\.com/, 'stackoverflow.com');
    }).addClass('d-inline-block mr12 fs-body2');

    const chatlinkSE = chatlinkSO.clone(true).attr('href', function (i, href) {
      return href.replace('stackoverflow.com', 'stackexchange.com');
    }).text('SE').insertAfter(chatlinkSO);

    const chatlinkMSE = chatlinkSO.clone(true).attr('href', function (i, href) {
      return href.replace('stackoverflow.com', 'meta.stackexchange.com');
    }).text('MSE').insertAfter(chatlinkSE);

    // Links in sidebar open in new tabs
    quickLinks.find('a').attr('target', '_blank');

    // Add bgcolor to num of annotations and flags for user
    $('.bounty-indicator-tab', quickLinks).slice(0, 2).each(function (i, el) {
      const linkText = $(this).next('a').text();
      el.classList.add(linkText.includes('annotations') ? 'supernovabg' : 'hotbg');
    });

    // Append to page
    $('body').append(quickLinks);
  });

  // Handle resize
  $(window).on('load resize', function () {
    $('body').toggleClass('usersidebar-open', $(document).width() >= 1720);
  });
}


// Append styles
addStylesheet(`
.s-table th, .s-table td {
  padding: 3px;
}
.js-profile-mod-info table td.mod-label {
  font-weight: bold;
}

/* copied from main site as chat doesn't have this style */
.mod-links li {
  margin-bottom: 5px;
}
.bounty-indicator-tab {
  color: var(--white) !important;
  display: inline;
  background-color: var(--blue-600);
  padding: 0.25em 0.5em 0.1em;
  margin-right: 5px;
  font-size: var(--fs-fine);
  line-height: 1.3;
  border-radius: 2px;
}
.bounty-indicator-tab.supernovabg {
  background: var(--orange-400) !important;
}
.bounty-indicator-tab.hotbg {
  background-color: var(--orange-600) !important;
}

#usersidebar * {
  box-sizing: border-box;
}
#usersidebar {
  position: fixed;
  z-index: 8950;
  top: 44px;
  right: 100%;
  width: 230px;
  max-height: calc(100vh - 50px);
  padding: 10px 12px 0;
  background: var(--white);
  opacity: 0.7;
  border: 1px solid var(--black-150);
  box-shadow: 2px 2px 14px -3px rgba(0,0,0,0.25);
}
#usersidebar:after {
  content: 'user';
  position: absolute;
  left: 100%;
  top: 5px;
  width: 40px;
  height: 30px;
  padding: 5px 8px;
  background: var(--white);
  border: 1px solid var(--black-150);
  border-left: none;
  box-shadow: 3px 2px 10px -2px rgba(0,0,0,0.25);
  box-sizing: border-box;
}
.usersidebar-open #usersidebar,
#usersidebar:hover {
  left: -1px;
  right: initial;
  opacity: 1;
}
.usersidebar-open #usersidebar {
  top: 50px;
  box-shadow: none;
}
.usersidebar-open #usersidebar:after {
  display: none;
}
#usersidebar .profile-section-title {
  margin-bottom: 15px !important;
  padding-left: 0px !important;
}
#usersidebar .details {
  margin-bottom: 15px;
}
#usersidebar .details .info-header {
  font-size: 0.95em;
  font-style: italic;
  color: var(--black-500);
}
#usersidebar .details .info-value {
  margin-bottom: 10px;
}
#usersidebar .details > div:nth-child(-n + 2),
#usersidebar .details > div:nth-child(n+7):nth-child(-n+8),
#usersidebar .details > div:nth-child(n+13):nth-child(-n+14),
#usersidebar .details > div:nth-child(n+19) {
  display: none;
}
#usersidebar .details a[href^="https://stackexchange.com/users/"] {
  font-size: var(--fs-body2);
}
.mod-quick-links .bounty-indicator-tab {
  float: left;
  margin-right: 4px !important;
}

/* Fullscreen snippets always on top */
.snippet.expanded-snippet {
  z-index: 9999999 !important;
}

@media screen and (max-height: 740px) {
  #usersidebar {
    top: 0px !important;
    max-height: 100vh;
  }
  #usersidebar:after {
    top: 49px;
  }
  #usersidebar .details {
    line-height: 1.2;
  }
  #usersidebar ul li {
    margin-bottom: 2px;
  }
}
`); // end stylesheet


// On script run
(function init() {
  setTimeout(() => {
    uid = getCurrentUserId();
    if (!uid) return;

    isChat ? doChatSidebar() : doMainSidebar();
  }, 100);
})();