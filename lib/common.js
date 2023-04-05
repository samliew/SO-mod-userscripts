/*
  Common helper functions and variables for SOMU scripts
  https://github.com/samliew/SO-mod-userscripts
  Requires jQuery

  Sections:
  - Constant Variables
  - jQuery Helper Plugins
  - Date Functions
  - Validation/Boolean Functions
  - AJAX / Callback / Promise Functions
  - String / HTML Parsing / Validation Functions
  - Post ID Functions
  - Location and History Functions
  - DOM Manipulation Functions
  - Storage (localStorage) Functions
 */

/* globals StackExchange, GM_info, unsafeWindow, jQuery, $ */



/**
 * ================================
 * Constant Variables
 * ================================
 */

// Browser
const scriptName = typeof GM_info !== 'undefined' ? GM_info.script.name : 'SOMU';
const scriptSlug = scriptName?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const _window = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window; // use unsafeWindow if available
const store = _window.localStorage;

// Date/time
// An array of short month names from Jan-Dec, in current locale
const monthsOfYear = [...Array(12)].map((_, i) => {
  const date = new Date(2000, i, 1);
  return date.toLocaleString(undefined, { month: 'short' });
});
// An array of short weekday names from Sun-Sat, in current locale
const daysOfWeek = [...Array(7)].map((_, i) => {
  const date = new Date(2000, 9, i + 1); // 2000-10-01 is a Sunday
  return date.toLocaleString(undefined, { weekday: 'short' });
});
// An object of common time constants in milliseconds
const MS = {
  oneHour: 60 * 6e4,
  twoHours: 2 * 60 * 6e4,
  oneDay: 24 * 60 * 6e4,
  oneWeek: 7 * 24 * 60 * 6e4,
  oneMonth: 30 * 24 * 60 * 6e4,
  oneYear: 365 * 24 * 60 * 6e4
};

// Platform / Site
const _hostname = location.hostname.toLowerCase();
const isMSE = _hostname === 'meta.stackexchange.com';
const isSO = _hostname === 'stackoverflow.com';
const isSOMeta = _hostname === 'meta.stackoverflow.com';
const isMetaSite = typeof StackExchange !== 'undefined' && StackExchange.options?.site?.isMetaSite && StackExchange.options?.site?.parentUrl !== 'undefined';
const parentUrl = (typeof StackExchange !== 'undefined' && StackExchange.options?.site?.parentUrl) || (isMSE ? location.origin : location.origin.replace('meta.', ''));
const metaUrl = (typeof StackExchange !== 'undefined' ? StackExchange.options?.site?.childUrl : undefined);
const siteApiSlug = _hostname.replace(/(chat\.|meta\.)+/, '').replace(/(\.stackexchange)?\.(com|net|org)$/, '').replace(/\s/g, '');

const userId = typeof StackExchange !== 'undefined' ? StackExchange.options?.user?.userId : null;
const fkey =
  (typeof _window.fkey === 'function' ? _window.fkey().fkey : null) ?? // chat
  document.getElementById('fkey')?.value ??
  (typeof StackExchange !== 'undefined' ? StackExchange.options?.user?.fkey : false) ??
  store.getItem(`fkey-${_hostname}`);



/**
 * ================================
 * jQuery Helper Plugins
 * ================================
 */

// Make jQuery available when running in a userscript sandbox
// See https://github.com/samliew/SO-mod-userscripts/issues/112
if (typeof unsafeWindow !== 'undefined' && window !== unsafeWindow) {
  window.jQuery = unsafeWindow.jQuery;
  window.$ = unsafeWindow.jQuery;
}

// Check if jQuery is available
if (jQuery) {

  /**
   * @summary Get and cache a script using jQuery ajax, then execute the callback
   * @returns {Promise<any>} A jQuery promise
   * @example
   *   $.getCachedScript('https://example.com/script.js', fn);
   *   $.getCachedScript('https://example.com/script.js').done(fn);
   */
  jQuery.getCachedScript = function (url, callback = () => { }) {
    return jQuery.ajax({
      url: url,
      dataType: 'script',
      cache: true
    }).done(callback);
  };

  /**
   * @summary Extract a user id from a jQuery link element
   * @returns {number|null} The user id, or null if not found
   * @example
   *   $('a[href*="/users/"]').getUid(); // 12345
   */
  jQuery.fn.getUid = function () {
    const url = this.href || '';
    if (!url.contains('/users/')) return null;
    const res = Number((url.match(/\/\d+\/?/) || [''])[0].replace(/[^\d]/g, ''));
    return isNaN(res) || res === 0 ? null : res;
  };

  /**
   * @summary Return the first element's text, trimmed and lowercased
   * @returns {string} trimmed and lowercased text
   * @example
   *   $('h1').lcTrimText(); // 'hello world'
   */
  jQuery.fn.lcTrimText = function () {
    return this.first().text().trim().toLowerCase();
  };

  /**
   * @summary Support an array of deferreds for jQuery.when
   * @param {Array} deferreds - An array of deferreds
   * @returns {Promise<any>} A jQuery promise
   * @link https://stackoverflow.com/a/16208232
   * @example
   *   $.when.all([deferred1, deferred2, ...]).then(fn);
   */
  jQuery.when.all = function (deferreds) {
    return jQuery.Deferred(function (def) {
      jQuery.when.apply(jQuery, deferreds).then(
        function () {
          def.resolveWith(this, [Array.prototype.slice.call(arguments)]);
        },
        function () {
          def.rejectWith(this, [Array.prototype.slice.call(arguments)]);
        }
      );
    });
  };

  /**
   * @summary Filter elements that have a values
   * @returns {jQuery} jQuery object (chainable)
   * @example $('input').hasValue()
   */
  jQuery.fn.hasValue = function (i, v) {
    return jQuery(this).filter(function () {
      return jQuery(this).val() !== '';
    });
  };

  /**
   * @summary Reverse the order of elements in a jQuery object
   * @returns {jQuery} jQuery object (chainable)
   * @example $('input').reverse()
   */
  jQuery.fn.reverse = [].reverse;

  /**
   * @summary Dynamically resize element to width of text content
   * @returns {jQuery} jQuery object (chainable)
   * @link https://github.com/samliew/dynamic-width
   * @example
   *   $('input').dynamicWidth();
   */
  jQuery.fn.dynamicWidth = function (i, v) {
    const plugin = jQuery.fn.dynamicWidth;

    const minWidth = 0,
      additionalPadding = 3;

    // Reusable private hidden element to measure text width
    if (!plugin.fakeEl) {
      plugin.fakeEl = plugin.fakeEl ||
        jQuery('<span style="position:absolute; opacity:0; pointer-events:none;"></span>').appendTo(document.body);
    }

    // Perform resize an element to width of text content, including padding on original element
    const sizeToContent = el => {
      const elem = jQuery(el);
      const cs = getComputedStyle(el);
      plugin.fakeEl.text(el.value || el.innerText || el.placeholder)
        .css('font-family', elem.css('font-family'))
        .css('font-size', elem.css('font-size'))
        .css('font-weight', elem.css('font-weight'))
        .css('font-style', elem.css('font-style'))
        .css('line-height', elem.css('line-height'));
      const elemPadding = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const newWidth = plugin.fakeEl.width() + elemPadding + additionalPadding;
      elem.css('width', newWidth > minWidth ? newWidth : minWidth);
    };

    return this.each(function (i, el) {
      sizeToContent(el);
      jQuery(el).off('change keypress keyup blur')
        .on('change keypress keyup blur', evt => sizeToContent(evt.target));
    });
  };

}; // if jQuery



/**
 * ================================
 * Date Functions
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
 * @param {Date|number} date - A Date object or timestamp
 * @return {string} ISO date string
 * @example
 *   dateToIsoString(new Date()) // '2019-01-01 00:00:00'
 */
const dateToIsoString = date => {
  if (!date || !date.getTime()) return '<unknown>';
  if (typeof date === 'number') date = new Date(date);
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
const isModerator = () => {
  return _hostname.includes('chat.') ?
    (typeof CHAT !== "undefined" && typeof CHAT?.RoomUsers?.current === "function" && CHAT.RoomUsers.current().is_moderator) ||
    document.querySelector('.topbar-menu-links')?.innerText.includes('♦') :
    (typeof StackExchange !== "undefined" && StackExchange?.options?.user?.isModerator) ?? false;
};



/**
 * ================================
 * AJAX / Callback / Promise Functions
 * ================================
 */

/**
 * @summary Waits a specified number of milliseconds
 * @param {number} [ms] milliseconds to wait
 * @returns {Promise<void>}
 */
const delay = (ms = 1) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Simple wrapper for (a cross-domain) GM_xmlhttpRequest() that returns a Promise
 * See http://tampermonkey.net/documentation.php#GM_xmlhttpRequest for options
 * Requires @grant GM_xmlhttpRequest
 * @param {string} options - The URL for the AJAX request, via the 'GET' method, OR
 * @param {object} options - A key-value pair of params for the AJAX request
 * @param {string} [type] - The type of response to expect (e.g.: 'text', 'json')
 * @return {Promise} A promise containing the response of the AJAX request
 */
const ajaxPromise = (options, type = 'text') => {
  if (typeof options === 'string') {
    options = { url: options };
  }

  return new Promise(function (resolve, reject) {
    if (typeof options.url !== 'string') reject();

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
 * @example
 *   ajaxPromise({
 *     url: url,
 *     xhr: jQueryXhrOverride
 *   })
 */
const jQueryXhrOverride = () => {
  var xhr = jQuery.ajaxSettings.xhr();
  var setRequestHeader = xhr.setRequestHeader;
  xhr.setRequestHeader = function (name, value) {
    if (name === 'X-Requested-With') return;
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
  if (hasBackoff()) clearTimeout(_window.backoff);
  _window.backoff = setTimeout(() => { clearTimeout(_window.backoff); _window.backoff = null }, secs * 1000);
};



/**
 * ================================
 * String / HTML Parsing / Validation Functions
 * ================================
 */

/**
 * @summary Decodes a string containing HTML entities to a text string (e.g. "&amp;" becomes "&")
 * @param {string} input - HTML to decode
 * @return {string} The decoded string
 * @link https://stackoverflow.com/a/34064434
 * @example
 *   htmlDecode('&lt;div&gt;Hello World&lt;/div&gt;') // <div>Hello World</div>
 */
const htmlDecode = input => {
  var doc = new DOMParser().parseFromString(input, "text/html");
  return doc.documentElement.textContent;
};

/**
 * @summary Base pluralization
 * @param {number} amount
 * @param {string} pluralSuffix
 * @param {string} singularSuffix
 * @returns {string}
 * @example
 *   pluralize(1, 's', '') // ''
 *   pluralize(2, 's', '') // 's'
 */
const pluralize = (amount, pluralSuffix = "s", singularSuffix = "") => amount !== 1 ? pluralSuffix : singularSuffix;

/**
 * @summary Parse reputation string to a number
 * @param {string} str Reputation string
 * @returns {number} Reputation value
 * @example
 *  strToRep('1.2k') // 1200
 *  strToRep('1.4m') // 1400000
 */
const strToRep = str => {
  // Replace .1m with 100000, .2m with 200000, etc.
  str = str.replace(/\.(\d)m/i, '$100000');
  // Replace m with 000000
  str = str.replace(/m/i, '000000');
  // Replace .1k with 100, .2k with 200, etc.
  str = str.replace(/\.(\d)k/i, '$100');
  // Replace k with 000
  str = str.replace(/k/i, '000');
  // Remove non-digits (commas, hyphens, etc.)
  return Number(str.replace(/[^\d]+/g, ''));
};



/**
 * ================================
 * Post ID Functions
 * ================================
 */

/**
 * @summary Checks if any parameters contain invalid ids (non-numerical strings or non-integers, or <= 0)
 * @param {...number} ids any number of ids to check
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
 * @example
 *   getPostId('https://example.com/questions/12345/slug/67890#67890') // 67890
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
 * Location and History Functions
 * ================================
 */

/**
 * @summary Get query parameter value, or empty string if not found
 * @param {string} key parameter key
 * @returns {string} parameter value
 * @example
 *   getQueryParam('foo') // 'bar'
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
 * @example
 *   setAttributes(el, { id: 'foo', class: 'bar' });
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
 * @example
 *   makeElem('div', { id: 'foo', class: 'bar' }, 'Hello World', [child1, child2]);
 */
const makeElem = (tagName = 'div', attrs = {}, text = '', children = []) => {
  const el = document.createElement(tagName);
  setAttributes(el, attrs);
  if (typeof text === 'string') el.textContent = text;
  children?.forEach(child => el.appendChild(child));
  return el;
};

/**
 * @summary Insert a style element into the document
 * @param {string} css - CSS content
 * @param {boolean} [atDocumentEnd] - whether to append at the end of the document (default), otherwise append to head
 * @example
 *   addStylesheet('body { background-color: red; }');
 */
const addStylesheet = (css = '', atDocumentEnd = true) => {
  const styleElem = makeElem('style', { type: 'text/css' }, css);
  if (typeof scriptName === 'string') styleElem.setAttribute('data-userscript', scriptName);
  atDocumentEnd ? document.body.appendChild(styleElem) : document.head.appendChild(styleElem);
};

/**
 * @summary Insert a style element into the document
 * @param {string} css - CSS content
 * @param {boolean} [atDocumentEnd] - whether to append at the end of the document (default), otherwise append to head
 * @example
 *   addStylesheet('body { background-color: red; }');
 */
const addExternalStylesheet = (url = '', atDocumentEnd = true) => {
  const styleElem = makeElem('link', {
    rel: 'stylesheet',
    type: 'text/css',
    href: url
  });
  if (typeof scriptName === 'string') styleElem.setAttribute('data-userscript', scriptName);
  atDocumentEnd ? document.body.appendChild(styleElem) : document.head.appendChild(styleElem);
};



/**
 * ================================
 * Observer / Event Functions
 * ================================
 */

/**
 * @summary waits for an element to appear in DOM
 * @param {string} selector CSS selector to wait for
 * @param {Element|Document} [context] observation context
 * @returns {Promise<NodeListOf<Element>>}
 */
const waitForElem = (selector, context = document) => {
  return new Promise(resolve => {
    const immediate = context.querySelectorAll(selector);
    if (immediate.length) resolve(immediate);

    const observer = new MutationObserver((_, obs) => {
      const observed = context.querySelectorAll(selector);
      if (observed.length) {
        obs.disconnect();
        resolve(observed);
      }
    });

    observer.observe(context, {
      attributes: true,
      childList: true,
      subtree: true
    });
  });
};



/**
 * ================================
 * Storage (localStorage) Functions
 * ================================
 */

/**
 * @summary Delete all items with a given prefix from localStorage
 * @param {string} prefix - prefix to match
 * @returns {number} number of items deleted
 * @example
 *   lsRemoveItemsWithPrefix('foo') // 3
 */
_window.lsRemoveItemsWithPrefix = prefix => {
  let count = 0;
  for (let i = store.length - 1; i >= 0; i--) {
    const key = store.key(i);
    if (key && key.indexOf(prefix) === 0) {
      store.removeItem(key);
      count++;
    }
  }
  console.log(count + ' items cleared');
  return count;
};



// EOF