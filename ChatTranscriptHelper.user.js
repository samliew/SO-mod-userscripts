// ==UserScript==
// @name         Chat Transcript Helper
// @description  Converts UTC timestamps to local time
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.1
//
// @include      https://chat.stackoverflow.com/transcript/*
// @include      https://chat.stackexchange.com/transcript/*
// @include      https://chat.meta.stackexchange.com/transcript/*
// ==/UserScript==

(function() {
    'use strict';

    const tzOffset = new Date().getTimezoneOffset();
    const tzHours = -(tzOffset / 60);
    const tzSymbol = (tzHours >= 0 ? '+' : '') + tzHours;

    function doPageload() {

        $('.timestamp').text(function(i, str) {
            // Split method used instead of substr, because it's in 12h format,
            //   alternatively regex could be used
            let h = Number(str.split(':')[0]);
            let m = str.split(':')[1].split(' ')[0];
            let a = str.split(' ')[1];
            if(a == 'PM') h += 12;
            else if(a == 'AM' && h == 12) h = 0;
            h += tzHours;
            if(h < 0) h += 24;
            else if(h >= 24) h %= 24;
            if(h.toString().length != 2) h = '0' + h;
            return `${h}:${m}`;
        });

        $('.msplab').text(function(i, str) {
            let h = Number(str.split(':')[0]) + tzHours;
            let m = str.split(':')[1];
            if(h < 0) h += 24;
            else if(h >= 24) h %= 24;
            if(h.toString().length != 2) h = '0' + h;
            return `${h}:${m}`;
        });

        $('.pager span.page-numbers').text(function(i, str) {
            let t1 = str.split(' - ')[0];
            let t2 = str.split(' - ')[1];
            let h1 = Number(t1.split(':')[0]) + tzHours;
            let h2 = Number(t2.split(':')[0]) + tzHours;
            if(h1 < 0) h1 += 24;
            else if(h1 >= 24) h1 %= 24;
            if(h2 < 0) h2 += 24;
            else if(h2 >= 24) h2 %= 24;
            if(h1.toString().length != 2) h1 = '0' + h1;
            if(h2.toString().length != 2) h2 = '0' + h2;
            return `${h1}:00 - ${h2}:00`;
        });

        $('.msg-small').text(`all times have been converted to local time (UTC${tzSymbol})`);
    }


    // On page load
    doPageload();

})();
