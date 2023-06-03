// ==UserScript==
// @name         Refresh Empty Mod Queue
// @description  If current mod queue is empty, reload page occasionally
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      4.1.11
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

/* globals StackExchange, _window */
/// <reference types="./globals" />

'use strict';

const goToMain = () => location.href = '/admin/dashboard?filtered=false';
const reloadPage = () => location.search.contains('filtered=false') ? location.reload() : location.search += (location.search.length == 0 ? '' : '&') + 'filtered=false';
let timeoutSecs = _window.modRefreshInterval || 10;
let timeout, interval;

/**
 * @summary Trigger page refresh
 * @param {boolean} main - Go to main dashboard instead of reloading page
 */
const initRefresh = function (main = false) {

  if ($('.js-flagged-post:visible, .flagged-post-row:visible').length > 0) return;
  if (timeoutSecs < 1) timeoutSecs = 5;

  // Function called again, reset
  if (timeout || interval) {
    clearTimeout(timeout);
    clearInterval(interval);
    timeout = null;
    interval = null;
    $('#somu-refresh-queue-counter').remove();
  }

  let c = timeoutSecs;
  $(`<div id="somu-refresh-queue-counter">Refreshing page in <b id="refresh-counter">${timeoutSecs}</b> seconds...</div>`).appendTo('body');

  // Main timeout
  timeout = setTimeout(main ? goToMain : reloadPage, timeoutSecs * 1000);

  // Counter update interval
  interval = setInterval(function () {
    $('#refresh-counter').text(--c > 0 ? c : 0);
  }, 1000);
};
// Function promoted to global scope for use in other scripts
_window.initRefresh = initRefresh;


// Append styles
addStylesheet(`
#somu-refresh-queue-counter {
  position:fixed;
  bottom:0;
  left:50%;
  line-height:2em;
  transform:translateX(-50%);
}
.js-admin-dashboard > div > div > fieldset {
  display: none;
}
`); // end stylesheet


// On script run
(function init() {

  // If no mod flags, insert mod flags indicator in header anyway...
  if ($('.js-admin-dashboard-button').length === 0) {
    $('.js-mod-inbox-button').parent().after(`
      <li><a href="/admin/dashboard" class="s-topbar--item px4 js-admin-dashboard-button" aria-label="no flagged posts" title="no posts flagged for moderator attention">
        <span class="s-badge s-badge__bounty">0</span>
      </a></li>`);
  }

  // If not on mod flag pages, ignore rest of script
  if (!isModDashboardPage || ($('.js-admin-dashboard').length == 0 && !document.body.classList.contains('flag-page'))) return;

  // If completely no post flags, redirect to main
  if ($('.s-sidebarwidget--header .bounty-indicator-tab').length === 0 && $('.so-flag, .m-flag, .c-flag').length === 0) {
    initRefresh(true);
  }
  // Refresh if no flags left in current queue
  else {
    initRefresh();
  }

  // On user action on page, restart and lengthen countdown
  $(document).on('mouseup keyup', 'body', function () {
    if (timeout) timeoutSecs++;
    initRefresh();
  });

  // On skip post link click
  $('.js-flagged-post, .flagged-post-row').on('click', '.skip-post', initRefresh);

  // When ajax requests have completed
  $(document).ajaxComplete(function (event, xhr, settings) {

    // If post deleted, remove from queue
    if (!settings.url.includes('/comments/') && settings.url.includes('/vote/10')) {
      const pid = settings.url.match(/\/\d+\//)[0].replace(/\//g, '');
      $('#flagged-' + pid).remove();

      // Refresh if no flags in current queue
      initRefresh();
    }
  });

  // When flags are handled, refresh if no flags in current queue
  $(document).ajaxStop(initRefresh);
})();