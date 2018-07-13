// ==UserScript==
// @name         No Oneboxes in Chat
// @description  Collapses oneboxes from chat rooms/transcripts/bookmarks, click to display onebox
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.1.1
//
// @include      https://chat.stackoverflow.com/rooms/*
// @include      https://chat.stackexchange.com/rooms/*
// @include      https://chat.meta.stackexchange.com/rooms/*
//
// @include      https://chat.stackoverflow.com/transcript/*
// @include      https://chat.stackexchange.com/transcript/*
// @include      https://chat.meta.stackexchange.com/transcript/*
//
// @include      https://chat.stackoverflow.com/rooms/*/conversation/*
// @include      https://chat.stackexchange.com/rooms/*/conversation/*
// @include      https://chat.meta.stackexchange.com/rooms/*/conversation/*
// ==/UserScript==

(function() {
    'use strict';


    /* Call hideOneboxes() from other scripts to hide all new oneboxes on any page update
     * Params:
     *     mid : message ID to re-hide its expanded onebox, OR
     *           -1 to re-hide all expanded oneboxes
     */
    unsafeWindow.hideOneboxes = function(mid = null) {

        // Display original link and hide oneboxes who hasn't been hidden before
        $('.onebox').not('.js-onebox-hidden').addClass('js-onebox-hidden').hide().each(function() {

            // Onebox permalink is usually the first URL in the onebox
            let url = $(this).find('a').first().attr('href');

            // If onebox type is a tweet, permalink is the last link in onebox
            if($(this).hasClass('ob-tweet')) url = $(this).find('a').last().attr('href');

            // Click placeholder to show onebox
            $(`<span class="has-onebox" title="click to load onebox">${url}</span>`)
                .click(function() {
                    $(this).addClass('js-show-onebox');
                }).insertBefore(this);

            // Also collapse user signature (use tiny-signature)
            $(this).parents('.monologue').find('.tiny-signature').fadeIn(200).siblings().hide();
        });

        // Re-hide oneboxes if mid is set
        if(mid === -1) {
            // Re-hide all expanded oneboxes
            $('.js-show-onebox').removeClass('js-show-onebox');
        }
        else if(mid) {
            // Re-hide specific message's onebox
            $(`#message-${mid}`).find('.js-show-onebox').removeClass('js-show-onebox');
        }
    };


    function doPageload() {

        // Once on page load
        hideOneboxes();

        // Occasionally, look for new oneboxes and hide them
        setInterval(hideOneboxes, 1000);
    }


    function appendStyles() {

        const styles = `
<style>
.has-onebox {
    padding-left: 10px;
    border-left: 3px solid orange;
    cursor: zoom-in;
}
.js-show-onebox {
    display: none;
}
.js-show-onebox + .js-onebox-hidden {
    display: block !important;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();

})();
