// ==UserScript==
// @name         Mod Batch Comment Deleter
// @description  Batch delete comments using comment IDs or permalinks (e.g.: from SEDE https://data.stackexchange.com/stackoverflow/query/1131935)
// @homepage     https://github.com/samliew/personal-userscripts
// @author       Samuel Liew
// @version      99999
//
// @match        https://*.stackoverflow.com/admin/deleter
// @match        https://*.serverfault.com/admin/deleter
// @match        https://*.superuser.com/admin/deleter
// @match        https://*.askubuntu.com/admin/deleter
// @match        https://*.mathoverflow.net/admin/deleter
// @match        https://*.stackapps.com/admin/deleter
// @match        https://*.stackexchange.com/admin/deleter
// @match        https://stackoverflowteams.com/c/*/admin/deleter
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
//
// @require      file://C:/projects/SO-mod-userscripts/ModBatchCommentDeleter.user.js
// ==/UserScript==
