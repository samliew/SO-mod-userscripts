// ==UserScript==
// @name         Question Lists Helper
// @description  Adds more information about questions to question lists
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.1
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

/* globals hasBackoff, addBackoff */


let backoff;
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
    if(hasBackoff) return; // TODO: await remaining backoff period instead of dropping request
    if(!Array.isArray(pids) || pids.length === 0) throw new Error('Parameter is not an array, or empty.');
    if(pids.length > 100) pids = pids.slice(0, 100);

    // Fetch question details from API
    return await fetch(`https://api.stackexchange.com/2.3/questions/${pids.join(';')}?pagesize=${pids.length}&order=desc&sort=creation&site=${siteApiSlug}&filter=!LeccOePNkCvNktEublRmRy&key=${apikey}`)
        .then(response => response.ok ? response.json() : null)
        .then(data => {
        // Respect backoff
        if(data.backoff) addBackoff(data.backoff);
        // Return null if no response
        return data ? data.items : [];
    });
};

/**
 * @summary Append styles used by this userscript to the page
 */
const appendStyles = () => {
    const style = document.createElement('style');
    style.innerHTML = `
.s-post-summary--stats {
  --s-post-summary-stats-gap: 3px;
}
.s-post-summary--content .s-post-summary--content-excerpt {
  -webkit-line-clamp: 10;
}
.s-post-summary--content-excerpt p {
  margin-bottom: 0;
}
.s-post-summary--content-excerpt pre,
.s-post-summary--content-excerpt .snippet {
  display: none;
}
.s-post-summary--morestats {
  margin-top: 3px;
}
`;
    document.body.appendChild(style);
}


/**
 * @summary Main async function
 */
(async function() {
    'use strict';

    // Run on page load
    appendStyles();

    // Run on question list pages only
    const qList = document.getElementById('questions');
    if(!qList) throw new Error('Not a question list page.');

    const qids = [...qList.querySelectorAll('.s-post-summary--content-title a')].map(v => Number(v.pathname.match(/\/(\d+)\//)[1]));
    console.log(qids);

    const questions = await getQuestions(qids);
    questions?.forEach(data => {
        console.log(data);
        const { question_id, comment_count, body } = data;

        const qElem = document.getElementById(`question-summary-${question_id}`);
        const qStats = qElem.querySelector('.s-post-summary--stats');
        const qSummary = qElem.querySelector('.s-post-summary--content');
        const qExcerpt = qElem.querySelector('.s-post-summary--content-excerpt');

        // Insert full body
        qExcerpt.innerHTML = body;

        const stats = document.createElement('div');
        stats.innerHTML = `
<div class="s-post-summary--stats-item" title="${comment_count} comments">
  <span class="s-post-summary--stats-item-number mr4">${comment_count}</span><span class="s-post-summary--stats-item-unit">comments</span>
</div>
        `;
        qStats.appendChild(stats);

        const moreStats = document.createElement('div');
        moreStats.classList.add('s-post-summary--morestats');
        Object.keys(data).forEach((key, i) => {

            // Ignore some keys
            if(['question_id', 'comment_count', 'link', 'title', 'last_activity_date', 'creation_date', 'body'].includes(key)) return;

            // Add data
            moreStats.innerHTML += `<div>${key}: ${data[key]}</div>`;
        });
        qSummary.appendChild(moreStats);
    });

})();
