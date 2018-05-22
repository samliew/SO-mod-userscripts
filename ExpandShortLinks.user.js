// ==UserScript==
// @name         Expand Short Links
// @description  Appends more characters to short link texts so they can be easily seen and clicked on
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0
//
// @match        https://*stackoverflow.com/*
// @match        https://*serverfault.com/*
// @match        https://*superuser.com/*
// @match        https://*askubuntu.com/*
// @match        https://*mathoverflow.net/*
// @match        https://*.stackexchange.com/*
// ==/UserScript==

(function() {
    'use strict';


    function expandShortLinks() {
        $('.post-text, .comment-copy').find('a').filter((i,el) => el.innerText.length <= 2).text((i,v) => v + ':shortlink');
    }


    // On page load
    expandShortLinks();
    $(document).ajaxComplete(expandShortLinks);

})();
