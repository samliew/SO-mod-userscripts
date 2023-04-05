// ==UserScript==
// @name         Comment Flag Type Colours
// @description  Background colours for each comment flag type
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      99999
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
// @match        https://*.stackoverflow.com/posts/*/timeline*
// @match        https://*.serverfault.com/posts/*/timeline*
// @match        https://*.superuser.com/posts/*/timeline*
// @match        https://*.askubuntu.com/posts/*/timeline*
// @match        https://*.mathoverflow.net/posts/*/timeline*
// @match        https://*.stackapps.com/posts/*/timeline*
// @match        https://*.stackexchange.com/posts/*/timeline*
// @match        https://stackoverflowteams.com/c/*/posts/*/timeline*
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
// @match        https://*.stackoverflow.com/users/flag-summary/*?group=4*
// @match        https://*.serverfault.com/users/flag-summary/*?group=4*
// @match        https://*.superuser.com/users/flag-summary/*?group=4*
// @match        https://*.askubuntu.com/users/flag-summary/*?group=4*
// @match        https://*.mathoverflow.net/users/flag-summary/*?group=4*
// @match        https://*.stackapps.com/users/flag-summary/*?group=4*
// @match        https://*.stackexchange.com/users/flag-summary/*?group=4*
// @match        https://stackoverflowteams.com/c/*/users/flag-summary/*?group=4*
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
// @exclude      */admin/dashboard?flagtype=answerduplicateanswerauto*
// @exclude      */admin/dashboard?flagtype=commentvandalismdeletionsauto*
// @exclude      */admin/dashboard?flagtype=commenttoomanydeletedrudenotconstructiveauto*
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
// @require      file://C:/projects/SO-mod-userscripts/CommentFlagTypeColours.user.js
// ==/UserScript==
