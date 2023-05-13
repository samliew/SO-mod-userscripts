// ==UserScript==
// @name         Post Ban Deleted Posts
// @description  When user posts on SO Meta regarding a post ban, fetch and display deleted posts (must be mod) and provide easy way to copy the results into a comment. Assists in building low-quality-questions mod messages.
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      99999
//
// @match        https://meta.stackoverflow.com/questions/*
// @match        https://stackoverflow.com/users/message/create/*?action=low-quality-questions*
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
