// ==UserScript==
// @name         NAA / VLQ Flag Queue Helper
// @description  Inserts several sort options for the NAA / VLQ / Review LQ Disputed queues
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      3.13
// 
// @updateURL    https://github.com/samliew/SO-mod-userscripts/raw/master/NotAnAnswerFlagQueueHelper.user.js
// @downloadURL  https://github.com/samliew/SO-mod-userscripts/raw/master/NotAnAnswerFlagQueueHelper.user.js
//
// @include      */admin/dashboard?flagtype=postother*
// @include      */admin/dashboard?flagtype=postlowquality*
// @include      */admin/dashboard?flagtype=answernotananswer*
// @include      */admin/dashboard?flagtype=reviewlowqualitydisputedauto*
//
// @require      https://raw.githubusercontent.com/samliew/ajax-progress/master/jquery.ajaxProgress.js
// ==/UserScript==

(function() {
    'use strict';

    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;


    const fkey = StackExchange.options.user.fkey;
    const superusers = [ 584192 ];
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
                url: `https://${location.hostname}/messages/delete-moderator-messages/${pid}/${StackExchange.moderator.renderTimeTicks}?valid=true`,
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
    // Decline/dismiss all flags on post
    function declinePostFlags(pid) {
        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid == null) { reject(); return; }

            $.post({
                url: `https://${location.hostname}/messages/delete-moderator-messages/${pid}/${StackExchange.moderator.renderTimeTicks}?valid=false`,
                data: {
                    fkey: fkey,
                    comment: 2
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
        $('.js-flagged-post').on('click', '.js-helpful-purge', function() {
            const pid = Number($(this).parents('.js-flagged-post').attr('data-post-id')) || -1;
            dismissAllHelpful(pid, function() {
                purgeComments(pid);
                $('#flagged-'+pid).remove();
            });
        });
    }


    function togglePosts(filter) {
        console.log("Toggle by: " + filter);

        const filterFunction = function() {
            if(filter === 'magisch') return $(this).find('.js-post-flag-group:not(.js-cleared) a[href^="/users/5389107/"]').length > 0; // Magisch's userid on SO
            if(filter === 'ekad')    return $(this).find('.js-post-flag-group:not(.js-cleared) a[href^="/users/1905949/"]').length > 0; // ekad's userid on SO
            if(filter === 'deleted') return $(this).find('.deleted-answer').length > 0;

            if(filter === 'self-answer') {
                const postOwners = $(this).find('.post-owner');
                return postOwners.length == 2 ? postOwners.get(0).href === postOwners.get(1).href : postOwners.parent().text().includes('Self-answered');
            }

            const pid = this.dataset.postId;
            const postLink = this.dataset.postLink;
            return postLink.includes('/questions/' + pid) == (filter === 'q');
        }

        $posts.hide().filter(filterFunction).show();
    }


    function sortPosts(filter) {
        console.log("Sort by: " + filter);

        if(filter === 'flagger-rank' && $('#load-flagger-stats').length > 0) {
            $('#load-flagger-stats').click();
            setTimeout(() => sortPosts('flagger-rank'), 4000);
        }

        const getFlaggerWeights = function(el) {
            return el.filter('.elite').length * 12 +
                el.filter('.gold').length * 8 +
                el.filter('.silver').length * 6 +
                el.filter('.bronze').length * 3 +
                el.filter('.default').length * 2 +
                el.filter('.hmmm, .horrible, .wtf').length * 0.5;
        };

        // Get sort function based on selected filter
        let sortFunction;

        switch(filter) {

            case 'poster-rep':
                sortFunction = function(a, b) {
                    let aRep = Number($(a).find('.js-body-loader:last .reputation-score').text().replace(/[^\d.]/g, '')),
                        bRep = Number($(b).find('.js-body-loader:last .reputation-score').text().replace(/[^\d.]/g, ''));
                    if(aRep % 1 > 0) aRep *= 1000;
                    if(bRep % 1 > 0) bRep *= 1000;

                    if(aRep == bRep) return 0;
                    return (aRep > bRep) ? 1 : -1;
                };
                break;

            case 'date-posted':
                sortFunction = function(a, b) {
                    let aDate = new Date($(a).find('.js-body-loader:last .relativetime:not(.old):last').attr('title')),
                        bDate = new Date($(b).find('.js-body-loader:last .relativetime:not(.old):last').attr('title'));

                    if(aDate == bDate) return 0;
                    return (aDate > bDate) ? 1 : -1;
                };
                break;

            case 'delete-votes':
                sortFunction = function(a, b) {
                    let aDelv = Number(($(a).find('.js-delete-post').val() || "0").replace(/\D+/g, '')),
                        bDelv = Number(($(b).find('.js-delete-post').val() || "0").replace(/\D+/g, ''));

                    if(aDelv == bDelv) return 0;
                    return (aDelv < bDelv) ? 1 : -1;
                };
                break;

            case 'flag-count':
                sortFunction = function(a, b) {
                    let aFlags = $(a).find('.js-post-flag-group .bounty-indicator-tab').map((i,el) => Number(el.innerText)).get().reduce((a,c) => a + c),
                        bFlags = $(b).find('.js-post-flag-group .bounty-indicator-tab').map((i,el) => Number(el.innerText)).get().reduce((a,c) => a + c);

                    if(aFlags == bFlags) return 0;
                    return (aFlags < bFlags) ? 1 : -1;
                };
                break;

            case 'post-length':
                sortFunction = function(a, b) {
                    let aLen = $(a).find('.js-body-summary').text().length,
                        bLen = $(b).find('.js-body-summary').text().length;

                    if(aLen == bLen) return 0;
                    return (aLen > bLen) ? 1 : -1;
                };
                break;

            case 'flagger-rank':
                sortFunction = function(a, b) {
                    let aBadges = $(a).find('.flag-badge'),
                        bBadges = $(b).find('.flag-badge');

                    let aScore = getFlaggerWeights(aBadges),
                        bScore = getFlaggerWeights(bBadges);

                    if(aScore == bScore) return 0;
                    return (aScore < bScore) ? 1 : -1;
                };
                break;

            case 'has-modified':
                sortFunction = function(a, b) {
                    let aMod = $(a).find('.js-post-flag-group:not(.js-cleared) .s-badge[title^="post edited"]').length > 0;
                    return aMod ? -1 : 1;
                };
                break;

            case 'disputed-has-modified':
                sortFunction = function(a, b) {
                    let aMod = $(a).find('.js-post-flag-group .s-badge[title^="post edited"]').length > 0;
                    return aMod ? -1 : 1;
                };
                break;

            case 'post-undeleted':
                sortFunction = function(a, b) {
                    let aUndel = $(a).find('.js-post-flag-group:not(.js-cleared) .revision-comment').text().includes('Post was undeleted by the author');
                    return aUndel ? -1 : 1;
                };
                break;

            case 'post-good-delete':
                sortFunction = function(a, b) {
                    let aDelv = $(a).find('.js-post-flag-group:not(.js-cleared) .revision-comment').text().includes('Post has a good score but received delete votes');
                    return aDelv ? -1 : 1;
                };
                break;

            default:
                location.reload(true);
                return;
        }

        // Sort posts in-memory then reattach to container
        $posts.filter(function() {
            return $(this).find('.js-post-flag-group').is(':visible');
        }).sort(sortFunction).detach().appendTo($postsContainer);
    }


    function doPageLoad() {

        $postsContainer = $('.js-flagged-post').first().parent();
        $posts = $('.js-flagged-post');

        // Add class to post owners
        let postOwners = $('.js-flagged-post .js-body-loader').find('a[href^="/users/"]:first').addClass('post-owner');

        // Add post-modified class to edited badges
        $('.s-badge[title^="post edited"]').addClass('post-modified');


        const actionBtns = $('<div id="actionBtns"></div>');
        $('.js-flagged-post').first().parent().prepend(actionBtns);

        // If there are lots of flags and is superuser
        if($('.js-flagged-post').length > 3 && superusers.includes(StackExchange.options.user.userId)) {

            // Delete all posts left on page button
            $('<button class="btn-warning">Delete ALL</button>')
                .click(function() {
                    if(!confirm('Confirm Delete ALL?')) return false;

                    $(this).remove();
                    const visiblePosts = $('.js-delete-post:visible');
                    $('body').showAjaxProgress(visiblePosts.length, { position: 'fixed' });
                    visiblePosts.click();
                })
                .appendTo(actionBtns);

            // Decline all posts left on page button
            $('<button class="btn-warning">Decline ALL</button>')
                .click(function() {
                    if(!confirm('Confirm Decline ALL?')) return false;

                    $(this).remove();
                    const visiblePosts = $('.js-flagged-post:visible');
                    $('body').showAjaxProgress(visiblePosts.length, { position: 'fixed' });

                    visiblePosts.hide().each(function() {
                        declinePostFlags(this.dataset.postId);
                    });
                })
                .appendTo(actionBtns);
        }


        let $filterOpts = $(`<div id="flag-queue-tabs" class="tabs"></div>`);
        $('.js-flagged-post').first().parent().prepend($filterOpts);

        // If LQDisputed queue
        if(location.search.includes('flagtype=reviewlowqualitydisputedauto')) {

            initPurgeHelpful();

            // Insert sort options
            $filterOpts.append(`
<a data-filter="default" class="youarehere">Default</a>
<a data-filter="post-undeleted" title="Post was undeleted by the author">Undeleted by author</a>
<a data-filter="post-good-delete" title="Post has a good score but received delete votes">Del. Votes</a>
<a data-filter="disputed-has-modified" title="Changed since first flag">Modified</a>
`);
        }
        else {

            // Insert sort options
            $filterOpts.append(`
<a data-filter="default" class="youarehere">Reset</a>
<a data-filter="poster-rep" title="Poster Rep">Rep</a>
<a data-filter="date-posted" title="Date Posted">Date</a>
<a data-filter="post-length" title="Post Length">Len</a>
<a data-filter="delete-votes" title="Delete Votes" class="dno">*Delv</a>
<a data-filter="flag-count" title="Flag Count">Flags</a>
<a data-filter="flagger-rank" title="Flagger Rank (click to sort again after stats loaded)" id="flagger-rank" class="dno">Rank</a>
<a data-filter="has-modified" title="Edited posts after being flagged">Edited</a>
<a data-toggle="q" title="Show Questions only">Q</a>
<a data-toggle="a" title="Show Answers only">A</a>
<a data-toggle="self-answer" title="Self Answer">Self</a>
<a data-toggle="deleted" title="Show Deleted only">Del</a>
`);

            // Insert additional filter options
            if(superusers.includes(StackExchange.options.user.userId)) {

                $filterOpts.append(`
<a data-toggle="magisch" title="Show flags by "Magisch" only">Mg</a>
<a data-toggle="ekad" title="Show flags by "ekad" only">Ek</a>
`);
            }
        }

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

        // Insert 'skip' button to temporarily hide current post
        $('.js-flagged-post > td').append(`<a class="js-skip-post" title="skip (hide) this post" href="#">skip post</a>`);

        // Shorten additional actions descriptions after flag
        $('.js-flag-text > span:last-child').not('[title]').not('.js-abbrev').addClass('js-abbrev').html(function(i, v) {
            return v.replace(/(added (\d+) comments?)/, '<span title="$1">$2C</span>')
                .replace(/(Vote Up)/gi, '<span title="$1">VU</span>')
                .replace(/(Vote Down)/gi, '<span title="$1">VD</span>')
                .replace(/(Deletion)/gi, '<span title="voted to delete">Deletion</span>')
                .replace(/(Moderator Review)/gi, '<span title="a moderator took previous action in the mod queue">Mod</span>');
        });

        // On skip post link click
        $('.js-flagged-post').on('click', '.js-skip-post', function() {

            // Hide post immediately so we can move on
            $(this).parents('.js-flagged-post').remove();

            return false;
        });

        // Remove old "deemed invalid by" flags as they mess up sorting by flagger rank
        $('.js-flag-row.js-cleared').filter((i, el) => el.innerText.includes('deemed invalid by')).remove();

        // Show Magisch filter option if there are flags by this user
        if($posts.find('.js-post-flag-group:not(.js-cleared) a[href^="/users/5389107/"]').length > 0) {
            $filterOpts.find('[data-toggle="magisch"]').removeClass('dno');
        }

        // Selects default decline reason and focus submit button
        $('.js-resolve-action[data-type="decline"]').click(function(evt) {
            const flagOpts = $(this).closest('.js-post-flag-group, .js-post-flag-options');
            setTimeout(() => {
                const opt = flagOpts.find('input[name="dismiss-reason"][value="2"]:visible').get(0);
                if(opt) opt.click();
                const btn = flagOpts.find('.js-submit-btn').focus();
            }, 100);
        });
    }


    function listenToPageUpdates() {

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {

            // Actions taken on post
            if(settings.url.includes('/messages/delete-moderator-messages/') || // flags cleared
               (settings.url.includes('/flags/questions/') && settings.url.includes('/close/add')) || // closed
               settings.url.includes('/vote/10') || // deleted
               settings.url.includes('/convert-to-comment')) {

                // Remove post from mod queue
                const pid = settings.url.match(/\/(\d+)\//)[0].replace(/\//g, '');
                $(`.js-flagged-post[data-post-id="${pid}"]`).remove();
            }

            // Flagger stats loaded, allow sorting by
            if(settings.url.includes('/users/flag-summary/')) {
                $('#flag-queue-tabs #flagger-rank').removeClass('dno');
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
    margin: 20px 24px 10px;
}
#flag-queue-tabs:after {
    position: relative;
    top: -1px;
    border-bottom: 1px solid var(--black-075);
}
#flag-queue-tabs a {
    float: left;
    margin-right: 8px;
    padding: 12px 8px 14px;
    color: var(--black-400);
    line-height: 1;
    text-decoration: none;
    border-bottom: 2px solid transparent;
    transition: all .15s ease-in-out;
}
.extra-actions {
    padding-right: 10px;
    text-align: right;
}

#actionBtns {
    margin: 40px 24px 0px;
}
#actionBtns button {
    margin-right: 10px;
}

input.js-helpful-purge {
    border-color: var(--red-500) !important;
}
.star-off, .star-on {
    display: none;
}
.js-skip-post {
    position: absolute !important;
    bottom: 0;
    right: 0;
    margin-left: 20px;
    padding: 5px 8px;
    font-size: 1rem;
    background: var(--black-050);
    white-space: nowrap;
    opacity: 0.3;
}
.js-skip-post:hover {
    background: var(--blue-400);
    color: var(--white);
    opacity: 1;
}

/* General new mod interface stuff */
.js-admin-dashboard > div.grid--cell {
    position: relative; /* so the decline + delete option goes over the sidebar */
    z-index: 1;
}
.js-mod-history-container {
    margin: 10px 8px 15px !important;
    background: var(--black-025);
}
.js-flagged-post {
    margin-top: 10px !important;
    margin-bottom: 20px !important;
}
.visited-post {
    opacity: 0.7;
}
.js-flagged-post .bc-black-3 {
    border-color: var(--black-050) !important;
}
.js-post-flag-group > .grid--cell {
    padding: 8px 0;
}
.js-post-flag-group > .grid--cell.ta-right {
    padding: 18px 8px !important;
}
.js-post-flag-group > .grid--cell > div {
    padding: 2px 0;
}
.js-admin-dashboard span[title]:hover {
    cursor: help !important;
}

/* Specific to this userscript */
.s-badge.post-modified {
    color: var(--red-500);
    border-color: var(--red-500);
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
