// ==UserScript==
// @name         Saved Questions Helper
// @description  Batch-move Saved Questions between private lists
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.1
//
// @match        https://*.stackoverflow.com/users/saves/*
// @match        https://*.serverfault.com/users/saves/*
// @match        https://*.superuser.com/users/saves/*
// @match        https://*.askubuntu.com/users/saves/*
// @match        https://*.mathoverflow.net/users/saves/*
// @match        https://*.stackexchange.com/users/saves/*
// ==/UserScript==

/* globals StackExchange */

'use strict';

const scriptName = GM_info.script.name.toLowerCase().replace(/\s+/g, '-');
const siteApiSlug = location.hostname.replace(/(\.stackexchange)?\.(com|net|org)$/i, '');
const apikey = '';

const userId = StackExchange?.options?.user?.userId;
const fkey = StackExchange?.options?.user?.fkey;

const currListId = document.querySelector('.js-saves-sidebar-item .is-selected')?.parentElement.dataset.listId;
const isAllSavesPage = location.pathname.endsWith('/all');
const isForLaterPage = !!document.querySelector('[data-is-forlater="True"]') || (!currListId && !isAllSavesPage);
console.log(`Current saves list: ${currListId ? currListId : (isForLaterPage ? 'For later' : 'All saves')}`);

// Validation
if (!fkey) {
  console.error(`${scriptName}: fkey not found!`);
  return;
}
if (!(currListId || isAllSavesPage || isForLaterPage)) {
  console.error(`Unable to detect saved list id.`);
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
  StackExchange?.helpers?.showToast(resp.ToastMessage, {
    type: resp?.Success ? 'success' : 'error',
  });

  return resp.ListId || false;
};


/**
 * @summary Move saved item
 * @param {number} [pid] post id
 * @param {number} [listId] list id
 * @param {string} [listName] list name (Optional)
 * @returns {string} html
 */
const moveSavedItem = async (pid, listId, listName = '') => {
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
  return await fetch(`https://${location.host}/posts/${pid}/open-save-modal?isMoveTo=${isMove}&listId=${currListId}&_=${Date.now()}`, {
    "method": "GET",
  }).then(resp => resp.text());
};


/**
 * @summary Get saves private list names (excl. create)
 * @param {number} [pid] post id
 * @param {boolean} [isMove] move (default create)
 * @param {number} [currListId] initial selected list id
 * @returns {object[]} list of { name, id, count }
 */
const getSavesLists = async () => {
  const modalBody = await getSavesModal();
  const el = document.createElement('div');
  el.innerHTML = modalBody;
  const options = el.querySelectorAll('.js-save-manage-select option');
  const values = [...options].map(v => {
    const hasCount = / \((\d+,)*\d+\)$/.test(v.innerText);
    return {
      name: v.innerText.replace(/\s*\(\d+\)$/, '').trim(),
      id: v.value,
      count: hasCount ? v.innerText.match(/(?:\d+,)*\d+/g).pop() : 0
    }
  }).filter(v => v.value !== 'create');
  return values;
};


/**
 * @summary Update move dropdown list and sidebar counts
 */
const updateMoveDropdown = async () => {

  // Get saved lists
  const savedLists = await getSavesLists();

  // Update move dropdown list
  if (cAllSelect) {
    cAllSelect.disabled = true;

    // Remove all existing options
    while (cAllSelect.firstElementChild) cAllSelect.firstElementChild.remove();

    // Add default bulk option value
    const opt = makeElem('option', {
      'class': 'd-none',
    }, 'Move to...');
    cAllSelect.appendChild(opt);

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
      const currListItem = currListId && currListId === v.id || (isForLaterPage && v.id === 'for-later');
      if (currListItem) opt.setAttribute('disabled', 'disabled');

      cAllSelect.appendChild(opt);
    });

    // Insert group divider before last option (create new list)
    const divider = makeElem('option', {
      "disabled": "disabled",
    }, '---');
    cAllSelect.insertBefore(divider, cAllSelect.lastElementChild);

    // Re-enable dropdown
    cAllSelect.disabled = false;
  }

  // Update sidebar count
  const sidebarItems = document.querySelectorAll('.js-saves-sidebar-item');
  sidebarItems.forEach(item => {
    const data = savedLists.find(v => v.id == item.dataset.listId);
    if (data) {
      item.dataset.count = data.count;
      item.querySelector('a').dataset.count = data.count;
    }
  });
};


/**
 * @summary Add event listeners
 */
const addEventListeners = () => {

  // Add event listener to bulk checkbox
  const cbs = document.querySelectorAll('.saved-item-bulk-checkbox');
  cAll?.addEventListener('click', evt => {
    const checked = evt.target.checked;
    cbs.forEach(box => { box.checked = checked });
  });

  // Add event listener to bulk dropdown
  cAllSelect?.addEventListener('change', async evt => {
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
        await moveSavedItem(pid, listId);
        cb.checked = false;
      });

      // In all saves page, update text of ".js-saved-in" to new list name
      if (isAllSavesPage) {
        const updatedListId = /^\d+$/.test(listId) ? listId : ''; // only replace with numerical list ids or empty
        selectedCbs.forEach(cb => {
          const el = cb.parentElement.querySelector('.js-saved-in');
          el.innerText = listName;
          el.href = el.href.replace(/\/\d*$/, `/${updatedListId}`);
        });
      }
      // Not in "All saves page"
      else {
        // Remove from display
        selectedCbs.forEach(cb => {
          cb.closest('.js-saves-post-summary').remove();
        });

        // Reduce count in header
        elSavesCount.innerText = Number(elSavesCount.innerText) - num;
      }

      // Toast success message
      StackExchange?.helpers?.hideToasts();
      StackExchange?.helpers?.showToast(`${num} question${num > 1 ? 's' : ''} moved to <a href="/users/saves/current/${listId}">${listName}</a>.`, {
        type: 'success',
        useRawHtml: true,
        transient: true,
        transientTimeout: 20e3,
      });
    }
    else {
      // Toast info message
      StackExchange?.helpers?.hideToasts();
      StackExchange?.helpers?.showToast(`No questions were selected, so nothing was moved.`, {
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
  });
};


/**
 * @summary Main function
 */
const doPageLoad = async () => {
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
    const c = makeElem('input', {
      'type': 'checkbox',
      'class': 'saved-item-bulk-checkbox s-checkbox',
      'value': item.dataset.postId
    });
    item.insertBefore(c, item.children[0]);
  });
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