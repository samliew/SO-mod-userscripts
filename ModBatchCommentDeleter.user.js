// ==UserScript==
// @name         Mod Batch Comment Deleter
// @description  Batch delete comments using comment IDs or permalinks (e.g.: from SEDE https://data.stackexchange.com/stackoverflow/query/1131935)
// @homepage     https://github.com/samliew/personal-userscripts
// @author       Samuel Liew
// @version      4.0.12
//
// @match        https://*.stackoverflow.com/admin/deleter
// @match        https://*.serverfault.com/admin/deleter
// @match        https://*.superuser.com/admin/deleter
// @match        https://*.askubuntu.com/admin/deleter
// @match        https://*.mathoverflow.net/admin/deleter
// @match        https://*.stackapps.com/admin/deleter
// @match        https://*.stackexchange.com/admin/deleter
// @match        https://stackoverflowteams.com/c/*/admin/deleter
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

/* globals StackExchange, fkey */
/// <reference types="./globals" />

'use strict';

const params = {
  itemsPerBatch: 1000,
  delayPerBatch: 5000,
};
let content, button, preview, textarea;
let isRunning = false;
let failures = 0, retryCount = 0;


// In case the batch endpoint is removed, we can use this to delete one by one
function deleteOne(url, callback = null) {
  $.ajax({
    url: url,
    method: 'POST',
    data: {
      fkey: fkey,
      sendCommentBackInMessage: false
    },
    dataType: 'json',
  }).done(function (response) {
    if (response.success == false) {
      failures++;
    }
    if (typeof callback == 'function') callback();
  }).fail(function (jqXHR, textStatus, errorThrown) {
    failures++;
  });
}

// Bulk delete a batch of 1000 comments
function bulkDeleteComments(commentIds) {
  return new Promise(function (resolve, reject) {
    if (typeof commentIds === 'undefined' || commentIds.length === 0) { reject(); return; }

    const datastring = 'commentIds%5B%5D=' + commentIds.join('&commentIds%5B%5D=') + '&action=delete&fkey=' + fkey;
    $.post(`${location.origin}/admin/comment/bulk-comment-change`, datastring)
      .done(function (response) {
        if (response.includes('ok') === false) {
          failures++;
        }
      }).fail(function () {
        failures++;
      });
  });
}

// Process queue
let doDeleteAll = function () {
  const startTime = new Date();
  let linkElems = preview.find('a').hide();
  //let links = linkElems.get().map(el => {
  //    if(!el.href.includes('/vote/10')) { return el.href + '/vote/10' }
  //    return el.href;
  //});
  let commentIds = linkElems.get().map(el => el.href.match(/\/(\d+)/)[1]);
  let total = typeof links !== 'undefined' ? links.length : commentIds.length;
  let currentNum = 0;

  linkElems.remove(); // Save memory?

  // Calculate and update progress
  function updateProgress() {
    const minsElapsed = (Date.now() - startTime) / 60000;
    const minsRemaining = (minsElapsed / currentNum) * (total - currentNum);
    document.title = `${currentNum.toLocaleString()}/${total.toLocaleString()} (${(currentNum / total * 100).toFixed(1)}%)`;
    preview.text(document.title + `. ${Math.floor(minsElapsed)} mins elapsed, ${Math.round(minsRemaining)} mins remaining`);
  }

  // Callback
  function processNextBatch() {
    if (currentNum >= total) cleanup();
    //links.slice(currentNum, currentNum + params.itemsPerBatch).forEach(v => { deleteOne(v); });
    bulkDeleteComments(commentIds.slice(currentNum, currentNum + params.itemsPerBatch));
    currentNum += params.itemsPerBatch;
    if (currentNum > total) currentNum = total;
  }

  // After a batch of ajax calls complete
  $(document).unbind('ajaxStop').ajaxStop(function () {
    updateProgress();

    // Some errors, wait and try up to 3 times
    if (failures > 1) {

      // Too many errors, stop
      if (retryCount >= 10) {
        cleanup(true);
        return;
      }

      // Reset and try last batch again in 2 minutes
      retryCount++;
      failures = 0;
      $('input[data-param-name="itemsPerBatch"]').val('20').trigger('change');
      $('input[data-param-name="delayPerBatch"]').val('20').trigger('change');
      currentNum -= params.itemsPerBatch;
      setTimeout(processNextBatch, 300000);
    }
    // Continue next batch after a delay
    else {
      setTimeout(processNextBatch, params.delayPerBatch);
    }
  });

  // Begin
  isRunning = true;
  processNextBatch();

  // Confirm when leaving page if batch script running
  $(window).on('beforeunload', function (evt) {
    return isRunning && confirm('Are you sure you wish to leave this page?');
  });

  // Stop everything and exit
  function cleanup(hasError = false) {
    isRunning = false;
    $(document).unbind('ajaxStop');
    $(window).off('beforeunload');

    button.remove();

    const endTime = new Date();
    preview.text(hasError ?
      `Receiving response errors. Check if you are rate-limited or these items are already deleted. Stopped at ${currentNum - params.itemsPerBatch} items.` :
      `Completed ${total} items in ${Math.round((endTime - startTime) / 60000)} minutes!`
    );
    document.title = hasError ? 'Error!' : 'Completed!';
  }

  // for safety, doDeleteAll can be called once only
  doDeleteAll = function () { };
}

// Update params from input values
function parseInputUpdatePreview(evt) {

  // Do nothing and wait for another event
  if (this.value.trim() == '') {
    $(this).one('change keyup', parseInputUpdatePreview);
    return false;
  }

  $(this).hide();

  // HTML pasted from SEDE
  if (this.value.includes('grid-canvas')) {
    preview.html(this.value);
  }
  // Links pasted from CSV
  else {
    preview.html(`<a href="//${location.hostname}/` + this.value.replace(/[\s\n\r]+/g, ' ').trim().split(/\s?site:\/\//).join(`" target="_blank">link</a> <a href="//${location.hostname}/`) + `" target="_blank">link</a>`);
    preview.children().first().remove();
  }

  // Show delete all button
  button.insertBefore(preview).text('Delete ALL ' + preview.find('a').length.toLocaleString());
}


// Append styles
addStylesheet(`
#content {
  display: block !important;
}

.slick-header.ui-state-default,.slick-headerrow.ui-state-default {
  width: 100%;
  overflow: hidden;
  border-left: 0;
}
.slick-header-columns,.slick-headerrow-columns {
  position: relative;
  white-space: nowrap;
  cursor: default;
  overflow: hidden;
}
.slick-header-column.ui-state-default {
  position: relative;
  display: inline-block;
  overflow: hidden;
  -o-text-overflow: ellipsis;
  text-overflow: ellipsis;
  height: 16px;
  line-height: 16px;
  margin: 0;
  padding: 4px;
  border-right: 1px solid var(--silver);
  border-left: 0;
  border-top: 0;
  border-bottom: 0;
  float: left;
}
.slick-headerrow-column.ui-state-default {
  padding: 4px
}
.slick-header-column-sorted {
  font-style: italic;
}
.slick-sort-indicator {
  display: inline-block;
  width: 8px;
  height: 5px;
  margin-left: 4px;
  margin-top: 6px;
}
.slick-sort-indicator-desc {
  background: url(/Content/slickgrid/images/sort-desc.gif);
}
.slick-sort-indicator-asc {
  background: url(/Content/slickgrid/images/sort-asc.gif);
}
.slick-resizable-handle {
  position: absolute;
  font-size: .1px;
  display: block;
  cursor: col-resize;
  width: 4px;
  right: 0;
  top: 0;
  height: 100%;
}
.slick-sortable-placeholder {
  background: var(--silver);
}
.grid-canvas {
  position: relative;
  outline: 0;
}
.slick-row.ui-widget-content,.slick-row.ui-state-active {
  position: absolute;
  border: 0;
  width: 100%;
}
.slick-cell,.slick-headerrow-column {
  position: absolute;
  border: 1px solid transparent;
  border-right: 1px dotted var(--silver);
  border-bottom-color: var(--silver);
  overflow: hidden;
  -o-text-overflow: ellipsis;
  text-overflow: ellipsis;
  vertical-align: middle;
  z-index: 1;
  padding: 1px 2px 2px 1px;
  margin: 0;
  white-space: nowrap;
  cursor: default;
}
.slick-group {
}
.slick-group-toggle {
  display: inline-block;
}
.slick-cell.highlighted {
  background: #87cefa;
  background: rgba(0,0,255,.2);
  -webkit-transition: all .5s;
  -moz-transition: all .5s;
  -o-transition: all .5s;
  transition: all .5s;
}
.slick-cell.flashing {
  border: 1px solid var(--red-500) !important;
}
.slick-cell.editable {
  z-index: 11;
  overflow: visible;
  background: var(--white);
  border-color: var(--black);
  border-style: solid;
}
.slick-cell:focus {
  outline: none;
}
.slick-reorder-proxy {
  display: inline-block;
  background: var(--blue-500);
  opacity: .15;
  filter: alpha(opacity=15);
  cursor: move;
}
.slick-reorder-guide {
  display: inline-block;
  height: 2px;
  background: var(--blue-500);
  opacity: .7;
  filter: alpha(opacity=70);
}
.slick-selection {
  z-index: 10;
  position: absolute;
  border: 2px dashed #000;
}
.tab-counter {
  color: #b0b0b0;
  display: none;
  margin-left: 4px;
}
.youarehere .tab-counter:hover {
  color: var(--blue-400);
}
#resultSets {
  position: relative;
}
#resultSets .subpanel {
  cursor: default;
  display: none;
  min-height: 500px;
}
.slick-header .slick-header-column {
  background-color: var(--black-025);
  color: var(--black-500);
  border-bottom: 1px dotted var(--black-150);
  display: block;
  font-weight: bold;
  padding: 6px 8px 5px 8px;
  text-align: center;
}
.slick-header .slick-header-column-sorted {
  color: var(--blue-500);
  font-style: normal;
}
.slick-sort-indicator {
  background-image: url(/Content/slickgrid/images/sort-asc-inactive.gif);
  background-repeat: no-repeat;
  height: 7px;
}
.slick-sort-indicator.slick-sort-indicator-asc {
  background-image: url(/Content/slickgrid/images/sort-asc.gif);
}
.slick-sort-indicator.slick-sort-indicator-desc {
  background-image: url(/Content/slickgrid/images/sort-desc.gif);
}
.slick-row.odd {
  background-color: var(--black-025);
}
.slick-cell {
  padding: 6px 8px 5px 8px;
  border-bottom: 1px dotted var(--black-150);
  border-right: 1px dotted var(--black-150);
}
.slick-cell.number {
  text-align: right;
}

.grid-canvas {
  display: table;
  position: relative !important;
  width: auto !important;
  height: auto !important;
}
.slick-row {
  display: table-row;
  position: relative !important;
}
.slick-cell,
.slick-header-column {
  display: table-cell;
  position: relative !important;
  max-width: 450px;
  width: auto !important;
  height: auto !important;
}
.slick-header-columns {
  display: table;
  position: relative !important;
  left: 0 !important;
  top: 0;
  width: auto !important;
}

#mainbar-full + button {
  margin-top: 20px;
}
.html-editor {
  width: 100%;
  height: 150px;
  margin: 20px auto;
}
.html-preview {
  margin: 20px auto;
}
input.inline {
  width: 100px;
  padding: 4px 7px !important;
  border: none !important;
  border-bottom: 1px dotted var(--black-700) !important;
}
`); // end stylesheet


// On script run
(function init() {

  document.title = "Batch Comment Deleter - " + StackExchange.options.site.name;

  // Init UI
  content = $('#content').empty().prepend(`
    <div id="mainbar-full">
        <div class="grid ai-center jc-space-between mb12 bb bc-black-3 pb12">
            <div class="fs-body3 flex--item fl1 mr12">Batch Comment Deleter</div>
        </div>
        <div class="deleter-info">items per batch: <input type="number" min="1" max="${Math.max(100, params.itemsPerBatch)}" class="inline" data-param-name="itemsPerBatch" value="${params.itemsPerBatch}" />; secs delay between batches: <input type="number" min="0" max="60" class="inline" data-param-name="delayPerBatch" value="${params.delayPerBatch / 1000}" /></div>
    </div>`);
  button = $(`<button>Delete ALL</button>`).on('click', function () {
    $(this).prop('disabled', true).text('processing...');
    doDeleteAll();
  });
  preview = $(`
    <div class="html-preview">
      Use this <a href="https://data.stackexchange.com/stackoverflow/query/1131935" target="_blank">SEDE query</a> to find comments to delete. Download results and paste the comment permalinks column below.
    </div>`).appendTo(content);
  textarea = $('<textarea placeholder="paste comment permalinks from exported query" class="html-editor"></textarea>').appendTo(content).one('change keyup', parseInputUpdatePreview);

  // Events to update params
  content.on('change', 'input[data-param-name]', function (evt) {
    const paramName = this.dataset.paramName;
    const num = Number(this.value) * 1000;
    const isNum = !isNaN(num);

    if (this.value != '') params[paramName] = isNum ? num : this.value;
  });
})();