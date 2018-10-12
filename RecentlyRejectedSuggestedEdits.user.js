// ==UserScript==
// @name         Recently Rejected Suggested Edits
// @description  New page to review recently rejected suggested edits
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.1
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
    const now = new Date();


    const getQueryParam = key => new URLSearchParams(location.search).get(key);
    const toDateFormat = d => d.toISOString().replace('T', ' ').replace('.000', '');


    function getRejected(page = 1) {
        resultsDiv.empty();

        $.get(`https://api.stackexchange.com/2.2/suggested-edits?pagesize=100&order=desc&sort=rejection&filter=!*KkBP6Je7loS9)xf&site=${location.hostname}`, function(data) {
            const items = data.items;
            let html = '';

            items.forEach(function(v) {
                const creationDate = new Date(v.creation_date * 1000);
                const rejectionDate = new Date(v.rejection_date * 1000);
                const proposingUser = v.proposing_user ? `<a href="${v.proposing_user.link}" title="rep:${v.proposing_user.reputation}, type:${v.proposing_user.user_type}">
  <img src="${v.proposing_user.profile_image}" width="16" /> ${v.proposing_user.display_name}</a>` : 'anonymous';

                html += `<div class="review">
  ${proposingUser}
  <a href="/suggested-edits/${v.suggested_edit_id}">suggested edit</a>
  on <a href="/q/${v.post_id}" class="answer-hyperlink">${v.post_id}</a> (${v.post_type.charAt(0)})
  <span title="${toDateFormat(creationDate)}" class="relativetime"></span>,
  and rejected <span title="${toDateFormat(rejectionDate)}" class="relativetime"></span>
</div>`;
            });

            resultsDiv.append(html);
            StackExchange.realtime.updateRelativeDates();
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
</div>`).append(resultsDiv);

        // Get list from API
        getRejected(1);

        // Update timings every min
        setInterval(function() {
            StackExchange.realtime.updateRelativeDates();
        }, 60000);
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

</style>
`;
        $('body').append(styles);
    }


    // On page load
    doPageload();

})();
