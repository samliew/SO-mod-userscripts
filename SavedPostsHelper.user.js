// ==UserScript==
// @name         Saved Posts Helper
// @description  Batch-move saved posts between private lists, quick move after saving in Q&A
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.3.1
//
// @match        https://*.stackoverflow.com/*
// @match        https://*.serverfault.com/*
// @match        https://*.superuser.com/*
// @match        https://*.askubuntu.com/*
// @match        https://*.mathoverflow.net/*
// @match        https://*.stackexchange.com/*
//
// @updateURL    https://github.com/samliew/SO-mod-userscripts/raw/master/SavedPostsHelper.user.js
// @downloadURL  https://github.com/samliew/SO-mod-userscripts/raw/master/SavedPostsHelper.user.js
// ==/UserScript==

/* globals StackExchange, jQuery */

'use strict';

const enableConsoleLog = false;
let clog = enableConsoleLog ? console.log : () => {};

const $ = jQuery;
const scriptName = GM_info.script.name.toLowerCase().replace(/\s+/g, '-');
const siteApiSlug = location.hostname.replace(/(\.stackexchange)?\.(com|net|org)$/i, '');
const apikey = '';

const userId = StackExchange?.options?.user?.userId;
const fkey = StackExchange?.options?.user?.fkey;

const currListId = document.querySelector('.js-saves-sidebar-item .is-selected')?.parentElement.dataset.listId;
const isOnQnaPages = location.pathname.startsWith('/questions/');
const isOnSavesPages = location.pathname.startsWith('/users/saves/');
const isOnAllSavesPage = location.pathname.endsWith('/all');
const isOnForLaterPage = !!document.querySelector('[data-is-forlater="True"]') || (!currListId && !isOnAllSavesPage);

if(isOnSavesPages) {
  clog(`Current saves list: ${currListId ? currListId : (isOnForLaterPage ? 'For later' : 'All saves')}`);
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

let savesList, cAll, cAllSelect, elSavesCount;


/**
 * @summary Waits a specified number of seconds
 * @param {number} [seconds] seconds to wait
 * @returns {Promise<void>}
 */
const wait = (seconds = 1) => new Promise((r) => setTimeout(r, seconds * 1e3));


/**
 * @summary Element bulk setAttribute
 * @param {object} el element
 * @param {object} attrs attributes
 * @link https://stackoverflow.com/a/12274782
 */
const setAttributes = (el, attrs) => {
  for (var key in attrs) el.setAttribute(key, attrs[key]);
};


/**
 * @summary Create element
 * @param {string} [tagName] element tag name
 * @param {object} [attrs] element attributes
 * @param {string} [text] element text
 * @param {array} [children] element children
 * @returns {object} element
 * @link https://stackoverflow.com/a/12274782
 */
const makeElem = (tagName = 'div', attrs = {}, text = '', children = []) => {
  const el = document.createElement(tagName);
  setAttributes(el, attrs);
  if (text) el.innerText = text;
  children?.forEach(child => el.appendChild(child));
  return el;
};


/**
 * @summary Create saved list
 * @param {string} [listName] new list name
 * @returns {number} listId
 */
const createSavedList = async (listName) => {
  clog('createSavedList', listName);

  // Validation
  listName = listName.trim();
  if(!listName) return false;

  const formData = new FormData();
  formData.append("fkey", fkey);
  formData.append("listName", listName);

  const resp = await fetch(`https://${location.host}/users/saves/${userId}/create-list`, {
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
 * @param {number} [pid] post id
 * @param {number} [listId] list id
 * @param {string} [listName] list name (Optional)
 * @returns {string} html
 */
const saveItem = async (pid, listId = '', listName = '') => {
  clog('saveItem', pid, listName);

  const formData = new FormData();
  formData.append("fkey", fkey);
  if (listId) formData.append("listId", listId);
  if (listName) formData.append("listName", listName);

  return await fetch(`https://${location.host}/posts/${pid}/save`, {
    "method": "POST",
    "body": formData,
  }).then(resp => resp.json());
};


/**
 * @summary Move saved item
 * @param {number} [pid] post id
 * @param {number} [listId] list id
 * @param {string} [listName] list name (Optional)
 * @returns {string} html
 */
const moveSavedItem = async (pid, listId, listName = '') => {
  clog('moveSavedItem', pid, listId, listName);

  const formData = new FormData();
  formData.append("fkey", fkey);
  formData.append("postId", pid);
  formData.append("listId", listId);
  if (listName) formData.append("listName", listName);

  return await fetch(`https://${location.host}/posts/save/manage-save`, {
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
  clog('getSavesModal', pid, isMove, currListId);

  if(!pid) return;
  return await fetch(`https://${location.host}/posts/${pid}/open-save-modal?isMoveTo=${isMove}&listId=${currListId}&_=${Date.now()}`, {
    "method": "GET",
  }).then(resp => resp.text());
};


/**
 * @summary Get saves private list names (excl. create)
 * @param {number} [pid] post id
 * @returns {object[]} list of { name, id, count }
 */
const getSavesLists = async (postId = 1) => {
  clog('getSavesLists', postId);

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
 * @summary Update move dropdown list and sidebar counts
 */
const updateMoveDropdown = async (postId = null, isQuestion = false) => {

  if(isOnQnaPages) {
    // Get post id from url
    postId = location.pathname.match(/\d+/)?.shift() ?? null;
  }
  else {
    // Get a valid post id from anywhere on page
    postId = document.querySelector('a[href^="/questions/"]')?.href.match(/\d+/)?.shift() ?? null;
  }

  clog('updateMoveDropdown', postId, isQuestion);

  // Get saved lists
  const savedLists = await getSavesLists(postId);

  // Update move dropdown list
  if (cAllSelect) {
    if(postId) {
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
    else if(isOnQnaPages) {
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

  // Create new list
  if(listId === 'create') {
    listName = prompt('Enter new list name');
    if(!listName) return;
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
    else if(isOnSavesPages) {
      // Remove from display
      selectedCbs?.forEach(cb => {
        cb.closest('.js-saves-post-summary').remove();
      });

      // Reduce count in header
      if(elSavesCount) elSavesCount.innerText = Number(elSavesCount.innerText) - num;
    }

    // Toast success message
    const listUrl = Number(listId) ? `<a href="/users/saves/current/${listId}">${listName}</a>` : `<a href="/users/saves/current">For later</a>`;
    StackExchange?.helpers?.hideToasts();
    StackExchange?.helpers?.showToast(`${num} post${num > 1 ? 's' : ''} moved to ${listUrl}.`, {
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
  await wait(1); // wait for database to update
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
const postUnsavedEvent = async (postId , isQuestion = false) => {

  // When undo button is clicked
  const handleUndoClickEvent = async (evt) => {
    const postId = evt.target.value;
    const resp = await saveItem(postId);
    clog(`${isQuestion ? 'Question' : 'Answer'} was resaved.`, postId, resp);

    // If we know the current list id, move it back there
    if(Number(currListId)) {
      const resp2 = await moveSavedItem(postId, currListId);
      clog(`${isQuestion ? 'Question' : 'Answer'} was moved to ${currListId}.`, postId, currListId, resp);
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
      if(xhr.status !== 200) return; // capture successful requests only

      // Post was saved on Q&A page
      if (/\/posts\/\d+\/save$/.test(settings.url)) {
        const postId = Number(settings.url.match(/\/posts\/(\d+)\/save$/)?.pop());
        const isQuestion = xhr.responseJSON?.NextTooltip?.includes('question');
        clog(`${isQuestion ? 'Question' : 'Answer'} was saved.`, postId, xhr.responseJSON);

        setTimeout(() => {
          postSavedEvent(postId, isQuestion);
        }, 100);
      }
    });
  }

  // On all pages,

  // On page update
  $(document).ajaxComplete(async (evt, xhr, settings) => {
    if(xhr.status !== 200) return; // capture successful requests only

    // Post was UNsaved
    if (/\/posts\/\d+\/save\?isUndo=true$/.test(settings.url)) {
      const postId = Number(settings.url.match(/\/posts\/(\d+)\/save\?isUndo=true$/)?.pop());
      const isQuestion = xhr.responseJSON?.NextTooltip.includes('question');
      clog(`${isQuestion ? 'Question' : 'Answer'} was unsaved.`, postId, xhr.responseJSON);

      setTimeout(() => {
        postUnsavedEvent(postId, isQuestion);
      }, 100);
    }
  });
};


/**
 * @summary Main function
 */
const doPageLoad = async () => {

  // On saves pages
  if(isOnSavesPages) {

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
    const elSavesHeader = document.querySelector('.js-saves-list-header');
    elSavesCount.innerText = elSavesCount.dataset.savesCount;
    elSavesHeader.appendChild(elSavesCount);

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
  }

  // On Q&A pages
  else if(isOnQnaPages) {
    // Nothing needed yet on page load
  }
}


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
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
`;
document.body.appendChild(styles);


// On page load
await doPageLoad();
await updateMoveDropdown();
addEventListeners();