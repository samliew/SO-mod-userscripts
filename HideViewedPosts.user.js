// ==UserScript==
// @name         Hide viewed posts
// @description  Avoid posts already seen and possibly handled by another moderator
// @match        https://stackoverflow.com/admin/dashboard*
// @match        https://meta.stackoverflow.com/admin/dashboard*
// @match        https://*.stackexchange.com/admin/dashboard?flag*=comment*
// @author       @samliew
// @version      1.0
// ==/UserScript==

(function() {
    'use strict';

    // Avoid posts already seen and possibly handled by another moderator
    $('.mod-audit').filter((i,e) => e.innerText.indexOf('question viewed by:') >= 0).closest('.flagged-post-row').remove();

})();
