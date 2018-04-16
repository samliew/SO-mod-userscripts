// ==UserScript==
// @name         Mod Popup Dialog Improvements
// @description  Some simple improvements for posts' Mod popup dialog
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0
//
// @match        https://*stackoverflow.com/admin/dashboard*
// @match        https://meta.stackoverflow.com/admin/dashboard*
// @match        https://*.stackexchange.com/admin/dashboard*
// ==/UserScript==

(function() {
    'use strict';

    function listenToPageUpdates() {

        $(document).ajaxComplete(function() {

            var $popupForm = $('.popup._hidden-descriptions form');
            if($popupForm) {

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
