// ==UserScript==
// @name         Refresh Empty Mod Queue
// @description  If current mod queue is empty, reload page occasionally
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.0
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

    const timeoutSecs = 10;
    const goToMain = () => location.href = '/admin/dashboard?filtered=false';
    const reloadPage = () => location.reload(true);


    let initRefresh = function(main = false) {

        if($('.js-flagged-post:visible, .flagged-post-row:visible').length > 0) return;

        let c = timeoutSecs;
        $(`<div style="position:absolute; bottom:10px;">Refreshing page in <b id="refresh-counter">${timeoutSecs}</b> seconds...</div>`).appendTo('.flag-container, .js-admin-dashboard');

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
        if(!$('body').hasClass('flag-page') && !$('body').hasClass('mod-page unified-theme')) return;

        // If completely no post flags, redirect to main
        if($('.s-sidebarwidget--header .bounty-indicator-tab').length === 0 && $('.so-flag, .m-flag, .c-flag').length === 0) {
            initRefresh(true);
        }
        // Refresh if no flags left in unfiltered queue
        else if(location.search.contains('filtered=false')) {
            initRefresh();
        }
        // Go to unfiltered queue
        else {
            location.search = location.search + '&filtered=false';
        }

        // When ajax requests have completed
        $(document).ajaxComplete(function(event, xhr, settings) {

            // If post deleted, remove from queue
            if(!settings.url.includes('/comments/') && settings.url.includes('/vote/10')) {
                const pid = settings.url.match(/\/\d+\//)[0].replace(/\//g, '');
                $('#flagged-' + pid).remove();

                // Refresh if no flags in current queue
                initRefresh();
            }
        });

        // When flags are handled
        $(document).ajaxStop(function(event, xhr, settings) {

            // Refresh if no flags in current queue
            initRefresh();
        });

        // On skip post link click
        $('.js-flagged-post, .flagged-post-row').on('click', '.skip-post', initRefresh);
    }


    // On page load
    doPageload();

})();
