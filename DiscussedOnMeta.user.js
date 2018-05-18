// ==UserScript==
// @name         Discussed on Meta
// @description  For Q&As, insert a link to search if it's discussed on Meta
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0
//
// @include      https://stackoverflow.com/questions/*
// @include      https://serverfault.com/questions/*
// @include      https://superuser.com/questions/*
// @include      https://askubuntu.com/questions/*
// @include      https://mathoverflow.net/questions/*
// @include      https://*.stackexchange.com/questions/*
// ==/UserScript==

(function() {
    'use strict';

    let metaUrl = 'meta.' + location.hostname;
    if(location.hostname.indexOf('stackexchange.com') >= 0) {
        metaUrl = location.hostname.split('.')[0] + '.meta.stackexchange.com';
    }


    function doPageload() {

        $('.question, .answer').each(function() {
            const pid = $(this).data('answerid') || $(this).data('questionid');
            $(this).find('.post-menu').append(`<a href="//${metaUrl}/search?q=url%3A${pid}" target="_blank">meta?</a>`);
        });
    }


    // On page load
    doPageload();

})();
