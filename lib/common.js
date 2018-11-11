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
 * Simple wrapper for (a cross-domain) GM_xmlhttpRequest that returns a Promise
 * See http://tampermonkey.net/documentation.php#GM_xmlhttpRequest for options
 * @require GM_xmlhttpRequest
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
