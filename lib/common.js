/*
    Common helper functions and variables for SOMU
    Requires jQuery
 */

function isModerator() {
    
    if(location.hostname.includes('chat.')) {
        return $('.topbar-menu-links').text().includes('♦') || $('#roomtitle span').attr('title').indexOf('Private') == 0;
    }
    return typeof StackExchange !== "undefined" && StackExchange.options && StackExchange.options.user && StackExchange.options.user.isModerator;
}
