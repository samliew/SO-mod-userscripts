// ==UserScript==
// @name         NAA / VLQ Flag Queue Helper
// @description  Inserts several sort options for the NAA / VLQ / Review LQ Disputed queues
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.7
//
// @include      */admin/dashboard?flagtype=postother*
// @include      */admin/dashboard?flagtype=postlowquality*
// @include      */admin/dashboard?flagtype=answernotananswer*
// @include      */admin/dashboard?flagtype=reviewlowqualitydisputedauto*
// ==/UserScript==

(function() {
    'use strict';

    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;


    const fkey = StackExchange.options.user.fkey;
    var $postsContainer, $posts;


    function purgeComments(pid) {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid == null) { reject(); return; }

            $.post({
                url: `https://${location.hostname}/admin/posts/${pid}/delete-comments`,
                data: {
                    'mod-actions': 'delete-comments',
                    'target-post-id': '',
                    duration: 1,
                    fkey: fkey
                }
            })
            .done(function(data) {
                resolve();
            })
            .fail(reject);
        });
    }


    // Mark all flags on post as helpful
    function dismissAllHelpful(pid, comment = "") {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid == null) { reject(); return; }

            $.post({
                url: `https://${location.hostname}/messages/delete-moderator-messages/${pid}/${unsafeWindow.renderTimeTicks}?valid=true`,
                data: {
                    fkey: fkey,
                    comment: comment
                }
            })
            .done(function(data) {
                resolve();
            })
            .fail(reject);
        });
    }


    function initPurgeHelpful() {

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {

            // Post expanded
            if(settings.url.includes('/ajax-load?review=true') >= 0) {

                // Expand comments?
                $('.js-show-link.comments-link').click();

                // Insert "purge comments and mark helpful" button
                $('.post-detail').not('.js-has-helpful-purge').addClass('js-has-helpful-purge')
                    .append(`<div class="extra-actions"><input type="button" class="js-helpful-purge" value="purge comments and clear flags" /></div>`);
            }
        });

        // Button event
        $('.flagged-post-row').on('click', '.js-helpful-purge', function() {
            const pid = Number($(this).parents('.flagged-post-row').attr('data-post-id')) || -1;
            dismissAllHelpful(pid, function() {
                purgeComments(pid);
                $('#flagged-'+pid).remove();
            });
        });
    }


    function togglePosts(filter) {
        console.log("Toggle by: " + filter);

        const filterFunction = function() {
            if(filter === 'deleted') return $(this).find('.deleted-answer').length > 0;
            return $(this).find('.mod-audit-user-info .user-action-time').text().includes(filter == 'q' ? 'asked' : 'answered');
        };

        $posts.hide().filter(filterFunction).show();
    }


    function sortPosts(filter) {
        console.log("Sort by: " + filter);

        if(filter === 'flagger-rank') {
            $('#load-flagger-stats').click();
        }

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
                    let aDelv = Number(($(a).find('.delete-post').val() || "0").replace(/[^\d]/g, '')),
                        bDelv = Number(($(b).find('.delete-post').val() || "0").replace(/[^\d]/g, ''));

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

            case 'flagger-rank':
                sortFunction = function(a, b) {
                    let aBadges = $(a).find('.flag-badge'),
                        bBadges = $(b).find('.flag-badge');

                    let aScore = aBadges.filter('.elite').length * 10 + aBadges.filter('.gold').length * 8 + aBadges.filter('.silver').length * 6 + aBadges.filter('.bronze').length * 3 + aBadges.filter('.default').length * 2 + aBadges.filter('.hmmm, .horrible, .wtf').length * 0.5,
                        bScore = bBadges.filter('.elite').length * 10 + bBadges.filter('.gold').length * 8 + bBadges.filter('.silver').length * 6 + bBadges.filter('.bronze').length * 3 + bBadges.filter('.default').length * 2 + bBadges.filter('.hmmm, .horrible, .wtf').length * 0.5;

                    if(aScore == bScore) return 0;
                    return (aScore < bScore) ? 1 : -1;
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
                <a data-filter="self-answer" title="Self Answer">Self</a>
                <a data-filter="poster-rep" title="Poster Rep">Rep</a>
                <a data-filter="date-posted" title="Date Posted">Date</a>
                <a data-filter="post-length" title="Post Length">Length</a>
                <a data-filter="delete-votes" title="Delete Votes">Del. Votes</a>
                <a data-filter="flag-count" title="Flag Count">Flags</a>
                <a data-filter="flagger-rank" title="Flagger Rank (click to sort again after stats loaded)" class="dno">Flagger Rank</a>
                <a data-toggle="q" title="Show Questions only">Q</a>
                <a data-toggle="a" title="Show Answers only">A</a>
                <a data-toggle="deleted" title="Show Deleted only">D</a>
            </div>`);
        $filterOpts.insertBefore('.flagged-posts.moderator');

        // Sort options event
        $('#flag-queue-tabs').on('click', 'a[data-filter]', function() {
            sortPosts(this.dataset.filter);

            // Update active tab highlight class
            $(this).addClass('youarehere').siblings('[data-filter]').removeClass('youarehere');

            return false;
        });

        // Toggle options event
        $('#flag-queue-tabs').on('click', 'a[data-toggle]', function() {
            togglePosts(this.dataset.toggle);

            // Update active tab highlight class
            $(this).toggleClass('youarehere').siblings('[data-toggle]').removeClass('youarehere');

            return false;
        });

        // If LQDisputed queue
        if(location.search.includes('flagtype=reviewlowqualitydisputedauto')) {
            initPurgeHelpful();
        }
    }


    function listenToPageUpdates() {

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {

            // Flags dismissed or marked helpful, OR post deleted, OR answer converted to comment
            if(settings.url.includes('/messages/delete-moderator-messages/') || settings.url.includes('/vote/10') || settings.url.includes('/convert-to-comment')) {

                // Remove post from mod queue
                const pid = settings.url.match(/\/(\d+)\//)[0].replace(/\//g, '');
                console.log('Flags cleared: ' + pid);
                $('#flagged-'+pid).remove();
            }

            // Flagger stats loaded, allow sorting by
            if(settings.url.includes('/users/flag-summary/')) {
                $('#flag-queue-tabs a[data-filter="flagger-rank"]').removeClass('dno');
            }

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
.extra-actions {
    padding-right: 10px;
    text-align: right;
}
input.js-helpful-purge {
    border-color: red !important;
}
.star-off, .star-on {
    display: none;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageLoad();
    listenToPageUpdates();

})();
