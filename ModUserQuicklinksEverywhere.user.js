// ==UserScript==
// @name         Mod User Quicklinks Everywhere
// @description  Adds quicklinks to user infobox in posts
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      4.1.10
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

/* globals StackExchange, parentUrl */
/// <reference types="./globals" />

'use strict';

// This is a moderator-only userscript
if (!isModerator()) return;

const isChildMeta = typeof StackExchange !== 'undefined' && StackExchange.options?.site?.isChildMeta;
const showOnHover = false;


function addUserLinks() {

  $('.post-user-info, .s-user-card, .user-details, .js-body-loader div.ai-center.fw-wrap')
    .filter(function () {
      // Do not add links to users in sidebar
      return $(this).closest('#sidebar').length === 0;
    })
    .not('.js-mod-quicklinks')
    .addClass('js-mod-quicklinks')
    .find('a[href^="/users/"]:first').each(function () {

      // Add Votes and IP-xref links after mod-flair if mod, or after the user link
      const uid = Number(this.href.match(/-?\d+/));
      const modFlair = $(this).next('.mod-flair');
      if (uid == -1 || modFlair.length == 1) return;

      const userlinks = `
        <div class="somu-mod-userlinks ${showOnHover ? 'show-on-hover' : ''}">
          <a target="_blank" href="${parentUrl}/users/account-info/${uid}" title="User Admin Page">mod</a>
          <a target="_blank" href="/admin/users/${uid}/post-comments" title="All Comments by User">cmnts</a>
          <a target="_blank" href="${parentUrl}/admin/show-user-votes/${uid}" title="Targeted Votes Tables">votes</a>
          <a target="_blank" href="${parentUrl}/admin/xref-user-ips/${uid}?daysback=30&threshold=2" title="IP Activity Cross-Reference">xref</a>
          <a target="_blank" href="${parentUrl}/admin/cm-message/create/${uid}?action=suspicious-voting" title="Compose CM Message (Suspicious Voting)" class="${isChildMeta ? 'd-none' : ''}">cm</a>
        </div>`;

      $(this).closest('.user-info, .s-user-card, .js-mod-quicklinks').append($(userlinks));
    });

  $('.user-info').addClass('js-mod-quicklinks');
}


// Append styles
addStylesheet(`
.user-info .user-details {
  position: relative;
}
.somu-mod-userlinks {
  display: flex;
  white-space: nowrap;
  font-size: 0.95em;
}
#questions .somu-mod-userlinks {
  /* No quicklinks in question lists */
  display: none;
}
.s-user-card .somu-mod-userlinks {
  /* New s-user-card uses grid, we want it in last position */
  order: 999;
  grid-column-start: 2;
  text-align: right;
}
.somu-mod-userlinks.show-on-hover {
  display: none;
}
.somu-mod-userlinks,
.somu-mod-userlinks a,
.started .somu-mod-userlinks a {
  color: var(--black-400);
}
.somu-mod-userlinks > a {
  display: inline-block;
  margin-right: 4px;
}
.somu-mod-userlinks a:hover,
.started .somu-mod-userlinks a:hover {
  color: var(--black);
}
.post-user-info:hover .somu-mod-userlinks,
.user-info:hover .somu-mod-userlinks {
  display: flex;
}
.flex--item + .somu-mod-userlinks {
  position: initial !important;
  display: inline-flex;
  width: auto;
  background: none;
  margin-left: 4px;
  margin-top: 1px;
}
/* review stats/leaderboard */
.stats-mainbar .task-stat-leaderboard .user-details {
  line-height: inherit;
}
`); // end stylesheet


// On script run
(function init() {
  $('.task-stat-leaderboard').removeClass('user-info');
  addUserLinks();

  // Page updates
  $(document).ajaxStop(addUserLinks);
  $(document).on('moduserquicklinks', addUserLinks);
})();