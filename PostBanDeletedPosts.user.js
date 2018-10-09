// ==UserScript==
// @name         Post Ban Deleted Posts
// @description  When user posts on SO Meta regarding a post ban, fetch and display deleted posts (must be mod) and provide easy way to copy the results into a comment
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.5.1
//
// @include      https://meta.stackoverflow.com/questions/*
//
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';


    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;


    const mainDomain = location.hostname.replace('meta.', '');
    const mainName = StackExchange.options.site.name.replace('Meta ', '');


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


    function toShortLink(str, newdomain = null) {

        // Match ids in string, prefixed with either a / or #
        const ids = str.match(/(?<=[/#])(\d+)/g);

        // Get last occurance of numeric id in string
        const pid = ids.pop();

        // Q (single id) or A (multiple ids)
        const qa = ids.length > 1 ? 'a' : 'q';

        // Use domain if set, otherwise use domain from string, fallback to relative path
        const baseDomain = newdomain ?
                  newdomain.replace(/\/$/, '') + '/' :
                  (str.match(/\/+([a-z]+\.)+[a-z]{2,3}\//) || ['/'])[0];

        // Format of short link on the Stack Exchange network
        return pid ? baseDomain + qa + '/' + pid : str;
    }


    function doPageload() {

        const post = $('#question');
        const postOwner = $('.post-signature:last a', post);

        // Is a deleted user, do nothing
        if(postOwner.length === 0) return;

        const username = $('.user-details', post).last().children().first().text().trim();
        const uid = postOwner.attr('href').match(/\d+/)[0];
        const hasDupeLink = $('.question-originals-of-duplicate a, .comments-list a', post).filter((i, el) => /(https:\/\/meta\.stackoverflow\.com)?\/q(uestions)?\/255583\/?.*/.test(el.href)).length > 0;
        const hasTags = $('a.post-tag', post).filter((i, el) => /post-ban/.test(el.innerText)).length > 0;

        // Not a post ban question
        if(!hasDupeLink && !hasTags) return;

        const qnsUrl = `https://${mainDomain}/search?q=user%3a${uid}%20is%3aquestion%20deleted%3a1%20score%3a..0&tab=newest`;
        const ansUrl = `https://${mainDomain}/search?q=user%3a${uid}%20is%3aanswer%20deleted%3a1%20score%3a..0&tab=newest`;

        ajaxPromise(qnsUrl)
            .then(function(data) {
                const count = Number($('.results-header h2, .fs-body3', data).first().text().replace(/[^\d]+/g, ''));
                if(count > 0) {
                    const results = $('.search-results .search-result, .js-search-results .search-result', data);
                    const stats = $(`
                        <div class="meta-mentioned" target="_blank">
                            ${username} has <a href="${qnsUrl}" target="_blank">${count} deleted questions</a> on ${mainName}
                            <span class="meta-mentions-toggle"></span>
                            <div class="meta-mentions"></div>
                        </div>`);
                    const hyperlinks = results.find('a').attr('href', (i,v) => 'https://' + mainDomain + v).attr('target', '_blank');
                    stats.insertAfter(post).find('.meta-mentions').append(results);

                    const hyperlinks2 = hyperlinks.filter('.question-hyperlink').map((i, el) => `[${1+i}](${toShortLink(el.href)})`).get();
                    const comment = $(`<textarea readonly="readonly">Deleted questions, score <= 0: (${hyperlinks2.join(' ')})</textarea>`);
                    comment.appendTo(stats);
                }
            });

        ajaxPromise(ansUrl)
            .then(function(data) {
                const count = Number($('.results-header h2, .fs-body3', data).first().text().replace(/[^\d]+/g, ''));
                if(count > 0) {
                    const results = $('.search-results .search-result, .js-search-results .search-result', data);
                    const stats = $(`
                        <div class="meta-mentioned" target="_blank">
                            ${username} has <a href="${ansUrl}" target="_blank">${count} deleted answers</a> on ${mainName}
                            <span class="meta-mentions-toggle"></span>
                            <div class="meta-mentions"></div>
                        </div>`);
                    const hyperlinks = results.find('a').attr('href', (i,v) => 'https://' + mainDomain + v).attr('target', '_blank');
                    stats.insertAfter(post).find('.meta-mentions').append(results);

                    const hyperlinks2 = hyperlinks.filter('.question-hyperlink').map((i, el) => `[${1+i}](${toShortLink(el.href)})`).get();
                    const comment = $(`<textarea readonly="readonly">Deleted answers, score <= 0: (${hyperlinks2.join(' ')})</textarea>`);
                    comment.appendTo(stats);
                }
            });
    }


    function appendStyles() {

        var styles = `
<style>
#question ~ .meta-mentioned {
    margin: 15px 0 0;
}
.meta-mentioned {
    position: relative;
    width: 100%;
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
    bottom: 0;
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
.meta-mentioned textarea {
    position: relative;
    display: block;
    width: calc(100% - 28px);
    height: 4.2em;
    margin-top: 10px;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();

})();
