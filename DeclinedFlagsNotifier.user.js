// ==UserScript==
// @name         Declined Flags Notifier
// @description  Show topbar indicator for recently declined flags
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

/* globals StackExchange, MS */
/// <reference types="./globals" />

'use strict';

const recent = new Date(Date.now() - 3 * MS.oneDay); // three days ago
const declinedFlagsResults = $(`<div id="declined-flags-results" style="display:none !important;"></div>`).appendTo(document.body);
let declinedFlags = [], recentlyDeclinedFlags = [], weeklyDeclinedFlags = [], oldDeclinedFlags = [];

function fetchDeclinedFlags(uid) {
  return new Promise(function (resolve, reject) {
    let deferreds = [], pages = [
      `${location.origin}/users/flag-summary/${uid}?group=1&status=3`,
      `${location.origin}/users/flag-summary/${uid}?group=4&status=3`,
      `${location.origin}/users/flag-summary/${uid}?group=2&status=3`,
      `${location.origin}/users/flag-summary/${uid}?group=3&status=3`,
    ], flagTypes = [
      'post', 'comment', 'spam', 'rude/abusive'
    ];

    // Load each type of declined flags pages, because we can't differentiate flag types if we load the "All" declined flags page
    pages.forEach(function (url, i) {
      const page = $(`<div data-url="${url}" data-flagtype="${flagTypes[i]}"></div>`).appendTo(declinedFlagsResults);
      const ajaxReq = page.load(url + ' #mainbar .flagged-post', function () {
        page.children().attr('data-flagtype', flagTypes[i]);
      });
      deferreds.push(ajaxReq);
    });

    // Resolve when all pages load
    $.when.all(deferreds).then(function () {
      console.log('loaded all declined flags');

      // Short delay to allow elems to be added to page
      setTimeout(() => {

        declinedFlags = declinedFlagsResults.find('.flagged-post').map(function () {
          return {
            flagType: $(this).attr('data-flagtype'),
            permalink: $(this).find('.answer-hyperlink, .question-hyperlink').first().attr('href'),
            flagText: $(this).find('.revision-comment').text(),
            flagDate: new Date($(this).find('.relativetime').last().attr('title')),
            flagRelativeTime: $(this).find('.relativetime').last().text(),
            response: $(this).find('.flag-outcome').text().replace(/^\s*declined\s+- /, '').trim(),
          };
        }).get();

        recentlyDeclinedFlags = declinedFlags.filter(v => v.flagDate >= recent);

        resolve();
      }, 1000);
    }, reject);
  });
}


// Append styles
addStylesheet(`
.declined-flags-button-item .js-unread-count {
  transform: translateY(16px);
}
.topbar-dialog.flag-dialog {
  width: 400px;
  max-height: 505px;
}

.topbar-dialog.flag-dialog .modal-content {
  min-height: 390px;
  max-height: 390px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-color: var(--scrollbar) transparent;
}
.topbar-dialog.flag-dialog .modal-content::-webkit-scrollbar {
  width: 10px;
  height: 10px;
  background-color: transparent
}
.topbar-dialog.flag-dialog .modal-content::-webkit-scrollbar-track {
  border-radius: 10px;
  background-color: transparent
}
.topbar-dialog.flag-dialog .modal-content::-webkit-scrollbar-thumb {
  border-radius: 10px;
  background-color: var(--scrollbar)
}
.topbar-dialog.flag-dialog .modal-content::-webkit-scrollbar-corner {
  background-color: transparent;
  border-color: transparent
}

.topbar-dialog.flag-dialog .inbox-item .item-content .item-header {
  color: var(--black-400);
}
.topbar-dialog.flag-dialog .inbox-item .item-content .item-creation {
  float: right;
}
.topbar-dialog.flag-dialog .inbox-item .item-content .item-location {
  margin: 4px 0;
  word-break: break-all;
}
.topbar-dialog.flag-dialog .inbox-item .item-content .item-summary {
  color: var(--black-700);
}
`); // end stylesheet


// On script run
(function init() {

  // User is already a moderator, do nothing since mods don't usually decline mod flags and don't need to be notified
  if (isModerator()) return;

  // Add link to declined flags in topbar
  const flagBadgeLink = $(`
    <li class="-item declined-flags-button-item">
      <a href="${location.origin}/users/flag-summary/${StackExchange.options.user.userId}?status=3" class="-link js-flagbadge-button" aria-label="Flags" title="Recent inbox messages" role="menuitem" aria-haspopup="true" aria-expanded="false">
        <svg aria-hidden="true" class="svg-icon iconFlag" width="20" height="20" viewBox="0 0 18 18"><path d="M3 2v14h2v-6h3.6l.4 1h6V3H9.5L9 2H3z"></path></svg>
        <span class="indicator-badge js-unread-count _important d-none">0</span>
      </a>
    </li>`).insertBefore('.inbox-button-item');

  const flagModal = $(`
    <li role="presentation" class="d-none"><div class="topbar-dialog flag-dialog" role="menu">
      <div class="header">
        <h3>recently declined flags</h3>
        <div class="-right">
          <a href="${location.origin}/users/flag-summary/${StackExchange.options.user.userId}?status=3">see declined flags</a>
        </div>
      </div>
      <div class="modal-content">
      </div>
    </div></li>`).insertAfter(flagBadgeLink);

  flagBadgeLink.on('click', function () {

    // Hide other topbar dialogs if open
    $(this).siblings().find('.topbar-icon-on').removeClass('topbar-icon-on');
    $(this).next().siblings().find('.topbar-dialog').hide();

    // Show active state on icon
    $(this).children().addClass('topbar-icon-on');

    // Show items
    flagModal.toggleClass('d-none');
    flagModal.children('.topbar-dialog').css({
      top: flagBadgeLink.height(),
      right: $(window).width() - flagBadgeLink.offset().left - flagBadgeLink.width() - (flagModal.width() * 2),
    });

    // Hide dialog when body clicked
    $(document.body).one('click', function () {
      flagModal.addClass('d-none');
      flagBadgeLink.children().removeClass('topbar-icon-on');
    });

    return false;
  });

  fetchDeclinedFlags(StackExchange.options.user.userId).then(() => {
    console.log('recently declined flags', recentlyDeclinedFlags);

    // No declined flags, do nothing
    if (recentlyDeclinedFlags.length === 0) {

      // Show "no results" in modal content
      $('.topbar-dialog.flag-dialog .modal-content').html('<ul><li><div class="item-content flex--item fl1 pl12">none!</div></li></ul>');

      return;
    }

    // Has recently declined flags, alert
    let declinedFlagsContent = '<ul></ul>';
    recentlyDeclinedFlags.forEach(function (v, i) {
      const d = v.flagDate.toISOString().replace('T', ' ').replace(/\.\d+/, '');
      declinedFlagsContent += `
        <li class="inbox-item">
          <a href="${v.permalink}" class="grid gs8 gsx">
            <div class="item-content flex--item fl1">
              <div class="item-header">
                <span class="item-type">${v.flagType} flag</span>
                <span class="item-creation"><span title="${d}" class="relativetime" data-timestamp="${d}">${v.flagRelativeTime}</span></span>
              </div>
              <div class="item-location">${v.flagText}</div>
              <div class="item-summary">${v.response}</div>
            </div>
          </a>
        </li>`;
    });

    // Append recently declined flags to modal content
    $('.topbar-dialog.flag-dialog .modal-content').html(declinedFlagsContent);

    // Show number of items
    flagBadgeLink.find('.js-unread-count').text(recentlyDeclinedFlags.length).removeClass('d-none');
  });
})();