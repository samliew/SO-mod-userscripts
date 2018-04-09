// ==UserScript==
// @name         Serial Voting Flags Helper
// @description  Replaces user profile links to user Mod Dashboard and add Votes and IP-xref links next to it (links open in new window)
// @match        https://stackoverflow.com/*
// @match        https://*.stackexchange.com/*
// @author       @samliew
// ==/UserScript==

(function() {
    'use strict';

    function doPageload() {

        $('.post-user-info, .user-details').find('a[href^="/users/"]').each(function() {

            // Replace user profile links to user Mod Dashboard
            this.href = this.href.replace('/users/', '/users/account-info/').replace(/[^\d]+$/, '');
            this.target = '_blank';

            // Add Votes and IP-xref links after the user link
            var uid = this.href.match(/\d+$/);
            $('<span>&nbsp;</span><br>(<a href="https://stackoverflow.com/admin/show-user-votes/'+uid+'" target="_blank">Votes</a>) (<a href="https://stackoverflow.com/admin/xref-user-ips/'+uid+'" target="_blank">IPxref</a>)<span>&nbsp;</span>')
                .insertAfter(this);
        });
    }

    // On page load
    doPageload();

})();
