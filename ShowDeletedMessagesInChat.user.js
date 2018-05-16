// ==UserScript==
// @name         Show Deleted Messages in Chat
// @description  Show Deleted Messages in Chat and Transcripts. Works with NoOneboxesInChat userscript
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


    function getDeletedMessagesHistory(mid) {

        const msgDiv = $(`#message-${mid}`).find('.content');

        $.get(`/messages/${mid}/history`, function(data) {
            const message = $(`#message-${mid}`, data).first().find('.content');
            const deletedBy = $('b:contains("deleted")', data).closest('.monologue').find('.username').attr('target', '_blank').html();
            msgDiv.append(message.children());
            msgDiv.find('.deleted').first().html(`(deleted by ${deletedBy})`);
        });
    }


    function processNewDeletedMessages() {

        $('.deleted').not('.js-history-loaded').addClass('js-history-loaded')
            .parents('.message').addClass('cmmt-deleted').each(function() {
                const mid = this.id.replace('message-', '');
                getDeletedMessagesHistory(mid);
            });
    }


    function doPageload() {
        setInterval(processNewDeletedMessages, 5000);
    }


    function appendStyles() {

        const styles = `
<style>
.message.cmmt-deleted {
    background: #f4eaea;
    color: #990000;
}
.message.cmmt-deleted span.deleted {
    float: right;
    padding-left: 10px;
    font-style: italic;
}
.message.cmmt-deleted span.deleted a {
    color: #999;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();

})();
