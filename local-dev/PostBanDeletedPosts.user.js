// ==UserScript==
// @name         Post Ban Deleted Posts
// @description  Assists in building low-quality-questions mod messages. For SO Meta only, fetch and display user's deleted posts in markdown format.
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      99999
//
// @match        https://meta.stackoverflow.com/questions/*
//
// @match        https://*.stackoverflow.com/users/message/create/*?action=low-quality-questions*
// @match        https://*.serverfault.com/users/message/create/*?action=low-quality-questions*
// @match        https://*.superuser.com/users/message/create/*?action=low-quality-questions*
// @match        https://*.askubuntu.com/users/message/create/*?action=low-quality-questions*
// @match        https://*.mathoverflow.net/users/message/create/*?action=low-quality-questions*
// @match        https://*.stackapps.com/users/message/create/*?action=low-quality-questions*
// @match        https://*.stackexchange.com/users/message/create/*?action=low-quality-questions*
//
// @exclude      https://stackoverflowteams.com/*
// @exclude      https://api.stackexchange.com/*
// @exclude      https://data.stackexchange.com/*
// @exclude      https://contests.stackoverflow.com/*
// @exclude      https://winterbash*.stackexchange.com/*
// @exclude      *chat.*
// @exclude      *blog.*
// @exclude      */tour
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/se-ajax-common.js
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
//
// @require      file://C:/projects/SO-mod-userscripts/PostBanDeletedPosts.user.js
//
// @grant        GM_xmlhttpRequest
// ==/UserScript==
