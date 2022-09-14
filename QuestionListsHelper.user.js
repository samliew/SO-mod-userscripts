// ==UserScript==
// @name         Question Lists Helper
// @description  Adds more information about questions to question lists
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      3.1
//
// @include      https://stackoverflow.com/*
// @include      https://serverfault.com/*
// @include      https://superuser.com/*
// @include      https://askubuntu.com/*
// @include      https://mathoverflow.net/*
// @include      https://*.stackexchange.com/*
//
// @exclude      https://stackoverflow.com/c/*
// @exclude      */admin/user-activity*
// @exclude      */admin/dashboard*
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

/* globals StackExchange, hasBackoff, addBackoff */

'use strict';

const scriptName = GM_info.script.name.toLowerCase().replace(/\s+/g, '-');
const siteApiSlug = location.hostname.replace(/(\.stackexchange)?\.(com|net|org)$/i, '');
const apikey = 'ENmQ1YxlYnp725at*EkjEg((';

let qList, filterButtons;


// Detect if SOMU is loaded
const rafAsync = () => new Promise(resolve => { requestAnimationFrame(resolve); });
async function waitForSOMU() {
  while (typeof SOMU === 'undefined' || !SOMU.hasInit) { await rafAsync(); }
  return SOMU;
}


/**
 * @summary waits a specified number of seconds
 * @param {number} [seconds] seconds to wait
 * @returns {Promise<void>}
 */
const wait = (seconds = 1) => new Promise((r) => setTimeout(r, seconds * 1e3));


/**
 * @summary Close a question
 * @param {Number} pid question id
 * @param {String} closeReasonId close reason id
 * @param {Number} siteSpecificCloseReasonId off-topic reason id
 * @param {String} siteSpecificOtherText custom close reason text
 * @param {Number|null} duplicateOfQuestionId duplicate question id
 * @returns {Promise<void>}
 */
// closeReasonId:  'NeedMoreFocus', 'SiteSpecific', 'NeedsDetailsOrClarity', 'OpinionBased', 'Duplicate'
// (SO) If closeReasonId is 'SiteSpecific', siteSpecificCloseReasonId:  18-notsoftwaredev, 16-toolrec, 13-nomcve, 11-norepro, 3-custom, 2-migration
function closeQuestionAsOfftopic(pid, closeReasonId = 'SiteSpecific', siteSpecificCloseReasonId = 3, siteSpecificOtherText = 'I’m voting to close this question because ', duplicateOfQuestionId = null) {
  const fkey = StackExchange.options.user.fkey;
  const isSO = location.hostname === 'stackoverflow.com';
  return new Promise(function (resolve, reject) {
    if (!isSO) { reject(); return; }
    if (typeof pid === 'undefined' || pid === null) { reject(); return; }
    if (typeof closeReasonId === 'undefined' || closeReasonId === null) { reject(); return; }
    if (closeReasonId === 'SiteSpecific' && (typeof siteSpecificCloseReasonId === 'undefined' || siteSpecificCloseReasonId === null)) { reject(); return; }

    if (closeReasonId === 'Duplicate') siteSpecificCloseReasonId = null;

    // Logging actual action
    console.debug(`[${scriptName}] %c Closing ${pid} as ${closeReasonId}, reason ${siteSpecificCloseReasonId}.`, 'font-weight: bold');

    $.post({
      url: `https://${location.hostname}/flags/questions/${pid}/close/add`,
      data: {
        'fkey': fkey,
        'closeReasonId': closeReasonId,
        'duplicateOfQuestionId': duplicateOfQuestionId,
        'siteSpecificCloseReasonId': siteSpecificCloseReasonId,
        'siteSpecificOtherText': siteSpecificCloseReasonId == 3 && isSO ? 'This question does not appear to be about programming within the scope defined in the [help]' : siteSpecificOtherText,
        //'offTopicOtherCommentId': '',
        'originalSiteSpecificOtherText': 'I’m voting to close this question because ',
      }
    })
    .done(resolve)
    .fail(reject);
  });
}


/**
 * @summary Get questions
 * @param {Number[]} [qids] an array of question ids
 * @returns {Promise<void>}
 */
const getQuestions = async function (pids) {
  if (hasBackoff()) return; // TODO: await remaining backoff period instead of dropping request
  if (!Array.isArray(pids) || pids.length === 0) console.log('Parameter is not an array, or empty.');
  if (pids.length > 100) pids = pids.slice(0, 100);

  // Fetch question details from API
  return await fetch(`https://api.stackexchange.com/2.3/questions/${pids.join(';')}?pagesize=${pids.length}&order=desc&sort=creation&site=${siteApiSlug}&filter=!0XA5-PIRJe4ut-7QzJK2bGYQO&key=${apikey}`)
    .then(response => response.ok ? response.json() : null)
    .then(data => {
      // Respect backoff
      if (data.backoff) addBackoff(data.backoff);
      // Return null if no response
      return data ? data.items : [];
    });
};


/**
 * @summary Filter questions in question lists
 */
const filterQuestions = function () {
  // Get question elements
  const qListItems = [...qList.querySelectorAll('.s-post-summary, .search-result[id^="question-summary-"]')];

  // Get current active filters
  const activeFilters = [...filterButtons].filter(btn => btn.classList.contains('is-selected')).map(btn => btn.dataset.filter);
  console.log(activeFilters);

  // No active filters, show all questions
  if (activeFilters.length === 0) {
    qListItems.forEach(q => q.classList.remove('d-none'));
    return;
  }

  // Toggle display of each question based on active filters
  qListItems.forEach(q => {
    const postTitle = q.querySelector('.s-post-summary--content-title a').innerText;
    const codeBlockCount = q.querySelectorAll('pre').length;
    const authorRep = Number(q.querySelector('.s-user-card--rep').innerText.replace(/(\.\d*)?k$/, '000').replace(/(\.\d*)?m$/, '000000').replace(/\D/g, ''));
    const postLength = Number(q.querySelector('.post-length').innerText);
    const commentCount = Number(q.querySelector('.comment-count').innerText);
    const answerCount = Number(q.querySelectorAll('.s-post-summary--stats-item-number')[1].innerText);

    // Hide question if it doesn't match any active filters
    const isHidden =
      (activeFilters.includes('open-only') && (postTitle.includes('[closed]') || postTitle.includes('[duplicate]'))) ||
      (activeFilters.includes('no-code') && codeBlockCount > 0) ||
      (activeFilters.includes('low-rep') && authorRep >= 500) ||
      (activeFilters.includes('too-short') && postLength >= 500) ||
      (activeFilters.includes('no-comments') && commentCount > 0) ||
      (activeFilters.includes('no-answers') && answerCount > 0);

    q.classList.toggle('d-none', isHidden);
  })
};


/**
 * @summary Look at unprocessed items from question lists and get more info about them
 * @returns {Promise<void>}
 */
const processQuestionLists = async function () {

  const newListItems = [...qList.querySelectorAll('.s-post-summary:not(.somu-question-stats) .s-post-summary--content-title a, .search-result[id^="question-summary-"]:not(.somu-question-stats) .result-link a')];
  const qids = newListItems.map(v => Number(v.pathname.match(/\/(\d+)\//)[1]));

  if (!qids.length) {
    console.log('No unprocessed question IDs found.');
    return;
  }

  // Get questions from API
  const questions = await getQuestions(qids);

  // Each item from API
  questions?.forEach(question => {
    const { question_id, body, comments, comment_count, favorite_count, close_vote_count, closed_date, locked_date, closed_reason, closed_details, notice } = question;

    const qElem = document.getElementById(`question-summary-${question_id}`);
    if (!qElem) return; // not a question, do nothing

    const qTitle = qElem.querySelector('.s-post-summary--content-title, .result-link');
    const qStats = qElem.querySelector('.s-post-summary--stats, .statscontainer');
    const qSummary = qElem.querySelector('.s-post-summary--content, .summary');
    let qExcerpt = qElem.querySelector('.s-post-summary--content-excerpt, .excerpt');

    // If excerpt element missing (home page), add
    if (!qExcerpt) {
      qExcerpt = document.createElement('div');
      qTitle.insertAdjacentElement('afterend', qExcerpt);
    }

    // Run once on each question only
    qElem.classList.add('somu-question-stats');

    // Insert full body
    qExcerpt.innerHTML = body;
    qExcerpt.classList.add('s-post-summary--content-excerpt');
    qExcerpt.classList.remove('excerpt');
    const postLength = qExcerpt.innerText.length;

    // Add comments to stats
    let commentsHtml = comments?.map(v => v.body_markdown).join('</li><li>') || '';
    let statsHtml = '';

    // Add favorite_count if is question
    if (!isNaN(favorite_count)) {
      statsHtml += `
<div class="s-post-summary--stats-item ${favorite_count >= 1000 ? 'is-supernova' : ''}" title="${favorite_count} favorited this question">
  <span class="s-post-summary--stats-item-number favorite-count">${favorite_count}</span><span class="s-post-summary--stats-item-unit">favorited</span>
</div>`;
    }

    // Add comment and post length stats
    statsHtml += `
<div class="s-post-summary--stats-item ${comment_count >= 10 ? 'is-supernova' : ''}">
  <span class="s-post-summary--stats-item-number comment-count">${comment_count}</span><span class="s-post-summary--stats-item-unit">comments</span>
  <div class="somu-comments-preview ${comment_count ? '' : 'd-none'}"><ol class="mb0"><li>${commentsHtml}</li></ol></div>
</div>
<div class="s-post-summary--stats-item ${postLength < 200 || postLength >= 10000 ? 'is-supernova' : ''}" title="length of post text">
  <span class="s-post-summary--stats-item-number post-length">${postLength}</span><span class="s-post-summary--stats-item-unit">chars</span>
</div>`;

    // Add close button
    const canClose = !closed_date && !locked_date;
    if(canClose) {
      statsHtml += `
        <button type="button" class="js-close-question-link s-btn s-btn__link" title="Vote to close this question" data-is-closed="false" data-has-active-vote="${close_vote_count}" data-question-id="${question_id}">
          Close ${close_vote_count ? "(" + close_vote_count + ")" : ""}
        </button>
      `;
    }

    // Append to post stats
    qStats.innerHTML += statsHtml;
    qStats.classList.add('s-post-summary--stats');

    // Add each key into morestats
    const moreStats = document.createElement('div');
    moreStats.classList.add('s-post-summary--morestats');
    Object.keys(question).filter(key => ![
      // Ignored keys
      'notice',
      'closed_reason',
      'closed_details',
      'question_id',
      'comment_count',
      'favorite_count',
      'comments',
      'answers',
      'link',
      'title',
      'body',
      'tags',
      'owner',
      'last_editor',
      'score',
      'view_count',
      'answer_count',
      'is_answered',
      'down_vote_count',
      'reopen_vote_count',
      'community_owned_date',
    ].includes(key)).forEach((key, i) => {
      // For each key
      let value = question[key];

      if (key.includes('protected_date')) {
        key = 'protected';
        value = 'yes';
      }
      else if (key.includes('protected_date')) {
        key = 'protected';
        value = 'yes';
      }
      else if (key.includes('close_vote_count')) {
        key = 'close_reopen_vote_count';
        value = value || question['reopen_vote_count'];
      }
      else if (key.includes('up_vote_count')) {
        key = 'votes';
        value = `+${value} / -${question['down_vote_count']}`;
      }
      else if (key.includes('accepted_answer_id')) {
        value = `<a href="https://${location.hostname}/a/${value}" target="_blank">${value}</a>`;
      }
      else if (key.includes('_date')) {
        const d = new Date(value * 1000).toISOString().replace('T', ' ').replace('.000', '');
        value = `<span class="relativetime" title="${d}" data-timestamp="${d}">${d}</span>`;
      }
      moreStats.innerHTML += `<div>${key}: ${value}</div>`;
    });

    // Has post notice
    if (notice?.body) {
      moreStats.innerHTML += `<div>post_notice: <div class="b1 bl blw2 pl6 bc-black-100 mt6">${notice.body.trim()}</div></div>`;
    }

    // Closed
    if (closed_reason) {
      const { reason, description } = closed_details;

      // Convert HTML descriptions to text
      const tempEl = document.createElement('div');
      tempEl.innerHTML = description.replace('StackOverflow.StackHtmlContent', '');
      const descriptionText = reason.includes('Not suitable') ? tempEl.innerText.split('. ')[0].replace(/^"/, '') : '';

      moreStats.innerHTML += `<div>closed_reason: <strong>${reason}</strong><div class="fs-fine">${descriptionText}</div></div>`;

      const closedByMods = closed_details?.by_users.filter(u => u.user_type === 'moderator');
      const closedByHammer = closed_details?.by_users.filter(u => u.user_type !== 'unregistered');

      // Closed by mod
      if (closedByMods?.length) {
        moreStats.innerHTML += `<div>closed_by_mod: ${closedByMods.map(({ user_id, display_name }) => `<a href="https://${location.hostname}/users/${user_id}" target="_blank">${display_name} ♦</a>`).join(', ')}</div>`;
      }

      // Hammered by gold
      else if (/Duplicate/i.test(closed_reason) && closedByHammer?.length < 3) {
        moreStats.innerHTML += `<div>closed_by_hammer: ${closedByHammer.map(({ user_id, display_name }) => `<a href="https://${location.hostname}/users/${user_id}" target="_blank">${display_name}</a>`).pop()}</div>`;
      }
    }

    // Append to post summary
    qSummary.appendChild(moreStats);
    qSummary.classList.add('s-post-summary--content');

    // Update relative dates
    StackExchange.realtime.updateRelativeDates();
  });

  filterQuestions();
};


/**
 * @summary Add question list filters to sidebar
 * @returns void
 */
const initQuestionListFilter = async function () {
  const sidebar = document.querySelector('.left-sidebar--sticky-container');
  if (!sidebar) return;

  const filterOptions = [
    'open-only',
    'no-code',
    'low-rep',
    'too-short',
    'no-comments',
    'no-answers',
  ];

  const filterWrapper = document.createElement('div');
  filterWrapper.classList.add('question-list-filter', 'pb4');
  sidebar.appendChild(filterWrapper);

  // Add list of filter buttons
  let html = `<div class="fs-fine tt-uppercase ml8 mt24 mb12 fc-light">Post Filters</div>
    <div class="s-btn-group-stacked ml4 pl8 pr8" id="somu-question-list-filter">`;

  filterOptions.forEach(opt => {
    html += `<button class="s-btn s-btn-sm s-btn__muted s-btn__outlined ta-left" data-filter="${opt}" name="SOMU:${scriptName}:${opt}">${opt.replace(/-/g, ' ')}</button>`;
  });
  filterWrapper.innerHTML = html + '</div>';

  filterWrapper.querySelectorAll('button').forEach(btn => btn.addEventListener('click', function (evt) {
    const el = evt.currentTarget;
    this.classList.toggle('is-selected');

    // Save SOMU value
    if (typeof SOMU !== 'undefined') {
      const isSelected = this.classList.contains('is-selected');
      SOMU.saveOptionValue(el.name, isSelected ? 'true' : 'false');
      // Toggle SOMU Options option checkbox
      document.querySelector(`input[name="${el.name}"]`).checked = isSelected;
    }

    if (!el?.dataset.filter) return;
    filterQuestions();
  }));

  filterButtons = filterWrapper.querySelectorAll('button');

  // Load SOMU value
  waitForSOMU().then(function (SOMU) {
    filterOptions.forEach(opt => {
      // Set option field in sidebar with current custom value; use default value if not set before
      SOMU.addOption(scriptName, opt, false, 'bool');
      // Get current custom value with default
      const selected = SOMU.getOptionValue(scriptName, opt, false, 'bool');
      // Set initial button state
      filterWrapper.querySelector(`button[data-filter="${opt}"]`).classList.toggle('is-selected', selected);
    });

  });
};


/**
 * @summary Handle duplicate search event in close dialog
 */
function doDupeSearch(closeModal) {
  const qid = closeModal.dataset.questionid || closeModal.dataset.postid;
  const dupeSearch = closeModal.querySelector('#duplicate-search, .js-duplicate-search-field');
  const searchQuery = dupeSearch.value.trim();
  const dupeNavi = closeModal.querySelector('.navi-container');
  const resultElem = closeModal.querySelector('.original-display .list-container');
  const previewElem = closeModal.querySelector('.preview');
  const errorElem = closeModal.querySelector('.search-errors');
  const dupeIdField = closeModal.querySelector('#original-question-id');
  const modalSubmit = closeModal.querySelector('.js-popup-submit');

  if (!searchQuery) {
    return;
  }

  // Clear search error message
  errorElem.innerText = '';

  fetch(`https://${location.hostname}/posts/popup/close/search-originals/${qid}?q=${searchQuery}`).then(
    response => response.text()
  ).then(async html => {
    // Single result preview
    if (html && html.startsWith('<div class="show-original">')) {
      previewElem.innerHTML = html;
      previewElem.style.display = 'block';
      resultElem.style.display = 'none';
      modalSubmit.disabled = false;

      dupeIdField.value = previewElem.querySelector('.js-question').dataset.questionid;

      if (dupeNavi.children.length) {
        dupeNavi.children[0].innerHTML = `<a>${dupeNavi.children[0].dataset.abbr}</a>`;

        // Add event listener to return to results
        dupeNavi.querySelector('a').addEventListener('click', function (evt) {
          dupeIdField.value = '';
          previewElem.style.display = 'none';
          resultElem.style.display = 'block';
          modalSubmit.disabled = true;
          dupeNavi.children[0].innerText = dupeNavi.children[0].dataset.text;
          dupeSearch.value = dupeSearch.dataset.originalSearch ?? '';
        });
      }
      return;
    }

    // List of results
    resultElem.innerHTML = html;
    await wait(0.01);
    dupeNavi.innerHTML = resultElem.querySelector('.navi').outerHTML;

    // No suggestions, clear
    if (!dupeNavi.children.length) {
      errorElem.innerText = 'Your search returned no matches; please try a different search';
      resultElem.innerHTML = '';
      return;
    }

    dupeNavi.children[0].innerText = dupeNavi.children[0].dataset.text;

    // Add event listener to preview result
    resultElem.querySelectorAll('.item').forEach(el => el.addEventListener('click', evt => {
      evt.preventDefault();
      const url = evt.currentTarget.querySelector('.post-link a').href;
      dupeSearch.dataset.originalSearch = searchQuery;
      dupeSearch.value = url;
      doDupeSearch(closeModal);
    }));

  }).catch(error => {
    errorElem.innerText = 'Your search returned no matches; please try a different search';
    resultElem.innerHTML = '';
  });
}


/**
 * @summary Add event listeners (close buttons)
 */
const initEventListeners = async function () {
  document.addEventListener('click', function (evt) {
    const closeBtn = evt.target;
    if (!closeBtn?.classList?.contains('js-close-question-link')) return;

    // Blur button
    closeBtn.blur();

    const qid = closeBtn.dataset.questionId;
    if (!qid) return;

    // Fetch close reason dialog
    fetch(`https://${location.hostname}/flags/questions/${qid}/close/popup?loadedTimestamp=1663118348686`).then(
      response => response.text()
    ).then(html => {
      // Insert close reason dialog after close button
      const closeWrapper = document.createElement('div');
      closeWrapper.innerHTML = html;
      closeBtn.parentNode.insertBefore(closeWrapper, null);

      // Remove dialog wrapper on click
      closeWrapper.addEventListener('click', function (evt) {
        closeWrapper.remove();
      });

      // Get elements in dialog
      const closeModal = closeWrapper.querySelector('#popup-close-question');
      const modalTitle = closeModal.querySelector('.popup-title');
      const modalBreadcrumbs = closeModal.querySelector('.js-breadcrumbs');
      const form = closeWrapper.querySelector('form');
      const mainPane = closeModal.querySelector('#pane-main');
      const submitBtn = closeModal.querySelector('.js-popup-submit');
      const backBtn = closeModal.querySelector('.js-popup-back');
      const cancelBtn = closeModal.querySelector('.js-popup-cancel');
      const radios = closeModal.querySelectorAll('input');
      const dupeSearch = closeModal.querySelector('#duplicate-search, .js-duplicate-search-field');
      const dupeNavi = closeModal.querySelector('.navi-container');

      // Center dialog in window
      setTimeout(closeModal => {
        closeModal.style.position = 'fixed';
        closeModal.style.top = (window.innerHeight / 2) - (closeModal.offsetHeight / 2) + 'px';
        closeModal.style.left = (window.innerWidth / 2) - (closeModal.offsetWidth / 2) + 'px';
      }, 10, closeModal);

      // Add name to duplicate question field
      form.querySelector('#original-question-id').name = 'duplicateOfQuestionId';

      // Add breadcrumbs
      const bcDivider = `<svg aria-hidden="true" class="svg-icon iconArrowRightAltSm s-breadcrumbs--divider d-none" width="13" height="14" viewBox="0 0 13 14"><path d="m4.38 4.62 1.24-1.24L9.24 7l-3.62 3.62-1.24-1.24L6.76 7 4.38 4.62Z"></path></svg>`
      modalBreadcrumbs.innerHTML = `<div class="s-breadcrumbs--item"><span class="s-breadcrumbs--link c-pointer" tabindex="0" role="button">Closing</span>${bcDivider}</div>`;
      modalBreadcrumbs.classList.remove('d-none');

      // Event listeners for close dialog
      closeModal.classList.add('d-block');
      closeModal.addEventListener('click', function (evt) {
        // Don't bubble up to parent
        evt.stopPropagation();
      });

      // Event listeners for close buttons
      const btns = closeModal.querySelectorAll('.popup-close a, .js-popup-close');
      btns.forEach(btn => btn.addEventListener('click', function (evt) {
        closeWrapper.remove();
      }));

      // Event listeners for back buttons to toggle subpanes
      const homeLink = closeModal.querySelector('.s-breadcrumbs--item:first-child');
      [homeLink, backBtn].forEach(btn => btn.addEventListener('click', function (evt) {
        // Hide all subpanes
        const subpanes = closeModal.querySelectorAll('.popup-subpane');
        subpanes.forEach(pane => pane.classList.add('dno'));

        // Show main pane
        mainPane.classList.remove('dno');

        // Hide back button and show cancel button
        backBtn.classList.add('d-none');
        cancelBtn.classList.remove('d-none');

        // Clear radio buttons checked state
        radios.forEach(radio => radio.checked = false);

        // Disable close button
        submitBtn.disabled = true;

        // Change title
        modalTitle.innerText = 'Why should this question be closed?';
      }));

      // Event listeners for radio buttons
      radios.forEach(radio => radio.addEventListener('change', function (evt) {

        // If there is a subpane
        const subpane = closeWrapper.querySelector(`.popup-subpane[data-subpane-name="${this.dataset.subpaneName}"]`);
        if (!subpane) {
          // Enable close button
          submitBtn.disabled = false;

          // Focus close button
          submitBtn.focus();
          return;
        }

        // Disable close button
        submitBtn.disabled = true;

        // Hide all subpanes
        const subpanes = closeModal.querySelectorAll('.popup-subpane');
        subpanes.forEach(pane => pane.classList.add('dno'));

        // Hide main pane
        mainPane.classList.add('dno');

        // Show selected subpane
        subpane.classList.remove('dno');

        // Show back button and hide cancel button
        backBtn.classList.remove('d-none');
        cancelBtn.classList.add('d-none');

        // If duplicate search selected
        if (this.value === 'Duplicate' || this.dataset.subpaneName === 'duplicate') {

          // Change title
          modalTitle.innerText = 'What question is this a duplicate of?';

          // Focus duplicate search field
          form.querySelector('#duplicate-search, .js-duplicate-search-field').focus();

          // Load initial duplicate search suggestions if not already loaded
          if (dupeSearch.value) return;
          const resultElem = subpane.querySelector('.original-display .list-container');
          fetch(resultElem.dataset.loadUrl).then(
            response => response.text()
          ).then(async html => {
            resultElem.innerHTML = html;
            await wait(0.01);
            dupeNavi.innerHTML = resultElem.querySelector('.navi').outerHTML;

            // No suggestions, clear
            if (!dupeNavi.children.length) {
              resultElem.innerHTML = '';
              return;
            }

            dupeNavi.children[0].innerText = dupeNavi.children[0].dataset.text ?? '';

            // Add event listener to preview result
            resultElem.querySelectorAll('.item').forEach(el => el.addEventListener('click', evt => {
              evt.preventDefault();
              const url = evt.currentTarget.querySelector('.post-link a').href;
              dupeSearch.value = url;
              doDupeSearch(closeModal);
            }));
          });
        }
      }));

      // Event listeners for duplicate search field
      let searchDebounceTimeout;
      dupeSearch.addEventListener('input', evt => {
        if(searchDebounceTimeout) clearTimeout(searchDebounceTimeout);
        searchDebounceTimeout = setTimeout(doDupeSearch, 1000, closeModal);
      });

      // Event listeners for form submit
      form.addEventListener('submit', function (evt) {
        const closeReasonId = form.closeReasonId.value ?? undefined;
        const siteSpecificCloseReasonId = form.siteSpecificCloseReasonId.value ?? undefined;
        const siteSpecificOtherText = form.siteSpecificOtherText.value ?? undefined;
        const duplicateOfQuestionId = form.duplicateOfQuestionId.value ?? undefined;
        const belongsOnBaseHostAddress = form.belongsOnBaseHostAddress.value ?? undefined;

        // TODO: Test migration
        if (belongsOnBaseHostAddress) {
          return; // Use normal form submit action
        }

        // We do our own AJAX submission to avoid page reload
        evt.preventDefault();
        closeQuestionAsOfftopic(qid, closeReasonId, siteSpecificCloseReasonId, siteSpecificOtherText, duplicateOfQuestionId).then(() => {
          // Remove dialog wrapper
          closeWrapper.remove();
          // Rename close button and disable it
          closeBtn.innerText = 'Closed';
          closeBtn.disabled = true;
        });
      });
    });
  });
};


/**
 * @summary Keyboard events for close dialog shortcuts, copied from ReviewQueueHelper
 */
function listenToKeyboardEvents() {

  // Cancel existing handlers and implement our own keyboard shortcuts
  $(document).off('keypress keyup');

  // Keyboard shortcuts event handler
  $(document).on('keyup', function (evt) {
      // Back buttons: escape (27)
      // Unable to use tilde (192) as on the UK keyboard it is swapped the single quote keycode
      const cancel = evt.keyCode === 27;
      const goback = evt.keyCode === 27;

      // Get numeric key presses
      let index = evt.keyCode - 49; // 49 = number 1 = 0 (index)
      if (index == -1) index = 9; // remap zero to last index
      if (index < 0 || index > 9) { // handle 1-0 number keys only (index 0-9)

          // Try keypad keycodes instead
          let altIndex = evt.keyCode - 97; // 97 = number 1 = 0 (index)
          if (altIndex == -1) altIndex = 9; // remap zero to last index
          if (altIndex >= 0 && altIndex <= 9) {
              index = altIndex; // handle 1-0 number keys only (index 0-9)
          }
          else {
              // Both are invalid
              index = null;
          }
      }

      // Do nothing if key modifiers were pressed
      if (evt.shiftKey || evt.ctrlKey || evt.altKey) return;

      // If edit mode, cancel if esc is pressed
      if (cancel && $('.editing-review-content').length > 0) {
          $('.js-review-cancel-button').click();
          return;
      }


      // Get current popup
      const currPopup = $('#delete-question-popup, #rejection-popup, #popup-flag-post, #popup-close-question').filter(':visible').last();

      // #69 - If a textbox or textarea is focused, e.g.: comment box
      // E.g.: if post is being edited or being commented on
      if (document.activeElement.tagName == 'TEXTAREA' ||
          (document.activeElement.tagName == 'INPUT' && document.activeElement.type == 'text') ||
          document.getElementsByClassName('editing-review-content').length > 0) {

          // Just unfocus the element if esc was pressed
          if (currPopup.length && goback) document.activeElement.blur();
          return;
      }


      // If there's an active popup
      if (currPopup.length) {

          // If escape key pressed, go back to previous pane, or dismiss popup if on main pane
          if (goback) {

              // If displaying a single duplicate post, go back to duplicates search
              const dupeBack = currPopup.find('.original-display .navi a').filter(':visible');
              if (dupeBack.length) {
                  dupeBack.click();
                  return false;
              }

              // Go back to previous pane if possible,
              // otherwise default to dismiss popup
              const link = currPopup.find('.popup-close a, .popup-breadcrumbs a, .js-popup-back').filter(':visible');
              if (link.length) {
                  link.last().click();
                  // Always clear dupe closure search box on back action
                  $('#search-text').val('');
                  return false;
              }
          }

          // If valid index, click it
          else if (index != null) {
              const currPopup = $('.popup:visible').last();
              // Get active (visible) pane
              const pane = currPopup.find('form .action-list, .popup-active-pane').filter(':visible').last();
              // Get options
              const opts = pane.find('input:radio');
              // Click option
              const opt = opts.eq(index).click();
              // Job is done here. Do not bubble if an option was clicked
              return opt.length !== 1;
          }

      } // end popup is active
  });
}


/**
 * @summary Main async function
 */
const doPageLoad = async function () {

  // Run on question lists and search results pages only
  qList = document.querySelector('#questions, #question-mini-list, .js-search-results > div:last-child');
  if (!qList) {
    console.log('Not a question list page.');
    return;
  }

  document.body.classList.add('SOMU-QuestionListsHelper');

  // Transform old question lists to new style
  let oldQuestionList = document.querySelector('.js-search-results, #qlist-wrapper');
  if (oldQuestionList) {
    oldQuestionList.classList.remove('ml0', 'bt', 's-card');
    oldQuestionList.classList.add('flush-left');
    oldQuestionList.querySelectorAll('.s-card').forEach(el => {
      el.classList.remove('s-card');
      el.classList.add('bb', 'bt', 'bc-black-100');
    });
  }
  const mixedQuestionList = document.querySelector('.mixed-question-list');
  if (mixedQuestionList) {
    mixedQuestionList.classList.remove('ml0', 'bt', 's-card');
    mixedQuestionList.classList.add('flush-left');
  }

  // When new questions are loaded
  const observer = new MutationObserver((mutationsList, observer) => {
    const hasNewChildElements = !!mutationsList.filter(m => m.type === 'childList').length;
    if (hasNewChildElements) processQuestionLists();
  });
  observer.observe(qList, { attributes: false, childList: true, subtree: false });

  // Init filters
  await initQuestionListFilter();

  // Do once on page load
  await processQuestionLists();

  // Add event listeners
  initEventListeners();
  listenToKeyboardEvents();
};


// On page load
doPageLoad();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
.s-post-summary--stats {
  --s-post-summary-stats-gap: 3px;
}
.search-result .excerpt,
.s-post-summary--content .s-post-summary--content-excerpt {
  -webkit-line-clamp: 10;
}
.search-result .excerpt > *,
.s-post-summary--content-excerpt > * {
  margin-bottom: 0;
}
.search-result .excerpt pre,
.search-result .excerpt .snippet,
.s-post-summary--content-excerpt pre,
.s-post-summary--content-excerpt .s-table-container,
.s-post-summary--content-excerpt .snippet {
  max-width: 100%;
  max-height: 150px;
  margin: 4px 0;
  padding: 5px;
  overflow: hidden;
  white-space: break-spaces;
  font-size: 4px;
}
.s-post-summary--content-excerpt .s-table-container {
  zoom: 0.5;
}
.s-post-summary--content-excerpt .s-table-container table {
  width: auto;
}
.s-post-summary--content b,
.s-post-summary--content strong {
  font-weight: 500;
}
.s-post-summary--content-excerpt .snippet-code {
  padding: 0;
}
.s-post-summary--content-excerpt .snippet-code-html {
  margin: 0;
}
.search-result .excerpt br,
.search-result .excerpt hr,
.s-post-summary--content-excerpt br,
.s-post-summary--content-excerpt hr {
  display: none;
}
.search-result .excerpt img,
.s-post-summary--content-excerpt img {
  max-width: 100%;
  max-height: 80px;
}
.excerpt sup,
.excerpt sub,
.s-post-summary--content-excerpt sup,
.s-post-summary--content-excerpt sub {
  font-size: 0.9em;
  vertical-align: unset;
}

.s-post-summary--morestats {
  padding-top: 16px;
  clear: both;
  columns: 2;
  color: var(--black-600);
  font-size: 0.95em;
  line-height: 1.2;
}
.somu-comments-preview {
  display: none;
  position: absolute;
  top: -10px;
  left: calc(100% + 10px);
  width: 100vw;
  max-width: 610px;
  background: var(--white);
  padding: 10px;
  border-radius: 5px;
  border: 1px solid var(--black-300);
  color: var(--theme-body-font-color);
  white-space: normal;
  box-shadow: 2px 2px 11px -6px black;
}
.somu-comments-preview:before {
  content: '';
  position: absolute;
  top: 6px;
  right: 100%;
  width: 90px;
  height: 27px;
  z-index: 0;
}
.somu-question-stats .statscontainer.s-post-summary--stats {
  width: 108px;
  margin-right: 8px;
  margin-bottom: -2px;
}
.statscontainer .s-post-summary--stats-item {
  font-size: 13px;
}
.s-post-summary--stats-item {
  position: relative;
  opacity: 1 !important;
  z-index: 1;
}
.s-post-summary--stats-item:hover .somu-comments-preview {
  display: block;
  z-index: 2;
}

/* New s-btn-group-stacked */
.s-btn-group-stacked {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
}
.s-btn-group-stacked .s-btn {
  text-align: left;
}
.s-btn-group-stacked .s-btn:not(:last-child) {
  margin-bottom: -1px;
}
.s-btn-group-stacked .s-btn:not(:first-child):not(:last-child) {
  border-radius: 0;
}
.s-btn-group-stacked .s-btn:first-child:not(:only-child) {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
.s-btn-group-stacked .s-btn:last-child:not(:only-child) {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
.s-btn-group-stacked .s-btn.is-selected {
  background: var(--theme-button-selected-background-color);
  box-shadow: none;
}
.s-btn-group-stacked .s-btn__muted.is-selected {
  color: var(--black-700);
  background-color: var(--black-075);
}

.flush-left > .flush-left {
  margin-left: 0;
}
`;
document.body.appendChild(styles);