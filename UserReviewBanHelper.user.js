// ==UserScript==
// @name         User Review Ban Helper
// @description  Display users' prior review bans in review, Insert review ban button in user review ban history page, Load ban form for user if user ID passed via hash
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      3.6
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
//
// @include      */admin/review/audits*
// @include      */admin/review/bans*
//
// @require      https://github.com/samliew/SO-mod-userscripts/raw/master/lib/common.js
// ==/UserScript==

(function() {
    'use strict';


    // Moderator check
    if(!isModerator()) return;


    const superusers = [ 584192 ];
    const fkey = StackExchange.options.user.fkey;
    const messageCharLimit = 2000;

    const defaultBanMessage = `Your recent [reviews](https://${location.hostname}/users/current?tab=activity&sort=reviews) wasn't helpful. Please review the history of the posts and consider how choosing a different action would help achieve those outcomes more quickly.`;
    const permaBanMessage = `Due to your [poor review history](https://${location.hostname}/users/current?tab=activity&sort=reviews) as well as no signs of improvement after multiple review bans, you are no longer welcome to use any review queues on the site.`;

    // Use {POSTLINK} and {QUEUENAME} placeholders
    const cannedMessages = {
        current: '',
        triageQuestionReqEdits: `Your review on {POSTLINK} wasn't helpful. "Requires Editing" should only be used when other community users (*like you*) are able to edit/format the question into a better shape. If a question is unsalvagable and/or can only be improved by the author, please flag/vote to close or delete instead. For more information, see [meta.stackoverflow.com/q/389148](https://meta.stackoverflow.com/q/389148).`,
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
    const pluralize = s => s.length != 1 ? 's' : '';
    const dateToSeDateFormat = d => d.toISOString().replace('T', ' ').replace(/\.\d+Z$/, 'Z');

    // For review ban message
    let textarea;
    let params, uid, posts, allposts = '', posttext = '';


    // Review unban user
    function reviewUnban(uid) {
        return new Promise(function(resolve, reject) {
            if(typeof uid === 'undefined' || uid === null) { reject(); return; }

            $.post({
                url: `https://${location.hostname}/admin/review/unban-user`,
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
                url: `https://${location.hostname}/admin/review/ban-user`,
                data: {
                    'userId': uid,
                    'explanation': message,
                    'reviewBanChoice': 'on',
                    'reviewBanDays': duration,
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
            $('#lookup-result input:submit').focus(); // focus submit button
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


    function doPageload() {

        // Linkify ban counts on ban page and historical page tables
        // /admin/review/bans  &  /admin/review/bans/historical
        if(location.pathname.includes('/admin/review/bans')) {

            // Linkify ban counts to user review ban history page
            $('table tbody tr').each(function() {
                const userlink = $(this).find('td a').first();
                const uid = userlink.attr('data-uid') || userlink.attr('href').match(/\/\d+\//)[0].replace(/\D+/g, '');
                $(this).children('td').eq(4).html(function(i, v) {
                    return `<a href="/users/history/${uid}?type=User+has+been+banned+from+review" target="_blank" title="see review ban history">${v}</a>`;
                });
            });

            // Fix table date sorting
            const table = $('.sorter').attr('id', 'banned-users-table');
            setTimeout(() => {
                $.tablesorter.destroy('.sorter', true, function() {

                    // Add classes to date column headers
                    const headers = $('.sorter th');
                    headers.slice(1,3).addClass('sorter-miniDate').removeClass('headerSortDown');
                    headers.eq(3).addClass('sorter-false');
                    headers.last().addClass('sorter-false');

                    // Add duration column header
                    headers.eq(2).after(`<th class="tablesorter-headerUnSorted">Duration</th>`);

                    // Reinit sorter
                    $('.sorter').tablesorter();

                    // Default sort header
                    headers.eq(1).addClass('tablesorter-headerDesc');
                });
            }, 1000);

            // Add duration column to the other rows
            table.find('tbody tr').each(function() {
                const cells = $(this).children('td');
                let startDate = new Date(cells.eq(1).find('.relativetime').attr('title')).getTime();
                let endDate = new Date(cells.eq(2).find('.relativetime').attr('title')).getTime();
                let diffDays = (endDate - startDate) / 86400000;
                cells.eq(2).after(`<td>${diffDays}</td>`);
            });

            // Option to renew permanent bans
            $('.reason', table).filter((i, el) => el.innerText.includes('no longer welcome')).each(function() {
                const p = $(this).parent();
                const l = p.find('a.unban').clone().appendTo(this);
                l.removeClass('unban').addClass('reban').attr('title', (i, s) => s.replace('unban', 'reapply another yearly review ban to').replace(' from reviewing', '')).text((i, s) => s.replace('unban', 'reban'));
            });
            table.on('click', '.reban', function() {
                if(confirm("Apply another year's ban to this user?")) {
                    const uid = this.dataset.userid;
                    reviewUnban(uid).then(() => reviewPermaBan(uid).then(reloadPage));
                }
                return false;
            });

            // UI classes
            $('#user-to-ban').addClass('s-input');
            $('#lookup').addClass('s-btn');

            // If attempt to submit ban form without selecting duration, alert and prevent
            $('#lookup-result').on('submit', 'form', function() {
                if($('input[name="reviewBanChoice"]:checked').length == 0) {
                    $(this).addClass('validation-error');
                    return false;
                }
            });

            // Load ban form for user if passed via querystring
            params = location.hash.substr(1).split('|');
            if(params) {
                uid = Number(params[0]) || null;

                if(params.length === 2) {
                    posts = params[1].split(';').map(v => v.replace(/\/?review\//, ''));

                    // Remove similar consecutive review types from urls
                    // (possibly no longer needed as we can increase max length)
                    //var prevType = null;
                    //posts = posts.map(v => {
                    //    if(v.includes(prevType + '/')) v = v.replace(/\D+/g, '');
                    //    else prevType = v.split('/')[0];
                    //    return v;
                    //});
                    //console.log(posts);

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
                if(!isNaN(uid)) {

                    // Insert UID
                    $('#user-to-ban').val(uid);

                    // Submit lookup
                    setTimeout(() => { $('#lookup').click() }, 500);
                }
            }

        }
        // Mod user history - review bans filter
        else if(location.pathname.includes('/users/history') && location.search == "?type=User+has+been+banned+from+review") {

            var uid2 = location.pathname.match(/\d+/)[0];

            // Get last review ban date and duration
            const hist = $('#user-history tbody tr:first td');

            if(hist.length == 4) {
                const lastBannedDate = hist.find('.relativetime').attr('title');
                const lastBannedDur = Number(hist.eq(2).text().match(/\d+ days/)[0].replace(/\D+/g, ''));
                const bannedDiff = daysReviewBanned(lastBannedDate, lastBannedDur);

                if(bannedDiff > 0) {
                    // Currently banned, show unban button
                    $(`<a class="button reviewban-button">Review Unban</a>`)
                        .click(function() {
                            if(confirm('Unban user from reviewing?')) {
                                $(this).remove();
                                reviewUnban(uid2);
                            }
                        })
                        .insertAfter('.subheader h1');
                    return;
                }
            }

            // Not currently banned, show review ban button
            $(`<a class="button reviewban-button" href="/admin/review/bans#${uid2}">Review Ban</a>`).insertAfter('.subheader h1');
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


    /* For review pages */
    function getUsersInfo() {

        // If triage queue, sort by action
        if(location.pathname.includes('/review/triage/')) {
            $('.review-instructions .review-results').detach().sort(function(a, b) {
                const ax = $(a).children('b').last().text();
                const bx = $(b).children('b').last().text();
                return ax < bx ? -1 : 1;
            }).appendTo('.review-instructions');
        }

        // Get users review history
        $('.review-summary').find('a[href^="/users/"]').each(function() {
            // Ignore mods
            var modFlair = $(this).next('.mod-flair');
            if(modFlair.length) return;

            var userlink = $(this);
            var uid = $(this).attr('href').match(/\d+/)[0];
            var url = '/users/history/' + uid + '?type=User+has+been+banned+from+review';
            var banUrl = `/admin/review/bans#${uid}|${location.pathname}`;

            // Add ban link
            $(`<a class="reviewban-link" href="${banUrl}" title="Ban user from reviews" target="_blank">X</a>`)
                .insertBefore(userlink);

            // Grab user's history
            $.ajax({
                url: url,
                xhr: jQueryXhrOverride,
                success: function(data) {

                    // Parse user history page
                    var numBans = 0;
                    var summary = $('#summary', data);
                    var numBansLink = summary.find('a[href="?type=User+has+been+banned+from+review"]').get(0);
                    if(typeof numBansLink !== 'undefined') {
                        numBans = Number(numBansLink.nextSibling.nodeValue.match(/\d+/)[0]);
                    }

                    console.log("Review bans for " + uid, numBans);

                    // Add annotation count
                    $(`<a class="reviewban-count ${numBans > 2 ? 'warning' : ''}" href="${url}" title="${numBans} prior review bans" target="_blank">${numBans}</a>`)
                        .insertBefore(userlink);
                }
            });
        });
    }


    /* For review ban page */
    function getUserReviewBanHistory(uid) {

        const url = `https://${location.hostname}/users/history/${uid}?type=User+has+been+banned+from+review`;

        // Grab user's history page
        $.get(url).then(function(data) {

            // Parse user history page
            let numBans = 0;
            const summary = $('#summary', data);
            const eventRows = $('#user-history tbody tr', data);

            // Get number from filter menu, because user might have been banned more times and events will overflow to next page
            const numBansLink = summary.find('a[href="?type=User+has+been+banned+from+review"]').get(0);
            if(typeof numBansLink !== 'undefined') {
                numBans = Number(numBansLink.nextSibling.nodeValue.match(/\d+/)[0]);
            }

            // Add annotation count
            const banCountDisplay = $(`<div class="reviewban-history-summary">User was previously review banned <b><a href="${url}" title="view history" target="_blank">${numBans} time${pluralize(numBans)}</a></b>. </div>`)
                .insertAfter('.message-wrapper');
            banCountDisplay.nextAll().wrapAll('<div class="grid history-duration-wrapper"><div class="grid--cell4 duration-wrapper"></div></div>');

            const pastReviewMessages = $('<div class="grid--cell12 reviewban-history"></div>').appendTo('.history-duration-wrapper');

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
            let daysago = new Date();
            daysago.setDate(daysago.getDate() - 28);
            eventRows.eq(0).each(function() {
                const datetime = new Date($(this).find('.relativetime').attr('title'));
                const duration = Number(this.innerText.match(/\= \d+ days/)[0].replace(/\D+/g, ''));
                let banEndDatetime = new Date(datetime);
                banEndDatetime.setDate(banEndDatetime.getDate() + duration);
                const currtext = banEndDatetime > Date.now() ? 'Current' : 'Recent';

                let newDuration = duration, recommendedDuration = duration;

                // Recent, double duration
                if(banEndDatetime > daysago) {
                    $(`<span class="reviewban-ending ${currtext == 'current' ? 'current' : 'recent'}"><span class="type" title="recommended to double the previous ban duration">${currtext}ly</span> review banned for <b>${duration} days</b> until <span class="relativetime" title="${dateToSeDateFormat(banEndDatetime)}">${banEndDatetime}</span>.</span>`)
                        .appendTo(banCountDisplay);
                    newDuration *= 2;

                    // Also add warning to the submit button if currently banned
                    if(currtext == 'Current') {
                        isCurrentlyBanned = true;
                        $('#lookup-result input:submit').addClass('s-btn__danger s-btn__filled js-ban-again').val((i, v) => v + ' again');
                    }
                }
                // Halve duration
                else {
                    $(`<span class="reviewban-ending">Last review banned for <b>${duration} days</b> until <span class="relativetime" title="${dateToSeDateFormat(banEndDatetime)}">${banEndDatetime}</span>.</span>`)
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

            // If is currently banned, add confirmation prompt when trying to ban user
            if(isCurrentlyBanned) {
                $('#lookup-result form').submit(function() {
                    return confirm('User is currently review banned!\n\nAre you sure you want to replace with a new ban?');
                });
            }
        });
    }


    function listenForPageUpdates() {

        // Completed loading lookup
        $(document).ajaxComplete(function(event, xhr, settings) {
            if(settings.url.includes('/admin/review/lookup-bannable-user')) {

                // Insert ban message if review link found
                if(typeof posts !== 'undefined') {
                    var banMsg = `Your review${pluralize(posts)} on ${posttext} wasn't helpful.`;
                    if(banMsg.length < messageCharLimit - 106) banMsg += ` Please review the history of the post${pluralize(posts)} and consider which action would achieve that outcome more quickly.`;
                    $('textarea[name=explanation]').val(banMsg);
                    cannedMessages.current = banMsg;
                }

                // Wrap text nodes in the lookup result ban form with spans so we can select them later if needed
                $($('#lookup-result form').prop('childNodes')).filter(function() {
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
                $('#days-7').val('4').next('label').text('4 days');
                $('#days-30').val('8').next('label').text('8 days');
                $('#days-other')
                    .before(`<input type="radio" value="16" name="reviewBanChoice" id="days-16"><label for="days-16"> 16 days</label><br>`)
                    .before(`<input type="radio" value="32" name="reviewBanChoice" id="days-32"><label for="days-32"> 32 days</label><br>`)
                    .before(`<input type="radio" value="64" name="reviewBanChoice" id="days-64"><label for="days-64"> 64 days </label><br>`)
                    .before(`<input type="radio" value="128" name="reviewBanChoice" id="days-128"><label for="days-128"> 128 days</label><br>`)
                    .before(`<input type="radio" value="256" name="reviewBanChoice" id="days-256"><label for="days-256"> 256 days</label><br>`)
                    .before(`<input type="radio" value="365" name="reviewBanChoice" id="days-365"><label for="days-365"> 365 days</label><br>`)
                    .before(`<div class="duration-error">Please select ban duration!</div>`)
                    .next().addBack().remove();

                // UI stuff
                $('#days-3').parent().addClass('duration-radio-group').find('input').addClass('s-radio');
                $('#lookup-result input:submit').addClass('s-btn s-btn__primary');

                if(superusers.includes(StackExchange.options.user.userId)) {
                    firstRadio.remove();
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
    border: 1px solid #666;
    color: #666;
}
a.reviewban-count.warning {
    background: #FF9;
    border-color: red;
    color: red;
}
a.reviewban-link {
    border: 1px solid red;
    background: red;
    color: white;
}
a.reviewban-button {
    float: right;
}

#lookup-result {
    margin-top: 20px !important;
}
#lookup-result .examples pre {
    margin-bottom: 0;
    padding: 5px 10px;
}
#lookup-result br {
    display: none;
}
#lookup-result .duration-radio-group {
    display: block;
    width: 300px;
    margin: 10px 0 0;
}
#lookup-result .duration-radio-group label {
    margin-left: 2px;
    cursor: pointer;
}
#lookup-result .duration-radio-group label:after {
    content: '';
    display: block;
    margin-bottom: 4px;
}
#lookup-result .duration-radio-group input[name="reviewBanDays"] {
    position: absolute;
    margin-left: 10px;
    margin-top: -6px;
}
#lookup-result .duration-error {
    display: none;
    margin: 0;
    color: red;
}
#lookup-result form.validation-error .duration-error {
    display: block;
}
#lookup-result form > div {
    margin: 5px 0;
}

#lookup-result form > .reviewban-history-summary {
    margin: 10px 0 15px;
}
.reviewban-history-summary .reviewban-ending.current span.type,
.reviewban-history-summary .reviewban-ending.recent span.type {
    color: red;
}
.reviewban-history {
    max-height: 500px;
    border-left: 1px solid #ccc;
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
    background: white;
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
    background: #f6f6f6;
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
    min-height: 220px;
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
    border: 1px solid #ccc;
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

table.sorter > tbody > tr:nth-child(odd) > td {
    background-color: #eee !important;
}
table.sorter > tbody > tr:nth-child(even) > td {
    background-color: white !important;
}
table.sorter > thead > tr .tablesorter-headerAsc,
table.sorter > thead > tr .tablesorter-headerDesc {
    background-color: #f90;
    color: #FFF;
}
table.sorter > thead > tr .tablesorter-headerAsc span::after {
    content: "▲";
}
table.sorter > thead > tr .tablesorter-headerDesc span::after {
    content: "▼";
}

a.reban {
    float: right;
    margin: 5px;
    padding: 3px 7px;
    background: #e8e8e8;
    color: red;
}
a.reban:hover {
    color: white;
    background: red;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();
    listenForPageUpdates();

})();
