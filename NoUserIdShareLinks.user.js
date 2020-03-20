// ==UserScript==
// @name         No User Id in Share Links
// @description  Adds option to remove your user ID from post share links
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.2
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*.stackexchange.com/*
// ==/UserScript==

(function() {
    'use strict';


    function doPageload() {

        // Strip user ids from the link itself
        const sharelinks = $('.js-share-link').attr('href', (i, v) => v.replace(/(\/\d+)\/\d+/, '$1'));

        // Strip user ids from the popups
        sharelinks.next().find('input').val((i, v) => v.replace(/(\/\d+)\/\d+/, '$1'));
    }


    function appendStyles() {

        const styles = `
<style>
.js-share-link + .s-popover .js-subtitle {
    display: none;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();

})();
