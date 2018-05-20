// ==UserScript==
// @name         Chat Transcripts By Default
// @description  Rewrites chat room links in comments to chat transcript, to avoid joining the room
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0.1
//
// @match        https://*stackoverflow.com/questions/*
// @match        https://*serverfault.com/questions/*
// @match        https://*superuser.com/questions/*
// @match        https://*askubuntu.com/questions/*
// @match        https://*mathoverflow.net/questions/*
// @match        https://*meta.stackexchange.com/questions/*
// ==/UserScript==

(function() {
    'use strict';


    function doPageLoad() {
        $('.comment-copy a').filter((i, el) => el.href.indexOf('chat.') >= 0 && el.href.indexOf('/rooms/') >= 0)
            .attr('href', (i, v) => v.replace('/rooms/', '/transcript/'))
            .attr({
                target: '_blank',
                title: 'Opens in a new window'
            });
    }


    // On page load
    doPageLoad();

})();
