// ==UserScript==
// @name         Chat Transcript Helper
// @description  Converts UTC timestamps to local time
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.6
//
// @include      https://chat.stackoverflow.com/transcript/*
// @include      https://chat.stackexchange.com/transcript/*
// @include      https://chat.meta.stackexchange.com/transcript/*
// ==/UserScript==

(function() {
    'use strict';


    const isMob = document.body.classList.contains('mob');
    const tzOffset = new Date().getTimezoneOffset();
    const tzHours = -(tzOffset / 60);
    const tzSymbol = (tzHours >= 0 ? '+' : '') + tzHours;


    function doPageload() {

        $('.timestamp').each(function(i, elem) {
            const str = $(this).text();
            let h = Number(str.split(':')[0]);
            const m = str.split(':')[1].split(' ')[0];
            const a = str.split(' ')[1];
            if(a == 'PM' && h < 12) h += 12;
            else if(a == 'AM' && h == 12) h = 0;
            h += tzHours;
            if(h < 0) h += 24;
            else if(h >= 24) h %= 24;
            if(h.toString().length != 2) h = '0' + h;
            $(this).text(`${h}:${m}`).attr('data-orig-timestamp', str);
        });

        $('.msplab').text(function(i, str) {
            let h = Number(str.split(':')[0]) + tzHours;
            const m = str.split(':')[1];
            if(h < 0) h += 24;
            else if(h >= 24) h %= 24;
            if(h.toString().length != 2) h = '0' + h;
            return `${h}:${m}`;
        });

        $('.pager span.page-numbers').text(function(i, str) {
            const t1 = str.split(' - ')[0];
            const t2 = str.split(' - ')[1];

            let h1, h2;
            if(isMob) {
                h1 = Number(t1) + tzHours;
                h2 = Number(t2.replace('h', '')) + tzHours;
            }
            else {
                h1 = Number(t1.split(':')[0]) + tzHours;
                h2 = Number(t2.split(':')[0]) + tzHours;
            }

            if(h1 < 0) h1 += 24;
            else if(h1 >= 24) h1 %= 24;
            if(h2 < 0) h2 += 24;
            else if(h2 >= 24) h2 %= 24;

            if(isNaN(h1) || isNaN(h2)) debugger;

            if(h1.toString().length != 2) h1 = '0' + h1;
            if(h2.toString().length != 2) h2 = '0' + h2;
            return `${h1}:00 - ${h2}:00`;
        });

        $('.msg-small').text(`all times have been converted to local time (UTC${tzSymbol})`);
    }


    function highlightMessageReplies() {

        $('#transcript').on('mouseover', '.message', function() {
            $('.message').removeClass('reply-parent reply-child'); // reset

            // Replies to selected message
            const mid = this.id.split('-')[1];
            $('.reply-info').filter((i, el) => el.href.includes('#'+mid)).closest('.message').addClass('reply-child');

            // Replying to another message
            const pMid = ($(this).find('.reply-info').attr('href') || '#').split('#')[1];
            if(pMid !== '') {
                $('#message-' + pMid).addClass('reply-child');
            }
        });
    }


    // On page load
    doPageload();
    highlightMessageReplies();

})();
