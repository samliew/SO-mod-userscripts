// ==UserScript==
// @name         Serial Voting Flags Helper
// @description  Adds links to user Mod Dashboard, Votes, IP-xref links next to username link
// @match        https://stackoverflow.com/*
// @match        https://*.stackexchange.com/*
// @author       @samliew
// ==/UserScript==

(function() {
    'use strict';

    function doPageload() {

        $('.post-user-info, .user-details').find('a[href^="/users/"]').each(function() {

            // Add Votes and IP-xref links after the user link
            var uid = this.href.match(/\d+/);
            $('<span>&nbsp;</span><br>(<a href="https://stackoverflow.com/users/account-info/'+uid+'" target="_blank">mod</a>|<a href="https://stackoverflow.com/admin/show-user-votes/'+uid+'" target="_blank">votes</a>|<a href="https://stackoverflow.com/admin/xref-user-ips/'+uid+'" target="_blank">xref</a>)<span>&nbsp;</span>')
                .insertAfter(this);
        });
    }

    // On page load
    doPageload();

})();
