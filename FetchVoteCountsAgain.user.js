// ==UserScript==
// @name         Fetch Vote Counts Again
// @description  Fetch vote counts for posts and enables you to click to fetch them again, even if you do not have sufficient rep
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0
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

        $('.vote').on('click', '.vote-count-post', function() {
            const votesElem = $(this);
            let pid = $(this).parents('.answer').first().attr('data-answerid');
            if(pid == null) pid = $('#question').attr('data-questionid');

            // If user has vote counts priv, ignore if empty
            if(votesElem.children().length <= 1 && StackExchange.options.user.rep > 1000) {
               console.log('ignoring first click');
               return;
            }

            $.get(`https://${location.hostname}/posts/${pid}/vote-counts`)
                .done(function(data) {
                    votesElem.css('cursor', 'pointer').attr('title', `${+data.up} up / ${+data.down} down`).html(`<div style="color:green">${data.up}</div><div class="vote-count-separator"></div><div style="color:maroon">${data.down}</div>`);
                });
        });
    }


    // On page load
    doPageLoad();

})();
