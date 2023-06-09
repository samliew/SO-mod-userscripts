// ==UserScript==
// @name         Chat Transcript Helper
// @description  Converts UTC timestamps to local time, Load entire day into single page
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      5.3.12
//
// @match        https://chat.stackoverflow.com/transcript/*
// @match        https://chat.stackexchange.com/transcript/*
// @match        https://chat.meta.stackexchange.com/transcript/*
//
// @match        https://chat.stackoverflow.com/rooms/*/conversation/*
// @match        https://chat.stackexchange.com/rooms/*/conversation/*
// @match        https://chat.meta.stackexchange.com/rooms/*/conversation/*
//
// @match        https://chat.stackoverflow.com/search*
// @match        https://chat.stackexchange.com/search*
// @match        https://chat.meta.stackexchange.com/search*
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/se-ajax-common.js
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

/* globals StackExchange */
/// <reference types="./globals" />

'use strict';

// Customisable variables
const scrollOffset = 35 + 20; // approx 35px for header and nav, 20px for padding

// Private variables
const isMobile = document.body.classList.contains('mob');
const tzOffset = new Date().getTimezoneOffset();
const tzHours = -(tzOffset / 60); // e.g. 8.0 or -7.5
const tzHoursWhole = Math.trunc(tzHours); // e.g. 8 or -7
const tzMins = tzOffset % 60; // e.g. usually 0, could be 30
const tzMinsFraction = tzMins / 60; // e.g. 0 or 0.5
const tzSymbol = (tzHours >= 0 ? '+' : '') + tzHours; // e.g. +8.0 or -7.5
console.log(`[CTH] Local timezone offset: ${tzOffset} (${tzSymbol} hours)`);

// Get [rel="canonical"] link, which is assumed to always exist on transcript pages (not search results)
const canonicalLink = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
const [_, utcYear, utcMonth, utcDate, subPage] = canonicalLink?.match(/^\/transcript\/\d+\/(\d+)\/(\d+)\/(\d+)\/(\d+-\d+)?/) || [null, NaN, NaN, NaN, null];
console.log(`[CTH] Transcript UTC date: ${utcYear}/${utcMonth}/${utcDate} (${subPage})`);


/**
 * Convert a UTC time string to a Date object
 * @param {string} str time string in UTC
 * @param {Date} [startOfUTCDay] Date object for start of UTC day, or today if not provided
 * @returns {Date} Date object
 * @example
 *   parseTime("3:22 AM") // returns Date object for today at 3:22 AM UTC
 *   parseTime("3:22 PM") // returns Date object for today at 3:22 PM UTC
 */
const parseChatTimestamp = (timeStr, startOfUTCDay = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()))) => {
  if (!timeStr) return null;

  // Extract hour, min, AM/PM
  let dateObj, dayOfWeek = timeStr.substr(0, 3);
  let [__, yst, hour, min, ap] = timeStr.match(/(yst )?(\d+):(\d+)(?:\s(AM|PM))?/);
  hour = Number(hour);
  min = Number(min);

  // Convert hour to 24h time
  if (ap === 'PM' && hour < 12) hour += 12;
  else if (ap === 'AM' && hour === 12) hour = 0;

  // If time is "yesterday", set startOfUTCDay to yesterday
  if (timeStr.startsWith('yst ')) {
    dateObj = new Date(Date.UTC(startOfUTCDay.getUTCFullYear(), startOfUTCDay.getUTCMonth(), startOfUTCDay.getUTCDate() - 1, hour, min));
  }
  // If time starts with a day of week, set startOfUTCDay to that day of week
  else if (daysOfWeek.includes(dayOfWeek)) {
    let daysDiff = daysOfWeek.indexOf(dayOfWeek) - startOfUTCDay.getUTCDay();
    if (daysDiff > 0) daysDiff -= 7;
    dateObj = new Date(Date.UTC(startOfUTCDay.getUTCFullYear(), startOfUTCDay.getUTCMonth(), startOfUTCDay.getUTCDate() + daysDiff, hour, min));
  }
  // Try to extract date from timestamp
  else {
    let [_, month, day, year] = timeStr.match(/(\w+) (\d+)(?:, (\d+))?/) || [null, NaN, NaN, NaN];
    day = Number(day);
    year = Number(year);
    if (!year) year = new Date().getFullYear();
    if (typeof month !== 'undefined') {
      month = monthsOfYear.indexOf(month);
    }
    // If date is valid, set startOfUTCDay to that date
    if (typeof month !== 'undefined' && !isNaN(month) && !isNaN(day) && !isNaN(year)) {
      dateObj = new Date(Date.UTC(year, month, day, hour, min));
    }
    else {
      dateObj = new Date(Date.UTC(startOfUTCDay.getUTCFullYear(), startOfUTCDay.getUTCMonth(), startOfUTCDay.getUTCDate(), hour, min));
    }
  }

  if (dateObj > new Date()) {
    console.error(`[CTH] Possible Invalid Future Date`, dateObj, timeStr, daysDiff, startOfUTCDay);
  }

  return dateObj;
};


/**
 * Convert a Date object to a time string in local time
 * @param {Date} date Date object (not millis)
 * @param {object} [options] Options object
 * @returns {string} datetime string in local time
 * @example
 *   toLocalTime(new Date()) // returns "3:22 PM"
 *   toLocalTime(new Date(), { showDate: true }) // returns "3:22 PM"
 *   toLocalTime(new Date(), { showDate: true, showYear: true, hours24: true }) // returns "15:22"
 */
const toLocalTimestamp = (date, options = {}) => {
  // Check if valid Date
  if (!date || Object.prototype.toString.call(date) !== '[object Date]' || isNaN(date.getTime())) return null;

  // Merge defaults with options
  options = Object.assign({
    showDate: true,
    showYear: false,
    hours24: false,
  }, options);

  let ap = '',
    hour = date.getHours(),
    min = date.getMinutes().toString().padStart(2, '0');

  // Convert to 12h time
  if (!options.hours24) {
    ap = hour >= 12 ? ' PM' : ' AM';
    if (hour > 12) hour -= 12;
    else if (hour === 0) hour = 12;
  }
  // 24h time, pad hour
  else {
    hour = hour.toString().padStart(2, '0');
  }

  // If not this year, add date with year
  if (options.showDate && options.showYear && date.getFullYear() !== new Date().getFullYear()) {
    return `${monthsOfYear[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${hour}:${min}${ap}`;
  }
  // If not today, add date and month
  else if (options.showDate && date.getDate() !== new Date().getDate()) {
    return `${monthsOfYear[date.getMonth()]} ${date.getDate()}, ${hour}:${min}${ap}`;
  }

  return `${hour}:${min}${ap}`;
};


function convertTranscriptTimestamps() {

  // Set UTC day from canonical link
  const startOfUTCDay = new Date(Date.UTC(utcYear, utcMonth - 1, utcDate));

  document.querySelectorAll('.timestamp').forEach(el => {
    const date = parseChatTimestamp(el.innerText, startOfUTCDay);
    el.dataset.originalTimestamp = el.innerText;
    el.title = dateToIsoString(date);
    el.textContent = toLocalTimestamp(date, { hours24: true, showYear: false });
  });

  document.querySelectorAll('.msplab').forEach(el => {
    const date = parseChatTimestamp(el.innerText, startOfUTCDay);
    el.dataset.originalTimestamp = el.innerText;
    el.title = dateToIsoString(date);
    el.textContent = toLocalTimestamp(date, { hours24: true, showDate: false });
  });

  document.querySelectorAll('.pager span.page-numbers').forEach(el => {
    const str = el.textContent;
    const [t1, t2] = str.split(' - ');
    let h1, h2, m1, m2;

    if (isMobile) {
      [h1, h2] = [t1, t2].map(t => Number(t.replace('h', '')) + tzHoursWhole);
    }
    else {
      [h1, h2] = [t1, t2].map(t => Number(t.split(':')[0]) + tzHoursWhole);
    }

    // Handle overflow
    if (h1 < 0) h1 += 24;
    else if (h1 >= 24) h1 %= 24;
    if (h2 < 0) h2 += 24;
    else if (h2 >= 24) h2 %= 24;

    // Calculate offset mins
    [m1, m2] = [t1, t2].map(t => (Number(t.split(':')[1]) || 0) + tzMins);

    // Validation
    if (isNaN(h1) || isNaN(h2)) {
      debugger;
      return;
    }

    // Convert to string and pad everything
    [h1, h2, m1, m2] = [h1, h2, m1, m2].map(n => n.toString().padStart(2, '0'));

    el.dataset.originalText = str;
    el.textContent = `${h1}:${m1} - ${h2}:${m2}`;
  });

  // Amend timezone message in desktop sidebar
  const msgSmall = document.querySelector('#info .msg-small');
  if (msgSmall) msgSmall.textContent = `all times have been converted to local time (UTC${tzSymbol})`;
}


function highlightMessageReplies() {

  $('#transcript').on('mouseover', '.message', function () {
    $('.message').removeClass('reply-parent reply-child'); // reset

    // Replies to selected message
    const mid = this.id.split('-')[1];
    $('.reply-info').filter((i, el) => el.href.includes('#' + mid)).closest('.message').addClass('reply-child');

    // Replying to another message
    const pMid = ($(this).find('.reply-info').attr('href') || '#').split('#')[1];
    if (pMid !== '') {
      $('#message-' + pMid).addClass('reply-child');
    }
  });
}


function scrollToMessageIfExist(mid) {
  const msgElem = document.getElementById('message-' + mid);
  if (!msgElem) return false;

  // Clear all message highlights on page
  document.querySelectorAll('.message').forEach(el => el.classList.remove('reply-parent', 'reply-child', 'highlight'));

  // Highlight current message
  msgElem.classList.add('highlight');

  // Perform scroll
  const offsetTop = msgElem.getBoundingClientRect().top + window.scrollY - scrollOffset;
  window.scrollTo({ top: offsetTop, behavior: 'smooth' });

  // Replace browser history
  window.history.replaceState({}, null, this.href);

  //console.log('[CTH] scrollToMessageIfExist', mid, msgElem, offsetTop);
  return msgElem;
}


// Append styles
addStylesheet(`
.transcript-nav {
  display: block;
  padding: 10px 0;
}
.transcript-nav .button {
  margin-right: 5px;
}
#transcript > .hourly > div[id="transcript"] {
  padding-bottom: 0px;
}
`); // end stylesheet


// On script run
(function init() {

  // Search page
  if (location.pathname.includes('/search')) {

    // Parse search timestamps
    document.querySelectorAll('.timestamp').forEach(el => {
      const date = parseChatTimestamp(el.innerText);
      el.dataset.originalTimestamp = el.innerText;
      el.title = dateToIsoString(date);
      el.textContent = toLocalTimestamp(date);
    });
  }

  // Transcript or conversation page
  else if (/\/(transcript|rooms\/\d+\/conversation\/)/.test(location.pathname)) {

    // Always redirect to full day page "/0-24" if we are on a partial day page
    const hasSubPage = document.querySelectorAll('.pager span.page-numbers').length > 0;
    if (hasSubPage) {
      window.location = canonicalLink.replace(subPage, '0-24') + location.hash;
      return;
    }

    // If there is a hash, highlight and scroll to it
    const msgId = location.hash.split('#').pop();
    // If page already loaded
    if (document.readyState === 'complete') {
      scrollToMessageIfExist(msgId);
    }
    // Wait for page to load
    else {
      window.addEventListener('load', function () {
        setTimeout(() => {
          scrollToMessageIfExist(msgId);
        }, 100);
      });
    }

    // Setup
    convertTranscriptTimestamps();
    highlightMessageReplies();

    // If conversation page, parse date in system messages
    // E.g.: "Conversation started Jan 20 at 0:13."
    if (location.pathname.includes('/conversation/')) {
      document.querySelectorAll('.system-message').forEach(el => {
        const [_, prefix, dateStr] = el.innerText.match(/^(.*?)(\w{3} \d{1,2} at \d{1,2}:\d{2})/) || [null, null, null];
        if (!prefix || !dateStr) return;
        const date = parseChatTimestamp(dateStr);
        el.dataset.originalText = el.innerText;
        el.innerText = prefix + toLocalTimestamp(date);
      });
    }

    // The rest of the code is for desktop only
    if (isMobile) return;

    // Desktop: If clicked replied-to message is on the same page, scroll to it instead
    document.querySelector('#transcript, #conversation').addEventListener('click', function (e) {
      if (e.target.classList.contains('reply-info')) {
        const msgId = e.target.href.split('#').pop();
        if (scrollToMessageIfExist(msgId)) e.preventDefault();
      }
    });

    // jQuery for the .one()
    // Add domain to document title when printing
    $(window).one('beforeprint', function () {
      document.title = location.hostname + ' - ' + document.title;

      // Remove domain from document title when printing dialog is closed
      $(window).one('afterprint', function () {
        document.title = document.title.replace(location.hostname + ' - ', '');
      });
    });
  }

})();