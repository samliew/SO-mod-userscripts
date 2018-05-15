// ==UserScript==
// @name         Hide viewed posts
// @description  Avoid posts already seen and possibly handled by another moderator
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.4
//
// @include      https://stackoverflow.com/admin/dashboard*
// @include      https://serverfault.com/admin/dashboard*
// @include      https://superuser.com/admin/dashboard*
// @include      https://askubuntu.com/admin/dashboard*
// @include      https://mathoverflow.net/admin/dashboard*
//
// @include      https://meta.stackoverflow.com/admin/dashboard*
// @include      https://meta.serverfault.com/admin/dashboard*
// @include      https://meta.superuser.com/admin/dashboard*
// @include      https://meta.askubuntu.com/admin/dashboard*
// @include      https://meta.mathoverflow.net/admin/dashboard*
//
// @include      /^https?:\/\/.*\.stackexchange\.com/admin/dashboard.*/
// ==/UserScript==

(function() {
    'use strict';

    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;


    // Avoid posts already seen and possibly handled by another moderator
    $('.mod-audit').filter((i,e) => e.innerText.indexOf('question viewed by:') >= 0).closest('.flagged-post-row').remove();

})();
