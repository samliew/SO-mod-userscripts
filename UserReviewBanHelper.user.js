// ==UserScript==
// @name         User Review Ban Helper
// @description  Display users' prior review bans in review, Insert review ban button in user review ban history page, Load ban form for user if user ID passed via hash
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      5.1
//
// @include      */review/close*
// @include      */review/reopen*
// @include      */review/suggested-edits*
// @include      */review/helper*
// @include      */review/low-quality-posts*
// @include      */review/triage*
// @include      */review/first-posts*
// @include      */review/late-answers*
//
// @include      */users/history/*?type=User+has+been+banned+from+review
// @include      */users/*?tab=activity&sort=reviews*
// @include      */users/*?tab=activity&sort=suggestions*
//
// @include      */admin/review/failed-audits*
// @include      */admin/review/audits*
// @include      */admin/review/bans*
// @include      */admin/links
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

(function() {
    'use strict';


    // Moderator check
    if(!isModerator()) return;


    const superusers = [ 584192 ];
    const isSuperuser = () => superusers.includes(StackExchange.options.user.userId);

    const fkey = StackExchange.options.user.fkey;
    const messageCharLimit = 2000;

    const defaultBanMessage = `Your recent [reviews](https://${location.hostname}/users/current?tab=activity&sort=reviews) wasn't helpful. Please review the history of the posts and consider how choosing a different action would help achieve those outcomes more quickly.`;
    const permaBanMessage = `Due to your [poor review history](https://${location.hostname}/users/current?tab=activity&sort=reviews) as well as no signs of improvement after many review bans, you won't be able to use any of the review queues on the site any longer.`;

    // Use {POSTLINK} and {QUEUENAME} placeholders
    const cannedMessages = {
        current: '',
        triageQuestionReqEdits: `Your review on {POSTLINK} wasn't helpful. The "Requires Editing" option should only be used when other community users (*like you*) are able to edit/format an *already answerable question* into a better shape. If a question can be closed or can only be improved/clarified by the question asker, please use the "Unsalvageable" option instead. If in doubt always use the "Skip" option. For more information, see *[Getting banned from Triage reviews](https://meta.stackoverflow.com/q/389148)* and *[How does the Triage queue work?](https://meta.stackoverflow.com/q/295650)*.`,
        helperEditPoor: `Your review on {POSTLINK} wasn't helpful. If a question should be closed and you are unable to make the question on-topic in the "Help and Improvement" review, please use "Skip" instead of making trivial changes.`,
        postNaa: `You recently reviewed this post {POSTLINK}. Although it was posted as an answer, it clearly did not attempt to provide an answer to the question. You should have flagged it as "not an answer" so that it could be removed.`,
        postNaaEdited: `You recently edited this post {POSTLINK}. Please do not edit posts that should have been deleted. Use "edit" only when your edit salvages the post and makes it a valid answer.`,
        postNaaCommentOnly: `You recently reviewed this post {POSTLINK}. Although you correctly identified it as not being an answer, you chose to leave a comment. That did not help to solve the problem. You should have flagged it as "not an answer" so that it could be removed.`,
        postLinkOnly: `You recently reviewed this post {POSTLINK}. It contained nothing more than a link to an off-site resource, which does not meet our minimum standards for an answer (https://${location.hostname}/help/how-to-answer). You should have flagged it as "not an answer" or "very low quality" so that it could be removed. Please read [How should I get started reviewing Late Answers and First Posts?](https://meta.stackoverflow.com/q/288505)`,
        postEditPoor: `You approved poor edits to this post {POSTLINK}, which should have been rejected. Please pay more attention to each review in future.`,
        postEditPlagiarism: `You reviewed this post {POSTLINK} incorrectly. The suggested edit was for the most part, plagiarism, and should have been rejected. Please pay more attention to each review in future.`,
        postSpam: `You recently reviewed this spam post {POSTLINK} without flagging it as spam. Please pay more attention to each review in future.`,
        recentGeneral: defaultBanMessage,
        noLongerWelcome: permaBanMessage,
    };


    const reloadPage = () => location.reload(true);
    const getQueryParam = key => new URLSearchParams(window.location.search).get(key);
    const pluralize = s => s.length != 1 ? 's' : '';
    const dateToSeDateFormat = d => d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, 'Z');

    // For review ban message
    let textarea;
    let params, uid, posts, reviewAction, allposts = '', posttext = '';


    // Review unban user
    function reviewUnban(uid) {
        return new Promise(function(resolve, reject) {
            if(typeof uid === 'undefined' || uid === null) { reject(); return; }

            $.post({
                url: `https://${location.hostname}/admin/review/unsuspend-user`,
                data: {
                    'userId': uid,
                    'fkey': fkey
                }
            })
            .done(resolve)
            .fail(reject);
        });
    }
    // Review ban user
    function reviewBan(uid, duration = 4, message = defaultBanMessage) {
        return new Promise(function(resolve, reject) {
            if(typeof uid === 'undefined' || uid === null) { reject(); return; }

            $.post({
                url: `https://${location.hostname}/admin/review/suspend-user`,
                data: {
                    'userId': uid,
                    'explanation': message,
                    'reviewSuspensionChoice': 'on',
                    'reviewSuspensionDays': duration,
                    'fkey': fkey
                }
            })
            .done(resolve)
            .fail(reject);
        });
    }
    function reviewPermaBan(uid) {
        return new Promise(function(resolve, reject) {
            reviewBan(uid, 365, permaBanMessage)
                .then(resolve)
                .catch(reject);
        });
    }


    // Find out if user is currently review banned and returns relative days to ban end date
    // X >  0 : review banned for X more days
    // X <= 0 : X days since ban
    function daysReviewBanned(banStart, banDuration) {
        let banEndDatetime = new Date(banStart);

        // Simple validation
        if(isNaN(banDuration) || banDuration <= 0) return false;
        if(banEndDatetime.toString() == "Invalid Date") return false;

        // Calculate ban end
        banEndDatetime.setDate(banEndDatetime.getDate() + banDuration);

        // Return difference (in days) to current time
        return (banEndDatetime - Date.now()) / 86400000;
    }
    function isReviewBanned(banStart, banDuration) {
        return daysReviewBanned(banStart, banDuration) > 0;
    }


    function initCannedMessages() {

        const cans = $(`<div id="canned-messages"></div>`).on('click', 'a', function(evt) {
            textarea.val(this.dataset.message);
            $('.js-lookup-result input:submit').focus(); // focus submit button
            return false;
        }).appendTo('.message-wrapper');

        Object.keys(cannedMessages).forEach(function(v) {
            let queuename = '';

            if(posts && posts.length == 1) {
                queuename = posts[0].split('/')[0] + ' ';
                allposts = allposts.replace(/(\n|\r)+/g, '');
            }

            let msg = cannedMessages[v].replace(/"/g, '&quot;').replace(/{POSTLINK}/g, allposts).replace(/{QUEUENAME}\s?/g, queuename);

            if(posts && posts.length == 1) {
                msg = msg.replace(/(\(\n|\n\))/g, '');
            }

            cans.append(`<a data-message="${msg}">${v}</a>`);
        });
    }


    // Completely new page
    function initFailedAuditsByUserPage() {

        document.title = 'Failed Review Audits - ' + StackExchange.options.site.name;

        const queues = [
          ['Close Review', 'close'],
          ['First Posts',  'first-posts'],
          ['Late Answers', 'late-answers'],
          ['Low Quality Posts', 'low-quality-posts'],
          ['Reopen Votes', 'reopen'],
          ['Suggested Edits', 'suggested-edits'],
          ['Triage', 'triage'],
        ];

        // Valid values: last30days, last14days, last7days, last2days, today
        const dateRange = 'last30days';

        const cont = $('#content').addClass('failed-audits-page')
            .empty().prepend(`<h1 class="bb bc-black-5 py8 s-subheader">Failed Audits (${dateRange.replace(/(\d+)/, ' $1 ')})</h1>`);

        cont.append(`
<table class="history-table-filter"><tr>
  <td><label class="d-block pt6"><input type="checkbox" id="js-toggle-date-format" /> toggle format</label></td>
  <td><input type="text" id="js-filter-user" class="s-input s-input__sm w100" placeholder="username or userid" /></td>
  <td></td>
  <td></td>
</tr></table>
`)
        .on('change', '#js-toggle-date-format', function() {
            cont.toggleClass('js-absolute-dates');
        })
        .on('change', '#js-filter-user', function() {
            const rows = $('.history-table tr');
            const val = this.value.toLowerCase().trim();
            const userid = Number(val);
            if(!isNaN(userid)) {
                rows.hide().filter(function() {
                    return $(this).find('a').attr('href').includes(userid);
                }).show();
            }
            else if(val.length > 0) {
                rows.hide().filter(function() {
                    return $(this).find('a').text().toLowerCase().includes(val);
                }).show();
            }
            else {
                rows.show();
            }
        });

        const filterField = $('#js-filter-user');

        queues.forEach(q => {
            cont.append(`<h3 class="s-subheader mt32 py8 bb bc-black-5"><a href="https://${location.hostname}/admin/review/audits?queue=${q[1]}&daterange=${dateRange}&failuresOnly=True" target="_blank">${q[0]}</a></h3>`);

            let numPages = 3;
            if(q[1] === 'first-posts') numPages = 6;

            for(let i = 1; i <= numPages; i++) {
                $(`<div id="${q[1]}-review-${i}"><i>loading...</i></div>`).appendTo(cont).load(`https://${location.hostname}/admin/review/audits?queue=${q[1]}&daterange=${dateRange}&failuresOnly=True&page=${i} #content .history-table`, function() {
                    filterField.trigger('change');
                });
            }
        });

        // Once on page load, read user querystring to filter results
        const uid = Number(getQueryParam('uid'));
        filterField.val(uid);
    }


    /* For review pages */
    function getUsersInfo() {

        // If triage queue
        if(location.pathname.includes('/review/triage/')) {

            // Sort by action
            $('.js-review-instructions .review-results').detach().sort(function(a, b) {
                const ax = $(a).children('b').last().text();
                const bx = $(b).children('b').last().text();
                return ax < bx ? -1 : 1;
            }).appendTo('.js-review-instructions');

            // Add review-ban button for users who selected "Looks OK"
            $(`<button class="mt16">Review ban "Looks OK"</button>`).appendTo('.reviewable-post-stats')
                .click(function() {
                $('.review-results').filter((i, el) => el.innerText.includes('Looks OK')).find('.reviewban-link').each((i, el) => el.click());
                $(this).remove();
            });

            // Add review-ban button for users who selected "Requires Editing"
            $(`<button class="mt16">Review ban "Requires Editing"</button>`).appendTo('.reviewable-post-stats')
                .click(function() {
                $('.review-results').filter((i, el) => el.innerText.includes('Requires Editing')).find('.reviewban-link').each((i, el) => el.click());
                $(this).remove();
                unsafeWindow.top.close();
            });

            // Add review ban all button
            $(`<button class="mt16">Review ban ALL</button>`).appendTo('.reviewable-post-stats')
                .click(function() {
                $(this).siblings('button').click();
                $(this).remove();
                unsafeWindow.top.close();
            });
        }

        // Get users review history
        $('.js-review-instructions').find('a[href^="/users/"]').each(function() {

            // Ignore mods
            var modFlair = $(this).next('.mod-flair');
            if(modFlair.length) return;

            var userlink = $(this);
            var uid = $(this).attr('href').match(/\d+/)[0];
            var url = '/users/history/' + uid + '?type=User+has+been+banned+from+review';
            var action = $(this).nextAll('b').last().text().toLowerCase().trim().replace(/\W+/g, '-');
            var banUrl = `/admin/review/bans#${uid}|${location.pathname}|${action}`;

            // Add ban link
            $(`<a class="reviewban-link" href="${banUrl}" title="Ban user from reviews" target="_blank">X</a>`)
                .insertBefore(userlink);

            // Skip fetching history for supermods since we will already be fetching that while attempting to ban
            if(!isSuperuser()) {

                // Grab user's history
                $.ajax({
                    url: url,
                    xhr: jQueryXhrOverride,
                    success: function(data) {

                        // Parse user history page
                        var numBans = 0;
                        var summary = $('#summary', data);
                        var numBansLink = summary.find('a[href="?type=User+has+been+suspended+from+reviewing"]').get(0);
                        if(typeof numBansLink !== 'undefined') {
                            numBans = Number(numBansLink.nextSibling.nodeValue.match(/\d+/)[0]);
                        }

                        console.log("Review suspensions for " + uid, numBans);

                        // Add annotation count
                        $(`<a class="reviewban-count ${numBans > 2 ? 'warning' : ''}" href="${url}" title="${numBans} prior review suspensions" target="_blank">${numBans}</a>`)
                            .insertBefore(userlink);
                    }
                });
            }
        });
    }


    /* For review ban page */
    function getUserReviewBanHistory(uid) {

        const url = `https://${location.hostname}/users/history/${uid}?type=User+has+been+suspended+from+reviewing`;

        // Change window/tab title so we can visually see the progress
        document.title = '3.HISTORY';

        // Grab user's history page
        $.get(url).then(function(data) {

            // Change window/tab title so we can visually see the progress
            document.title = '4.READY';

            // Parse user history page
            let numBans = 0;
            const summary = $('#summary', data);
            const eventRows = $('#user-history tbody tr', data);

            // Get number from filter menu, because user might have been banned more times and events will overflow to next page
            const numBansLink = summary.find('a[href="?type=User+has+been+suspended+from+reviewing"]').get(0);
            if(typeof numBansLink !== 'undefined') {
                numBans = Number(numBansLink.nextSibling.nodeValue.match(/\d+/)[0]);
            }

            // Add annotation count
            const banCountDisplay = $(`<div class="reviewban-history-summary">User was previously review suspended <b><a href="${url}" title="view history" target="_blank">${numBans} time${pluralize(numBans)}</a></b>. </div>`)
                .insertAfter('.message-wrapper');
            banCountDisplay.nextAll().wrapAll('<div class="grid history-duration-wrapper"><div class="grid--cell4 duration-wrapper"></div></div>');

            const pastReviewMessages = $('<div class="grid--cell12 reviewban-history"></div>').appendTo('.history-duration-wrapper');

            // Change user profile link to directly link to user reviews tab page
            $('.duration-wrapper a').first().attr('href', (i, v) => v + '?tab=activity&sort=reviews').attr('title', 'view other recent reviews by user');

            // Default to first radio button
            $('.duration-radio-group input').first().click();

            // Get hist items from filtered page
            const histItems = eventRows.map(function(i, el) {
                const event = Object.assign({}, null); // plain object
                let startDate = new Date($(el).find('.relativetime').attr('title'));
                let endDate = new Date(startDate);
                event.begin = startDate;
                event.reason = el.children[2].innerHTML.split('duration =')[0];
                event.mod = el.children[2].innerHTML.split(/duration = \d+ days?/)[1].replace(/\s*by\s*/, '');
                event.duration = Number(el.children[2].innerText.match(/\= (\d+) day/m)[1]);
                // calculate end datetime
                endDate.setDate(endDate.getDate() + event.duration);
                event.end = endDate;
                return event;
            }).get();

            // Append hist items to pastReviewMessages
            histItems.forEach(function(event) {
                pastReviewMessages.append(`<div class="item">
  <div class="item-meta">
    <div><span class="relativetime" title="${dateToSeDateFormat(event.begin)}">${event.begin.toDateString() + ' ' + event.begin.toLocaleTimeString()}</span></div>
    <div>${event.duration} days</div>
    <div><span class="relativetime" title="${dateToSeDateFormat(event.end)}">${event.end.toDateString() + ' ' + event.end.toLocaleTimeString()}</span></div>
    <div>${event.mod}</div>
  </div>
  <div class="item-reason">${event.reason}</div>
</div>`);
            });

            // No items
            if(histItems.length == 0) {
                pastReviewMessages.append('<em>(none)</em>');
            }
            else {
                pastReviewMessages.find('a').attr('target', '_blank'); // links open in new tab/window
                StackExchange.realtime.updateRelativeDates();
            }

            // Add currently/recently banned indicator if history found
            let isCurrentlyBanned = false;
            let isRecentlyBanned = false;
            let newDuration = null, recommendedDuration = null;
            let daysago = new Date();
            daysago.setDate(daysago.getDate() - 60);
            eventRows.eq(0).each(function() {
                const datetime = new Date($(this).find('.relativetime').attr('title'));
                const duration = Number(this.innerText.match(/\= \d+ days/)[0].replace(/\D+/g, ''));
                let banEndDatetime = new Date(datetime);
                banEndDatetime.setDate(banEndDatetime.getDate() + duration);
                const currtext = banEndDatetime > Date.now() ? 'Current' : 'Recent';

                newDuration = duration;
                recommendedDuration = duration;

                // Recent, double duration
                if(banEndDatetime > daysago) {
                    isRecentlyBanned = true;

                    $(`<span class="reviewban-ending ${currtext == 'current' ? 'current' : 'recent'}"><span class="type" title="recommended to double the previous ban duration">${currtext}ly</span> review suspended for <b>${duration} days</b> until <span class="relativetime" title="${dateToSeDateFormat(banEndDatetime)}">${banEndDatetime}</span>.</span>`)
                        .appendTo(banCountDisplay);
                    newDuration *= 2;

                    // Also add warning to the submit button if currently banned
                    if(currtext == 'Current') {
                        isCurrentlyBanned = true;
                        $('.js-lookup-result input:submit').addClass('s-btn__danger s-btn__filled js-ban-again').val((i, v) => v + ' again');
                    }
                }
                // Halve duration
                else {
                    $(`<span class="reviewban-ending">Last review suspended for <b>${duration} days</b> until <span class="relativetime" title="${dateToSeDateFormat(banEndDatetime)}">${banEndDatetime}</span>.</span>`)
                        .appendTo(banCountDisplay);
                    newDuration = Math.ceil(duration / 2);
                }
                console.log('Calculated ban duration:', newDuration);

                // Select recommended duration radio from available options
                if(newDuration < 2) newDuration = 2; // min duration
                if(newDuration > 365) newDuration = 365; // max duration
                $('.duration-radio-group input').each(function() {
                    if(Number(this.value) <= newDuration + (newDuration/7)) {
                        this.click();
                        recommendedDuration = Number(this.value);
                    }
                });
                console.log('Closest ban duration option:', recommendedDuration);
            });

            // If sam is review banning users in Triage
            if(isSuperuser() && location.hash.includes('/triage')) {

                // If reviewAction is "looks-ok", and user is currently banned for >= 64, ignore (close tab)
                if(reviewAction == 'looks-ok' && isCurrentlyBanned && recommendedDuration >= 64) {
                    unsafeWindow.top.close();
                }
                // If recommended is up to 32, auto submit form
                else if(recommendedDuration == null || recommendedDuration <= 32) {

                    // Change window/tab title so we can visually see which has been auto-processed
                    document.title = '5.AUTOBAN';

                    $('.js-lookup-result form').submit();
                }
            }

            // If is currently banned, add confirmation prompt when trying to ban user
            if(!isSuperuser() && isCurrentlyBanned) {
                $('.js-lookup-result form').submit(function() {
                    return confirm('User is currently review suspended!\n\nAre you sure you want to replace with a new ban?');
                });
            }

        });
    }


    function doPageload() {

        // If on /admin/review/bans/historical, linkify ban count
        if(location.pathname.includes('/admin/review/bans/historical')) {

            // Linkify historical ban counts to user review ban history page
            const table = $('.sorter').attr('id', 'banned-users-table');
            table.find('tbody tr').each(function() {
                const userlink = $(this).find('td a').first();
                const uid = userlink.attr('href').match(/\/(\d+)\//)[1];
                $(this).children('td').last().html(function(i, v) {
                    return `<a href="/users/history/${uid}?type=User+has+been+suspended+from+reviewing" target="_blank" title="see review ban history">${v}</a>`;
                });
            });
        }

        // Linkify ban counts on ban page and historical page tables
        // /admin/review/bans  &  /admin/review/bans/historical
        else if(location.pathname.includes('/admin/review/bans')) {

            const table = $('.sorter').attr('id', 'banned-users-table');

            // If superuser,
            if(isSuperuser()) {
                // close tab/window if a user has just been banned
                if(location.pathname == '/admin/review/bans' && history.length >= 2 && location.hash == '') {
                    window.top.close();
                }
                // remove ban table to save browser memory
                if(location.hash != '') {
                    table.remove();
                }
            }

            // Load ban form for user if passed via querystring
            params = location.hash.substr(1).split('|');
            if(params) {
                uid = Number(params[0]) || null;

                if(params.length >= 2) {

                    // Change window/tab title so we can visually see the progress
                    document.title = '1.INIT';

                    posts = params[1].split(';').map(v => v.replace(/\/?review\//, ''));
                    reviewAction = params[2] || null;

                    // Remove similar consecutive review types from urls
                    // (possibly no longer needed as we can increase max length)
                    //var prevType = null;
                    //posts = posts.map(v => {
                    //    if(v.includes(prevType + '/')) v = v.replace(/\D+/g, '');
                    //    else prevType = v.split('/')[0];
                    //    return v;
                    //});

                    console.log(posts, reviewAction);

                    // Fit as many URLs as possible into message
                    var i = posts.length;
                    do {
                        posttext = posts.slice(0, i--).map(v => `\n[${v}](/review/${v})`).join(", ") + '\n';
                    }
                    while(i > 1 && 48 + location.hostname.length + posttext.length > messageCharLimit);

                    // Save all posts for canned messages
                    allposts = posts.map(v => `\n[${v}](/review/${v})`).join(", ") + '\n';
                }

                // Validation
                if(uid && !isNaN(uid)) {

                    // Insert UID
                    $('.js-user-to-suspend').val(uid);

                    // Submit lookup
                    setTimeout(() => {

                        // Change window/tab title so we can visually see the progress
                        document.title = '2.LOOKUP';

                        $('.js-lookup').click();
                    }, 1500);
                }
            }


            // Linkify ban counts to user review ban history page
            table.find('tbody tr').each(function() {
                const userlink = $(this).find('a').first();
                const uid = userlink.attr('data-uid') || userlink.attr('href').match(/\/(\d+)\//)[1];
                $(this).children('td').eq(4).html(function(i, v) {
                    return `<a href="/users/history/${uid}?type=User+has+been+banned+from+review" target="_blank" title="see review suspension history">${v}</a>`;
                });
            });

            // Fix table date sorting
            setTimeout(() => {
                if($('#banned-users-table').length == 0) return;
                $.tablesorter.destroy('.sorter', true, function() {

                    // Add classes to date column headers
                    const headers = $('thead th', table);
                    headers.slice(1,3).addClass('sorter-miniDate').removeClass('headerSortDown');
                    headers.eq(3).addClass('sorter-false');
                    headers.last().addClass('sorter-false');

                    // Add duration column header
                    headers.eq(2).after(`<th class="tablesorter-header tablesorter-headerUnSorted">Duration</th>`);

                    // Reinit sorter
                    $('.sorter').tablesorter();

                    // Default sort header
                    headers.eq(1).addClass('tablesorter-headerDesc');
                });
            }, 2000);

            // Add duration column to the other rows
            table.find('tbody tr').each(function() {
                const cells = $(this).children('td');
                let startDate = new Date(cells.eq(1).find('.relativetime').attr('title')).getTime();
                let endDate = new Date(cells.eq(2).find('.relativetime').attr('title')).getTime();
                let diffDays = (endDate - startDate) / 86400000;
                cells.eq(2).after(`<td>${diffDays}</td>`);
            });

            // Option to renew permanent bans
            $('.reason', table).filter((i, el) => el.innerText.includes('no longer welcome') || el.innerText.includes('no signs') || el.innerText.includes('any longer')).each(function() {
                const p = $(this).parent();
                const l = p.find('a.js-unsuspend').clone().appendTo(this);
                l.removeClass('js-unsuspend').addClass('js-suspend-again').attr('title', (i, s) => s.replace('Unsuspend', 'reapply another yearly review suspension to').replace(' from reviewing', '')).text((i, s) => s.replace('js-unsuspend', 'js-suspend-again'));
            });
            table.on('click', '.js-suspend-again', function() {
                if(confirm("Apply another year's suspension to this user?")) {
                    const uid = this.dataset.userid;
                    reviewUnban(uid).then(() => reviewPermaBan(uid).then(reloadPage));
                }
                return false;
            });

            // UI classes
            $('.js-user-to-suspend').addClass('s-input');
            $('.js-lookup').addClass('s-btn');

            // Ban user form submission
            $('.js-lookup-result').on('submit', 'form', function() {

                // No duration selected, alert and prevent
                if($('input[name="reviewSuspensionChoice"]:checked').length == 0) {
                    $(this).addClass('validation-error');
                    return false;
                }

                // Disable button to prevent double submission
                $('.js-lookup-result input:submit').prop('disabled', true);

                // If Samuel
                if(isSuperuser()) {

                    // Perform an ajax submit instead and then immediately close the window for efficiency
                    $.ajax({
                        type : 'POST',
                        url : this.action,
                        data : $(this).serialize(),
                        beforeSend: function() {
                            // Max timeout before closing window
                            setTimeout(function() {
                                unsafeWindow.top.close();
                            }, 5000);
                        }
                    }).done(function() {
                        unsafeWindow.top.close();
                    });
                    return false;
                }

                if(document.title.includes('BAN')) {

                    // Change window/tab title so we can visually see the progress
                    document.title = '>> BANNING';
                }
            });


            // Add summary of currently review-banned users if we are not review banning users
            if(location.hash == '' && location.search == '') {
                const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
                const weekAhead = Date.now() + (7 * 24 * 60 * 60 * 1000);

                const rows = table.find('tbody tr');
                const reqEditing = rows.filter((i, el) => el.children[4].innerText.includes('Requires Editing')).length;
                const forTriage = rows.filter((i, el) => el.children[4].innerText.toLowerCase().includes('triage')).length;
                const auditFailures = rows.filter((i, el) => el.children[4].innerText.includes('You have made too many incorrect reviews.')).length;
                const hundred = rows.filter((i, el) => el.children[3].innerText >= 100).length;
                const permaban = rows.filter((i, el) => el.children[4].innerText.match(/(no|any) (longer|signs)/)).length;
                const firstTimers = rows.filter((i, el) => el.children[5].innerText == 1).length;
                const fiveTimers = rows.filter((i, el) => el.children[5].innerText >= 5).length;
                const tenTimers = rows.filter((i, el) => el.children[5].innerText >= 10).length;
                const pastDay = rows.filter((i, el) => el.children[1].innerText.match(/(just|min|hour)/)).length;
                const pastWeek = rows.filter((i, el) => new Date(el.children[1].children[0].title) > weekAgo).length;
                const unbanDay = rows.filter((i, el) => el.children[2].innerText.match(/(just|min|hour)/)).length;
                const unbanWeek = rows.filter((i, el) => new Date(el.children[2].children[0].title) < weekAhead).length;

                const durations = rows.map((i, el) => Number(el.children[3].innerText)).get();
                const tally = {
                  'count4': durations.filter(v => v <= 4).length,
                  'count8': durations.filter(v => v > 4 && v <= 8).length,
                  'count16': durations.filter(v => v > 8 && v <= 16).length,
                  'count32': durations.filter(v => v > 16 && v <= 32).length,
                  'count64': durations.filter(v => v > 32 && v <= 64).length,
                  'count128': durations.filter(v => v > 64 && v <= 128).length,
                  'count365': durations.filter(v => v > 128 && v <= 365).length,
                  'count366': durations.filter(v => v > 365).length
                };

                const bannedStats = $(`<div id="banned-users-stats"><ul>` +
(forTriage > 0 ? `<li><span class="copy-only">-&nbsp;</span>${forTriage} (${(forTriage/rows.length*100).toFixed(1)}%) users are banned for Triage reviews in one way or another</li>` : '') +
(reqEditing > 0 ? `<li><span class="copy-only">-&nbsp;</span>${reqEditing} (${(reqEditing/rows.length*100).toFixed(1)}%) users are banned for selecting "Requires Editing" in Triage when the question was unsalvagable</li>` : '') + `
<li><span class="copy-only">-&nbsp;</span>${auditFailures} (${(auditFailures/rows.length*100).toFixed(1)}%) users are automatically banned for failing multiple review audits</li>
<li><span class="copy-only">-&nbsp;</span>${firstTimers} (${(firstTimers/rows.length*100).toFixed(1)}%) users are banned for the first time</li>
<li><span class="copy-only">-&nbsp;</span>${fiveTimers} (${(fiveTimers/rows.length*100).toFixed(1)}%) users have at least five review bans</li>
<li><span class="copy-only">-&nbsp;</span>${tenTimers} (${(tenTimers/rows.length*100).toFixed(1)}%) users have at least ten review bans</li>
<li><span class="copy-only">-&nbsp;</span>${hundred} (${(hundred/rows.length*100).toFixed(1)}%) users have a duration of at least 100 days, of which ${permaban} users are perma-banned</li>
<li><span class="copy-only">-&nbsp;</span>${pastDay} (${(pastDay/rows.length*100).toFixed(1)}%) users are banned within the past day</li>
<li><span class="copy-only">-&nbsp;</span>${pastWeek} (${(pastWeek/rows.length*100).toFixed(1)}%) users are banned within the past week</li>
<li><span class="copy-only">-&nbsp;</span>${unbanDay} (${(unbanDay/rows.length*100).toFixed(1)}%) users will be unbanned by tomorrow</li>
<li><span class="copy-only">-&nbsp;</span>${unbanWeek} (${(unbanWeek/rows.length*100).toFixed(1)}%) users will be unbanned in the next seven days</li>
</ul>
Breakdown:<br>
<ul>
<li><span class="copy-only">-&nbsp;</span>&lt;=4 : ${tally.count4} users (${(tally.count4/rows.length*100).toFixed(1)}%)</li>
<li><span class="copy-only">-&nbsp;</span>&gt;4 to &lt;=8 : ${tally.count8} users (${(tally.count8/rows.length*100).toFixed(1)}%)</li>
<li><span class="copy-only">-&nbsp;</span>&gt;8 to &lt;=16 : ${tally.count16} users (${(tally.count16/rows.length*100).toFixed(1)}%)</li>
<li><span class="copy-only">-&nbsp;</span>&gt;16 to &lt;=32 : ${tally.count32} users (${(tally.count32/rows.length*100).toFixed(1)}%)</li>
<li><span class="copy-only">-&nbsp;</span>&gt;32 to &lt;=64 : ${tally.count64} users (${(tally.count64/rows.length*100).toFixed(1)}%)</li>
<li><span class="copy-only">-&nbsp;</span>&gt;64 to &lt;=128 : ${tally.count128} users (${(tally.count128/rows.length*100).toFixed(1)}%)</li>
<li><span class="copy-only">-&nbsp;</span>&gt;128 to &lt;=365 : ${tally.count365} users (${(tally.count365/rows.length*100).toFixed(1)}%)</li>
<li><span class="copy-only">-&nbsp;</span>&gt;365 : ${tally.count366} users (${(tally.count366/rows.length*100).toFixed(1)}%)</li>
</ul>
</div>`);

                // For easier copying data to a spreadsheet
                const copyTable = $(`<table><tr>
<td>${rows.length}</td>
<td>${forTriage}</td>
<td>${reqEditing}</td>
<td>${auditFailures}</td>
<td>${firstTimers}</td>
<td>${fiveTimers}</td>
<td>${tenTimers}</td>
<td>${hundred}</td>
<td>${permaban}</td>
<td>${pastDay}</td>
<td>${pastWeek}</td>
<td>${unbanDay}</td>
<td>${unbanWeek}</td>
<td>${tally.count4}</td>
<td>${tally.count8}</td>
<td>${tally.count16}</td>
<td>${tally.count32}</td>
<td>${tally.count64}</td>
<td>${tally.count128}</td>
<td>${tally.count365}</td>
<td>${tally.count366}</td>
</tr></table>`);

                if(isSuperuser()) {
                    copyTable.appendTo(bannedStats);
                }

                table.before(bannedStats);
                bannedStats.parent().addClass('banned-reviewers-section').children('h3').text((i,v) => v.toLowerCase() + ', out of which:').prepend('<span>Currently, there are </span>');
            }

        }

        // Mod user history - review bans filter
        else if(location.pathname.includes('/users/history') && location.search == "?type=User+has+been+banned+from+review") {

            const uid2 = location.pathname.match(/\d+/)[0];

            const heading = $('#mainbar h2').first();

            // Add additional links to new pages
            heading.after(`<a href="/admin/review/failed-audits?uid=${uid2}" class="fr s-btn s-btn__sm mr12" title="view all recently failed audits from all queues on a single page">see all failed audits</a>`);

            // Get last review ban date and duration
            const hist = $('#user-history tbody tr:first td');

            if(hist.length == 4) {
                const lastBannedDate = hist.find('.relativetime').attr('title');
                const lastBannedDur = Number(hist.eq(2).text().match(/\d+ days/)[0].replace(/\D+/g, ''));
                const bannedDiff = daysReviewBanned(lastBannedDate, lastBannedDur);

                if(bannedDiff > 0) {
                    // Currently banned, show unban button
                    $(`<a class="fr s-btn s-btn__sm s-btn__filled s-btn__danger reviewban-button">Review Unban</a>`)
                        .click(function() {
                            if(confirm('Unban user from reviewing?')) {
                                $(this).remove();
                                reviewUnban(uid2);
                            }
                        })
                        .insertAfter(heading);
                    return;
                }
            }

            // Not currently banned, show review ban button
            $(`<a class="fr s-btn s-btn__sm s-btn__filled s-btn__primary reviewban-button" href="/admin/review/bans#${uid2}">Review Ban</a>`).insertAfter(heading);
        }

        // Review queue history pages
        else if(/\/review\/.+\/history/.test(location.pathname)) {

            // Add textbox so we can filter by userId (just like our own)
            $('#mainbar-full .pager').last().append(`<span> | </span><form class="js-user-review-history-form d-inline"><input placeholder="by user id" name="userId" class="s-input s-input__sm w30" /><button type="submit" class="d-none"></button></form>`);
        }

        // Failed audits by user
        else if(location.pathname.includes('/admin/review/failed-audits')) {

            initFailedAuditsByUserPage();
        }

        // Add additional links to new pages
        else if(location.pathname === '/admin/links') {
            $('.content-page ul').first().append('<li><a href="/admin/review/failed-audits" title="view all recently failed audits from all queues on a single page">All failed review audits</a></li>');
        }

        // Add additional links to new pages
        else if(location.pathname === '/admin/review/audits') {
            $('#content .subheader').first().append('<a href="/admin/review/failed-audits" class="fr s-btn s-btn__sm" title="view all recently failed audits from all queues on a single page">all failed audits</a>');
        }

        // Review queues
        else {

            // On any completed review, load reviewers info
            $(document).ajaxComplete(function(event, xhr, settings) {
                if(settings.url.includes('/review/next-task')) {
                    getUsersInfo();
                }
            });
        }
    }


    function listenForPageUpdates() {

        // Completed loading lookup
        $(document).ajaxComplete(function(event, xhr, settings) {
            if(settings.url.includes('/admin/review/lookup-suspendable-user')) {

                // Insert ban message if review link found
                if(typeof posts !== 'undefined') {
                    var banMsg = `Your review${pluralize(posts)} on ${posttext} wasn't helpful.`;
                    if(banMsg.length < messageCharLimit - 106) banMsg += ` Please review the history of the post${pluralize(posts)} and consider which action would achieve that outcome more quickly.`;
                    $('textarea[name=explanation]').val(banMsg);
                    cannedMessages.current = banMsg;
                }

                // Wrap text nodes in the lookup result ban form with spans so we can select them later if needed
                $($('.js-lookup-result form').prop('childNodes')).filter(function() {
                    return this.nodeType === 3
                }).wrap('<span>').parent().text((i, v) => v.replace(/^\s*ban\s*$/, 'Ban '));

                // Update message label
                $('label[for="explanation"]').html(`Explain why this person is being banned; it will be shown to them when they try to review. Comment markdown supported.<div>Example:</div>`)
                    .after(`<div class="examples"><pre>You approved edits on [blatant spam](&lt;link to review task&gt;)</pre></div>`);

                // Update message max length
                textarea = $('textarea[name="explanation"]').addClass('s-textarea').attr('maxlength', messageCharLimit).wrapAll(`<div class="message-wrapper"></div>`);

                // Add canned messages
                initCannedMessages();

                // Duration radios
                const firstRadio = $('#days-3').val('2').next('label').text('2 days').addBack();
                const secondRadio = $('#days-7').val('4').next('label').text('4 days').addBack();
                const thirdRadio = $('#days-30').val('8').next('label').text('8 days').addBack();
                $('#days-other')
                    .before(`<input type="radio" value="16" name="reviewSuspensionChoice" id="days-16"><label for="days-16"> 16 days</label><br>`)
                    .before(`<input type="radio" value="32" name="reviewSuspensionChoice" id="days-32"><label for="days-32"> 32 days</label><br>`)
                    .before(`<input type="radio" value="64" name="reviewSuspensionChoice" id="days-64"><label for="days-64"> 64 days </label><br>`)
                    .before(`<input type="radio" value="128" name="reviewSuspensionChoice" id="days-128"><label for="days-128"> 128 days</label><br>`)
                    .before(`<input type="radio" value="256" name="reviewSuspensionChoice" id="days-256"><label for="days-256"> 256 days</label><br>`)
                    .before(`<input type="radio" value="365" name="reviewSuspensionChoice" id="days-365"><label for="days-365"> 365 days</label><br>`)
                    .before(`<div class="duration-error">Please select ban duration!</div>`)
                    .next().addBack().remove();

                // UI stuff
                $('#days-3').parent().addClass('duration-radio-group').find('input').addClass('s-radio');
                const banSubmit = $('.js-lookup-result input:submit').addClass('s-btn s-btn__primary').attr('id', 'ban-submit');

                // Refocus submit button on duration change
                $('.duration-radio-group').on('click', 'input', function() {
                    banSubmit.focus();
                });

                firstRadio.remove(); // remove option 2

                if(true || isSuperuser()) {

                    // If triage reviews
                    if(location.hash.includes('|/review/triage/')) {

                        // Modify minimum review ban to get their attention
                        secondRadio.remove(); // remove option 4
                        //thirdRadio.remove(); // remove option 8

                        // If reviewAction is "requires-editing", select alternate canned message
                        if(reviewAction == 'requires-editing') {
                            $('#canned-messages a[data-message*="Requires Editing"]').click();
                        }
                    }

                    // If suggested-edits reviews
                    else if(location.hash.includes('|/review/suggested-edits/')) {

                        // If reviewAction is "approve", select alternate canned message
                        if(reviewAction == 'approve') {
                            $('#canned-messages a[data-message^="You approved poor edits"]').click();
                        }
                    }
                }

                // Default would be based on previous ban duration
                getUserReviewBanHistory(uid);
            }
        });
    }


    function appendStyles() {

        const styles = `
<style>
a.reviewban-count,
a.reviewban-link {
    position: relative;
    top: -2px;
    display: inline-block;
    width: 16px;
    height: 16px;
    margin-right: 5px;
    text-align: center;
    font-size: 0.8em;
    line-height: 14px;
    border-radius: 50%;
    border: 1px solid var(--black-500);
    color: var(--black-500);
}
a.reviewban-count.warning {
    background: var(--yellow-100);
    border-color: var(--red-500);
    color: var(--red-500);
}
a.reviewban-link {
    border: 1px solid var(--red-500);
    background: var(--red-500);
    color: #fff;
}
a.reviewban-button {
    float: right;
}

.js-lookup-result {
    margin-top: 20px !important;
}
.js-lookup-result .examples pre {
    margin-bottom: 0;
    padding: 5px 10px;
}
.js-lookup-result br {
    display: none;
}
.js-lookup-result .duration-radio-group {
    display: block;
    width: 300px;
    margin: 10px 0 0;
}
.js-lookup-result .duration-radio-group label {
    margin-left: 2px;
    cursor: pointer;
}
.js-lookup-result .duration-radio-group label:after {
    content: '';
    display: block;
    margin-bottom: 4px;
}
.js-lookup-result .duration-radio-group input[name="reviewBanDays"] {
    position: absolute;
    margin-left: 10px;
    margin-top: -6px;
}
.js-lookup-result .duration-error {
    display: none;
    margin: 0;
    color: var(--red-500);
}
.js-lookup-result form.validation-error .duration-error {
    display: block;
}
.js-lookup-result form > div {
    margin: 5px 0;
}

.js-lookup-result form > .reviewban-history-summary {
    margin: 10px 0 15px;
}
.reviewban-history-summary .reviewban-ending.current span.type,
.reviewban-history-summary .reviewban-ending.recent span.type {
    color: var(--red-500);
}
.reviewban-history {
    max-height: 500px;
    border-left: 1px solid var(--black-150);
    padding-left: 20px;
    padding-bottom: 10px;
    padding-right: 18px;
    overflow-y: scroll;
}
.reviewban-history:before {
    content: 'Previous review ban reasons:';
    position: sticky;
    top: 0;
    display: block;
    margin-bottom: 5px;
    padding-bottom: 5px;
    background: var(--white);
}
.reviewban-history > .item {
    margin: 10px 0 20px;
}
.reviewban-history .item-meta {
    font-size: 12px;
}
.reviewban-history .item-meta:after {
    content: '';
    display: block;
    clear: both;
}
.reviewban-history .item-reason {
    margin-top: 5px;
    padding: 7px 12px;
    background: var(--black-025);
    clear: both;
}
.reviewban-history .item-meta > div {
    width: 40%;
    float: left;
}
.reviewban-history .item-meta  > div:before {
    display: inline-block;
    min-width: 52px;
    font-style: italic;
}
.reviewban-history .item-meta > div:nth-child(1):before {
    content: 'Began: ';
}
.reviewban-history .item-meta > div:nth-child(2):before {
    content: 'Duration: ';
    width: 62px;
}
.reviewban-history .item-meta  > div:nth-child(3):before {
    content: 'Ending: ';
}
.reviewban-history .item-meta  > div:nth-child(4):before {
    content: 'Moderator: ';
    width: 62px;
}

.message-wrapper {
    position: relative;
}
.message-wrapper textarea {
    display: block;
    min-height: 250px;
    max-width: none !important;
    width: 80% !important;
    margin-bottom: 20px;
    font-family: monospace;
}
#canned-messages {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 20%;
    padding: 12px 15px;
    border: 1px solid var(--black-150);
    border-left: none;
}
#canned-messages:before {
    content: 'Canned messages';
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
}
#canned-messages a {
    display: inline-block;
    float: left;
    clear: both;
}

.copy-only {
    display: inline-block;
    width: 0;
    opacity: 0;
    text-indent: -100vw;
}

#banned-users-table td:first-child {
    max-width: 140px;
    overflow: hidden;
}
table.sorter > tbody > tr:nth-child(odd) > td {
    background-color: var(--black-050) !important;
}
table.sorter > tbody > tr:nth-child(even) > td {
    background-color: var(--white) !important;
}
table.sorter > thead > tr .tablesorter-headerAsc,
table.sorter > thead > tr .tablesorter-headerDesc {
    background-color: var(--orange-300);
    color: var(--white);
}
table.sorter > thead > tr .tablesorter-headerAsc span::after {
    content: "▲";
}
table.sorter > thead > tr .tablesorter-headerDesc span::after {
    content: "▼";
}

a.js-suspend-again {
    float: right;
    margin: 5px;
    padding: 3px 7px;
    background: var(--black-050);
    color: var(--red-500);
}
a.js-suspend-again:hover {
    color: var(--white);
    background: var(--red-500);
}

.failed-audits-page .history-table,
.failed-audits-page .history-table-filter {
    width: 100%;
}
.failed-audits-page .history-table tr,
.failed-audits-page .history-table-filter tr {
    display: flex;
}
.failed-audits-page .history-table td,
.failed-audits-page .history-table-filter td {
    display: inline-block;
    width: 120px;
    margin-right: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.failed-audits-page .history-table td:nth-child(2) {
    width: 500px;
}
.failed-audits-page .history-table td:nth-child(4),
.failed-audits-page .history-table td:nth-child(6) {
    width: 70px;
}
.failed-audits-page .history-table td:nth-child(5) {
    height: 22px;
    order: -1;
}
.failed-audits-page .history-table-filter td:nth-child(2) {
    width: 124px;
}
.failed-audits-page.js-absolute-dates .history-table td:nth-child(5) {
    font-size: 0;
}
.failed-audits-page.js-absolute-dates .history-table span.history-date:before {
    content: attr(title);
    font-size: 0.9rem;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    listenForPageUpdates();
    doPageload();

})();
