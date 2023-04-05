// ==UserScript==
// @name         Mod Flagger Stats
// @description  Post hover in mod flag queue, get and display flaggers stats. Badge links to user's flag history. Non-mods only can view their own flag badge on profile.
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      99999
//
// @match        https://*.stackoverflow.com/users/*
// @match        https://*.serverfault.com/users/*
// @match        https://*.superuser.com/users/*
// @match        https://*.askubuntu.com/users/*
// @match        https://*.mathoverflow.net/users/*
// @match        https://*.stackapps.com/users/*
// @match        https://*.stackexchange.com/users/*
// @match        https://stackoverflowteams.com/c/*/users/*
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
// @require      file://C:/projects/SO-mod-userscripts/ModFlaggerStats.user.js
// ==/UserScript==
