// ==UserScript==
// @name         Possible Vandalism Edits Helper
// @description  Display revision count and post age
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.1.1
//
// @include      https://*stackoverflow.com/admin/dashboard?flagtype=postvandalismeditsauto*
// @include      https://*serverfault.com/admin/dashboard?flagtype=postvandalismeditsauto*
// @include      https://*superuser.com/admin/dashboard?flagtype=postvandalismeditsauto*
// @include      https://*askubuntu.com/admin/dashboard?flagtype=postvandalismeditsauto*
// @include      https://*mathoverflow.net/admin/dashboard?flagtype=postvandalismeditsauto*
// @include      https://*.stackexchange.com/admin/dashboard?flagtype=postvandalismeditsauto*
// ==/UserScript==

(function() {
    'use strict';

    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;


    function doPageload() {

        $('.post-list .revision-comment a').each(function() {

            const flag = $(this).parents('.flagged-post-row');
            const link = $(this);
            const pid = this.href.match(/\d+/)[0];

            // Get post info
            $.get({
                url: `https://stackoverflow.com/posts/${pid}/timeline`,
                success: function(data) {
                    const eventrows = $('.event-rows tr', data);
                    const dateCreated = new Date(eventrows.filter('[data-eventtype="history"]').last().find('.relativetime').attr('title'));
                    const dateDiff = Date.now() - dateCreated;
                    const age = Math.floor(dateDiff / 3600000);
                    const revisions = eventrows.filter(function() {
                        return $(this).find('.event-verb').text().indexOf('edited') >= 0;
                    });
                    //console.log(eventrows, dateCreated, age, revisions.length);

                    link.before(`<span class="info-num rev-count ${revisions.length >= 5 ? 'red' : ''}" title="post revisions">${revisions.length}</span>`);
                    link.before(`<span class="info-num post-age ${age > 365 ? 'red' : ''}" title="post age">${age}d</span>`);
                }
            });

        });
    }


    function appendStyles() {

        const styles = `
<style>
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
    color: red;
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
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();

})();
