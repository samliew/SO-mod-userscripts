// ==UserScript==
// @name         Mod Popup Dialog Improvements
// @description  Some simple improvements for posts' Mod popup dialog
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.1
//
// @match        https://*stackoverflow.com/*
// @match        https://meta.stackoverflow.com/*
// @match        https://*.stackexchange.com/*
// ==/UserScript==

(function() {
    'use strict';

    function listenToPageUpdates() {
        $(document).ajaxComplete(function() {
            var $popupForm = $('.popup._hidden-descriptions form');
            if($popupForm) {

                // Move comments to chat is selected by default
                $('#tab-actions input[value="move-comments-to-chat"]').prop('checked', true).triggerHandler('click');

                // Delete moved comments is checked by default
                $('#delete-moved-comments').prop('checked', true);

                // Prevent Mod actions in Flag Queue redirecting to post - instead opens in a new tab
                if(location.href.indexOf('/admin/dashboard') >= 0) {
                    $popupForm.attr('target', '_blank');
                }
            }
        });
    }

    // On page load
    listenToPageUpdates();

})();
