// ==UserScript==
// @name         Discussed on Meta
// @description  For questions, insert a link to search if it's discussed on Meta
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.1
//
// @include      https://stackoverflow.com/questions/*
// @include      https://serverfault.com/questions/*
// @include      https://superuser.com/questions/*
// @include      https://askubuntu.com/questions/*
// @include      https://mathoverflow.net/questions/*
// @include      https://*.stackexchange.com/questions/*
//
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    let metaDomain = 'meta.' + location.hostname;
    if(location.hostname.indexOf('stackexchange.com') >= 0) {
        metaDomain = location.hostname.split('.')[0] + '.meta.stackexchange.com';
    }


    // Simple wrapper for GM_xmlhttpRequest that returns a Promise
    // See http://tampermonkey.net/documentation.php#GM_xmlhttpRequest for options
    function ajaxPromise(options) {
        if(typeof options === 'string') {
            options = { url: options };
        }

        return new Promise(function(resolve, reject) {
            if(typeof options.url === 'undefined' || options.url == null) reject();

            options.method = options.method || 'GET';
            options.onload = function(response) {
                resolve(response.responseText);
            };
            options.onerror = function() {
                reject();
            };
            GM_xmlhttpRequest(options);
        });
    }


    function doPageload() {

        $('.question').each(function() {
            const post = $(this);
            const pid = $(this).data('questionid');
            const searchUrl = `https://${metaDomain}/search?tab=newest&q=url%3A${pid}`

            ajaxPromise(searchUrl)
                .then(function(data) {
                    const count = Number($('.results-header h2', data).text().replace(/[^\d]+/, ''));
                    const results = $('.search-results .search-result', data);
                    const lastMentioned = results.first().find('.relativetime').text();
                    const lastPermalink = results.first().find('a').first().attr('href');
                    if(count > 0) {
                        post.find('.postcell').append(`<div class="meta-mentioned" target="_blank"><a href="${searchUrl}" target="_blank">${count} posts</a> on Meta, last seen <a href="https://${metaDomain}${lastPermalink}" target="_blank">${lastMentioned}</a>.</div>`);
                    }
                });
        });
    }


    function appendStyles() {

        var styles = `
<style>
.meta-mentioned {
    padding: 10px 3px;
    color: #848d95;
    font-style: italic;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();

})();
