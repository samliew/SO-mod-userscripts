// ==UserScript==
// @name         Mod User Quicklinks Everywhere
// @description  Adds quicklinks to user infobox in posts
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      3.0
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

/* globals StackExchange, GM_info */

'use strict';

// Moderator check
if (typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator) return;


const isChildMeta = StackExchange.options.site.isChildMeta;
const parentUrl = isChildMeta ? StackExchange.options.site.parentUrl : '';
const showOnHover = false;


function addUserLinks() {

    $('.post-user-info, .s-user-card, .user-details, .js-body-loader div.ai-center.fw-wrap')
        .not('.js-mod-quicklinks')
        .addClass('js-mod-quicklinks')
        .find('a[href^="/users/"]:first').each(function () {

            // Add Votes and IP-xref links after mod-flair if mod, or after the user link
            const uid = Number(this.href.match(/-?\d+/));
            const modFlair = $(this).next('.mod-flair');
            if (uid == -1 || modFlair.length == 1) return;

            const userlinks = `<div class="somu-mod-userlinks ${showOnHover ? 'show-on-hover' : ''}">` +
                `<a href="${parentUrl}/users/account-info/${uid}" target="_blank">mod</a>` +
                `<a href="/admin/users/${uid}/post-comments" target="_blank">cmnts</a>` +
                `<a href="${parentUrl}/admin/show-user-votes/${uid}" target="_blank">votes</a>` +
                `<a href="${parentUrl}/admin/xref-user-ips/${uid}?daysback=30&threshold=2" target="_blank">xref</a>` +
                (!isChildMeta ? `<a href="${parentUrl}/admin/cm-message/create/${uid}?action=suspicious-voting" target="_blank">cm</a>` : '') +
                `</div>`;

            $(this).closest('.user-info, .s-user-card, .js-mod-quicklinks').append($(userlinks));
        });

    $('.user-info').addClass('js-mod-quicklinks');
}

function doPageload() {
    $('.task-stat-leaderboard').removeClass('user-info');
    addUserLinks();
}

function listenToPageUpdates() {
    $(document).ajaxStop(addUserLinks);
    $(document).on('moduserquicklinks', addUserLinks);
}


// On page load
doPageload();
listenToPageUpdates();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
.user-info .user-details {
    position: relative;
}
.somu-mod-userlinks {
    display: block;
    clear: both;
    white-space: nowrap;
    font-size: 0.95em;
}
#questions .somu-mod-userlinks {
    /* No quicklinks in question lists */
    display: none;
}
.s-user-card .somu-mod-userlinks {
    /* New s-user-card uses grid, we want it in last position */
    order: 999;
    grid-column-start: 2;
    text-align: right;
}
.somu-mod-userlinks.show-on-hover {
    display: none;
}
.somu-mod-userlinks,
.somu-mod-userlinks a,
.started .somu-mod-userlinks a {
    color: var(--black-400);
}
.somu-mod-userlinks > a {
    display: inline-block;
    margin-right: 3px;
}
.somu-mod-userlinks a:hover,
.started .somu-mod-userlinks a:hover {
    color: var(--black);
}
.post-user-info:hover .somu-mod-userlinks,
.user-info:hover .somu-mod-userlinks {
    display: block;
}
.flex--item + .somu-mod-userlinks {
    position: initial !important;
    display: inline-block;
    width: auto;
    background: none;
    margin-top: 1px;
}
/* review stats/leaderboard */
.stats-mainbar .task-stat-leaderboard .user-details {
    line-height: inherit;
}
`;
document.body.appendChild(styles);