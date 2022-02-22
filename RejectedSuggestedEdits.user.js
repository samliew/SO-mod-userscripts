// ==UserScript==
// @name         Rejected Suggested Edits
// @description  New page to review rejected suggested edits
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.0
//
// @include      https://*stackoverflow.com/review/suggested-edits*
// @include      https://*serverfault.com/review/suggested-edits*
// @include      https://*superuser.com/review/suggested-edits*
// @include      https://*askubuntu.com/review/suggested-edits*
// @include      https://*mathoverflow.net/review/suggested-edits*
// @include      https://*.stackexchange.com/review/suggested-edits*
//
// @include      https://*stackoverflow.com/admin/links
// @include      https://*serverfault.com/admin/links
// @include      https://*superuser.com/admin/links
// @include      https://*askubuntu.com/admin/links
// @include      https://*mathoverflow.net/admin/links
// @include      https://*.stackexchange.com/admin/links
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';

const sitename = StackExchange.options.site.name.replace('Stack Exchange').trim();
const fkey = StackExchange.options.user.fkey;
const apikey = 'FHd6ejY4s4KDhL9VCWhkwQ((';

const now = new Date();
let today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
let yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
let oneyear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = str => ('0' + str).slice(-2);

const resultsDiv = $(`<div id="reviews"></div>`);
const pagerDiv = $(`<div class="s-pagination pager fl"></div>`);


// Helper functions
const getQueryParam = key => new URLSearchParams(location.search).get(key);
const toDateFormat = d => d.toISOString().replace('T', ' ').replace('.000', '');
const toRelativeDate = d => {
    return d > today ? pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) :
        d > yesterday ? 'yesterday ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) :
            d > oneyear ? months[d.getMonth()] + ' ' + d.getDate() :
                toDateFormat(d);
};


function getRedirectUrl(url, method = "GET") {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function (e) {
            if (xhr.status == 200 && xhr.readyState == 4) {
                if (url != xhr.responseURL) {
                    resolve(xhr.responseURL);
                } else {
                    reject();
                }
            }
        }
        xhr.open(method, url, true);
        xhr.send();
    });
}


function buildPagination(max, page = 1, baseUrl = "", range = 5) {

    pagerDiv.empty();

    let str = '';
    let from = page - range;
    let to = page + range;

    if (from < 1) from = 1;
    if (to > max) to = max;

    if (page - 1 >= 1) {
        str += `<a href="${baseUrl}?page=${page - 1}" class="s-pagination--item" rel="prev">Prev</a> `;
    }

    if (from > 1) {
        str += `<a href="${baseUrl}?page=1" class="s-pagination--item">1</a> `;
        if (from > 2) {
            str += `<div class="s-pagination--item s-pagination--item__clear">…</span> `;
        }
    }

    for (let i = from; i <= to; i++) {
        i == page ?
            str += `<div class="s-pagination--item is-selected">${i}</div> ` :
            str += `<a href="${baseUrl}?page=${i}" class="s-pagination--item">${i}</a> `;
    }

    if (to < max) {
        if (to < max - 1) {
            str += `<div class="s-pagination--item s-pagination--item__clear">…</div> `;
        }
        str += `<a href="${baseUrl}?page=${max}" class="s-pagination--item">${max}</a> `;
    }

    if (page + 1 <= max) {
        str += `<a href="${baseUrl}?page=${page + 1}" class="s-pagination--item" rel="next">Next</a> `;
    }

    pagerDiv.html(str);
}


function getRejected(page = 1) {

    // Check for backoff
    if (hasBackoff()) { return; }

    resultsDiv.empty();
    StackExchange.helpers.addSpinner('#reviews');

    $.get(`https://api.stackexchange.com/2.2/suggested-edits?page=${page}&pagesize=100&order=desc&sort=rejection&filter=!*KkBP6Je7loS9)xf&site=${location.hostname}&key=${apikey}`, function (data) {
        StackExchange.helpers.removeSpinner();

        addBackoff(data.backoff);

        const items = data.items;
        let html = '';

        items.forEach(function (v) {
            const posttype = v.post_type.charAt(0);
            const creationDate = new Date(v.creation_date * 1000);
            const rejectionDate = new Date(v.rejection_date * 1000);
            const proposingUser = !v.proposing_user ? '<span class="userlink">anonymous</span>' :
                `<a class="userlink" href="${v.proposing_user.link}" title="rep: ${v.proposing_user.reputation}, type: ${v.proposing_user.user_type}">${v.proposing_user.display_name}</a>`;

            html += `<div class="review review-bar-container">
<a href="/suggested-edits/${v.suggested_edit_id}" class="toggle" title="toggle review summary"></a>
<span class="userspan">${proposingUser}</span>
<a href="/suggested-edits/${v.suggested_edit_id}">suggested edit</a>
on <a href="/${posttype}/${v.post_id}" class="answer-hyperlink">${posttype}${v.post_id}</a>
was rejected <span title="${toDateFormat(rejectionDate)}" class="relativetime">${toRelativeDate(rejectionDate)}</span></div>`;
        });

        resultsDiv.append(html);
        StackExchange.realtime.updateRelativeDates();

        buildPagination(Math.ceil(data.total / data.page_size), data.page);

        // Load anonymous details if <= 10
        const anonusers = $('span.userlink');
        if (anonusers.length <= 10) anonusers.parent().siblings('.toggle').trigger('preload');
    });
}


function initRejectsPage() {

    document.title = `Rejected Reviews - Suggested Edits - ${sitename}`;

    // Insert nav and results container
    const content = $('#content').html('<div id="mainbar" role="main" class="grid"></div>').append(`<div class="subheader tools-rev">
    <h1><a href="/review">Review</a><span class="lsep">|</span><span class="review-title">Rejected Suggested Edits</span></h1>
    <div id="tabs">
        <a href="/review/suggested-edits/stats">stats</a>
        <a href="/review/suggested-edits/history">history</a>
        <a href="/review/suggested-edits/history/rejected" class="youarehere">rejects</a>
        <a href="/review/suggested-edits">review</a>
    </div>
</div>`).append(resultsDiv).append(pagerDiv);

    // Get list from API
    getRejected(1);

    // Update timings every 30 secs, doesn't work with toggle time format
    //setInterval(function() {
    //    StackExchange.realtime.updateRelativeDates();
    //}, 30000);

    // Handle same-page ajax pagination
    pagerDiv.on('click', 'a', function (evt) {
        const pagenum = Number($(this).attr('href').match(/page=\d+/)[0].split('=')[1]);
        getRejected(pagenum);
        return false;
    });

    // Toggle time format
    $(`<a class="toggle-date-format">toggle format</a>`).insertBefore(resultsDiv).on('click', function () {
        $('#reviews .review > .relativetime').each(function (i, el) {
            // Switch title and text
            const tmp = el.innerText;
            el.innerText = el.title;
            el.title = tmp;
        });
        StackExchange.realtime.updateRelativeDates();
    });

    // Toggle open review
    resultsDiv.on('click preload', '.toggle', function (evt) {
        const preload = evt.type == 'preload';
        const rev = $(this).parent();
        const url = $(this).attr('href');

        if (!preload) {
            rev.toggleClass('open');
        }

        if (rev.children('.review-info').length == 0) {
            const infoDiv = $(`<div class="review-info review-bar"></div>`).appendTo(rev);
            if (preload) {
                infoDiv.hide();
            }
            StackExchange.helpers.addSpinner(infoDiv[0]);

            getRedirectUrl(`https://${location.hostname}` + url).then(function (v) {
                const rid = v.match(/\d+$/)[0];
                $.post(`https://${location.hostname}/review/next-task/` + rid, { 'taskTypeId': 1, 'fkey': fkey }, function (data) {
                    StackExchange.helpers.removeSpinner();
                    infoDiv.append(`<div class="review-instructions infobox">${data.instructions}</div>`).append(`<div class="review-more-instructions">${data.moreInstructions}</div>`);

                    const spamRejects = data.instructions.match(/This edit defaces/g);
                    if (spamRejects && spamRejects.length > 0) {
                        infoDiv.before(`, for <b>spam/vandalism</b> x${spamRejects.length}`);
                    }

                    const drasticRejects = data.instructions.match(/This edit deviates from the original intent/g);
                    if (drasticRejects && drasticRejects.length > 0) {
                        infoDiv.before(`, for <b>drastic changes</b> x${drasticRejects.length}`);
                    }

                    const harmfulRejects = data.instructions.match(/completely superfluous or actively harm readability/g);
                    if (harmfulRejects && harmfulRejects.length > 0) {
                        infoDiv.before(`, for <b>no improvement</b> x${harmfulRejects.length}`);
                    }

                    const tagRejects = data.instructions.match(/This edit introduces tags that do not help to define the topic/g);
                    if (tagRejects && tagRejects.length > 0) {
                        infoDiv.before(`, for <b>irrelevant tags</b> x${tagRejects.length}`);
                    }

                    const replyRejects = data.instructions.match(/should have been written as a comment/g);
                    if (replyRejects && replyRejects.length > 0) {
                        infoDiv.before(`, for <b>attempting to reply</b> x${replyRejects.length}`);
                    }
                });
            });
        }
        return false;
    });
}


function doPageload() {

    if (location.pathname === '/review/suggested-edits/history/rejected') {
        appendStyles();
        initRejectsPage();
    }
    else if (location.pathname.includes('/review/suggested-edits')) {
        // Add to nav tabs
        const histlink = $('#tabs').find('a[href="/review/suggested-edits/history"]');
        histlink.clone().removeClass('youarehere').attr('href', '/review/suggested-edits/history/rejected').text('rejects').insertAfter(histlink);
    }
    else if (location.pathname === '/admin/links') {
        $('.content-page ul').first().append('<li><a href="/review/suggested-edits/history/rejected">Rejected suggested edits</a></li>');
    }

}


// On page load
doPageload();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
#reviews {
    line-height: 2em;
    font-size: 14px;
}
.review:nth-child(even) {
    background: var(--black-025);
}
.review .toggle {
    content: '';
    display: inline-block;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 6px 0 6px 9px;
    border-color: transparent transparent transparent var(--black-400);
    transform-origin: center;
}
.review .review-info {
    display: none;
}
.review.open .toggle {
    transform: rotateZ(90deg);
}
.review.open .review-info {
    display: block !important;
}
.review .userspan {
    display: inline-block;
    min-width: 230px;
    text-align: right;
}
.review .userlink {
    display: inline-block;
}
span.userlink {
    font-style: italic;
}
.review .answer-hyperlink {
    display: inline-block;
    min-width: 71px;
    margin-bottom: 0;
}
.review > .relativetime {
    display: inline-block;
}
.review .relativetime:not([title$='Z']):before {
    content: 'at ';
}
.review.review-bar-container {
    margin-top: 0;
}
.review-bar-container .review-bar {
    line-height: 1;
    font-size: 1rem;
}
.review .ajax-loader {
    margin: 15px;
}
.review-instructions {
    margin-left: 14px;
    margin-top: 10px;
}
.review-bar-container .review-bar .review-more-instructions {
    padding: 16px 14px 0px;
}
.pager, .toggle {
    user-select: none;
}
`;
document.body.appendChild(styles);