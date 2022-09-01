// ==UserScript==
// @name         Question Lists Helper
// @description  Adds more information about questions to question lists
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.2
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
    console.log(codeBlockCount, authorRep, postLength, commentCount, answerCount);

    // Hide question if it doesn't match any active filters
    const isHidden =
      (activeFilters.includes('open-only') && (postTitle.includes('[closed]') || postTitle.includes('[duplicate]'))) ||
      (activeFilters.includes('no-code') && codeBlockCount > 0) ||
      (activeFilters.includes('low-rep') && authorRep >= 200) ||
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
    const { question_id, body, comments, comment_count, favorite_count, closed_reason, closed_details, notice } = question;

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

    statsHtml += `
<div class="s-post-summary--stats-item ${comment_count >= 10 ? 'is-supernova' : ''}">
  <span class="s-post-summary--stats-item-number comment-count">${comment_count}</span><span class="s-post-summary--stats-item-unit">comments</span>
  <div class="somu-comments-preview ${comment_count ? '' : 'd-none'}"><ol class="mb0"><li>${commentsHtml}</li></ol></div>
</div>
<div class="s-post-summary--stats-item ${postLength < 200 || postLength >= 10000 ? 'is-supernova' : ''}" title="length of post text">
  <span class="s-post-summary--stats-item-number post-length">${postLength}</span><span class="s-post-summary--stats-item-unit">chars</span>
</div>`;

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