// ==UserScript==
// @name         Post Headers & Question TOC
// @description  Sticky post headers while you view each post (helps for long posts). Question ToC of Answers in sidebar.
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.5.1
//
// @include      https://*stackoverflow.com/questions/*
// @include      https://*serverfault.com/questions/*
// @include      https://*superuser.com/questions/*
// @include      https://*askubuntu.com/questions/*
// @include      https://*mathoverflow.net/questions/*
// @include      https://*stackapps.com/questions/*
// @include      https://*.stackexchange.com/questions/*
//
// @exclude      *chat.*
// ==/UserScript==

(function() {
    'use strict';


    const store = window.localStorage;
    const modflair = '<span class="mod-flair" title="moderator">♦</span>';
    const hasFixedHeader = $('.top-bar').hasClass('_fixed');


    // Fetch and store option
    const delKeyRoot = 'PostToC-ShowDeleted';
    function saveShowDeleted(val) {
        if(typeof val === 'undefined' || val == null) return;
        store.setItem(delKeyRoot, val);
    }
    function getShowDeleted() {
        let val = store.getItem(delKeyRoot);
        return val !== 'false';
    }


    // (Promise) Get post timeline
    function getPostTimeline(pid) {
        return new Promise(function(resolve, reject) {
            if(pid == null) { reject(); return; }

            $.ajax(`https://${location.hostname}/posts/${pid}/timeline`)
                .done(function(data) {
                    const events = $('.event-rows', data);
                    resolve(events);
                })
                .fail(reject);
        });
    }
    // (Promise) Get post answers from timeline
    function getPostAnswers(pid) {
        return new Promise(function(resolve, reject) {
            if(pid == null) { reject(); return; }

            getPostTimeline(pid).then(function(v) {
                const answers = $(v).children().filter(function() {
                    return $(this).find('.answer-type').length !== 0;
                });
                resolve(answers);
            });
        });
    }


    // Returns true if element found
    function gotoPost(pid, isQuestion = false) {
        const postBaseUrl = $('#question-header h1 a').attr('href');
        const elem = $(isQuestion ? '#question' : '#answer-'+pid);
        if(elem.length === 1) {
            history.replaceState(null, document.title, `${postBaseUrl}${isQuestion ? '' : '/'+pid+'#'+pid}`);
            $('html, body').animate({ scrollTop: $(isQuestion ? '#question' : '#answer-'+pid).offset().top + 1 }, 600);
            return true;
        }
        return false;
    }


    function initStickyPostHeaders() {

        const postsOnPage = $('#question, .answer').each(function() {
            const post = $(this);
            const isQuestion = post.hasClass('question');
            const pid = isQuestion ? this.dataset.questionid : this.dataset.answerid;

            const postuser = $(this).find('.user-info:last .user-details').first();
            let postuserHtml = '<span class="deleted-user">' + postuser.text() + '</span>'; // default to deleted user
            if(postuser.find('a').length != 0) {
                postuserHtml = postuser.find('a')[0].outerHTML;
            }

            const postismod = postuser.length != 0 ? postuser.next().hasClass('mod-flair') : false;
            const postdate = $(this).find('.user-info .user-action-time').last().html() || '';

            const stickyheader = $(`<div class="post-stickyheader">
${isQuestion ? 'Question' : 'Answer'} by ${postuserHtml}${postismod ? modflair : ''} ${postdate}
<div class="sticky-tools">
  <a href="/posts/${pid}/revisions">revs</a> | <a href="/posts/${pid}/timeline">timeline</a>
</div></div>`);
            post.prepend(stickyheader);
        });

        $('.post-stickyheader a').attr('target', '_blank');
        $('.post-stickyheader').click(function() {
            const isQuestion = $(this.parentNode).hasClass('question');
            const pid = isQuestion ? this.parentNode.dataset.questionid : this.parentNode.dataset.answerid;
            gotoPost(pid, isQuestion);
        }).on('click', 'a', function(evt) {
            evt.stopPropagation();
        });

        function hashChange(evt) {
            let id, elem;
            if(location.hash.indexOf('#comment') == 0) {
                id = location.hash.match(/\d+/)[0];
                elem = $('#comment-'+id);
            }
            else if(location.hash.length > 1) {
                id = location.hash.match(/\d+/)[0];
                elem = $('#answer'-id);
            }

            if(id && elem && elem.length) {
                window.scrollTo({ top: elem.offset().top - (hasFixedHeader ? 40 : 50), behavior: 'instant' });
            }
        }
        window.addEventListener("hashchange", hashChange, false);
        window.addEventListener("load", hashChange, false);
    }


    function initTableOfContentsSidebar() {

        const postsOnPage = $('#answers > .answer');
        const qid = $('#question').attr('data-questionid');
        const sortby = $('#answers-header #tabs .youarehere').text().trim();

        // If no answers, do nothing
        if(postsOnPage.length == 0) return;

        getPostAnswers(qid).then(function(v) {

            if(sortby == 'votes') {
                v = v.get().sort(function(a, b) {
                    const ax = Number($(a).find('.event-comment span:not(.badge-earned-check)').last().text().match(/[-0-9]+$/)[0]);
                    const bx = Number($(b).find('.event-comment span:not(.badge-earned-check)').last().text().match(/[-0-9]+$/)[0]);

                    // If sorted by votes, deleted answers are placed at the bottom
                    const adel = $(a).hasClass('deleted-event');
                    const bdel = $(b).hasClass('deleted-event');

                    return (adel && bdel) || (!adel && !bdel) ? bx - ax : (adel ? 1 : -1); // desc
                });
            }
            else if(sortby == 'oldest') {
                v = v.get().reverse();
            }
            else if(sortby == 'active') {
                v = v.get().sort(function(a, b) {
                    const aid = $(a).find('.event-comment a.timeline').attr('href').match(/[0-9]+/)[0];
                    const bid = $(b).find('.event-comment a.timeline').attr('href').match(/[0-9]+/)[0];
                    const apost = $('#answer-'+aid).get(0);
                    const bpost = $('#answer-'+bid).get(0);

                    if(apost == null || bpost == null) return 0;
                    return apost.offsetTop - bpost.offsetTop;
                });
            }
            const answers = $(v);

            let answerlist = '';
            let deletedCount = 0;
            answers.each(function() {
                const isDel = $(this).hasClass('deleted-event');
                const postuser = $(this).find('.created-by a, .created-by').first();
                const isPostuserDeleted = $(this).find('.created-by a').length === 0;
                const postusername = postuser.text().replace('♦', ' ♦');
                const pid = $(this).find('.event-comment a.timeline').attr('href').match(/[0-9]+/)[0];
                const votes = $(this).find('.event-comment span:not(.badge-earned-check)').last().text().match(/[-0-9]+$/)[0];
                const datetime = $(this).find('.relativetime')[0].outerHTML;
                const isAccepted = $(this).find('.badge-earned-check').length == 1;

                answerlist += `
<div class="spacer ${isDel ? 'deleted-answer':''}" data-answerid="${pid}" data-votes="${votes}" data-datetime="${votes}">
  <a href="/a/${pid}" title="Vote score (upvotes - downvotes)">
    <div class="answer-votes large ${isAccepted ? 'answered-accepted':''}">${votes}</div>
  </a>
  <a href="/a/${pid}" class="post-hyperlink">${isPostuserDeleted ? '<span class="deleted-user">':''}${postusername}</a>
  ${datetime}
</div>`;
                if(isDel) deletedCount++;
            });

            const qtoc = $(`
<div class="module sidebar-linked" id="qtoc">
  <h4 id="qtoc-header">${v.length} Answer${v.length > 1 ? 's' : ''} <span><input id="qtoc-toggle-del" type="checkbox" checked="checked" /><label for="qtoc-toggle-del" title="toggle deleted">${deletedCount} deleted</label></span></h4>
  <div class="linked">${answerlist}</div>
</div>`);

            // Accepted answer first
            qtoc.find('.answered-accepted').parents('.spacer').prependTo(qtoc.find('.linked'));

            // If answer is on current page, clicking on them scrolls to the answer
            qtoc.on('click', 'a', function() {
                const pid = this.parentNode.dataset.answerid;
                return !gotoPost(pid);
            });

            // Insert after featured module
            $('.community-bulletin').after(qtoc);

            // Remove chat and hot network questions as they take up a lot of sidebar real-estate
            $('#chat-feature, #hot-network-questions').hide();

            const deletedAnswersListitems = $('#qtoc-header').next().find('.deleted-answer');
            const deletedAnswers = postsOnPage.filter('.deleted-answer');

            // Toggle checkbox event for deleted answers
            const showDelBtn = $('#qtoc-toggle-del').click(function() {
                const isChecked = $(this).is(':checked');
                saveShowDeleted(isChecked);
                deletedAnswersListitems.toggle(isChecked);
                deletedAnswers.toggle(isChecked);
            });

            // If user previously selected do not show deleted posts, hide them
            if(!getShowDeleted()) showDelBtn.trigger('click');

            // Put count of deleted answers next to total
            $('#answers-header h2').append(`<span class="deleted-count">(${deletedCount} deleted)</span>`);
        });
    }


    function doPageLoad() {

    }


    function appendStyles() {

        const styles = `
<style>
/* Right sidebar */
#qinfo {
    margin-bottom: 6px;
}
#qinfo p.label-key {
    margin-bottom: 6px;
}

/* Sticky post votes/sidebar */
.post-layout--left.votecell {
    grid-row: 1 / 10;
}
.votecell .vote {
    position: sticky;
    top: 10px;
}
.votecell .vote .message {
    min-width: 360px;
}
.downvoted-answer .vote>* {
    transform: translateZ(0);
}

/* Sticky post header */
.question-page #answers .answer {
    border-bottom: none;
}
.answer {
    margin-bottom: 20px;
    padding-bottom: 20px;
    padding-top: 0;
}
.pager-answers {
    padding-top: 10px;
    padding-bottom: 20px;
}
.post-stickyheader {
    position: sticky;
    top: 0;
    display: block;
    margin-bottom: 10px;
    padding: 12px 16px;
    z-index: 5;

    background: #eee;
    border-bottom: 1px solid #ccc;
    cursor: pointer;
}
.post-stickyheader ~ .post-layout .votecell .vote {
    top: 51px;
    z-index: 2;
}
.question:hover .post-stickyheader,
.answer:hover .post-stickyheader {
    z-index: 7;
}
.question:hover .votecell .vote,
.answer:hover .votecell .vote {
    z-index: 6;
}

.post-stickyheader .relativetime {
    color: darkred;
    border-bottom: 1px dashed darkred;
}
.post-stickyheader .sticky-tools {
    float: right;
}
.post-stickyheader .deleted-user {
    margin: -3px 0;
}
/* If topbar is fixed */
.top-bar._fixed ~ .container .post-stickyheader {
    top: 50px;
}
.top-bar._fixed ~ .container .post-stickyheader ~ .post-layout .votecell .vote {
    top: 101px;
}

/* Table of Contents Sidebar */
#qtoc-header > span {
    float: right;
    display: inline-block;
    font-size: 13px;
}
#qtoc .relativetime {
    padding-top: 2px;
    white-space: nowrap;
}
#sidebar .linked a:first-of-type {
    padding-right: 10px;
}
#sidebar #qtoc .spacer {
    margin-bottom: 10px;
    font-size: 12px;
    font-weight: normal;
    color: #999;
}
#qtoc .answer-votes {
    white-space: nowrap;
    width: 38px;
    text-align: center;
    box-sizing: border-box;
    float: none;
    border-radius: 2px;
    font-size: 90%;
    transform: translateY(-1px);
}
#qtoc .answer-votes.large {
    min-width: 16px;
}
#qtoc .post-hyperlink {
    display: inline-block;
    padding-top: 2px;
    width: calc(100% - 48px);
    margin-bottom: 0;
    color: #0C0D0E;
    line-height: 1.3;
    font-size: 13px;
}
#qtoc .post-hyperlink:hover {
    color: #9c1724;
}
#qtoc .deleted-user {
    margin: -3px 0;
}
</style>
`;
        $('body').append(styles);
    }


    appendStyles();
    initStickyPostHeaders();
    initTableOfContentsSidebar();
    doPageLoad();

})();
