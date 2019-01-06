// ==UserScript==
// @name         Mod User Quicklinks Everywhere
// @description  Adds quicklinks to user infobox in posts
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.3.1
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

                // Add Votes and IP-xref links after mod-flair if mod, or after the user link
                const uid = this.href.match(/\d+/);
                const modFlair = $(this).next('.mod-flair');
                const userlinks = $(`<div class="mod-userlinks">[
  <a href="${parentUrl}/users/account-info/${uid}" target="_blank">mod</a>
| <a href="${parentUrl}/admin/show-user-votes/${uid}" target="_blank">votes</a>
| <a href="${parentUrl}/admin/xref-user-ips/${uid}?daysback=30&threshold=2" target="_blank">xref</a>
]</div>`)

                if(modFlair.length !== 0) {
                    userlinks.insertAfter(modFlair);
                }
                else {
                    userlinks.insertAfter(this);
                }
            });
    }


    function listenToPageUpdates() {
        $(document).ajaxStop(addUserLinks);
        $(document).on('moduserquicklinks', addUserLinks);
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
.deleted-answer .mod-userlinks {
    background-color: #f4eaea;
}
/* review stats/leaderboard */
.stats-mainbar .task-stat-leaderboard .user-details {
    line-height: inherit;
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
