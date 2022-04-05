// ==UserScript==
// @name         Possible Vandalism Edits Helper
// @description  Display revision count and post age
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.1
//
// @include      https://*stackoverflow.com/admin/dashboard?flagtype=postvandalismeditsauto*
// @include      https://*serverfault.com/admin/dashboard?flagtype=postvandalismeditsauto*
// @include      https://*superuser.com/admin/dashboard?flagtype=postvandalismeditsauto*
// @include      https://*askubuntu.com/admin/dashboard?flagtype=postvandalismeditsauto*
// @include      https://*mathoverflow.net/admin/dashboard?flagtype=postvandalismeditsauto*
// @include      https://*.stackexchange.com/admin/dashboard?flagtype=postvandalismeditsauto*
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';

// Moderator check
if (typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator) return;

if (unsafeWindow !== undefined && window !== unsafeWindow) {
    window.jQuery = unsafeWindow.jQuery;
    window.$ = unsafeWindow.jQuery;
}

function doPageLoad() {

    $('.post-list .revision-comment a').each(function () {
        const flag = $(this).parents('.flagged-post-row');
        const link = $(this);
        const pid = this.href.match(/\d+/)[0];

        // Get post info
        $.get({
            url: `https://stackoverflow.com/posts/${pid}/timeline`,
            success: function (data) {
                const eventrows = $('.event-rows tr', data);
                const dateCreated = new Date(eventrows.filter('[data-eventtype="history"]').last().find('.relativetime').attr('title'));
                const dateDiff = Date.now() - dateCreated;
                const age = Math.floor(dateDiff / 86400000); // 86400000 = 1 day
                const revisions = eventrows.filter(function () {
                    return $(this).find('.event-verb, .wmn1').text().includes('edited');
                });
                //console.log(eventrows, dateCreated, age, revisions.length);

                link.before(`<span class="info-num rev-count ${revisions.length >= 5 ? 'red' : ''}" title="post revisions">${revisions.length}</span>`);
                link.before(`<span class="info-num post-age ${age > 365 ? 'red' : ''}" title="post age">${age}d</span>`);
            }
        });
    });
}


// On page load
doPageLoad();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
.post-header,
.post-summary,
.close-question-button,
.undelete-post,
.delete-post,
p[title="question originally asked"],
.user-action-time,
.mod-audit-user-info + br {
    display: none !important;
}
.post-list {
    margin-left: 0;
}
.post-list .title-divider {
    margin-top: 5px;
}
.revision-comment {
    position: relative;
    display: block;
}
.revision-comment:hover {
    background: cornsilk;
}
.info-num {
    display: inline-block;
    min-width: 18px;
    margin-right: 10px;
    font-weight: bold;
    font-size: 1.1em;
}
.info-num.red {
    color: var(--red-500);
}
.post-recommendation {
    display: block;
    margin: 5px 0;
    font-weight: bold;
    font-size: 1.2em;
}
.post-recommendation:before {
    content: 'Recommendation: ';
}
.tagged-ignored {
    opacity: 1;
}
`;
document.body.appendChild(styles);
