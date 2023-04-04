// ==UserScript==
// @name         10k Tools Helper
// @description  Expand all sections, and adds additional post type filters
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      3.0
//
// @match        https://*.stackoverflow.com/tools*
// @match        https://*.serverfault.com/tools*
// @match        https://*.superuser.com/tools*
// @match        https://*.askubuntu.com/tools*
// @match        https://*.mathoverflow.net/tools*
// @match        https://*.stackapps.com/tools*
// @match        https://*.stackexchange.com/tools*
// @match        https://stackoverflowteams.com/c/*/tools*
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

const currentTab = document.querySelector('.tools-rev .js-filter-btn .youarehere');
const currentTabName = currentTab.dataset.value;

const callbackWhenPageLoaded = () => {

  if (currentTabName === 'stats') {
    // Unused
  }

  else if (currentTabName === 'migrated') {
    // Unused
  }

  else if (currentTabName === 'close') {
    // Unused
  }

  else if (currentTabName === 'delete') {

    // Add question and answer filters
    const buttonWrapper = $(`<div class="modtools-filters-wrapper grid">Quick filters:&nbsp;<div class="modtools-filters grid tt-capitalize">
  <a class="flex--item s-btn s-btn__muted s-btn__outlined py8 ws-nowrap is-selected" data-filter="q">questions</a>
  <a class="flex--item s-btn s-btn__muted s-btn__outlined py8 ws-nowrap is-selected" data-filter="a">answers</a>
</div><div>`).appendTo('.tools-index-subtabs');
    const buttons = buttonWrapper.find('[data-filter]');

    // Get all deleted items
    const items = $('.summary-table tr').each(function () {
      this.dataset.posttype = $(this).find('.question-hyperlink').length ? 'q' : 'a';
    });

    // On click, toggle items
    buttons.on('click', function () {
      $(this).toggleClass('is-selected');
      const selectedButtons = buttons.filter('.is-selected');

      // If both selected or unselected, show all
      if (selectedButtons.length != 1) {
        console.log('show all');
        items.removeClass('d-none');
      }
      else {
        const activeFilter = selectedButtons.attr('data-filter');
        console.log('show ' + activeFilter);
        items.addClass('d-none').filter((i, el) => el.dataset.posttype == activeFilter).removeClass('d-none');
      }
    });
  }
};


// Append styles
addStylesheet(`
.summary-table tr.collapsing {
  display: table-row;
}
.expander-arrow-small-hide,
.summary-table tr.d-none {
  display: none !important;
}
.modtools-filters,
.modtools-filters-wrapper {
  display: inline-flex;
  align-items: center;
}
.modtools-filters .is-selected {
  box-shadow: inset 1px 1px 2px 0px rgba(0,0,0,0.3);
}
.modtools-filters a {
  float: none;
  padding: .8em;
  line-height: 1.15384615;
}
.modtools-filters a:first-child {
  border-bottom-right-radius: 0 !important;
  border-top-right-radius: 0 !important;
}
.modtools-filters a + a {
  border-bottom-left-radius: 0 !important;
  border-top-left-radius: 0 !important;
  border-left: 0;
  margin-left: -1px;
}
`); // end stylesheet


// On script run
(function init() {

  // Once on page load only
  $(document).one('ajaxStop', callbackWhenPageLoaded);
})();