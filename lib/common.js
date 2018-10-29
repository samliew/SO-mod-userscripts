/*
    Common helper functions and variables for SOMU
    Requires jQuery
 */

isModerator() {
    return !location.hostname.includes('chat.') ?
        typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator :
        !$('.topbar-menu-links').text().includes('♦') && $('#roomtitle span').attr('title').indexOf('Private') !== 0;
}

