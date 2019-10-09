// ==UserScript==
// @name         Hide Vote Counts
// @description  Hides post score until voted
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0.2
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*.stackexchange.com/*
//
// @exclude      */c/*
// @exclude      */admin/*
// @exclude      *chat.*
// @exclude      *blog.*
//
// @run-at       document-end
// ==/UserScript==


(function() {
    'use strict';

    const uid = StackExchange.options.user.userId;


    function doPageload() {

        // Hide all vote counts immediately on page load
        $('.js-voting-container').addClass('js-score-hidden');

        // Show vote counts on own posts
        $('.question, .answer').filter(function() {
            return $(this).find(`.user-details[itemprop="author"] > a[href^="/users/${uid}/"]`).length > 0;
        }).find('.js-voting-container').removeClass('js-score-hidden');

        // Function to check for votes again when Q&A has initialized
        StackExchange.ready(function() {

            // If we have voted, show post votes
            $('.js-voting-container .fc-theme-primary').parent().removeClass('js-score-hidden');
        });
    }


    function listenToPageUpdates() {

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {

            // Ignore unsuccessful ajax responses
            if(xhr.status != 200 && xhr.status != 204) return;

            // On vote
            if(/\/posts\/\d+\/vote\/\d/.test(settings.url)) {
                const pid = Number(settings.url.match(/\/(\d+)\//)[1]);
                const votetype = Number(settings.url.match(/\d+$/)[0]);

                // Show if voted, hide if unvoted successfully
                if(xhr.responseJSON.Success) $(`.js-voting-container[data-post-id="${pid}"]`).toggleClass('js-score-hidden', votetype === 0);
            }
        });
    }


    function appendStyles() {

        const styles = `
<style>
.js-voting-container.js-score-hidden .js-vote-count {
    position: relative;
    font-size: 0 !important;
    pointer-events: none;
}
.js-voting-container.js-score-hidden .js-vote-count .vote-count-separator {
    display: none;
}
.js-voting-container.js-score-hidden .js-vote-count:after {
    content: '?';
    display: inline-block;
    font-size: 1.61538462rem !important;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();
    listenToPageUpdates();

})();
