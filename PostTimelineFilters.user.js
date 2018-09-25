// ==UserScript==
// @name         Post Timeline Filters
// @description  Inserts several filter options for post timelines
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.6.4
//
// @include      */posts*/timeline*
// ==/UserScript==

(function() {
    'use strict';

    let $eventsContainer, $events;


    function filterPosts(filter) {
        console.log(`Filter by: ${filter}`);

        // Get sort function based on selected filter
        let filterFn;
        switch(filter) {

            case 'hide-votes':
                filterFn = function(i, el) {
                    const eType = $(el).find('span.event-type').text();
                    return eType !== 'votes' && eType !== 'comment flag';
                };
                break;

            case 'hide-votes-comments':
                filterFn = function(i, el) {
                    const eType = $(el).find('span.event-type').text();
                    return eType !== 'votes' && eType !== 'comment' && eType !== 'comment flag' && el.dataset.eventtype !== 'comment';
                };
                break;

            case 'only-comments':
                filterFn = function(i, el) {
                    const eType = $(el).find('span.event-type').text();
                    return eType === 'comment';
                };
                break;

            case 'only-answers':
                filterFn = function(i, el) {
                    const eType = $(el).find('span.event-type').text();
                    return eType === 'answer';
                };
                break;

            case 'only-history':
                filterFn = function(i, el) {
                    const eType = $(el).find('span.event-type').text();
                    return eType === 'history' || el.dataset.eventtype === 'vote';
                };
                break;

            case 'only-closereopen':
                filterFn = function(i, el) {
                    const eType = $(el).find('span.event-type').text();
                    return eType === 'close' || eType === 'reopen';
                };
                break;

            case 'only-reviews':
                filterFn = function(i, el) {
                    const eType = $(el).find('span.event-type').text();
                    return eType === 'review' || el.dataset.eventtype === 'review';
                };
                break;

            case 'only-flags':
                filterFn = function(i, el) {
                    const eType = $(el).find('span.event-type').text();
                    return eType !== 'comment flag' && (eType === 'flag' || el.dataset.eventtype === 'flag');
                };
                break;

            case 'only-mod':
                filterFn = function(i, el) {
                    const eType = $(el).find('span.event-type').text();
                    return eType !== 'comment flag' && (eType === 'flag' || $(el).hasClass('deleted-event') || $(el).hasClass('deleted-event-details'));
                };
                break;

            default:
                filterFn = function(i, el) {
                    const eType = $(el).find('span.event-type').text();
                    return eType !== 'comment flag';
                };
                break;
        }

        $events.addClass('dno').filter(filterFn).removeClass('dno');

        // Once filtered, match related rows
        // e.g.: Hide that comment flags were cleared if the comment flag is currently hidden
        $('.deleted-event.dno').filter((i, el) => el.dataset.eventtype == 'flag').each(function(i, el) {
            const eid = el.dataset.eventid;
            const related = $events.filter('.deleted-event-details').filter((i, el) => el.dataset.eventid === eid);
            console.log(related, eid);
            related.addClass('dno');
        });
    }


    function doPageLoad() {

        // Pre-trim certain elements once on page load to make filtering less complicated
        $('span.event-type, td.event-verb span a').text((i, v) => '' + v.trim());
        $('td.event-type, td.event-verb span').filter((i, el) => el.children.length === 0).text((i, v) => '' + v.trim());

        // Rename "CommentNoLongerNeeded" event-verb to take up less space
        $('.event-verb span').filter((i, el) => el.innerText.indexOf('Comment') === 0).text((i, v) => v.replace(/^Comment/, ''));

        $eventsContainer = $('table.post-timeline');
        $events = $('.event-rows > tr').not('.separator'); // .filter((i, el) => el.dataset.eventtype !== 'flag' && $(el).find('span.event-type').text() !== 'flag')

        const userType = StackExchange.options.user.isModerator ? 'mod' : 'normal';
        const postType = $('td.event-verb span').filter((i, el) => el.innerText === 'asked' || el.innerText === 'answered').text() === 'asked' ? 'question' : 'answer';

        console.log(userType, postType);

        // Insert sort options
        const $filterOpts = $(`<div id="post-timeline-tabs" class="tabs posttype-${postType} usertype-${userType}">
                <a data-filter="all" class="youarehere">Show All</a>
                <a data-filter="hide-votes" id="newdefault">Hide Votes</a>
                <a data-filter="hide-votes-comments">Hide Votes & Comments</a>
                <a data-filter="only-comments">Comments</a>
                <a data-filter="only-reviews">Reviews</a>
                <a data-filter="only-answers" class="q-only">Answers</a>
                <a data-filter="only-history" title="Edits, Delete, Undelete">History</a>
                <a data-filter="only-closereopen" class="q-only">Close & Reopen</a>
                <a data-filter="only-flags" class="mod-only">♦ Flags</a>
                <a data-filter="only-mod" class="mod-only">♦ Mod-only</a>
            </div>`)
            .insertBefore($eventsContainer);

        // Filter options event
        $('#post-timeline-tabs').on('click', 'a[data-filter]', function() {
            if($(this).hasClass('youarehere')) return false;

            // Hide expanded flags
            $('.expander-arrow-small-show').click();

            // Filter posts based on selected filter
            filterPosts(this.dataset.filter);

            // Update active tab highlight class
            $(this).addClass('youarehere').siblings().removeClass('youarehere');

            return false;
        });

        // Hide votes (daily summary) is the new default
        $('a#newdefault').click();
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
#post-timeline-tabs {
    float: none;
    margin: 20px 0 30px;
}
#post-timeline-tabs:after {
    position: relative;
    top: -1px;
    border-bottom: 1px solid #e4e6e8;
}
#post-timeline-tabs a {
    float: left;
    margin-right: 8px;
    padding: 12px 8px 14px;
    color: #848d95;
    line-height: 1;
    text-decoration: none;
    border-bottom: 2px solid transparent;
    transition: all .15s ease-in-out;
}
#post-timeline-tabs a.youarehere {
    background: #f3f3f3;
}

.posttype-answer .q-only,
.usertype-normal .mod-only {
    display: none;
}

tr.separator {
    display: none !important;
}
tr.separator + tr {
    border-top: 1px solid #e4e6e8;
}

/* Increase cell min-widths to avoid jumping when comment flags are expanded */
.post-timeline .event-type {
    min-width: 90px !important;
}
.post-timeline .event-verb {
    min-width: 115px;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageLoad();

})();
