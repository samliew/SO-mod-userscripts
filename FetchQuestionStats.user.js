// ==UserScript==
// @name         Fetch Question Stats
// @description  Display number of comments on each post in question lists. For mod queues, additional info (recent revision history) is also retrieved.
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0.6
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*.stackexchange.com/*
//
// @exclude      *chat.*
// @exclude      https://stackoverflow.com/c/*
// ==/UserScript==


(function() {
    'use strict';


    const fkey = StackExchange.options.user.fkey;
    const timestampAt = daysago => Math.floor(new Date(Date.now() - daysago * 24 * 60 * 60 * 1000) / 1000);


    // Get comments for posts
    function getPostComments(arrPids, daysago = 30) {
        return new Promise(function(resolve, reject) {
            if(typeof arrPids === 'undefined' || arrPids === null || arrPids.length == 0) { reject(); return; }

            $.get(`http://api.stackexchange.com/2.2/posts/${arrPids.join(';')}/comments?pagesize=100&fromdate=${timestampAt(daysago)}&order=desc&sort=creation&site=${location.hostname}&filter=!*JxbCg3rl-(BR7.w`)
                .done(function(data) {
                    resolve(data.items);
                    return;
                })
                .fail(reject);
        });
    }


    // Get revisions for posts (including first rev)
    function getPostRevisions(arrPids, daysago = 30) {
        return new Promise(function(resolve, reject) {
            if(typeof arrPids === 'undefined' || arrPids === null || arrPids.length == 0) { reject(); return; }

            $.get(`http://api.stackexchange.com/2.2/posts/${arrPids.join(';')}/revisions?pagesize=100&fromdate=${timestampAt(daysago)}&site=${location.hostname}&filter=!SWJaJDLw60c6cEGmKi`)
                .done(function(data) {
                    resolve(data.items);
                    return;
                })
                .fail(reject);
        });
    }


    function doPageLoad() {

        // Append statscontainer to posts in mod queues
        $('.flagged-posts .flagged-post-row .post-summary').append(`<div class="statscontainer"></div>`);

        const modonly = location.pathname.includes('/admin/dashboard');
        const questions = $('#questions .question-summary, .flagged-posts .flagged-post-row');
        const pids = questions.map((i, el) => el.id.replace(/\D+/g, '')).get();

        if(pids.length == 0) return;

        getPostComments(pids).then(function(comments) {
            questions.each(function() {
                const pid = Number(this.id.replace(/\D+/g, ''));
                const cmmts = comments.filter(v => v.post_id === pid);
                $(this).find('.statscontainer').append(modonly ?
                     `<div class="views" title="${cmmts.length} recent comments"><a href="https://${location.hostname}/a/${pid}" target="_blank">${cmmts.length} recent comments<a/></div>` :
                     `<div class="views" title="${cmmts.length} recent comments">${cmmts.length} cmmts</div>`);
            });
        })
        .finally(function() {

            if(!modonly) return;

            // If mod queue, also load revisions
            getPostRevisions(pids).then(function(revisions) {
                questions.each(function() {
                    const flagDates = $(this).find('.mod-message .relativetime').map((i, el) => new Date(el.title).getTime() / 1000).sort();
                    const pid = Number(this.id.replace(/\D+/g, ''));
                    const revs = revisions.filter(v => v.post_id === pid);
                    const revsSinceFlag = revs.filter(v => v.creation_date > flagDates[0]);
                    const statsContainer = $(this).find('.statscontainer');

                    if(revsSinceFlag.length > 0) {
                        statsContainer.append(`<div class="views warning"><a href="https://${location.hostname}/posts/${pid}/revisions" target="_blank" title="view revisions">modified ${revsSinceFlag.length} times since flagged</a></div>`);
                    }
                    else {
                        statsContainer.append(`<div class="views"><a href="https://${location.hostname}/posts/${pid}/revisions" target="_blank" title="view revisions">${revs.length} recent revisions</a></div>`);
                    }
                });

            }).finally(function() {
                questions.each(function() {
                    const pid = Number(this.id.replace(/\D+/g, ''));
                    const flagCount = $(this).find('.bounty-indicator-tab').hide().map((i, el) => Number(el.innerText)).get().reduce((a, c) => a + c);
                    const statsContainer = $(this).find('.statscontainer');
                    statsContainer.append(`<div><a href="https://${location.hostname}/posts/${pid}/timeline" target="_blank" title="view post timeline">${flagCount} flags</a></div>`);
                });
            });
        });
    }


    function appendStyles() {

        const styles = `
<style>
.flagged-post-row .statscontainer {
    display: inline-flex;
    justify-content: space-between;
    width: 100%;
    margin: 10px 0 -10px;
    padding: 8px 10px;
    border: 1px solid #eee;
}
.flagged-post-row .statscontainer > div {
    width: auto;
    padding: 0;
    line-height: 1.3;
    text-align: left;
    color: #333;
}
.flagged-post-row .statscontainer > div:last-child {
    margin-bottom: 0;
}
.flagged-post-row .statscontainer a {
    color: inherit;
}
.flagged-post-row .statscontainer .warning {
    color: #f00;
}
.flagged-post-row .statscontainer .warning a {
    font-weight: bold;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageLoad();

})();
