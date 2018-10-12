// ==UserScript==
// @name         Recently Rejected Suggested Edits
// @description  New page to review recently rejected suggested edits
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0
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
// ==/UserScript==

(function() {
    'use strict';


    const sitename = StackExchange.options.site.name.replace('Stack Exchange').trim();
    const resultsDiv = $(`<div id="reviews"></div>`);
    const pagerDiv = $(`<div class="pager fl"></div>`);
    let backoff = new Date();


    const getQueryParam = key => new URLSearchParams(location.search).get(key);
    const toDateFormat = d => d.toISOString().replace('T', ' ').replace('.000', '');


    function buildPagination(max, page = 1, baseUrl = "", range = 5) {

        pagerDiv.empty();

        let str = '';
        let from = page - range;
        let to = page + range;

        if(from < 1) from = 1;
        if(to > max) to = max;

        if(page - 1 >= 1) {
            str += `<a href="${baseUrl}?page=${page - 1}" rel="next"><span class="page-numbers prev">prev</span></a> `;
        }

        if(from > 1) {
            str += `<a href="${baseUrl}?page=1"><span class="page-numbers">1</span></a> `;
            if(from > 2) {
                str += `<span class="page-numbers dots">…</span> `;
            }
        }

        for(let i = from; i <= to; i++) {
            i == page ?
              str += `<span class="page-numbers current">${i}</span> ` :
              str += `<a href="${baseUrl}?page=${i}"><span class="page-numbers">${i}</span></a> `;
        }

        if(to < max) {
            if(to < max - 1) {
                str += `<span class="page-numbers dots">…</span> `;
            }
            str += `<a href="${baseUrl}?page=${max}"><span class="page-numbers">${max}</span></a> `;
        }

        if(page + 1 <= max) {
            str += `<a href="${baseUrl}?page=${page + 1}" rel="next"><span class="page-numbers next">next</span></a> `;
        }

        pagerDiv.html(str);
    }


    function getRejected(page = 1) {

        // Check for backoff
        if(new Date() <= backoff) {
            console.log('backoff');
            return;
        }

        resultsDiv.empty();
        StackExchange.helpers.addSpinner('#reviews');

        $.get(`https://api.stackexchange.com/2.2/suggested-edits?page=${page}&pagesize=100&order=desc&sort=rejection&filter=!*KkBP6Je7loS9)xf&site=${location.hostname}`, function(data) {
            StackExchange.helpers.removeSpinner();

            // Store backoff value if found
            if(data.backoff) {
                backoff = new Date();
                backoff.setSeconds( backoff.getSeconds() + data.backoff);
            }

            const items = data.items;
            let html = '';

            items.forEach(function(v) {
                const posttype = v.post_type.charAt(0);
                const creationDate = new Date(v.creation_date * 1000);
                const rejectionDate = new Date(v.rejection_date * 1000);
                const proposingUser = !v.proposing_user ? '<span class="userlink">anonymous</span>' :
                  `<a class="userlink" href="${v.proposing_user.link}" title="rep: ${v.proposing_user.reputation}, type: ${v.proposing_user.user_type}">${v.proposing_user.display_name}</a>`;

                html += `<div class="review">
  ${proposingUser}
  <a href="/suggested-edits/${v.suggested_edit_id}">suggested edit</a>
  on <a href="/${posttype}/${v.post_id}" class="answer-hyperlink">${posttype}${v.post_id}</a>
  was rejected <span title="-" class="relativetime">${toDateFormat(rejectionDate)}</span>
</div>`;
            });

            resultsDiv.append(html);
            StackExchange.realtime.updateRelativeDates();

            buildPagination(Math.ceil(data.total / data.page_size), data.page);
        });
    }


    function initRejectsPage() {

        document.title = `Rejected Reviews - Suggested Edits - ${sitename}`;

        // Insert nav and results container
        const content = $('#mainbar-full').html('').append(`<div class="subheader tools-rev">
    <h1><a href="/review">Review</a><span class="lsep">|</span><span class="review-title">Rejected Suggested Edits</span></h1>
    <div id="tabs">
        <a href="/review/suggested-edits/stats">stats</a>
        <a href="/review/suggested-edits/history">history</a>
        <a href="/review/suggested-edits/history/rejects" class="youarehere">rejects</a>
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
        pagerDiv.on('click', 'a', function(evt) {
            const pagenum = Number($(this).attr('href').match(/page=\d+/)[0].split('=')[1]);
            getRejected(pagenum);
            return false;
        });

        // Toggle time format
        $(`<a class="toggle-date-format">toggle format</a>`).insertBefore(resultsDiv).click(function() {
            $('#reviews .relativetime').each(function(i, el) {
                // Switch title and text
                const tmp = el.innerText;
                el.innerText = el.title;
                el.title = tmp;
            });
            StackExchange.realtime.updateRelativeDates();
        });
    }


    function doPageload() {

        if(location.pathname === '/review/suggested-edits/history/rejected') {
            appendStyles();
            initRejectsPage();
        }
        else if(location.pathname.includes('/review/suggested-edits')) {
            // Add to nav tabs
            const histlink = $('#tabs').find('a[href="/review/suggested-edits/history"]');
            histlink.clone().removeClass('youarehere').attr('href', '/review/suggested-edits/history/rejected').text('rejects').insertAfter(histlink);
        }
        else if(location.pathname === '/admin/links') {
            $('.content-page ul').first().append(`<li><a href="/review/suggested-edits/history/rejects">Rejected suggested edits</a></li>`);
        }

    }


    function appendStyles() {

        const styles = `
<style>
#reviews {
    line-height: 2em;
    font-size: 14px;
}
.review:nth-child(even) {
    background: #f6f6f6;
}
.userlink {
    display: inline-block;
    min-width: 250px;
    text-align: right;
}
.answer-hyperlink {
    display: inline-block;
    min-width: 71px;
    margin-bottom: 0;
}
.relativetime {
    display: inline-block;
    min-width: 83px;
}
.relativetime:not([title$='Z']):before {
    content: 'at ';
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    doPageload();

})();
