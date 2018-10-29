/*
    Common helper functions and variables for SOMU
    Requires jQuery
 */

function isModerator() {
    return location.hostname.includes('chat.') ?
        $('.topbar-menu-links').text().includes('♦') || (typeof CHAT !== "undefined" && CHAT.RoomUsers && typeof CHAT.RoomUsers.current === "function" && CHAT.RoomUsers.current().is_moderator) :
        typeof StackExchange !== "undefined" && StackExchange.options && StackExchange.options.user && StackExchange.options.user.isModerator;
}
