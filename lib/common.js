/*
    Common helper functions and variables for SOMU scripts
    https://github.com/samliew/SO-mod-userscripts

    Requires jQuery
 */

// Make jQuery available when running in a userscript sandbox
// See https://github.com/samliew/SO-mod-userscripts/issues/112
if (typeof unsafeWindow !== 'undefined' && window !== unsafeWindow) {
  window.jQuery = unsafeWindow.jQuery;
  window.$ = unsafeWindow.jQuery;
}



/**
 * ================================
 * Common constant Variables
 * ================================
 */

// Utility variables
const _window = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window; // use unsafeWindow if available
const store = window.localStorage;
const MS = {
  twohours: 2 * 60 * 6e4,
  oneday: 24 * 60 * 6e4,
  oneweek: 7 * 24 * 60 * 6e4,
  onemonth: 30 * 24 * 60 * 6e4,
  oneyear: 365 * 24 * 60 * 6e4
};

// Platform / site variables
const isMSE = location.hostname === 'meta.stackexchange.com';
const isSO = location.hostname === 'stackoverflow.com';
const isSOMeta = location.hostname === 'meta.stackoverflow.com';
const isMetaSite = typeof StackExchange !== 'undefined' && StackExchange.options?.site?.parentUrl !== 'undefined';
const parentUrl = (typeof StackExchange !== 'undefined' && StackExchange.options?.site?.parentUrl) || location.origin;
const metaUrl = (typeof StackExchange !== 'undefined' ? StackExchange.options?.site?.childUrl : undefined);
const fkey =
  (typeof window.fkey === 'function' ? window.fkey().fkey : null) ?? // chat
  document.getElementById('fkey')?.value ??
  StackExchange?.options?.user?.fkey ??
  store.getItem(`fkey-${location.hostname}`);



/**
 * ================================
 * jQuery Helper Plugins
 * ================================
 */

jQuery.getCachedScript = function (url, callback) {
  return $.ajax({
    url: url,
    dataType: 'script',
    cache: true
  }).done(callback);
};

jQuery.fn.getUid = function () {
  const url = $(this).attr('href') || '';
  if (!url.contains('/users/')) return null;
  const res = Number((url.match(/\/\d+\/?/) || [''])[0].replace(/[^\d]/g, ''));
  return isNaN(res) || res == 0 ? null : res;
};

jQuery.fn.lcTrimText = function () {
  return this.first().text().trim().toLowerCase();
};



/**
 * ================================
 * Date Helper Functions
 * ================================
 */

/**
 * Converts a SE API date to a Date object
 * @param {number} apiDate - The SE API date
 * @return {Date} A Date object
 */
const seApiDateToDate = apiDate => {
  return apiDate ? new Date(apiDate * 1000) : null;
};

/**
 * Converts a Date object to ISO format used by sites
 * @param {Date} date - A Date object
 * @return {string} ISO date string
 */
const dateToIsoString = date => {
  if (!date || !date.getTime()) return '<unknown>';
  return date.toJSON().replace(/\.\d+Z/, 'Z').replace('T', ' ');
};

/**
 * Converts a Date object to a relative format used by sites
 * @param {Date} date - A Date object
 * @return {string} A relative string describing the date relative to now
 * @example
 *   dateToRelativeString(new Date()) // 'just now'
 *   dateToRelativeString(new Date(Date.now() - 3000)) // '3 secs ago'
 */
const dateToRelativeString = date => {
  if (!date || !date.getTime()) return '<unknown>';

  const delta = ((new Date()).getTime() - date.getTime()) / 1000;
  if (delta < 2) { return 'just now'; }
  if (delta < 60) { return Math.floor(delta) + ' secs ago'; }
  if (delta < 120) { return '1 min ago'; }
  if (delta < 3600) { return Math.floor(delta / 60) + ' mins ago'; }
  if (delta < 7200) { return '1 hour ago'; }
  if (delta < 86400) { return Math.floor(delta / 3600) + ' hours ago'; }
  if (delta < 172800) { return 'yesterday'; }
  if (delta < 259200) { return '2 days ago'; }

  return date.toLocaleString(undefined, { month: 'short', timeZone: 'UTC' })
    + ' '
    + date.toLocaleString(undefined, { day: '2-digit', timeZone: 'UTC' })
    + ((delta > 31536000) ? (' \'' + date.toLocaleString(undefined, { year: '2-digit', timeZone: 'UTC' })) : '')
    + ' at '
    + date.toLocaleString(undefined, { minute: '2-digit', hour: '2-digit', hour12: false, timeZone: 'UTC' });
};



/**
 * ================================
 * Validation/Boolean Functions
 * ================================
 */

/**
 * Checks if current user is a moderator. Works on all sites (main, meta, and chat) pages
 * @return {boolean} Whether the user is a moderator
 * @example
 *   // Moderator check
 *   if (!isModerator()) return;
 */
function isModerator() {
  return location.hostname.includes('chat.') ?
    (typeof CHAT !== "undefined" && typeof CHAT?.RoomUsers?.current === "function" && CHAT.RoomUsers.current().is_moderator) || document.querySelector('.topbar-menu-links')?.innerText.includes('♦') :
    (typeof StackExchange !== "undefined" && StackExchange?.options?.user?.isModerator) ?? false;
}



/**
 * ================================
 * AJAX / Callbacks / Promises Functions
 * ================================
 */

/**
 * @summary Waits a specified number of seconds
 * @param {number} [seconds] seconds to wait
 * @returns {Promise<void>}
 */
const wait = (seconds = 1) => new Promise((r) => setTimeout(r, seconds * 1e3));

/**
 * Simple wrapper for (a cross-domain) GM_xmlhttpRequest() that returns a Promise
 * See http://tampermonkey.net/documentation.php#GM_xmlhttpRequest for options
 * Requires @grant GM_xmlhttpRequest
 * @param {string} options - The URL for the AJAX request, via the 'GET' method, OR
 * @param {object} options - A key-value pair of params for the AJAX request
 * @return {Promise} A promise containing the response of the AJAX request
 */
const ajaxPromise = (options, type = 'text') => {
  if (typeof options === 'string') {
    options = { url: options };
  }

  return new Promise(function (resolve, reject) {
    if (typeof options.url === 'undefined' || options.url == null) reject();

    options.responseType = type;
    options.method = options.method || 'GET';
    options.onload = function (response) {
      let parser = new DOMParser();
      resolve(parser.parseFromString(response.responseText, 'text/html'));
    };
    options.onerror = function () {
      reject();
    };
    GM_xmlhttpRequest(options);
  });
};

/**
 * Override jQuery's setRequestHeader to ignore setting the "X-Requested-With" header
 * Solution from https://stackoverflow.com/a/24719409
 * @return {jQuery.ajaxSettings.xhr} An overidden jQuery.ajaxSettings.xhr function to be passed to the options param of a jQuery AJAX function
 *
 * Example:
 *   ajaxPromise({
 *     url: url,
 *     xhr: jQueryXhrOverride
 *   })
 */
const jQueryXhrOverride = () => {
  var xhr = jQuery.ajaxSettings.xhr();
  var setRequestHeader = xhr.setRequestHeader;
  xhr.setRequestHeader = function (name, value) {
    if (name == 'X-Requested-With') return;
    setRequestHeader.call(this, name, value);
  };
  return xhr;
};

/**
 * @summary Checks if there's a backoff on the current page
 * @return {boolean} Whether there's a backoff
 */
const hasBackoff = () => typeof _window.backoff === 'number';

/**
 * @summary Sets a temporary backoff timeout from now until num seconds later. If already set, replaces the timeout.
 * @param {number} secs - Number of seconds to backoff for
 */
const addBackoff = secs => {
  if (isNaN(secs)) return;
  if (hasBackoff()) clearTimeout(_window.backoff);1
  _window.backoff = setTimeout(() => { clearTimeout(_window.backoff); _window.backoff = null }, secs * 1000);
};



/**
 * ================================
 * String / HTML Parsing & Validation Functions
 * ================================
 */

/**
 * @summary Decodes a string containing HTML entities to a text string (e.g. "&amp;" becomes "&")
 * @param {string} input - HTML to decode
 * @return {string} The decoded string
 * @link https://stackoverflow.com/a/34064434
 */
const htmlDecode = input => {
  var doc = new DOMParser().parseFromString(input, "text/html");
  return doc.documentElement.textContent;
};



/**
 * ================================
 * Post ID Functions
 * ================================
 */

/**
 * @summary Checks if any parameters contain invalid ids (non-numerical strings or non-integers, or <= 0)
 * @param {...number} ids - Any number of ids to check
 * @example
 *   hasInvalidIds(1, 2, 3.1) // true - 3.1 is not valid
 */
const hasInvalidIds = () => {
  return [...arguments].some((v) => typeof v === 'undefined' || v === null || isNaN(v) || v <= 0 || v != Math.round(v));
};

/**
 * @summary Parse a SE Q&A URL string for a post id
 * @param {string} url - URL to parse
 * @returns {number|null} Post id
 */
const getPostId = url => {
  if (typeof url !== 'string') return null;

  // Detect answer ID
  const a = url.match(/#\d+$/g);
  if (a && a.length) return Number(a[0].replace(/\D/g, ''));

  // Detect question ID
  const b = url.match(/\/\d+\/?/g);
  if (b && b.length) return Number(b[b.length - 1].replace(/\D/g, ''));

  return null;
};



/**
 * ================================
 * DOM Manipulation Functions
 * ================================
 */

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
 * ================================
 * Location and History Functions
 * ================================
 */

/**
 * @summary Get query parameter value, or empty string if not found
 * @param {string} key parameter key
 * @returns {string} parameter value
 */
const getQueryParam = key => new URLSearchParams(window.location.search).get(key) || '';

/**
 * Navigate to a post. If in mod queue pages, open in new tab
 * @param {Number} pid
 */
const goToPost = pid => {
  if (hasInvalidIds(pid)) return;

  // If in mod queues, open in new tab
  if (location.pathname.includes('/admin/dashboard')) {
    // Make a temp link and click it instead of using window.open
    const link = makeElem('a', {
      href: `${location.origin}/q/${pid}`,
      target: '_blank',
      style: 'display: none !important;'
    }, '&nbsp;');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  else {
    location.href = `${location.origin}/q/${pid}`;
  }
};



// EOF