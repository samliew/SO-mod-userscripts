// ==UserScript==
// @name         Review Queue Helper
// @description  Keyboard shortcuts, skips accepted questions and audits (to save review quota)
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      99999
//
// @match        https://*.stackoverflow.com/review/*
// @match        https://*.serverfault.com/review/*
// @match        https://*.superuser.com/review/*
// @match        https://*.askubuntu.com/review/*
// @match        https://*.mathoverflow.net/review/*
// @match        https://*.stackapps.com/review/*
// @match        https://*.stackexchange.com/review/*
// @match        https://stackoverflowteams.com/c/*/review/*
//
// @match        https://*.stackoverflow.com/questions/*
// @match        https://*.serverfault.com/questions/*
// @match        https://*.superuser.com/questions/*
// @match        https://*.askubuntu.com/questions/*
// @match        https://*.mathoverflow.net/questions/*
// @match        https://*.stackapps.com/questions/*
// @match        https://*.stackexchange.com/questions/*
// @match        https://stackoverflowteams.com/c/*/questions/*
//
// @match        https://*.stackoverflow.com/admin/dashboard?flagtype=*
// @match        https://*.serverfault.com/admin/dashboard?flagtype=*
// @match        https://*.superuser.com/admin/dashboard?flagtype=*
// @match        https://*.askubuntu.com/admin/dashboard?flagtype=*
// @match        https://*.mathoverflow.net/admin/dashboard?flagtype=*
// @match        https://*.stackapps.com/admin/dashboard?flagtype=*
// @match        https://*.stackexchange.com/admin/dashboard?flagtype=*
// @match        https://stackoverflowteams.com/c/*/admin/dashboard?flagtype=*
//
// @exclude      */review/*/stats
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
// @require      file://C:/projects/SO-mod-userscripts/ReviewQueueHelper.user.js
// ==/UserScript==
