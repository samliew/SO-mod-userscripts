// ==UserScript==
// @name         No Oneboxes in Chat
// @description  Collapses oneboxes from chat rooms/transcripts/bookmarks, click to display onebox
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0
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
        let obs = $('.onebox').not('.js-onebox-hidden').addClass('js-onebox-hidden').hide().each(function() {
            let url = $(this).find('a').first().attr('href');
            if($(this).hasClass('ob-tweet')) url = $(this).find('a').last().attr('href');

            $(`<span class="has-onebox" title="click to load onebox">${url}</span>`)
                .click(function() {
                    $(this).addClass('js-show-onebox');
                }).insertBefore(this);
        });

        let obs2 = [];
        if(mid === -1) {
            // Re-hide all expanded oneboxes
            obs2 = $('.js-show-onebox').removeClass('js-show-onebox');
        }
        else {
            // Re-hide specific message's onebox
            obs2 = $(`#message-${mid}`).find('.js-show-onebox').removeClass('js-show-onebox');
        }

        //console.log((obs.length + obs2.length) + ' oneboxes hidden');
    };


    function doPageload() {

        // Once on page load
        hideOneboxes();

        // Occasionally, look for new oneboxes and hide them
        setInterval(hideOneboxes, 2000);
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
