// ==UserScript==
// @name         Refresh Empty Mod Queue
// @description  If current mod queue is empty, reload page occasionally
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.1
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

    const timeoutSecs = 15;
    const goToMain = () => location.href = '/admin/dashboard';
    const reloadPage = () => location.reload(true);


    function doPageload() {

        // If no mod flags, insert mod flags indicator in header anyway...
        if($('.flag-count-item').length === 0) {
            $('.js-mod-inbox-button').parent().after(`<li class="-item flag-count-item" data-remove-order="3">
                   <a href="/admin/dashboard" class="-link _text-only" title="no flags!">
                       <span class="indicator-badge _regular">0</span>
                   </a>
               </li>`);
        }

        // If on mod flag pages
        if($('body').hasClass('flag-page')) {

            // If completely no post flags, redirect to main
            if($('.so-flag, .m-flag, .c-flag').length === 0) {
                setTimeout(goToMain, timeoutSecs * 1000);
            }

            // Refresh if no flags in current queue
            else if($('.flagged-posts.moderator').children().length === 0) {
                setTimeout(reloadPage, timeoutSecs * 1000);
            }

            // When flags are handled,
            $(document).ajaxStop(function(event, xhr, settings) {

                // Refresh if no flags in current queue
                if($('.flagged-post-row').length === 0) {
                    setTimeout(reloadPage, timeoutSecs * 1000);
                }
            });
        }
    }


    // On page load
    doPageload();

})();
