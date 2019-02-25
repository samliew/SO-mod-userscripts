// ==UserScript==
// @name         Refresh Empty Mod Queue
// @description  If current mod queue is empty, reload page occasionally
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.2.2
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

(function() {
    'use strict';

    const timeoutSecs = 5;
    const goToMain = () => location.href = '/admin/dashboard?filtered=false';
    const reloadPage = () => location.reload(true);


    let initRefresh = function(main = false) {

        if($('.flagged-post-row').length > 0) return;

        let c = timeoutSecs;
        $(`<div>Refreshing page in <b id="refresh-counter">${timeoutSecs}</b> seconds...</div>`).appendTo('.flag-container');

        // Main timeout
        setTimeout(main ? goToMain : reloadPage, timeoutSecs * 1000);

        // Counter update interval
        setInterval(function() {
            $('#refresh-counter').text(--c > 0 ? c : 0);
        }, 1000);

        // Ensures this function only runs once
        initRefresh = function() {};
    };


    function doPageload() {

        // If no mod flags, insert mod flags indicator in header anyway...
        if($('.flag-count-item').length === 0) {
            $('.js-mod-inbox-button').parent().after(`<li class="-item flag-count-item" data-remove-order="3">
                   <a href="/admin/dashboard" class="-link _text-only" title="no flags!">
                       <span class="indicator-badge _regular">0</span>
                   </a>
               </li>`);
        }

        // If not on mod flag pages, ignore rest of script
        if(!$('body').hasClass('flag-page')) return;

        // If completely no post flags, redirect to main
        if($('.so-flag, .m-flag, .c-flag').length === 0) {
            initRefresh(true);
        }
        // Refresh if no flags in current queue
        else {
            initRefresh();
        }

        // When flags are handled
        $(document).ajaxStop(function(event, xhr, settings) {
            // Refresh if no flags in current queue
            initRefresh();
        });

        // On skip post link click
        $('.flagged-post-row').on('click', '.skip-post', initRefresh);
    }


    // On page load
    doPageload();

})();
