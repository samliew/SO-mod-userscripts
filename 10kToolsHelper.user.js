// ==UserScript==
// @name         10k Tools Helper
// @description  Expand all sections, and adds additional post type filters
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      3.2.11
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
    const buttonWrapper = makeElemFromHtml(`
<div class="modtools-filters-wrapper d-flex ai-center">Quick filters:&nbsp;
  <div class="modtools-filters flex--item fw-nowrap ml12 d-flex s-btn-group js-filter-btn">
    <button type="button" class="flex--item s-btn s-btn__muted s-btn__outlined" data-filter="q">Questions</button>
    <button type="button" class="flex--item s-btn s-btn__muted s-btn__outlined" data-filter="a">Answers</button>
  </div>
<div>`);
    document.querySelector('.tools-index-subtabs').appendChild(buttonWrapper);

    // Get all items, and add post type data attribute
    const items = document.querySelectorAll('.summary-table tr');
    items.forEach(tr => tr.dataset.postType = tr.querySelectorAll('.question-hyperlink').length ? 'q' : 'a');

    // On click, toggle items
    buttonWrapper.addEventListener('click', function (evt) {
      if (!evt.target.matches('button[data-filter]')) return;

      evt.target.classList.toggle('is-selected');
      const selectedButtons = buttonWrapper.querySelectorAll('button[data-filter].is-selected');

      // If both selected or unselected, show all
      if (selectedButtons.length != 1) {
        items.forEach(el => el.classList.remove('d-none'));
      }
      // Show only selected post type
      else {
        const activeFilter = selectedButtons[0].dataset.filter;
        items.forEach(el => el.classList.toggle('d-none', el.dataset.postType != activeFilter));
      }
    });
  }
};


// Append styles
addStylesheet(`
/* General 10k tools UI improvements */
.island div[data-mode="newTags"] table.summary-table.no-collapse tr {
  display: flex;
  flex-wrap: wrap;
}
.summary-table tr td {
  vertical-align: middle;
}
.summary-table tr a {
  word-break: break-word;
}
.summary-table tr a.question-hyperlink {
  font-size: var(--fs-body2);
}
.summary-table tr a.question-hyperlink:before {
  content: 'Q: ';
}
.summary-table tr a.answer-hyperlink:before {
  /* content: 'A: '; */
}

/* Show all collapsed items */
.summary-table tr.collapsing {
  display: table-row;
}
.expander-arrow-small-hide,
.summary-table tr.d-none {
  display: none !important;
}

/* Delete tabs filters */
.modtools-filters-wrapper {

}
.modtools-filters-wrapper .modtools-filters {

}
`); // end stylesheet


// On script run
(function init() {

  // Once on page load only
  $(document).one('ajaxStop', callbackWhenPageLoaded);
})();