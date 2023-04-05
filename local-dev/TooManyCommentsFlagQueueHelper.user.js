// ==UserScript==
// @name         Too Many Comments Flag Queue Helper
// @description  Inserts quicklinks to "Move comments to chat + delete" and "Delete all comments"
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      99999
//
// @match        https://*.stackoverflow.com/admin/dashboard?flagtype=posttoomanycommentsauto*
// @match        https://*.serverfault.com/admin/dashboard?flagtype=posttoomanycommentsauto*
// @match        https://*.superuser.com/admin/dashboard?flagtype=posttoomanycommentsauto*
// @match        https://*.askubuntu.com/admin/dashboard?flagtype=posttoomanycommentsauto*
// @match        https://*.mathoverflow.net/admin/dashboard?flagtype=posttoomanycommentsauto*
// @match        https://*.stackapps.com/admin/dashboard?flagtype=posttoomanycommentsauto*
// @match        https://*.stackexchange.com/admin/dashboard?flagtype=posttoomanycommentsauto*
// @match        https://stackoverflowteams.com/c/*/admin/dashboard?flagtype=posttoomanycommentsauto*
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
// @require      file://C:/projects/SO-mod-userscripts/TooManyCommentsFlagQueueHelper.user.js
// ==/UserScript==
