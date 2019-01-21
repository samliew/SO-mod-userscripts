/*
    Common helper functions and variables for SOMU scripts
    https://github.com/samliew/SO-mod-userscripts
    
    Requires jQuery
 */



/* =====================
 * jQuery Helper Plugins
 * ===================== */
jQuery.getCachedScript = function(url, callback) {
    return $.ajax({
        url: url,
        dataType: 'script',
        cache: true
    }).done(callback);
};
jQuery.fn.getUid = function() {
    const url = $(this).attr('href') || '';
    if(!url.contains('/users/')) return null;
    const res = Number((url.match(/\/\d+\/?/) || [''])[0].replace(/[^\d]/g, ''));
    return isNaN(res) || res == 0 ? null : res;
};



/**
 * Checks if current user is a moderator. Works on all sites (main, meta, and chat) pages
 * @return {boolean} Whether the user is a moderator
 */
function isModerator() {
    return location.hostname.includes('chat.') ?
        $('.topbar-menu-links').text().includes('♦') || (typeof CHAT !== "undefined" && CHAT.RoomUsers && typeof CHAT.RoomUsers.current === "function" && CHAT.RoomUsers.current().is_moderator) :
        typeof StackExchange !== "undefined" && StackExchange.options && StackExchange.options.user && StackExchange.options.user.isModerator;
}



/**
 * Simple wrapper for (a cross-domain) GM_xmlhttpRequest() that returns a Promise
 * See http://tampermonkey.net/documentation.php#GM_xmlhttpRequest for options
 * Requires @grant GM_xmlhttpRequest
 * @param {string} options - The URL for the AJAX request, via the 'GET' method, OR
 * @param {object} options - A key-value pair of params for the AJAX request
 * @return {Promise} A promise containing the response of the AJAX request
 */
function ajaxPromise(options) {
    if(typeof options === 'string') {
        options = { url: options };
    }

    return new Promise(function(resolve, reject) {
        if(typeof options.url === 'undefined' || options.url == null) reject();

        options.method = options.method || 'GET';
        options.onload = function(response) {
            resolve(response.responseText);
        };
        options.onerror = function() {
            reject();
        };
        GM_xmlhttpRequest(options);
    });
}



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
function jQueryXhrOverride() {
    var xhr = jQuery.ajaxSettings.xhr();
    var setRequestHeader = xhr.setRequestHeader;
    xhr.setRequestHeader = function(name, value) {
        if (name == 'X-Requested-With') return;
        setRequestHeader.call(this, name, value);
    };
    return xhr;
}



/**
 * hasBackoff()    - Check if there's a backoff on the current page
 * addBackoff(num) - Sets a temporary backoff timeout from now until num seconds later
 *                   If already set, replaces the timeout
 */
const _w = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
const hasBackoff = () => typeof _w.backoff === 'number';
function addBackoff(secs) {
    if(isNaN(secs)) return;
    if(hasBackoff()) clearTimeout(_w.backoff);
    _w.backoff = setTimeout(() => { clearTimeout(_w.backoff); _w.backoff = null }, secs * 1000);
}



/**
 * Decodes a string containing HTML entities to a text string
 * https://stackoverflow.com/a/34064434
 */
function htmlDecode(input) {
    var doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent;
}



// EOF
