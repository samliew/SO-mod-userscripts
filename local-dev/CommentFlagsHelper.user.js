// ==UserScript==
// @name         Comment Flags Helper
// @description  Always expand comments (with deleted) and highlight expanded flagged comments, Highlight common chatty and rude keywords
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      99999
//
// @match        https://*.stackoverflow.com/admin/dashboard*
// @match        https://*.serverfault.com/admin/dashboard*
// @match        https://*.superuser.com/admin/dashboard*
// @match        https://*.askubuntu.com/admin/dashboard*
// @match        https://*.mathoverflow.net/admin/dashboard*
// @match        https://*.stackapps.com/admin/dashboard*
// @match        https://*.stackexchange.com/admin/dashboard*
// @match        https://stackoverflowteams.com/c/*/admin/dashboard*
//
// @match        https://*.stackoverflow.com/admin/users/*/post-comments*
// @match        https://*.serverfault.com/admin/users/*/post-comments*
// @match        https://*.superuser.com/admin/users/*/post-comments*
// @match        https://*.askubuntu.com/admin/users/*/post-comments*
// @match        https://*.mathoverflow.net/admin/users/*/post-comments*
// @match        https://*.stackapps.com/admin/users/*/post-comments*
// @match        https://*.stackexchange.com/admin/users/*/post-comments*
// @match        https://stackoverflowteams.com/c/*/admin/users/*/post-comments*
//
// @exclude      *?flagtype=posttoomanycommentsauto*
//
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
// @require      https://raw.githubusercontent.com/samliew/ajax-progress/master/jquery.ajaxProgress.js
//
// @require      file://C:/projects/SO-mod-userscripts/CommentFlagsHelper.user.js
// ==/UserScript==
