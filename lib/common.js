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
  - User ID Functions
  - Location and History Functions
  - DOM Manipulation Functions
  - Storage (localStorage, clipboard) Functions
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
  oneSec: 1e3,
  oneMin: 60 * 1e3,
  oneHour: 60 * 6e4,
  twoHours: 2 * 60 * 6e4,
  oneDay: 24 * 60 * 6e4,
  oneWeek: 7 * 24 * 60 * 6e4,
  oneMonth: 30 * 24 * 60 * 6e4,
  oneYear: 365 * 24 * 60 * 6e4
};

// Platform / Site (variables to work in chat too, and Teams if possible)
const _hostname = location.hostname.toLowerCase(); // do not rename
const _chatSiteLink = document.querySelector('#header-logo a, #footer-logo a')?.href;
const _chatSiteName = document.querySelector('#header-logo img, #footer-logo img')?.alt;
const _chatUserId = (typeof CHAT !== 'undefined' && CHAT?.CURRENT_USER_ID) || document.querySelector('.topbar-menu-links a')?.href.match(/\/users\/(\d+)\//)?.[1];

const isChat = ['chat.stackexchange.com', 'chat.meta.stackexchange.com', 'chat.stackoverflow.com'].some(v => v === _hostname);
const isMSE = _hostname === 'meta.stackexchange.com';
const isSO = _hostname === 'stackoverflow.com';
const isSOMeta = _hostname === 'meta.stackoverflow.com';
const isMetaSite = (typeof StackExchange !== 'undefined' && StackExchange.options?.site?.isMetaSite && StackExchange.options?.site?.parentUrl !== 'undefined') ?? false;
const isSOTeams = _hostname === 'stackoverflowteams.com';

const isElectionPage = location.pathname.startsWith('/election');
const isModDashboardPage = location.pathname.startsWith('/admin/dashboard');

const parentName = (
  (typeof StackExchange !== 'undefined' && StackExchange.options?.site?.name) ||
  _chatSiteName ||
  document.title
)?.replace(/^(.* - )?Meta /, '');

const parentUrl = (
  (typeof StackExchange !== 'undefined' && StackExchange.options?.site?.parentUrl) || // meta site
  (typeof StackExchange !== 'undefined' && StackExchange.options?.site?.routePrefix && `${location.origin}${StackExchange.options.site.routePrefix}`) || // teams
  _chatSiteLink || // chat
  (isMSE && location.origin) || // Meta.SE
  location.origin.replace('meta.', '') // fallback to current origin with "meta." removed
).replace(/\/\s*$/, ''); // without trailing slash

const metaUrl = (typeof StackExchange !== 'undefined' ? StackExchange.options?.site?.childUrl : undefined) || parentUrl.replace(/^(https?:\/\/)(?:meta\.)?([^.]+)\./, '$1meta.$2.');
const teamsRoutePrefix = (isSOTeams && typeof StackExchange !== 'undefined' && StackExchange.options?.site?.routePrefix) || ''; // always empty string if not Teams

const seApiUrl = 'https://api.stackexchange.com/2.3'; // excluding trailing slash
const siteApiSlug = (isMetaSite ? _hostname : parentUrl).replace(/^https?:\/\//, '').replace(/(\.stackexchange)?\.(com|net|org)$/, '').replace(/\s/g, '');

// get self user ID from StackExchange object, if available. proxiedUserId is for Teams
const selfId = (typeof StackExchange !== 'undefined' ? StackExchange.options?.user?.proxiedUserId || StackExchange.options?.user?.userId : null) || _chatUserId;

// get current user ID from url, if on a user profile page
// see https://regex101.com/r/96DIYA
const _userlinkRegex = /\/(?:users(?:\/)?(?:account-info|history|saves|preferences|flagged-posts|flag-summary|message\/create)?|admin(?:\/)?(?:cm-message\/create|(?:show|xref)-user-(?:votes|ips)))\/(-?\d+)/i;
const currentUserId = Number(location.pathname.match(_userlinkRegex)?.pop()) || null;

const _getFkey = () =>
  (typeof _window.fkey === 'function' ? _window.fkey().fkey : null) ?? // chat
  document.getElementById('fkey')?.value ??
  (typeof StackExchange !== 'undefined' ? StackExchange.options?.user?.fkey : false) ??
  store.getItem(`fkey-${_hostname}`) ??
  store.getItem(`se-fkey`);
const fkey = _getFkey();

/* For test/debug
console.table({ isChat, isMSE, isSO, isSOMeta, isMetaSite, parentName, parentUrl, metaUrl, siteApiSlug, userId, fkey });
*/



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
 * @returns {Date} A Date object
 */
const seApiDateToDate = apiDate => {
  return apiDate ? new Date(apiDate * 1000) : null;
};

/**
 * Converts a Date object to ISO format used by sites
 * @param {Date|number} date - A Date object or timestamp
 * @returns {string} ISO date string
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
 * @returns {string} A relative string describing the date relative to now
 * @example
 *   dateToRelativeTime(new Date()) // 'just now'
 *   dateToRelativeTime(new Date(Date.now() - 3000)) // '3 secs ago'
 */
const dateToRelativeTime = (date, options = {}) => {
  const {
    justNowText = 'just now',
    now = new Date(),
    soonText = 'soon',
  } = options;

  // Validate date
  if (!date || typeof date.getTime !== 'function') date = new Date(date);
  if (!date.getTime()) return date;

  // Internal helper functions
  const getNumDaysInMonth = (month, year) => {
    const febDays = getNumDaysInYear(year) === 366 ? 29 : 28;
    const days = [31, febDays, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    const daysInMonth = days[month - 1];
    if (!daysInMonth) {
      throw new RangeError(`Invalid month number: ${month}`);
    }

    return daysInMonth;
  };
  const getNumDaysInYear = (year) => {
    if (year % 4) return 365;
    if (year % 100) return 366;
    if (year % 400) return 365;
    return 366;
  };

  // Internal constants
  const MS_IN_SECOND = 1000;
  const SEC_IN_MINUTE = 60;
  const MIN_IN_HOUR = 60;
  const HOUR_IN_DAY = 24;

  const S_HOUR = SEC_IN_MINUTE * MIN_IN_HOUR;
  const S_DAY = S_HOUR * HOUR_IN_DAY;
  const DAY_IN_MONTH = getNumDaysInMonth(date.getMonth() + 1, date.getFullYear());
  const DAY_IN_YEAR = getNumDaysInYear(date.getFullYear());

  const nowMs = now.getTime();

  // Try future date
  const diff = (date.getTime() - nowMs) / MS_IN_SECOND;
  const dayDiff = Math.floor(diff / S_DAY);

  // In the future
  if (diff > 0) {
    /** @type {[boolean, string][]} */
    const rules = [
      [diff < 5, soonText],
      [diff < SEC_IN_MINUTE, ((x) => `in ${x} sec${pluralize(x)}`)(Math.floor(diff))],
      [diff < S_HOUR, ((x) => `in ${x} min${pluralize(x)}`)(Math.floor(diff / SEC_IN_MINUTE))],
      [diff < S_DAY, ((x) => `in ${x} hour${pluralize(x)}`)(Math.floor(diff / S_HOUR))],
      [dayDiff < DAY_IN_MONTH, ((x) => `in ${x} day${pluralize(x)}`)(dayDiff)],
      [dayDiff < DAY_IN_YEAR, ((x) => `in ${x} month${pluralize(x)}`)(Math.floor(dayDiff / DAY_IN_MONTH))],
      [true, ((x) => `in ${x} year${pluralize(x)}`)(Math.floor(dayDiff / DAY_IN_YEAR))],
    ];

    const [, relative = ""] = rules.find(([rule]) => rule) || [];
    return relative;
  }

  // In the past
  const pastDiff = Math.abs(diff);
  const pastDayDiff = Math.abs(dayDiff);

  /** @type {[boolean, string][]} */
  const rules = [
    [pastDiff < 5, justNowText],
    [pastDiff < SEC_IN_MINUTE, ((x) => `${x} sec${pluralize(x)} ago`)(Math.floor(pastDiff))],
    [pastDiff < S_HOUR, ((x) => `${x} min${pluralize(x)} ago`)(Math.floor(pastDiff / SEC_IN_MINUTE))],
    [pastDiff < S_DAY, ((x) => `${x} hour${pluralize(x)} ago`)(Math.floor(pastDiff / S_HOUR))],
    [pastDayDiff < DAY_IN_MONTH, ((x) => `${x} day${pluralize(x)} ago`)(pastDayDiff)],
    [pastDayDiff < DAY_IN_YEAR, ((x) => `${x} month${pluralize(x)} ago`)(Math.floor(pastDayDiff / DAY_IN_MONTH))],
    [true, ((x) => `${x} year${pluralize(x)} ago`)(Math.floor(pastDayDiff / DAY_IN_YEAR))],
  ];

  const [, relative = ""] = rules.find(([rule]) => rule) || [];
  return relative;
};



/**
 * ================================
 * Validation/Boolean Functions
 * ================================
 */

/**
 * Checks if string contains a diamond character
 * @param {string} str
 * @returns {boolean}
 */
const containsDiamondUnicode = str => typeof str === 'string' && str.includes('\u2666');

/**
 * Checks if current user is a moderator. Works on all sites (main, meta, and chat) pages
 * @returns {boolean} Whether the user is a moderator
 * @example
 *   // Moderator check
 *   if (!isModerator()) return;
 */
const isModerator = () => {
  return _hostname.includes('chat.') ?
    (typeof CHAT !== "undefined" && typeof CHAT?.RoomUsers?.current === "function" && CHAT.RoomUsers.current().is_moderator) ||
    containsDiamondUnicode(document.querySelector('.topbar-menu-links')?.innerText) :
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
 * @returns {Promise} A promise containing the response of the AJAX request
 */
const ajaxPromise = (options, type = 'text') => {
  if (typeof options === 'string') {
    options = { url: options };
  }

  return new Promise(function (resolve, reject) {
    if (typeof options.url !== 'string') reject();

    options.responseType = type;
    options.method ||= 'GET';
    options.onload ||= function (response) {
      try {
        if (type === 'text' || type === 'html') {
          let parser = new DOMParser();
          resolve(parser.parseFromString(response.responseText, 'text/html'));
        }
        else if (type === 'json') {
          // If the response is JSON, parse it into a JS object
          resolve(JSON.parse(response.responseText));
        }
        return;
      } catch (e) { }
      resolve(response);
    };
    options.onerror ||= function () {
      reject();
    };

    if (typeof GM_xmlhttpRequest === 'function') {
      GM_xmlhttpRequest(options);
    }
    else if (typeof GM !== 'undefined' && typeof GM?.xmlhttpRequest === 'function') {
      GM.xmlhttpRequest(options);
    }
    else {
      reject();
    }
  });
};

/**
 * @summary GM_xmlhttpRequest wrapper that returns the destination URL, following any redirects
 * @param {string} url The URL to be requested
 * @returns {Promise<string>} A promise containing the redirected destination URL
 */
const getFinalUrl = url => {
  return new Promise(function (resolve, reject) {
    ajaxPromise({
      url: url,
      method: 'HEAD',
      redirect: 'follow',
      timeout: 5000,
      onload: function (response) {
        resolve(response.finalUrl || url);
      },
      onerror: reject,
      ontimeout: reject,
    });
  });
};

/**
 * Override jQuery's setRequestHeader to ignore setting the "X-Requested-With" header
 * Solution from https://stackoverflow.com/a/24719409
 * @returns {jQuery.ajaxSettings.xhr} An overidden jQuery.ajaxSettings.xhr function to be passed to the options param of a jQuery AJAX function
 * @example
 *   $.ajax({
 *     url: 'https://example.com',
 *     xhr: jQueryXhrOverride,
 *   });
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
 * @returns {boolean} Whether there's a backoff
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
 * @returns {string} The decoded string
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
 * @summary Parse a variable and return the first set of consecutive digits including commas and decimal points
 * @param {any} v - variable to parse
 * @returns {number} number, NaN if no number found
 * @example
 *   getNumber('1,234.56') // 1234.56
 *   getNumber('1,234.56.78') // 1234.56 (only one decimal per number)
 *   getNumber('1,23 4.56') // 123
 *   getNumber('/example/12345/example') // 12345
 *   getNumber('https://chat.stackoverflow.com/rooms/1234/test-room') // 1234
 */
const tryGetNumber = v => {
  if (typeof v === 'number') return v; // already a number

  const getMatch = str => {
    let match = str?.match(/(\d+(?:,\d+)?(?:\.\d+)?)/);
    if (match) return Number(match[1].replace(/,/g, ''));
    return NaN;
  };

  // Array: first number match from all array values
  if (Array.isArray(v)) {
    for (let i = 0; i < v.length; i++) {
      let match = getMatch(v[i]);
      if (match) return match;
    }
    return NaN;
  }

  // Object: first number match from all object values
  if (typeof v === 'object') {
    for (let key in v) {
      let match = getMatch(v[key]);
      if (match) return match;
    }
    return NaN;
  }

  // Non-string variables: try to coerce to string
  if (typeof v !== 'string') {
    v = v.valueOf() ?? v.toString() ?? null
  }

  return getMatch(v);
};

/**
 * @summary Validate number variable is a positive integer
 * @param {Number} v variable to validate
 * @returns {boolean} whether the variable is a positive integer
 */
const isPositiveInteger = v => typeof v === 'number' && v > 0 && v === Math.round(v);

/**
 * @summary Convert a CamelCase string to kebab-case
 * @param {string} str - CamelCase string
 * @returns {string} kebab-case string
 */
const camelToKebab = str => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();



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
 * @summary Rewrite a Q&A URL to a short permalink
 * @param {string} url URL to rewrite
 * @param {string} [baseDomain] Base domain to use for short link, otherwise auto-detect from input
 * @returns {string} Short permalink
 * @example
 *   toShortLink('https://example.com/questions/12345/slug/67890#67890') // 'https://example.com/a/67890'
 *   toShortLink('/questions/12345/slug/67890#67890', 'https://test.com') // 'https://test.com/a/67890'
 *   toShortLink('/questions/12345/slug/67890#67890') // '/a/67890'
 */
const toShortLink = (url, baseDomain = null) => {

  // Match ids in string, prefixed with either a / or #
  const ids = url.match(/[\/#](\d+)/g);

  // Get last occurance of numeric id in string
  const pid = ids.pop().replace(/\D+/g, '');

  // Q (single id) or A (multiple ids)
  const qa = ids.length > 1 ? 'a' : 'q';

  // Use domain if set, otherwise use domain from string, fallback to relative path
  const domain = baseDomain ?
    baseDomain.replace(/\/$/, '') + '/' :
    (url.match(/\/+([a-z]+\.)+[a-z]{2,3}\//) || ['/'])[0];

  // Format of short link on the Stack Exchange network
  return pid ? domain + qa + '/' + pid : url;
};



/**
 * ================================
 * User ID Functions
 * ================================
 */

/**
 * @summary Extract a user id from a URL
 * @param {string} url - URL to parse
 * @returns {number|null} The user id, or null if not found
 * @example
 *   getUserId('/users/12345/username'); // 12345
 *   getUserId('/users/account-info/12345'); // 12345
 */
const getUserId = function (url) {
  if (typeof url !== 'string') return null;
  return Number(url.match(_userlinkRegex)?.pop()) || null;
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
  if (isModDashboardPage) {
    // Make a temp link and click it instead of using window.open
    const link = makeElem('a', {
      href: `${location.origin}/q/${pid}`,
      target: '_blank',
      style: 'display: none !important;'
    }, '&nbsp;');
    document.body?.appendChild(link);
    link.click();
    document.body?.removeChild(link);
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
 * @returns {HTMLElement} element
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
 * @summary Create element from HTML string
 * @param {string} html HTML string
 * @returns {HTMLElement} element
 * @example
 *   makeElemFromHtml('<div id="foo">Hello World</div>')
 */
const makeElemFromHtml = (html) => {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstChild;
};

/**
 * @summary Insert a style element into the document
 * @param {string} css - CSS content
 * @param {boolean} [atDocumentEnd] - whether to append at the end of the document (default), otherwise append to head
 * @example
 *   addStylesheet('body { background-color: red; }');
 */
const addStylesheet = (css = '', atDocumentEnd = true) => {

  // Some userscripts run at document-start, which means at the time this function is called,
  //   document.body may not yet be available, so we shall wait for the body to be ready
  if (atDocumentEnd && !document.body) {
    document.addEventListener('DOMContentLoaded', () => addStylesheet(css, atDocumentEnd));
    return;
  }

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

  // Some userscripts run at document-start, which means at the time this function is called,
  //   document.body may not yet be available, so we shall wait for the body to be ready
  if (atDocumentEnd && !document.body) {
    document.addEventListener('DOMContentLoaded', () => addExternalStylesheet(url, atDocumentEnd));
    return;
  }

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
 * Storage (localStorage, clipboard) Functions
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

/**
 * @summary Copy text to clipboard
 * @param {string | HTMLElement} content text or element to copy
 * @returns {boolean} success
 */
const copyToClipboard = async content => {
  let success = false;

  // If content is an element, get its value or innerText
  if (content instanceof HTMLElement) {
    content = content.value || content.innerText;
  }

  // Save current focus
  const previousFocusElement = document.activeElement;

  // Create a temporary textarea element
  const textArea = document.createElement('textarea');
  Object.assign(textArea.style, {
    position: 'fixed',
    zIndex: -1,
    opacity: 0,
    pointerEvents: 'none'
  });
  textArea.value = content;
  document.body.appendChild(textArea);
  window.focus();
  textArea.focus();
  textArea.select();

  // Method 1
  try {
    if (typeof navigator.clipboard?.writeText === 'function') {
      success = await navigator.clipboard.writeText(content || textArea.value);
    }
  }
  catch (err) { }

  // Method 2
  try {
    if (!success) document.execCommand('copy');
    success = true;
  }
  catch (err) { }

  // Remove temporary textarea and restore previous focus
  document.body.removeChild(textArea);
  previousFocusElement.focus();

  return success;
};



// EOF