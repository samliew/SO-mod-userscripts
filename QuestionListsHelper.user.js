// ==UserScript==
// @name         Question Lists Helper
// @description  Adds more information about questions to question lists
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.3.3
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

const siteApiSlug = location.hostname.replace(/(\.stackexchange)?\.(com|net|org)$/i, '');
const apikey = 'ENmQ1YxlYnp725at*EkjEg((';


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
    if(hasBackoff()) return; // TODO: await remaining backoff period instead of dropping request
    if(!Array.isArray(pids) || pids.length === 0) console.log('Parameter is not an array, or empty.');
    if(pids.length > 100) pids = pids.slice(0, 100);

    // Fetch question details from API
    return await fetch(`https://api.stackexchange.com/2.3/questions/${pids.join(';')}?pagesize=${pids.length}&order=desc&sort=creation&site=${siteApiSlug}&filter=!0XA5-PIRJe4ut-7QzJK2bGYQO&key=${apikey}`)
        .then(response => response.ok ? response.json() : null)
        .then(data => {
        // Respect backoff
        if(data.backoff) addBackoff(data.backoff);
        // Return null if no response
        return data ? data.items : [];
    });
};


/**
 * @summary Main async function
 */
(async function() {

    // Run on question lists and search results pages only
    const qList = document.querySelectorAll('#questions, #question-mini-list, .js-search-results > div:last-child');
    if(!qList.length) {
        console.log('Not a question list page.');
        return;
    }

    // Transform search results to new question list style
    const searchResults = document.querySelector('.js-search-results');
    if(searchResults) {
        searchResults.classList.remove('ml0', 'bt');
        searchResults.classList.add('flush-left');
        searchResults.querySelectorAll('.s-card').forEach(el => {
            el.classList.remove('s-card');
            el.classList.add('br', 'bb', 'bt', 'bc-black-100');
        });
    }

    // Get questions from API
    const qids = [...qList[0].querySelectorAll('.s-post-summary:not(.somu-question-stats) .s-post-summary--content-title a, .search-result[id^="question-summary-"]:not(.somu-question-stats) .result-link a')].map(v => Number(v.pathname.match(/\/(\d+)\//)[1]));

    if(!qids.length) {
        console.log('No question IDs found.');
        return;
    }

    // Each item from API
    const questions = await getQuestions(qids);
    questions?.forEach(data => {
        const { question_id, body, comments, comment_count, favorite_count, closed_reason, closed_details, notice } = data;

        const qElem = document.getElementById(`question-summary-${question_id}`);
        if(!qElem) return; // not a question, do nothing

        const qStats = qElem.querySelectorAll('.s-post-summary--stats, .statscontainer')[0];
        const qSummary = qElem.querySelectorAll('.s-post-summary--content, .summary')[0];
        const qExcerpt = qElem.querySelectorAll('.s-post-summary--content-excerpt, .excerpt')[0];

        // Run once on each question only
        qElem.classList.add('somu-question-stats');

        // Insert full body
        qExcerpt.innerHTML = body;
        qExcerpt.classList.add('s-post-summary--content-excerpt');
        qExcerpt.classList.remove('excerpt');

        // Add comments to stats
        let commentsHtml = comments?.map(v => v.body_markdown).join('</li><li>') || '';
        let statsHtml = '';

        // Add favorite_count if is question
        if(!isNaN(favorite_count)) {
          statsHtml += `
<div class="s-post-summary--stats-item" title="${favorite_count} favorited this question">
  <span class="s-post-summary--stats-item-number mr4">${favorite_count}</span><span class="s-post-summary--stats-item-unit">favorited</span>
</div>`;
        }

        statsHtml += `
<div class="s-post-summary--stats-item">
  <span class="s-post-summary--stats-item-number mr4">${comment_count}</span><span class="s-post-summary--stats-item-unit">comments</span>
  <div class="somu-comments-preview ${comment_count ? '' : 'd-none'}"><ol class="mb0"><li>${commentsHtml}</li></ol></div>
</div>
<div class="s-post-summary--stats-item" title="length of post text">
  <span class="s-post-summary--stats-item-number mr4">${qExcerpt.innerText.length}</span><span class="s-post-summary--stats-item-unit">chars</span>
</div>`;

        // Append to post stats
        qStats.innerHTML += statsHtml;
        qStats.classList.add('s-post-summary--stats');

        // Add each key into morestats
        const moreStats = document.createElement('div');
        moreStats.classList.add('s-post-summary--morestats');
        Object.keys(data).filter(key => ![
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
                let value = data[key];

                if(key.includes('protected_date')) {
                    key = 'protected';
                    value = 'yes';
                }
                else if(key.includes('protected_date')) {
                    key = 'protected';
                    value = 'yes';
                }
                else if(key.includes('close_vote_count')) {
                    key = 'close_reopen_vote_count';
                    value = value || data['reopen_vote_count'];
                }
                else if(key.includes('up_vote_count')) {
                    key = 'votes';
                    value = `+${value} / -${data['down_vote_count']}`;
                }
                else if(key.includes('accepted_answer_id')) {
                    value = `<a href="https://${location.hostname}/a/${value}" target="_blank">${value}</a>`;
                }
                else if(key.includes('_date')) {
                    const d = new Date(value * 1000).toISOString().replace('T', ' ').replace('.000', '');
                    value = `<span class="relativetime" title="${d}" data-timestamp="${d}">${d}</span>`;
                }
                moreStats.innerHTML += `<div>${key}: ${value}</div>`;
            });

        // Has post notice
        if(notice?.body) {
            moreStats.innerHTML += `<div>post_notice: <div class="b1 bl blw2 pl6 bc-black-100 mt6">${notice.body.trim()}</div></div>`;
        }

        // Closed
        if(closed_reason) {
            moreStats.innerHTML += `<div>closed_reason: <strong>${closed_reason}</strong></div>`;

            // Hammered by gold
            const closedByHammer = closed_details?.by_users.filter(u => u.user_type !== 'unregistered');
            if(/Duplicate/i.test(closed_reason) && closedByHammer?.length < 3) {
                moreStats.innerHTML += `<div>closed_by_hammer: ${closedByHammer.map(({ user_id, display_name }) => `<a href="https://${location.hostname}/users/${user_id}" target="_blank">${display_name}</a>`).pop()}</div>`;
            }

            // Closed by mod
            const closedByMods = closed_details?.by_users.filter(u => u.user_type === 'moderator');
            if(closedByMods?.length) {
                moreStats.innerHTML += `<div>closed_by_mod: ${closedByMods.map(({ user_id, display_name }) => `<a href="https://${location.hostname}/users/${user_id}" target="_blank">${display_name} ♦</a>`).join(', ')}</div>`;
            }
        }

        // Append to post summary
        qSummary.appendChild(moreStats);
        qSummary.classList.add('s-post-summary--content');

        // Update relative dates
        StackExchange.realtime.updateRelativeDates();
    });

})();


/**
 * @summary Append styles used by this userscript to the page
 */
const style = document.createElement('style');
style.innerHTML = `
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
.s-post-summary--content-excerpt .snippet {
  max-width: 100%;
  max-height: 100px;
  margin: 4px 0;
  padding: 5px;
  overflow: hidden;
  white-space: break-spaces;
  font-size: 4px;
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
}
.somu-comments-preview {
  display: none;
  position: absolute;
  top: -10px;
  left: calc(100% + 10px);
  width: 100vw;
  max-width: 610px;
  background: white;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid var(--black-300);
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
`;
document.body.appendChild(style);
