// ==UserScript==
// @name         Mod User Quicklinks Everywhere
// @description  Adds quicklinks to user infobox in posts
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.1
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*.stackexchange.com/*
//
// @exclude      *chat.*
// @exclude      https://stackoverflow.com/c/*
// ==/UserScript==

(function() {
    'use strict';

    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;


    const isChildMeta = StackExchange.options.site.isChildMeta;
    const parentUrl = isChildMeta ? StackExchange.options.site.parentUrl : '';


    function addUserLinks() {
        $('.post-user-info, .user-details')
            .not('[js-mod-quicklinks]')
            .attr('js-mod-quicklinks', 'true')
            .find('a[href^="/users/"]:first').each(function() {

                // Add Votes and IP-xref links after the user link
                const uid = this.href.match(/\d+/);
                $(`<div class="mod-userlinks">[
  <a href="${parentUrl}/users/account-info/${uid}" target="_blank">mod</a>
| <a href="${parentUrl}/admin/show-user-votes/${uid}" target="_blank">votes</a>
| <a href="${parentUrl}/admin/xref-user-ips/${uid}" target="_blank">xref</a>
]</div>`)
                    .insertAfter(this);
            });
    }


    function listenToPageUpdates() {
        $(document).ajaxStop(addUserLinks);
    }


    function appendStyles() {

        const styles = `
<style>
.user-info .user-details {
  position: relative;
}
.mod-userlinks {
    position: absolute !important;
    display: none;
    width: 100%;
    font-size: 1em;
    transform: scale(0.9, 0.9);
    transform-origin: left center;
    background: white;
}
.post-user-info:hover .mod-userlinks,
.user-info:hover .mod-userlinks {
    display: block;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    addUserLinks();
    listenToPageUpdates();

})();
