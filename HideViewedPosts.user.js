// ==UserScript==
// @name         Hide viewed posts
// @description  Avoid posts already seen and possibly handled by another moderator
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.1
//
// @include      https://stackoverflow.com/admin/dashboard*
// @include      https://meta.stackoverflow.com/admin/dashboard*
// @include      https://*.stackexchange.com/admin/dashboard?flag*=comment*
// ==/UserScript==

(function() {
    'use strict';

    // Avoid posts already seen and possibly handled by another moderator
    $('.mod-audit').filter((i,e) => e.innerText.indexOf('question viewed by:') >= 0).closest('.flagged-post-row').remove();

})();
