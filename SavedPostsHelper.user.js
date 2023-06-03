// ==UserScript==
// @name         Saved Posts Helper
// @description  Batch-move saved posts between private lists, quick move after saving in Q&A, import/export lists
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      3.2.10
//
// @match        https://*.stackoverflow.com/*
// @match        https://*.serverfault.com/*
// @match        https://*.superuser.com/*
// @match        https://*.askubuntu.com/*
// @match        https://*.mathoverflow.net/*
// @match        https://*.stackexchange.com/*
//
// @exclude      https://api.stackexchange.com/*
// @exclude      https://data.stackexchange.com/*
// @exclude      https://contests.stackoverflow.com/*
// @exclude      https://winterbash*.stackexchange.com/*
// @exclude      *chat.*
// @exclude      *blog.*
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/se-ajax-common.js
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

/* globals StackExchange, scriptName, selfId, fkey */
/// <reference types="./globals" />

'use strict';

const listSidebarNav = document.querySelector('.js-saves-sidebar-nav');
const currListId = listSidebarNav?.querySelector('a.is-selected')?.parentElement.dataset.listId;
const currListName = document.querySelector('.js-saves-list-header')?.innerText.trim();

const isOnQnaPages = location.pathname.startsWith('/questions/');
const isOnSavesPages = location.pathname.startsWith('/users/saves/');
const isOnAllSavesPage = location.pathname.endsWith('/all');
const isOnForLaterPage = !!document.querySelector('[data-is-forlater="True"]') || (!currListId && !isOnAllSavesPage);

let savesList, cAll, cAllSelect, elSavesCount;

if (isOnSavesPages) {
  console.log(`Current saves list: ${currListId ? currListId : (isOnForLaterPage ? 'For later' : 'All saves')}`);
}


// Validation
if (!fkey) {
  console.error(`${scriptName}: fkey not found!`);
  return;
}
if (!(isOnQnaPages || currListId || isOnAllSavesPage || isOnForLaterPage)) {
  console.error(`Unable to detect current saved list id.`);
  return;
}


/**
 * @summary Create saved list
 * @param {string} listName new list name
 * @returns {number} listId
 */
const createSavedList = async (listName) => {
  //console.log('createSavedList', listName);

  // Validation
  listName = listName.trim();
  if (!listName) return false;

  const formData = new FormData();
  formData.append("fkey", fkey);
  formData.append("listName", listName);

  const resp = await fetch(`${location.origin}/users/saves/${selfId}/create-list`, {
    "method": "POST",
    "body": formData,
  }).then(resp => resp.json());

  // Toast success or error message
  StackExchange?.helpers?.hideToasts();
  StackExchange?.helpers?.showToast(resp.ToastMessage || resp.ErrorMessage, {
    type: resp?.Success ? 'success' : 'danger',
  });

  return resp.ListId || false;
};


/**
 * @summary Save item
 * @param {number} pid post id
 * @param {number} [listId] list id
 * @param {string} [listName] list name
 * @param {boolean} [unsaveItem] unsave item
 * @returns {string} html
 */
const saveItem = async (pid, listId = '', listName = '', unsaveItem = false) => {
  //console.log('saveItem', pid, listName);

  const formData = new FormData();
  formData.append("fkey", fkey);
  if (listId) formData.append("listId", listId);
  if (listName) formData.append("listName", listName);

  const isUndo = unsaveItem ? '?isUndo=true' : '';

  return await fetch(`${location.origin}/posts/${pid}/save${isUndo}`, {
    "method": "POST",
    "body": formData,
  }).then(resp => resp.json());
};


/**
 * @summary Move saved item
 * @param {number} pid post id
 * @param {number} listId list id
 * @param {string} [listName] list name
 *
 * @returns {string} html
 */
const moveSavedItem = async (pid, listId, listName = '') => {
  //console.log('moveSavedItem', pid, listId, listName);

  const formData = new FormData();
  formData.append("fkey", fkey);
  formData.append("postId", pid);
  formData.append("listId", listId);
  if (listName) formData.append("listName", listName);

  return await fetch(`${location.origin}/posts/save/manage-save`, {
    "method": "POST",
    "body": formData,
  }).then(resp => resp.json());
};


/**
 * @summary Get saves modal
 * @param {number} [pid] post id
 * @param {boolean} [isMove] move (default create)
 * @param {number} [currListId] initial selected list id
 * @returns {string} html
 */
const getSavesModal = async (pid = 1, isMove = false, currListId = null) => {
  //console.log('getSavesModal', pid, isMove, currListId);

  if (!pid) return;
  return await fetch(`${location.origin}/posts/${pid}/open-save-modal?isMoveTo=${isMove}&listId=${currListId}&_=${Date.now()}`, {
    "method": "GET",
  }).then(resp => resp.text());
};


/**
 * @summary Get saves private list names (excl. create)
 * @param {number} [pid] post id
 * @returns {object[]} list of { name, id, count }
 */
const getSavesLists = async (postId = 1) => {
  //console.log('getSavesLists', postId);

  const modalBody = await getSavesModal(postId);
  const el = document.createElement('div');
  el.innerHTML = modalBody;
  const options = el.querySelectorAll('.js-save-manage-select option');
  const values = [...options].map(v => {
    // there are newlines and spaces when loading save lists in Q&A pages for some reason
    const hasCount = / \((\d+,)*\d+\)[\n\s]*$/.test(v.innerText);
    return {
      // there are newlines and spaces when loading save lists in Q&A pages for some reason
      name: v.innerText.replace(/[\n\s]*\(\d+\)[\n\s]*$/, '').trim(),
      id: v.value,
      count: hasCount ? v.innerText.match(/(?:\d+,)*\d+/g).pop() : 0
    }
  }).filter(v => v.value !== 'create');
  return values;
};


/**
 * @summary Recursive get all items in a saved list
 * @param {number} [listId] list id
 * @param {string} [sort] sort type
 * @param {number} [page] page number
 * @returns {object[]} list of { pid, title, url }
 *
 * If listId is null: get uncategorised (For later) items
 * If listId is "all": get all items
 */
const getSavedListItems = async (listId = null, sort = 'Added', page = 1) => {
  //console.log('getSavedListItems', listId, sort, page);

  // Validate listId param
  if (listId !== null && listId !== 'all' && listId <= 0) return [];

  const resp = await fetch(`${location.origin}/users/saves/${selfId}${listId === 'all' ? '' : `/${listId || 'all'}`}?sort=${sort}&page=${page}&_=${Date.now()}`, {
    "method": "GET",
  });
  pageHtml = await resp.text();

  // Make page dom
  const el = document.createElement('div');
  el.innerHTML = pageHtml;

  // Select items on page
  const items = [...el.querySelectorAll('.s-post-summary')].map(v => {
    const questionLink = v.querySelector('.s-post-summary--content-title .s-link');
    const postLinks = v.querySelectorAll('.s-post-summary--content-title .s-link, .js-post-summary-answer-link');
    const postLink = [...postLinks].pop(); // last link is post link (could be saved answer)
    return {
      //postType: postLinks.length > 1 ? 'answer' : 'question',
      pid: getPostId(postLink.href),
      url: 'https:' + toShortLink(postLink.href), //.replace(/\?.*$/, ''), // strip ?r=Saves_AllUserSaves from end
      title: questionLink.innerText.replace(/;/g, ',').replace(/\s*\[\w+\]\s*$/i, '').trim(),
    }
  });

  // Detect next page
  const nextPage = el.querySelector('a.s-pagination--item[rel="next"]');
  if (nextPage) {
    await delay(1000);
    const nextPageItems = await getSavedListItems(listId, sort, page + 1);
    return [...items, ...nextPageItems];
  }

  return items;
};


/**
 * @summary Update move dropdown list and sidebar counts
 */
const updateMoveDropdown = async (postId = null, isQuestion = false) => {

  if (isOnQnaPages) {
    // Get post id from url
    postId = location.pathname.match(/\d+/)?.shift() ?? null;
  }
  else {
    // Get a valid post id from anywhere on page
    postId = document.querySelector('a[href^="/questions/"]')?.href.match(/\d+/)?.shift() ?? null;
  }

  //console.log('updateMoveDropdown', postId, isQuestion);

  // Get saved lists
  const savedLists = await getSavesLists(postId);

  // Update move dropdown list
  if (cAllSelect) {
    if (postId) {
      cAllSelect.dataset.postId = postId;
      cAllSelect.dataset.isQuestion = isQuestion;
    }

    cAllSelect.disabled = true;

    // Remove all existing options
    while (cAllSelect.firstElementChild) cAllSelect.firstElementChild.remove();

    if (isOnSavesPages) {
      // Add default bulk option value
      const opt = makeElem('option', {
        'class': 'd-none',
      }, 'Move to...');
      cAllSelect.appendChild(opt);
    }

    // Add saved lists to dropdown
    savedLists.forEach(v => {

      // Build option text
      let text = v.name;
      if (v.count > 0) text += ` (${v.count})`;

      // Make option
      const opt = makeElem('option', {
        "data-list-name": v.name,
        "data-list-count": v.count,
        "value": v.id,
      }, text);

      // Disable current list item (makes no sense to move to current list)
      const currListItem = (currListId && currListId === v.id) || (isOnForLaterPage && v.id === 'for-later');
      if (isOnSavesPages && currListItem) opt.setAttribute('disabled', 'disabled');

      cAllSelect.appendChild(opt);
    });

    if (isOnSavesPages) {
      // Insert group divider before last option (create new list)
      const divider = makeElem('option', {
        "disabled": "disabled",
      }, '---');
      cAllSelect.insertBefore(divider, cAllSelect.lastElementChild);
    }
    else if (isOnQnaPages) {
      // Remove last option (create), since it's harder to implement this as the toast message has a short timeout
      cAllSelect.lastElementChild?.remove();
    }

    // Re-enable dropdown
    cAllSelect.disabled = false;
  }

  // Update sidebar count
  const sidebarItems = document.querySelectorAll('.js-saves-sidebar-item');
  sidebarItems?.forEach(item => {
    const data = savedLists.find(v => v.id == item.dataset.listId);
    if (data) {
      item.dataset.count = data.count;
      item.querySelector('a').dataset.count = data.count;
    }
  });
};


/**
 * @summary Add bulk dropdown or Q&A move dropdown event listeners
 */
const handleMoveDropdownEvent = async evt => {
  let listId = evt.target.value;
  let listName = evt.target.selectedOptions[0].dataset.listName;
  const isQuestion = evt.target.dataset.isQuestion === 'true';

  // Create new list
  if (listId === 'create') {
    listName = prompt('Enter new list name');
    if (!listName) return;
    listId = await createSavedList(listName);
  }

  // Validation
  if (!listId) {
    cAllSelect.selectedIndex = 0;
    return;
  }

  // Get selected checkboxes
  const selectedCbs = document.querySelectorAll('.saved-item-bulk-checkbox:checked');

  if (selectedCbs.length) {
    const num = selectedCbs.length;

    // Move to selected list
    selectedCbs.forEach(async cb => {
      const pid = cb.value;
      const resp = await moveSavedItem(pid, listId);
      cb.checked = false;
    });

    // In all saves page, update text of ".js-saved-in" to new list name
    if (isOnAllSavesPage) {
      const updatedListId = /^\d+$/.test(listId) ? listId : ''; // only replace with numerical list ids or empty
      selectedCbs.forEach(cb => {
        const el = cb.parentElement.querySelector('.js-saved-in');
        el.innerText = listName;
        el.href = el.href.replace(/\/\d*$/, `/${updatedListId}`);
      });
    }
    // Not in "All saves page"
    else if (isOnSavesPages) {
      // Remove from display
      selectedCbs?.forEach(cb => {
        cb.closest('.js-saves-post-summary').remove();
      });

      // Reduce count in header
      if (elSavesCount) elSavesCount.innerText = Number(elSavesCount.innerText) - num;
    }

    // Toast success message
    const listUrl = Number(listId) ? `<a href="/users/saves/current/${listId}">${listName}</a>` : `<a href="/users/saves/current">For later</a>`;
    const numberMoved = isOnQnaPages && num === 1 ? `${isQuestion ? 'Question' : 'Answer'}` : `${num} post${num > 1 ? 's' : ''}`;
    StackExchange?.helpers?.hideToasts();
    StackExchange?.helpers?.showToast(`${numberMoved} moved to ${listUrl}.`, {
      type: 'success',
      useRawHtml: true,
      transient: true,
      transientTimeout: 20e3,
    });
  }
  else {
    // Toast info message
    StackExchange?.helpers?.hideToasts();
    StackExchange?.helpers?.showToast(`No posts were selected, so nothing was moved.`, {
      type: 'info',
      useRawHtml: false,
      transient: true,
      transientTimeout: 6e3,
    });
  }

  // Temporarily "clear" and disable dropdown while updating
  cAllSelect.disabled = true;
  cAllSelect.selectedIndex = 0;
  await delay(1000); // wait 1s for database to update
  await updateMoveDropdown();
};


/**
 * @summary Handle post saved event
 */
const postSavedEvent = async (postId, isQuestion = false) => {

  // Add dropdown to toast
  cAllSelect = makeElem('select', {
    'class': 'saved-item-all-dropdown',
    'disabled': 'disabled',
  });
  const cb = makeElem('input', {
    'type': 'checkbox',
    'checked': 'checked',
    'class': 'saved-item-bulk-checkbox s-checkbox d-none',
    'value': postId
  });
  const cAllSelectWrapper = makeElem('span', {
    'class': 's-select-wrapper d-inline-block ml4'
  }, null, [
    makeElem('span', null, ' Change: '),
    cAllSelect,
    cb
  ]);
  $('.js-toast .js-toast-body').append(cAllSelectWrapper);

  // Add event listener to move dropdown
  cAllSelect?.addEventListener('change', handleMoveDropdownEvent);

  // Load options
  await updateMoveDropdown(postId, isQuestion);
};


/**
 * @summary Handle post UNsaved event
 * Unfortunately we don't know which list the post was unsaved from so we can only "undo" to the default list (For later)
 */
const postUnsavedEvent = async (postId, isQuestion = false) => {

  // When undo button is clicked
  const handleUndoClickEvent = async (evt) => {
    const postId = evt.target.value;
    const resp = await saveItem(postId);
    //console.log(`${isQuestion ? 'Question' : 'Answer'} was resaved.`, postId, resp);

    // If we know the current list id, move it back there
    if (Number(currListId)) {
      const resp2 = await moveSavedItem(postId, currListId);
      //console.log(`${isQuestion ? 'Question' : 'Answer'} was moved to ${currListId}.`, postId, currListId, resp);
    }

    // Toast success message
    const listName = document.querySelector('.js-saves-list-header')?.childNodes[0].textContent ?? 'For later';
    const listUrl = Number(currListId) ? `<a href="/users/saves/current/${currListId}">${listName}</a>` : `<a href="/users/saves/current">For later</a>`;
    StackExchange?.helpers?.hideToasts();
    StackExchange?.helpers?.showToast(`${isQuestion ? 'Question' : 'Answer'} was resaved to ${listUrl}. Please refresh the page.`, {
      type: 'success',
      useRawHtml: true,
      transient: true,
      transientTimeout: 20e3,
    });

    // If on Q&A page, undo the saves button on the post
    $(`#saves-btn-${postId} svg`).toggleClass('d-none');
  };

  // Add undo button to toast
  const undoBtn = makeElem('button', {
    'type': 'button',
    'class': 's-btn s-btn__xs s-btn__danger s-btn__outlined',
    'value': postId
  }, 'Undo?');
  const undoBtnWrapper = makeElem('span', {
    'class': 's-select-wrapper d-inline-block ml4'
  }, null, [
    undoBtn
  ]);
  $('.js-toast .js-toast-body').append(undoBtnWrapper);

  // Add event listener to undo button
  undoBtn.addEventListener('click', handleUndoClickEvent);
};



/**
 * @summary Add event listeners
 */
const addEventListeners = () => {

  // Saved pages only
  if (isOnSavesPages) {

    // Add event listener to bulk checkbox
    const cbs = document.querySelectorAll('.saved-item-bulk-checkbox');
    cAll?.addEventListener('click', evt => {
      const checked = evt.target.checked;
      cbs?.forEach(box => { box.checked = checked });
    });

    // Add event listener to move dropdown
    cAllSelect?.addEventListener('change', handleMoveDropdownEvent);

  }

  // Q&A pages only
  else if (isOnQnaPages) {

    // On page update
    $(document).ajaxComplete(async (evt, xhr, settings) => {
      if (xhr.status !== 200) return; // capture successful requests only

      // Post was saved on Q&A page
      if (/\/posts\/\d+\/save$/.test(settings.url)) {
        const postId = Number(settings.url.match(/\/posts\/(\d+)\/save$/)?.pop());
        const isQuestion = xhr.responseJSON?.NextTooltip?.includes('question');
        //console.log(`${isQuestion ? 'Question' : 'Answer'} was saved.`, postId, xhr.responseJSON);

        setTimeout(() => {
          postSavedEvent(postId, isQuestion);
        }, 100);
      }
    });
  }

  // On all pages,

  // On page update
  $(document).ajaxComplete(async (evt, xhr, settings) => {
    if (xhr.status !== 200) return; // capture successful requests only

    // Post was UNsaved
    if (/\/posts\/\d+\/save\?isUndo=true$/.test(settings.url)) {
      const postId = Number(settings.url.match(/\/posts\/(\d+)\/save\?isUndo=true$/)?.pop());
      const isQuestion = xhr.responseJSON?.NextTooltip.includes('question');
      //console.log(`${isQuestion ? 'Question' : 'Answer'} was unsaved.`, postId, xhr.responseJSON);

      setTimeout(() => {
        postUnsavedEvent(postId, isQuestion);
      }, 100);
    }
  });
};


// Append styles
addStylesheet(`
.js-saves-page nav,
.js-saves-page .filter-wrapper {
  position: sticky;
  top: 50px;
  margin-top: -8px;
  padding-top: 14px;
  padding-bottom: 14px;
  margin-bottom: -14px;
  background: var(--white);
  z-index: 2;
}
.js-saves-page .js-saves-sidebar-item a {
  display: flex;
  justify-content: space-between;
}
.js-saves-page nav .js-saves-sidebar-item a[data-count]:after {
  content: "(" attr(data-count) ")";
  display: inline-block;
  margin-left: 0.25em;
}
.js-saves-page .filter-wrapper {
  margin-bottom: -1px;
  --_ps-bb: var(--su1) solid var(--bc-light);
  border-bottom: var(--_ps-bb);
}
.js-saves-page .js-saves-count:not([data-saves-count="0"]) {
  display: inline-block;
  margin: 0 0 0 0.5em;
}
.js-saves-page .js-saves-count:not([data-saves-count="0"]):before {
  content: '(';
}
.js-saves-page .js-saves-count:not([data-saves-count="0"]):after {
  content: ')';
}
.js-saves-page .saved-item-all-label {
  display: flex;
  align-items: center;
  cursor: auto;
}
.js-saves-page .saved-item-all-checkbox {
  margin-left: calc(var(--su8) + 1px);
  margin-right: 0.5em;
  padding: 0.5rem;
}
.js-saves-lists-posts {
  align-items: center;
}
.js-saves-post-list {
  border-radius: 0 !important;
}
.js-saves-post-list .js-saves-post-summary {
  padding-left: calc(var(--su16) + 1.2rem);
}
.js-saves-post-list .saved-item-bulk-checkbox {
  position: absolute;
  top: 20px;
  left: var(--su8);
  padding: 0.5rem;
  z-index: 1;
}
.js-saves-post-list .saved-item-bulk-checkbox:hover {
  box-shadow: var(--_ch-bs-focus);
}
.js-saves-post-list .saved-item-bulk-checkbox:after {
  content: '';
  position: absolute;
  top: -21px;
  left: -10px;
  bottom: -76px;
  right: -6px;
  opacity: 0;
  z-index: 0;
}
.js-saves-post-list .js-post-tag-list-wrapper {
  margin-bottom: 0;
}
`); // end stylesheet


// On script run
(async function init() {

  // On saves pages
  if (isOnSavesPages) {
    savesList = document.querySelector('.js-saves-post-list');
    if (!savesList) return;

    // Insert bulk checkbox selector and dropdown in place of saves count
    elSavesCount = document.querySelector('.js-saves-count');
    const filterWrapper = elSavesCount.parentElement;
    cAll = makeElem('input', {
      'type': 'checkbox',
      'class': 'saved-item-all-checkbox s-checkbox'
    });
    cAllSelect = makeElem('select', {
      'class': 'saved-item-all-dropdown'
    });
    const cAllSelectWrapper = makeElem('div', {
      'class': 's-select ml16'
    }, null, [cAllSelect]);
    const cAllLabel = makeElem('label', {
      'class': 'saved-item-all-label'
    }, null, [
      cAll,
      makeElem('span', null, 'Select all'),
      cAllSelectWrapper
    ]);
    filterWrapper.insertBefore(cAllLabel, elSavesCount);

    // Alignment
    filterWrapper.classList.add('filter-wrapper', 'ai-center');

    // Move saves count to list header
    const elSavesHeader = document.querySelector('.js-saves-lists-posts');
    const elSavesHeaderTitle = elSavesHeader.querySelector('.js-saves-list-header');
    elSavesCount.innerText = elSavesCount.dataset.savesCount;
    elSavesHeaderTitle.appendChild(elSavesCount);

    // UI fix: Remove pe-none from create/edit list modals, otherwise use can click on elements behind them
    document.querySelectorAll('aside.pe-none').forEach(modal => modal.classList.remove('pe-none'));

    // Create import modal
    const importModal = makeElem('aside', {
      'class': 's-modal js-save-modal js-list-action-modal',
      'id': 'import-list-modal',
      'tabindex': "-1",
      'role': "dialog",
      'aria-hidden': "true",
      'data-controller': "s-modal",
      'data-s-modal-target': "modal",
      'data-modal-action': "Import",
    }, null);
    importModal.innerHTML = `
      <div class="s-modal--dialog js-modal-dialog js-keyboard-navigable-modal pe-auto ws12">
        <form class="js-import-list-form">
          <h1 class="s-modal--header fs-headline1 fw-bold mr48 js-first-tabbable" id="modal-title" tabindex="0">
            Import items into "${currListName}"
          </h1>
          <div class="mt12 mb16">
            <div class="mb12 mb4 s-notice s-notice__info">
              Insert one post ID per line (or export data), OR a line of comma, semicolon, or space-delimited post IDs.
              Posts will be saved and moved to the current list.
            </div>
            <textarea class="s-textarea s-textarea__sm hs3 js-list-textarea js-modal-initial-focus"></textarea>
          </div>
          <div class="d-flex gs8 gsx s-modal--footer mt16 jc-center">
            <div class="flex-item">
              <a href=${location.href} class="flex--item s-btn s-btn__primary d-none" type="button">Close &amp; Refresh</a>
              <button class="flex--item s-btn s-btn__primary" type="button">Import</button>
              <button class="flex--item s-btn" data-action="s-modal#hide" type="button">Close</button>
            </div>
          </div>
          <button class="s-modal--close s-btn s-btn__muted js-last-tabbable" type="button" aria-label="Close" data-action="s-modal#hide">
            <svg aria-hidden="true" class="m0 svg-icon iconClearSm" width="14" height="14" viewBox="0 0 14 14"><path d="M12 3.41 10.59 2 7 5.59 3.41 2 2 3.41 5.59 7 2 10.59 3.41 12 7 8.41 10.59 12 12 10.59 8.41 7 12 3.41Z"></path></svg>
          </button>
        </form>
      </div>`;
    elSavesHeader.parentElement.appendChild(importModal);

    // Create export modal
    const exportModal = makeElem('aside', {
      'class': 's-modal js-save-modal js-list-action-modal',
      'id': 'export-list-modal',
      'tabindex': "-1",
      'role': "dialog",
      'aria-hidden': "true",
      'data-controller': "s-modal",
      'data-s-modal-target': "modal",
      'data-modal-action': "Export",
    }, null);
    exportModal.innerHTML = `
      <div class="s-modal--dialog js-modal-dialog js-keyboard-navigable-modal pe-auto ws12">
        <form class="js-export-list-form">
          <h1 class="s-modal--header fs-headline1 fw-bold mr48 js-first-tabbable" id="modal-title" tabindex="0">
            Export list "${currListName}"
          </h1>
          <div class="mt12 mb16">
            <textarea class="s-textarea s-textarea__sm hs3 js-list-textarea js-modal-initial-focus fc-black bg-white" style="cursor:text;" readonly></textarea>
          </div>
          <div class="d-flex gs8 gsx s-modal--footer mt16 jc-center">
            <div class="flex-item">
              <button class="flex--item s-btn s-btn__primary" type="button">Copy CSV</button>
              <button class="flex--item s-btn" data-action="s-modal#hide" type="button">Close</button>
            </div>
          </div>
          <button class="s-modal--close s-btn s-btn__muted js-last-tabbable" type="button" aria-label="Close" data-action="s-modal#hide">
            <svg aria-hidden="true" class="m0 svg-icon iconClearSm" width="14" height="14" viewBox="0 0 14 14"><path d="M12 3.41 10.59 2 7 5.59 3.41 2 2 3.41 5.59 7 2 10.59 3.41 12 7 8.41 10.59 12 12 10.59 8.41 7 12 3.41Z"></path></svg>
          </button>
        </form>
      </div>`;
    elSavesHeader.parentElement.appendChild(exportModal);

    // Create import/export buttons
    const importListBtn = makeElem('button', {
      'type': 'button',
      'class': 'flex-item s-btn s-btn__muted s-btn__outlined js-import-list-modal',
      'data-action': 's-modal#show',
      'data-modal-action': 'Import',
    }, 'Import list');
    importListBtn.addEventListener('click', () => {

      // Reset buttons and links
      const importBtn = importModal.querySelector('button.s-btn__primary');
      importBtn.previousElementSibling?.classList.add('d-none');
      importBtn.classList.remove('d-none');
      importBtn.nextElementSibling?.classList.remove('d-none');

      // Reset textarea
      const textarea = importModal.querySelector('textarea');
      textarea.value = '';
      textarea.focus();

      // Show modal
      importModal.setAttribute('aria-hidden', 'false');
    });

    const exportListBtn = makeElem('button', {
      'type': 'button',
      'class': 'flex-item s-btn s-btn__muted s-btn__outlined js-export-list-modal d-flex ai-center',
      'data-action': 's-modal#show',
      'data-modal-action': 'Export',
    }, 'Export list');
    exportListBtn.addEventListener('click', async () => {

      // Get saved list items
      StackExchange.helpers.addSpinner(exportListBtn);
      const listItems = await getSavedListItems(currListId);
      const delimitedList = listItems.map(v => Object.values(v).join(';')).join('\n');
      const textarea = exportModal.querySelector('textarea');
      textarea.value = delimitedList;
      textarea.focus();
      textarea.select();
      StackExchange.helpers.removeSpinner(exportListBtn);

      // Show modal
      exportModal.setAttribute('aria-hidden', 'false');
    });

    const impExpBtnGroup = makeElem('div', {
      'class': 'd-flex s-btn-group ml12'
    }, null, [importListBtn, exportListBtn]);

    // Wrap "Edit list" button in a div
    const editListBtn = document.querySelector('.js-saves-lists-posts .js-open-list-modal');
    const editListBtnWrapper = makeElem('div', {
      'class': 'd-flex'
    }, null, [editListBtn, impExpBtnGroup]);
    elSavesHeader.appendChild(editListBtnWrapper);

    // Add bulk checkboxes to each saved post
    savesList.querySelectorAll('.js-saves-post-summary').forEach(item => {
      const answer = item.querySelector('.s-post-summary--answer'); // saved post may be an answer
      const pid = answer?.dataset.postId || item.dataset.postId;
      const c = makeElem('input', {
        'type': 'checkbox',
        'class': 'saved-item-bulk-checkbox s-checkbox',
        'value': pid
      });
      item.insertBefore(c, item.children[0]);
    });

    // Add import button handler
    const importBtn = importModal.querySelector('button.s-btn__primary');
    importBtn.addEventListener('click', async () => {
      StackExchange.helpers.removeMessages();
      const textarea = importModal.querySelector('textarea');
      const toastElement = textarea.parentElement;

      // Default: If only one line in textarea, assume semicolon, comma, or space-delimited
      let postIds = textarea.value.split(/[,;\s]+/).filter(Number);

      // If more than one line, assume one item per line
      const rowItems = textarea.value.split(/[\n\r]+/);
      if (rowItems.length > 1) {
        postIds = rowItems.map(v => v.split(';')[0]).filter(Number);
      }

      // Unique post IDs
      postIds = [...new Set(postIds)];

      // If still no post IDs, show error
      if (!postIds.length) {
        StackExchange.helpers.showErrorMessage(toastElement, 'No post IDs found in textarea.');
        return;
      }

      // Disable import button and show spinner
      StackExchange.helpers.addSpinner(importBtn);
      StackExchange.helpers.showSuccessMessage(toastElement, 'Importing items...');
      importBtn.disabled = true;

      // Import items
      let successCount = 0, errorCount = 0, alreadySaved = 0;
      for (let i = 0; i < postIds.length; i++) {
        await delay(500); // delay to avoid rate-limiting
        const saveRes = await saveItem(postIds[i], currListId);

        // Couldn't save item, because post doesn't exist
        if (!saveRes) {
          errorCount++;
          continue;
        }

        // Couldn't save item, because it was already saved
        if (!saveRes.Success) alreadySaved++;

        const moveRes = await moveSavedItem(postIds[i], currListId);
        successCount++;
      }

      // Hide import and show refresh link
      importBtn.previousElementSibling.classList.remove('d-none');
      importBtn.classList.add('d-none');
      importBtn.disabled = false;
      importBtn.nextElementSibling.classList.add('d-none');

      // Show success message
      StackExchange.helpers.removeSpinner(importBtn);
      StackExchange.helpers.showSuccessMessage(toastElement, !errorCount ?
        `${successCount} unique post${pluralize(successCount)} imported successfully.` :
        `${successCount} unique post${pluralize(successCount)} imported successfully (${errorCount} post${pluralize(errorCount)} doesn't exist).`
      );
    });

    // Add export copy button handler
    const exportCopyBtn = exportModal.querySelector('button.s-btn__primary');
    exportCopyBtn.addEventListener('click', () => {
      const textarea = exportModal.querySelector('textarea');
      textarea.select();

      copyToClipboard(textarea);

      StackExchange.helpers.showSuccessMessage(exportCopyBtn.parentElement, 'Copied to clipboard.');
    });

  }
  // On Q&A pages
  else if (isOnQnaPages) {
    // Nothing needed yet on page load
  }

  await updateMoveDropdown();
  addEventListeners();
})();