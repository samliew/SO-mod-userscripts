// ==UserScript==
// @name         Possible Vandalism Edits Helper
// @description  Display revision count and post age
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      99999
//
// @match        https://*.stackoverflow.com/admin/dashboard?flagtype=postvandalismeditsauto*
// @match        https://*.serverfault.com/admin/dashboard?flagtype=postvandalismeditsauto*
// @match        https://*.superuser.com/admin/dashboard?flagtype=postvandalismeditsauto*
// @match        https://*.askubuntu.com/admin/dashboard?flagtype=postvandalismeditsauto*
// @match        https://*.mathoverflow.net/admin/dashboard?flagtype=postvandalismeditsauto*
// @match        https://*.stackapps.com/admin/dashboard?flagtype=postvandalismeditsauto*
// @match        https://*.stackexchange.com/admin/dashboard?flagtype=postvandalismeditsauto*
// @match        https://stackoverflowteams.com/c/*/admin/dashboard?flagtype=postvandalismeditsauto*
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
// @require      file://C:/projects/SO-mod-userscripts/PossibleVandalismEditsHelper.user.js
// ==/UserScript==
