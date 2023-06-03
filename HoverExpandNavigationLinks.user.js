// ==UserScript==
// @name         Hover Expand Navigation Links
// @description  On pagination dots "..." mouseover, adds more page links (max 30 per hover), keyboard shortcuts for jumping to prev/next pages
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

function listenToKeyboardEvents() {
  const pager = $('.s-pagination, .pager').not('.page-sizer').first();
  const pagerItems = pager.children('.s-pagination--item');
  //const currentPagerItem = pagerItems.filter('.is-selected');

  // Keyboard shortcuts event handler
  $(document).on('keydown', null, function (evt) {

    // Do nothing if key modifiers were pressed
    if (evt.shiftKey || evt.ctrlKey || evt.altKey) return;

    // Do nothing if a textbox or textarea is focused
    if ($('input:text:focus, textarea:focus').length > 0) return;

    const LEFTKEY = evt.keyCode == 37 || evt.key == 'ArrowLeft';
    const RIGHTKEY = evt.keyCode == 39 || evt.key == 'ArrowRight';
    const UPKEY = evt.keyCode == 38 || evt.key == 'ArrowUp';
    const DOWNKEY = evt.keyCode == 40 || evt.key == 'ArrowDown';

    //console.trace('HENL', 'keyup', evt);

    let newLocation = null;
    if (LEFTKEY) {
      newLocation = pagerItems.first().attr('href');
    }
    else if (RIGHTKEY) {
      newLocation = pagerItems.last().attr('href');
    }
    else if (UPKEY) {
      newLocation = pagerItems.filter('[rel="prev"]').next().attr('href') || pagerItems.first().attr('href');
    }
    else if (DOWNKEY) {
      newLocation = pagerItems.filter('[rel="next"]').prev().attr('href') || pagerItems.last().attr('href');
    }

    if (newLocation) {
      location.href = newLocation;
      return false;
    }
  });
}


// Append styles
addStylesheet(`
.pager .page-numbers,
.s-pagination .s-pagination--item {
  margin-bottom: 5px;
}
`); // end stylesheet


// On script run
(function init() {

  // Fix incorrect nav params on page load
  let queryparams = location.search.replace('?', '').replace(/&?page=\d+/i, '');
  if (queryparams.length > 0) queryparams += '&';
  $('.pager > a').each(function () {
    const matches = this.href.match(/[&?]page=(\d+)/i);
    if (matches && matches.length) {
      const page = matches[0].replace(/\D+/g, '');
      this.href = '?' + queryparams + 'page=' + page;
    }
  });

  $('#content').on('click mouseover', '.page-numbers.dots, .s-pagination--item__clear', function () {

    let queryparams = location.search.replace('?', '').replace(/&?page=\d+/i, '');
    if (queryparams.length > 0) queryparams += '&';

    let baseurl = this.previousElementSibling.pathname || '';
    let prevNum = +(this.previousElementSibling.innerText);
    let nextNum = +(this.nextElementSibling?.innerText);
    let removeWhenDone = true;
    if (nextNum - prevNum > 30) {
      nextNum = prevNum + 30;
      removeWhenDone = false;
    }

    for (let i = prevNum + 1; i < nextNum; i++) {
      $(`<a class="s-pagination--item" href="${baseurl}?${queryparams}page=${i}" title="go to page ${i}">${i}</a>`).insertBefore(this);
    }

    if (removeWhenDone) $(this).remove();
  });

  listenToKeyboardEvents();
})();