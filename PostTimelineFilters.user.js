// ==UserScript==
// @name         Post Timeline Filters
// @description  Inserts several filter options for post timelines
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.2
//
// @include      */posts/*/timeline
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
                    return eType !== 'votes';
                };
                break;

            case 'hide-votes-comments':
                filterFn = function(i, el) {
                    let eType = $(el).find('span.event-type').text();
                    if(!eType || eType === '') eType = el.dataset.eventtype;
                    return eType !== 'votes' && eType !== 'comment' && eType !== 'comment flag' && eType !== 'flag';
                };
                break;

            case 'only-closereopen':
                filterFn = function(i, el) {
                    const eType = $(el).find('span.event-type').text();
                    return eType === 'close' || eType === 'reopen';
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

            case 'only-reviews':
                filterFn = function(i, el) {
                    const eType = $(el).find('span.event-type').text();
                    return eType === 'review';
                };
                break;

            case 'only-flags':
                filterFn = function(i, el) {
                    const eType = $(el).find('span.event-type').text();
                    return eType === 'flag';
                };
                break;

            case 'only-mod':
                filterFn = function(i, el) {
                    const eType = $(el).find('span.event-type').text();
                    return eType === 'flag' || $(el).hasClass('deleted-event') || $(el).hasClass('deleted-event-details');
                };
                break;

            default:
                $events.show();
                return;
        }

        $events.hide().filter(filterFn).show();
    }


    function doPageLoad() {

        // Pre-trim event type once
        $('span.event-type').text((i, v) => '' + v.trim());
        $('td.event-type').filter((i, el) => el.children.length === 0).text('');

        $eventsContainer = $('table.post-timeline');
        $events = $('.event-rows > tr').not('.separator').filter((i, el) => el.dataset.eventtype !== 'flag' && $(el).find('span.event-type').text() !== 'flag');

        const postType = $events.last().find('.event-verb').text().trim() === 'asked' ? 'question' : 'answer';
        const userType = StackExchange.options.user.isModerator ? 'mod' : 'normal';

        // Insert sort options
        const $filterOpts = $(`<div id="post-timeline-tabs" class="tabs posttype-${postType} usertype-${userType}">
                <a data-filter="all" class="youarehere">Show All</a>
                <a data-filter="hide-votes" id="newdefault">Hide Votes</a>
                <a data-filter="hide-votes-comments">Hide Votes & Comments</a>
                <a data-filter="only-comments">Comments</a>
                <a data-filter="only-answers" class="q-only">Answers</a>
                <a data-filter="only-closereopen" class="q-only mod-only">♦ Close & Reopen</a>
                <a data-filter="only-reviews" class="mod-only">♦ Reviews</a>
                <a data-filter="only-flags" class="mod-only">♦ Flags</a>
                <a data-filter="only-mod" class="mod-only">♦ All Mod-only</a>
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

/* Fix for broken comment flags display */
.post-timeline tr.dno[style^="display:block;"],
.post-timeline tr.dno[style^="display: block;"] {
    display: table-row !important;
}
.post-timeline tr.dno[data-eventtype="history"],
.post-timeline tr.dno[data-eventtype="history"] {
    display: none !important;
}
.post-timeline tr.dno[style^="display"],
.post-timeline tr.dno[style^="display"] {
    border-left: 2px double #f4a83d;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageLoad();

})();
