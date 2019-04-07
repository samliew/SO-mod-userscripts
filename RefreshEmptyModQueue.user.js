// ==UserScript==
// @name         Refresh Empty Mod Queue
// @description  If current mod queue is empty, reload page occasionally
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.6.1
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

    const goToMain = () => location.href = '/admin/dashboard?filtered=false';
    const reloadPage = () => location.search.contains('filtered=false') ? location.reload(true) : location.search += (location.search.length == 0 ? '' : '&') + 'filtered=false';
    let timeoutSecs = unsafeWindow.modRefreshInterval || 10;
    let timeout, interval;


    let initRefresh = function(main = false) {

        if($('.js-flagged-post:visible, .flagged-post-row:visible').length > 0) return;
        if(timeoutSecs < 1) timeoutSecs = 5;

        // Function called again, reset
        if(timeout || interval) {
            clearTimeout(timeout);
            clearInterval(interval);
            timeout = null;
            interval = null;
            $('#somu-refresh-queue-counter').remove();
        }

        let c = timeoutSecs;
        $(`<div id="somu-refresh-queue-counter">Refreshing page in <b id="refresh-counter">${timeoutSecs}</b> seconds...</div>`).appendTo('body');

        // Main timeout
        timeout = setTimeout(main ? goToMain : reloadPage, timeoutSecs * 1000);

        // Counter update interval
        interval = setInterval(function() {
            $('#refresh-counter').text(--c > 0 ? c : 0);
        }, 1000);
    };
    unsafeWindow.initRefresh = initRefresh;


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
        if(!location.pathname.includes('/admin/dashboard') || ( $('.js-admin-dashboard').length == 0 && !document.body.classList.contains('flag-page') )) return;

        // If completely no post flags, redirect to main
        if($('.s-sidebarwidget--header .bounty-indicator-tab').length === 0 && $('.so-flag, .m-flag, .c-flag').length === 0) {
            initRefresh(true);
        }
        // Refresh if no flags left in current queue
        else {
            initRefresh();
        }

        // On user action on page, restart and lengthen countdown
        $(document).on('mouseup keyup', 'body', function() {
            if(timeout) timeoutSecs++;
            initRefresh();
        });

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

        // When flags are handled, refresh if no flags in current queue
        $(document).ajaxStop(initRefresh);

        // On skip post link click
        $('.js-flagged-post, .flagged-post-row').on('click', '.skip-post', initRefresh);
    }


    function appendStyles() {

        const styles = `
<style>
#somu-refresh-queue-counter {
    position:fixed;
    bottom:0;
    left:50%;
    line-height:2em;
    transform:translateX(-50%);
}
.js-admin-dashboard > div > div > fieldset {
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
