// ==UserScript==
// @name         Fetch Vote Counts Again
// @description  Fetch vote counts for posts and enables you to click to fetch them again, even if you do not have sufficient rep. Also enables fetch vote counts on posts in mod flag queue.
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.2.2
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*stackapps.com/*
// @include      https://*.stackexchange.com/*
//
// @exclude      *chat.*
// ==/UserScript==


(function() {
    'use strict';


    function doPageLoad() {

        $('.vote-count-post').attr('title', 'View upvote and downvote totals');

        $('#content').on('click', '.vote-count-post', function() {
            const votesElem = $(this);
            let pid = $(this).parents('.answer').first().attr('data-answerid');
            if(pid == null) pid = $(this).parents('.question').attr('data-questionid');

            // If user does not have vote counts priv, use API to fetch vote counts
            if(StackExchange.options.user.rep < 1000) {
                $.get(`https://api.stackexchange.com/2.2/posts/${pid}?filter=!w-*Ytm8Gt4I)pS_ZBu&site=${location.hostname}`)
                    .done(function(data) {
                        votesElem.attr('title', `${+data.items[0].up_vote_count} up / ${+data.items[0].down_vote_count} down`)
                            .html(`<div style="color:green">${data.items[0].up_vote_count}</div><div class="vote-count-separator"></div><div style="color:maroon">${-data.items[0].down_vote_count}</div>`);
                    });
            }

            // User has vote count priv and already fetched vote counts once
            //   or on mod page (mods can't fetch vote counts)
            else if((votesElem.children().length > 1 && StackExchange.options.user.rep >= 1000) || $('body').hasClass('mod-page')) {
                $.get(`https://${location.hostname}/posts/${pid}/vote-counts`)
                    .done(function(data) {
                        votesElem.attr('title', `${+data.up} up / ${+data.down} down`)
                            .html(`<div style="color:green">${data.up}</div><div class="vote-count-separator"></div><div style="color:maroon">${data.down}</div>`);
                    });

                return false;
            }
        });
    }


    function appendStyles() {

        const styles = `
<style>
.vote-count-post {
    cursor: pointer !important;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageLoad();

})();
