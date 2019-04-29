// ==UserScript==
// @name         User Review Ban Helper
// @description  Display users' prior review bans in review, Insert review ban button in user review ban history page, Load ban form for user if user ID passed via hash
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.2.1
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
// ==/UserScript==

(function() {
    'use strict';


    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;


    const fkey = StackExchange.options.user.fkey;
    const defaultBanMessage = `Your recent [reviews](https://${location.hostname}/users/current?tab=activity&sort=reviews) wasn't helpful. Please review the history of the posts and consider how choosing a different action would help achieve those outcomes more quickly.`;
    const permaBanMessage = `Due to your [poor review history](https://${location.hostname}/users/current?tab=activity&sort=reviews) as well as no signs of improvement after multiple review bans, you are no longer welcome to use any review queues on the site.`;


    const reloadPage = () => location.reload(true);
    const pluralize = s => s.length != 0 ? 's' : '';


    // Solution from https://stackoverflow.com/a/24719409/584192
    function jQueryXhrOverride() {
        var xhr = jQuery.ajaxSettings.xhr();
        var setRequestHeader = xhr.setRequestHeader;
        xhr.setRequestHeader = function(name, value) {
            if (name == 'X-Requested-With') return;
            setRequestHeader.call(this, name, value);
        };
        return xhr;
    }


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

                    // Reinit sorter
                    $('.sorter').tablesorter();

                    // Default sort header
                    headers.eq(1).addClass('tablesorter-headerDesc');
                });
            }, 1000);

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

            // Load ban form for user if passed via querystring
            var params = location.hash.substr(1).split('|');
            var uid = params[0];
            var posts = params[1].split(';').map(v => v.replace(/\/?review\//, ''));

            // Remove similar consecutive review types from urls
            var prevType = null;
            posts = posts.map(v => {
                if(v.includes(prevType + '/')) v = v.replace(/\D+/g, '');
                else prevType = v.split('/')[0];
                return v;
            });
            console.log(posts);

            // Fit as many URLs as possible into message
            var posttext = '';
            var i = posts.length;
            do {
                posttext = posts.slice(0, i--).join(", ");
            }
            while(i > 1 && 48 + location.hostname.length + posttext.length > 300);

            // Completed loading lookup
            $(document).ajaxComplete(function(event, xhr, settings) {
                if(settings.url.includes('/admin/review/lookup-bannable-user')) {

                    // Insert ban message if review link found
                    if(typeof params[1] !== 'undefined') {
                        var banMsg = `Your review${pluralize(posts)} on https://${location.hostname}/review/${posttext} wasn't helpful.`;
                        if(banMsg.length < 300 - 102) banMsg += ` Do review the history of the post${pluralize(posts)} and consider which action would achieve that outcome more quickly.`;
                        $('textarea[name=explanation]').val(banMsg);
                    }

                    // Change default to other
                    $('#days-other').click();

                    $('#days-3').val('4').next('label').text('4 days for first review ban');
                    $('#days-7').val('8').next('label').text('8 days for second review ban');
                    $('#days-30').val('16').next('label').text('16 days for third review ban');
                    $('#days-other')
                        .before(`<input type="radio" value="32" name="reviewBanChoice" id="days-32"><label for="days-32"> 32 days for fourth review ban</label><br>`)
                        .before(`<input type="radio" value="64" name="reviewBanChoice" id="days-64"><label for="days-64"> 64 days for fifth review ban</label><br>`)
                        .before(`<input type="radio" value="128" name="reviewBanChoice" id="days-128"><label for="days-128"> 128 days for subsequent review bans</label><br>`);

                    // Run once only
                    $(event.currentTarget).unbind('ajaxComplete');
                }
            });

            // Validation
            if(/\d+/.test(uid)) {

                // Insert UID
                $('#user-to-ban').val(uid);

                // Submit lookup
                setTimeout(() => $('#lookup').click(), 500);
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
        // Completed review, load reviewers info
        else {
            $(document).ajaxComplete(function(event, xhr, settings) {
                if(settings.url.includes('/review/next-task')) getUsersInfo();
            });
        }
    }


    function getUsersInfo() {

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
                    if(typeof numBansLink !== 'undefined')
                        numBans = Number(numBansLink.nextSibling.nodeValue.match(/\d+/)[0]);

                    console.log("Review bans for " + uid, numBans);

                    // Add annotation count
                    $(`<a class="reviewban-count ${numBans > 2 ? 'warning' : ''}" href="${url}" title="${numBans} prior review bans" target="_blank">${numBans}</a>`)
                        .insertBefore(userlink);
                }
            });
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

#lookup-result textarea {
    min-height: 90px;
    width: 100% !important;
    margin-bottom: 10px;
    font-family: monospace;
}
#lookup-result input[name="reviewBanDays"] {
    position: absolute;
    margin-left: 10px;
    margin-top: -6px;
}
#lookup-result form > div {
    margin: 5px 0;
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

.reban {
    float: right;
    margin: 5px;
    padding: 3px 7px;
    background: #e8e8e8;
}
.reban:hover {
    color: white;
    background: red;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    doPageload();
    appendStyles();

})();
