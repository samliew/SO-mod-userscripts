// ==UserScript==
// @name         Mod Popup Dialog Improvements
// @description  Some simple improvements for posts' Mod popup dialog
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.6.5
//
// @match        https://stackoverflow.com/*
// @match        https://serverfault.com/*
// @match        https://superuser.com/*
// @match        https://askubuntu.com/*
// @match        https://mathoverflow.net/*
// @match        https://stackexchange.com/*
//
// @match        https://meta.stackoverflow.com/*
// @match        https://meta.serverfault.com/*
// @match        https://meta.superuser.com/*
// @match        https://meta.askubuntu.com/*
// @match        https://meta.mathoverflow.net/*
// @match        https://meta.stackexchange.com/*
//
// @match        *.stackexchange.com/*
// ==/UserScript==

(function() {
    'use strict';

    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;


    function listenToPageUpdates() {

        $(document).ajaxComplete(function(evt, jqXHR, settings) {

            // When post mod menu link is clicked
            if(settings.url.indexOf('/admin/posts/') === 0 && settings.url.indexOf('/moderator-menu') > 0) {

                const $popupForm = $('.popup._hidden-descriptions form');
                if($popupForm.length === 0) return;

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
                    setTimeout(() => $(this).parents('tr.flagged-post-row').hide(), 300);
                });
            }


            // When post decline link is clicked in mod queue
            if(settings.url.indexOf('/admin/dismiss-flag') === 0) {

                // Default decline option to second option "a moderator reviewed your flag, but found no evidence to support it"
                $('#dis_2').click();

                // Focus decline button so we can press space/enter
                $('#dis_ok').focus();
            }

        });
    }


    // On page load
    listenToPageUpdates();

})();
