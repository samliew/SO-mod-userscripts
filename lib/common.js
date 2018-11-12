/*
    Common helper functions and variables for SOMU scripts
    https://github.com/samliew/SO-mod-userscripts
    
    Requires jQuery
 */



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
