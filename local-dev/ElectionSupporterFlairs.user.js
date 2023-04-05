// ==UserScript==
// @name         Election Supporter Flairs
// @description  Flair users who voted in the elections when you were elected, or if non-mod, for the latest election
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      99999
//
// @match        https://*.stackoverflow.com/*
// @match        https://*.serverfault.com/*
// @match        https://*.superuser.com/*
// @match        https://*.askubuntu.com/*
// @match        https://*.mathoverflow.net/*
// @match        https://*.stackapps.com/*
// @match        https://*.stackexchange.com/*
// @match        https://stackoverflowteams.com/*
//
// @exclude      */show-user-votes/*
// @exclude      *?tab=questions*
// @exclude      *?tab=tags*
// @exclude      *?tab=following*
// @exclude      *?tab=activity*
// @exclude      *?tab=bounties*
// @exclude      *?tab=responses*
// @exclude      *?tab=votes*
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
// @require      file://C:/projects/SO-mod-userscripts/DuplicateAnswersFlagsHelper.user.js
// ==/UserScript==
