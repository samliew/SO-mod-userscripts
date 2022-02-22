// ==UserScript==
// @name         No User Id in Share Links
// @description  Adds option to remove your user ID from post share links
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*.stackexchange.com/*
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';


function stripUserIds() {

    // Strip user ids from the link itself
    const sharelinks = $('.js-share-link').not('.js-no-userid').addClass('js-no-userid').attr('href', (i, v) => v.replace(/(\/\d+)\/\d+/, '$1'));

    // Strip user ids from the popups
    sharelinks.next().find('input').val((i, v) => v.replace(/(\/\d+)\/\d+/, '$1'));
}


function doPageload() {
    stripUserIds();

    // When new stuff is loaded
    $(document).ajaxComplete(function (event, xhr, settings) {
        stripUserIds();
    });
}


// On page load
doPageload();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
.js-share-link + .s-popover .js-subtitle {
    display: none;
}
`;
document.body.appendChild(styles);