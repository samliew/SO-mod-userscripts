// ==UserScript==
// @name         NAA / VLQ Flag Queue Helper
// @description  Inserts several sort options for the NAA / VLQ / Review LQ Disputed queues
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.2
//
// @include      */admin/dashboard?flagtype=lowquality*
// @include      */admin/dashboard?flagtype=answernotananswer*
// @include      */admin/dashboard?flagtype=reviewlowqualitydisputedauto*
// ==/UserScript==

(function() {
    'use strict';

    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;


    var $postsContainer, $posts;


    function sortPosts(filter) {
        console.log("Sort by: " + filter);

        // Get sort function based on selected filter
        let sortFunction;

        switch(filter) {

            case 'poster-rep':
                sortFunction = function(a, b) {
                    let aRep = Number($(a).find('.reputation-score').text().replace(/[^\d.]/g, '')),
                        bRep = Number($(b).find('.reputation-score').text().replace(/[^\d.]/g, ''));
                    if(aRep % 1 > 0) aRep *= 1000;
                    if(bRep % 1 > 0) bRep *= 1000;

                    if(aRep == bRep) return 0;
                    return (aRep > bRep) ? 1 : -1;
                };
                break;

            case 'self-answer':
                sortFunction = function(a, b) {
                    let aOwner = $(a).find('.mod-audit p:last').text();
                    return aOwner === '(answering own question)' ? -1 : 1;
                };
                break;

            case 'date-posted':
                sortFunction = function(a, b) {
                    let aDate = new Date($(a).find('.user-action-time .relativetime').attr('title')),
                        bDate = new Date($(b).find('.user-action-time .relativetime').attr('title'));

                    if(aDate == bDate) return 0;
                    return (aDate > bDate) ? 1 : -1;
                };
                break;

            case 'delete-votes':
                sortFunction = function(a, b) {
                    let aDelv = Number($(a).find('.delete-post').val().replace(/[^\d]/g, '')),
                        bDelv = Number($(b).find('.delete-post').val().replace(/[^\d]/g, ''));

                    if(aDelv == bDelv) return 0;
                    return (aDelv < bDelv) ? 1 : -1;
                };
                break;

            case 'flag-count':
                sortFunction = function(a, b) {
                    let aFlags = Number($(a).find('.dismiss-options .bounty-indicator-tab').text()),
                        bFlags = Number($(b).find('.dismiss-options .bounty-indicator-tab').text());

                    if(aFlags == bFlags) return 0;
                    return (aFlags < bFlags) ? 1 : -1;
                };
                break;

            case 'post-length':
                sortFunction = function(a, b) {
                    let aLen = $(a).find('.post-summary-body').text().length,
                        bLen = $(b).find('.post-summary-body').text().length;

                    if(aLen == bLen) return 0;
                    return (aLen > bLen) ? 1 : -1;
                };
                break;

            default:
                location.reload(true);
                return;
        }

        // Sort posts in-memory then reattach to container
        $posts.sort(sortFunction).detach().appendTo($postsContainer);
    }


    function doPageLoad() {

        $postsContainer = $('.flagged-post-row').first().parent();
        $posts = $('.flagged-post-row');

        // Insert sort options
        const $filterOpts = $(`<div id="flag-queue-tabs" class="tabs">
                <a data-filter="default" class="youarehere">Default</a>
                <a data-filter="self-answer">Self Answer</a>
                <a data-filter="poster-rep">Poster Rep</a>
                <a data-filter="date-posted">Date Posted</a>
                <a data-filter="delete-votes">Delete Votes</a>
                <a data-filter="flag-count">Flag Count</a>
                <a data-filter="post-length">Post Length</a>
            </div>`);
        $filterOpts.insertBefore('.flagged-posts.moderator');

        // Sort options event
        $('#flag-queue-tabs').on('click', 'a[data-filter]', function() {
            sortPosts(this.dataset.filter);

            // Update active tab highlight class
            $(this).addClass('youarehere').siblings().removeClass('youarehere');

            return false;
        });
    }


    function appendStyles() {

        const styles = `
<style>
.tabs:after,
#tabs:after {
    content: '';
    clear: both;
    display: block;
}
.tabs .youarehere,
#tabs .youarehere {
    position: relative;
    z-index: 1;
}
#flag-queue-tabs {
    float: none;
    margin: 20px 0 30px;
}
#flag-queue-tabs:after {
    position: relative;
    top: -1px;
    border-bottom: 1px solid #e4e6e8;
}
#flag-queue-tabs a {
    float: left;
    margin-right: 8px;
    padding: 12px 8px 14px;
    color: #848d95;
    line-height: 1;
    text-decoration: none;
    border-bottom: 2px solid transparent;
    transition: all .15s ease-in-out;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageLoad();

})();
