// ==UserScript==
// @name         Mod Popup Dialog Improvements
// @description  Some simple improvements for posts' Mod popup dialog
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.3
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

                // On postlowquality queue, default to convert-to-comment instead
                if(location.href.indexOf('postlowquality') >= 0) {
                    $('#tab-actions input[value="convert-to-comment"]').prop('checked', true).triggerHandler('click');
                }

                // Delete moved comments is checked by default
                $('#delete-moved-comments').prop('checked', true);

                // Prevent Mod actions in Flag Queue redirecting to post - instead opens in a new tab
                if(location.href.indexOf('/admin/dashboard') >= 0) {
                    $popupForm.attr('target', '_blank');
                }

                // Submitting popup form hides the post as well
                $popupForm.on('click', 'input:submit', function() {
                    $(this).parents('tr.flagged-post-row').hide();
                });
            }
        });
    }

    // On page load
    listenToPageUpdates();

})();
