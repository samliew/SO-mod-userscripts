// ==UserScript==
// @name         Chat Transcripts By Default
// @description  Rewrites chat room links in comments to chat transcript, to avoid joining the room
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.1
//
// @include      https://*stackoverflow.com/questions/*
// @include      https://*serverfault.com/questions/*
// @include      https://*superuser.com/questions/*
// @include      https://*askubuntu.com/questions/*
// @include      https://*mathoverflow.net/questions/*
// @include      https://*.stackexchange.com/questions/*
//
// @include      https://*stackoverflow.com/admin/dashboard*
// @include      https://*serverfault.com/admin/dashboard*
// @include      https://*superuser.com/admin/dashboard*
// @include      https://*askubuntu.com/admin/dashboard*
// @include      https://*mathoverflow.net/admin/dashboard*
// @include      https://*.stackexchange.com/admin/dashboard*
// ==/UserScript==

(function() {
    'use strict';


    function convertChatLinksToTranscript() {

        // For each link in comments, where url matches chat + rooms
        $('.comment-copy a')
            .filter((i, el) => el.href.indexOf('chat.') >= 0 && el.href.indexOf('/rooms/') >= 0)
            .attr('href', (i, v) => v.replace('/rooms/', '/transcript/'))
            .attr({
                target: '_blank',
                title: 'Open chat transcript in a new window'
            })
            .html((i, v) => v + ' <em>(view transcript)</em>');
    }


    function listenToPageUpdates() {

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {

            // If comments have updated
            if(settings.url.indexOf('/comments') >= 0) convertChatLinksToTranscript();
        });
    }


    // On page load
    convertChatLinksToTranscript();
    listenToPageUpdates();

})();
