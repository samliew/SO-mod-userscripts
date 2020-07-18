// ==UserScript==
// @name         Hide Reputation
// @description  Hides all reputation
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
//
// @exclude      https://data.stackexchange.com/*
// @exclude      *chat.*
// @exclude      *blog.*
//
// @run-at       document-end
// ==/UserScript==


(function() {
    'use strict';


    function removeRepTooltips() {

        // Remove anything with rep in title tooltips
        $('[title]').attr('title', function(i, v) {
            return v.includes('rep') ? '' : v;
        });
    }


    function doPageload() {

        removeRepTooltips();
    }


    function listenToPageUpdates() {

        // On any page update
        $(document).ajaxStop(function(event, xhr, settings) {
            removeRepTooltips();
        });
    }


    function appendStyles() {

        const styles = `
<style>
.user-info .-flair {
    display: none !important;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();
    listenToPageUpdates();

})();
