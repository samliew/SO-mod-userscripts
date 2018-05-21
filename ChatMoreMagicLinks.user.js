// ==UserScript==
// @name         Chat More Magic Links
// @description  Some magic links are not parsed in Stack Overflow Chat. This script parses and submit expanded magic links via an edit to your latest message.
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.1.1
//
// @include      https://chat.stackoverflow.com/rooms/*
// ==/UserScript==

(function() {
    'use strict';

    const mainDomain = 'https://' + location.hostname.replace('chat.', '');
    const _fkey = $('#fkey').val();
    const _uid = CHAT.CURRENT_USER_ID;


    function getMessageRawString(mid) {
        return new Promise(function(resolve, reject) {
            $.get(`/messages/${mid}/history`)
                .done(function(data) {
                    const str = $('.monologue', data).eq(1).find('.message-source').html().trim();
                    resolve(str);
                })
                .fail(reject);
        });
    }


    function convertMagicLinksInMessage(msg) {
        msg = msg.replace('[mcve]', `[Minimal, Complete, and Verifiable example](${mainDomain}/help/mcve)`);
        msg = msg.replace('[help]', `[help center](${mainDomain}/help)`);
        msg = msg.replace('[help/on-topic]', `[help center](${mainDomain}/help/on-topic)`);
        msg = msg.replace('[help/dont-ask]', `[help center](${mainDomain}/help/dont-ask)`);
        msg = msg.replace('[help/behavior]', `[help center](${mainDomain}/help/behavior)`);
        msg = msg.replace('[meta-help]', `[help center](${mainDomain}/help/whats-meta)`);
        msg = msg.replace('[tour]', `[tour](${mainDomain}/tour)`);
        msg = msg.replace('[chat]', `[Stack Overflow Chat](https://${location.hostname})`);
        return msg;
    }


    function checkLastMessage() {
        const lastMessage = $('.user-container.mine .message:not(.cmmt-deleted)').last();

        // If last message has already been handled, ignore
        if(lastMessage.hasClass('js-magiclinks')) return;
        lastMessage.addClass('js-magiclinks');

        // Required
        const mid = Number(lastMessage.attr('id').match(/\d+$/)[0]);
        if(isNaN(mid)) return;

        getMessageRawString(mid)
            .then(function(rawMessage) {
                const parsedMessage = convertMagicLinksInMessage(rawMessage);
                //console.log(mid, rawMessage, parsedMessage);

                if(rawMessage.length !== parsedMessage.length && rawMessage !== parsedMessage) {
                    updateMessage(mid, parsedMessage);
                }
            });
    }


    function updateMessage(mid, message) {

        $.post(`/messages/${mid}`,
        {
            fkey: _fkey,
            text: message
        });

        //console.log('updateMessage', mid, message);
    }


    function doPageload() {

        // Occasionally, check last message and parse it
        setInterval(checkLastMessage, 5000);
    }


    // On page load
    doPageload();

})();
