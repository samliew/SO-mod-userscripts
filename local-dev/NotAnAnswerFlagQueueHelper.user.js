// ==UserScript==
// @name         NAA / VLQ Flag Queue Helper
// @description  Inserts several sort options for the NAA / VLQ / Review LQ Disputed queues
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      99999
//
// @match        https://*.stackoverflow.com/admin/dashboard?flagtype=postother*
// @match        https://*.serverfault.com/admin/dashboard?flagtype=postother*
// @match        https://*.superuser.com/admin/dashboard?flagtype=postother*
// @match        https://*.askubuntu.com/admin/dashboard?flagtype=postother*
// @match        https://*.mathoverflow.net/admin/dashboard?flagtype=postother*
// @match        https://*.stackapps.com/admin/dashboard?flagtype=postother*
// @match        https://*.stackexchange.com/admin/dashboard?flagtype=postother*
// @match        https://stackoverflowteams.com/c/*/admin/dashboard?flagtype=postother*
//
// @match        https://*.stackoverflow.com/admin/dashboard?flagtype=postlowquality*
// @match        https://*.serverfault.com/admin/dashboard?flagtype=postlowquality*
// @match        https://*.superuser.com/admin/dashboard?flagtype=postlowquality*
// @match        https://*.askubuntu.com/admin/dashboard?flagtype=postlowquality*
// @match        https://*.mathoverflow.net/admin/dashboard?flagtype=postlowquality*
// @match        https://*.stackapps.com/admin/dashboard?flagtype=postlowquality*
// @match        https://*.stackexchange.com/admin/dashboard?flagtype=postlowquality*
// @match        https://stackoverflowteams.com/c/*/admin/dashboard?flagtype=postlowquality*
//
// @match        https://*.stackoverflow.com/admin/dashboard?flagtype=answernotananswer*
// @match        https://*.serverfault.com/admin/dashboard?flagtype=answernotananswer*
// @match        https://*.superuser.com/admin/dashboard?flagtype=answernotananswer*
// @match        https://*.askubuntu.com/admin/dashboard?flagtype=answernotananswer*
// @match        https://*.mathoverflow.net/admin/dashboard?flagtype=answernotananswer*
// @match        https://*.stackapps.com/admin/dashboard?flagtype=answernotananswer*
// @match        https://*.stackexchange.com/admin/dashboard?flagtype=answernotananswer*
// @match        https://stackoverflowteams.com/c/*/admin/dashboard?flagtype=answernotananswer*
//
// @match        https://*.stackoverflow.com/admin/dashboard?flagtype=reviewlowqualitydisputedauto*
// @match        https://*.serverfault.com/admin/dashboard?flagtype=reviewlowqualitydisputedauto*
// @match        https://*.superuser.com/admin/dashboard?flagtype=reviewlowqualitydisputedauto*
// @match        https://*.askubuntu.com/admin/dashboard?flagtype=reviewlowqualitydisputedauto*
// @match        https://*.mathoverflow.net/admin/dashboard?flagtype=reviewlowqualitydisputedauto*
// @match        https://*.stackapps.com/admin/dashboard?flagtype=reviewlowqualitydisputedauto*
// @match        https://*.stackexchange.com/admin/dashboard?flagtype=reviewlowqualitydisputedauto*
// @match        https://stackoverflowteams.com/c/*/admin/dashboard?flagtype=reviewlowqualitydisputedauto*
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
// @require      file://C:/projects/SO-mod-userscripts/NotAnAnswerFlagQueueHelper.user.js
// ==/UserScript==
