// ==UserScript==
// @name         User Review Ban Helper
// @description  Display users' prior review bans in review, Insert review ban button in user review ban history page, Load ban form for user if user ID passed via hash
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      99999
//
// @include      */review/close*
// @include      */review/reopen*
// @include      */review/suggested-edits*
// @include      */review/helper*
// @include      */review/low-quality-posts*
// @include      */review/triage*
// @include      */review/first-questions*
// @include      */review/first-answers*
// @include      */review/late-answers*
//
// @include      */users/account-info/*
// @include      */users/history/*?type=User+has+been+suspended+from+reviewing
// @include      */users/*?tab=activity&sort=reviews*
// @include      */users/*?tab=activity&sort=suggestions*
//
// @include      */admin/review/failed-audits*
// @include      */admin/review/audits*
// @include      */admin/review/suspensions*
// @include      */admin/links
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/se-ajax-common.js
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// @require      https://raw.githubusercontent.com/userscripters/storage/master/dist/browser.js
//
// @require      file://C:/projects/SO-mod-userscripts/UserReviewBanHelper.user.js
// ==/UserScript==
