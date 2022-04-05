// ==UserScript==
// @name         Hide Reputation
// @description  Hides all reputation
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.2
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*.stackexchange.com/*
//
// @exclude      https://data.stackexchange.com/*
// @exclude      *chat.*
// @exclude      *blog.*
//
// @run-at       document-end
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';

if (unsafeWindow !== undefined && window !== unsafeWindow) {
    window.jQuery = unsafeWindow.jQuery;
    window.$ = unsafeWindow.jQuery;
}

function removeRepTooltips() {
    // Remove anything with rep in title tooltips
    $('[title]').attr('title', function (i, v) {
        return v.includes('rep') ? '' : v;
    });
}

function listenToPageUpdates() {
    // On any page update
    $(document).ajaxStop(function (event, xhr, settings) {
        removeRepTooltips();
    });
}


// On page load
removeRepTooltips();
listenToPageUpdates();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
.user-info .-flair {
    display: none !important;
}
`;
document.body.appendChild(styles);
