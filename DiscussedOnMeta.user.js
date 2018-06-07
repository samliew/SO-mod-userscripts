// ==UserScript==
// @name         Discussed on Meta
// @description  For questions and answers, displays info if it's discussed on Meta. On arrow mouseover, displays the Meta posts
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.9.1
//
// @include      https://stackoverflow.com/questions/*
// @include      https://serverfault.com/questions/*
// @include      https://superuser.com/questions/*
// @include      https://askubuntu.com/questions/*
// @include      https://mathoverflow.net/questions/*
// @include      https://*.stackexchange.com/questions/*
//
// @exclude      *meta.*
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

        $('.question, .answer').each(function() {
            const post = $(this);
            const pid = $(this).data('answerid') || $(this).data('questionid');

            // Ignore if too short, will generate lots of false positives
            if(pid <= 9999) return;

            const query = encodeURIComponent(`url://${location.hostname}/*/${pid}`);
            const searchUrl = `https://${metaDomain}/search?tab=newest&q=${query}`;

            ajaxPromise(searchUrl)
                .then(function(data) {
                    const count = Number($('.results-header h2, .fs-body3', data).first().text().replace(/[^\d]+/g, ''));
                    if(count > 0) {
                        const results = $('.search-results .search-result, .js-search-results .search-result', data);
                        const lastMentioned = results.first().find('.relativetime').text();
                        const lastPermalink = results.first().find('a').first().attr('href');
                        const metaPosts = $(`
                            <div class="meta-mentioned" target="_blank">
                                <a href="${searchUrl}" target="_blank">${count} posts</a> on Meta, last seen <a href="https://${metaDomain}${lastPermalink}" target="_blank">${lastMentioned}</a>
                                <span class="meta-mentions-toggle"></span>
                                <div class="meta-mentions"></div>
                            </div>`);
                        results.find('a').attr('href', (i,v) => 'https://' + metaDomain + v).attr('target', '_blank');
                        metaPosts.insertBefore(post).find('.meta-mentions').append(results);
                    }
                });

            // If we are on Stack Overflow, also check if post is asked on MSE
            if(location.hostname === 'stackoverflow.com') {

                const query = encodeURIComponent(`url://${location.hostname}/*/${pid}`);
                const searchUrl = `https://meta.stackexchange.com/search?tab=newest&q=${query}`;

                ajaxPromise(searchUrl)
                    .then(function(data) {
                        const count = Number($('.results-header h2, .fs-body3', data).first().text().replace(/[^\d]+/g, ''));
                        if(count > 0) {
                            const results = $('.search-results .search-result, .js-search-results .search-result', data);
                            const lastMentioned = results.first().find('.relativetime').text();
                            const lastPermalink = results.first().find('a').first().attr('href');
                            const metaPosts = $(`
                                <div class="meta-mentioned mse-mentioned" target="_blank">
                                    <a href="${searchUrl}" target="_blank">${count} posts</a> on Meta Stack Exchange, last seen <a href="https://${metaDomain}${lastPermalink}" target="_blank">${lastMentioned}</a>
                                    <span class="meta-mentions-toggle"></span>
                                    <div class="meta-mentions"></div>
                                </div>`);
                            results.find('a').attr('href', (i,v) => 'https://' + metaDomain + v).attr('target', '_blank');
                            metaPosts.insertBefore(post).find('.meta-mentions').append(results);
                        }
                    });
            }
        });
    }


    function appendStyles() {

        var styles = `
<style>
.meta-mentioned {
    position: relative;
    width: 100%;
    height: 38px;
    margin: 0 0 15px;
    padding: 10px 12px;
    background: #FFF8DC;
    border: 1px solid #E0DCBF;
    box-sizing: border-box;
    z-index: 1;
}
#answers .meta-mentioned {
    margin: 15px 0 0;
}
.meta-mentioned * {
    box-sizing: border-box;
}
.meta-mentioned:hover {
    z-index: 100;
}
.meta-mentions-toggle {
    position: absolute;
    top: 4px;
    right: 4px;
    display: block;
    width: 28px;
    height: 32px;
    cursor: pointer;
}
.meta-mentions-toggle:before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 4px;
    left: 0;
    background: #ddd;
    border-radius: 3px;
}
.meta-mentions-toggle:after {
    content: '';
    position: absolute;
    top: 10px;
    left: 8px;
    display: block;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 8px 6.5px 0 6.5px;
    border-color: #666666 transparent transparent transparent;
}
.meta-mentions-toggle:hover:before {
    background: #888;
}
.meta-mentions-toggle:hover:after {
    border-color: #FFF transparent transparent transparent;
}
.meta-mentions-toggle:hover + .meta-mentions,
.meta-mentions:hover {
    display: block;
}
.meta-mentions {
    display: none;
    position: absolute;
    top: 100%;
    max-width: calc(100% + 2px);
    width: calc(100% + 2px);
    min-height: 40px;
    margin-left: -13px;
    padding: 12px;
    background: #fff;
    border: 1px solid #ccc;
    box-shadow: 5px 5px 5px -3px rgba(0,0,0,0.10);
    z-index: 1;
}
.meta-mentions .question-summary {
    max-width: 100%;
    padding: 10px 0;
}
.meta-mentions .question-summary:last-child {
    border: none;
}
.meta-mentions .question-summary .result-link {
    margin-bottom: 6px;
    font-size: 14px;
    line-height: 1.4;
}
.meta-mentions .question-summary .excerpt,
.meta-mentions .question-summary .started,
.meta-mentions .question-summary .started * {
    line-height: 1.4;
    font-size: 11px !important;
}
.meta-mentions .question-summary .started {
    margin-right: 10px;
    text-align: right;
}
.meta-mentions .question-summary .summary {
    max-width: 600px;
}
.meta-mentions .question-summary .post-tag {
    font-size: 11px;
    pointer-events: none;
}
.meta-mentions .bounty-award-container {
    display: none;
}
.meta-mentions .status {
    margin: 0;
}
.meta-mentions .vote-count-post,
.meta-mentions .question-summary .stats strong {
    font-size: 15px;
    line-height: 0.8;
}
.meta-mentions .question-summary .started {
    margin-top: 0;
}
.meta-mentions .statscontainer {
    padding-top: 5px;
}
.meta-mentions .statscontainer .votes,
.meta-mentions .statscontainer .status {
    font-size: 10px;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();

})();
