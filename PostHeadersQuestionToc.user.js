// ==UserScript==
// @name         Post Headers & Question TOC
// @description  Sticky post headers while you view each post (helps for long posts). Question ToC of Answers in sidebar.
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.7
//
// @include      https://*stackoverflow.com/questions/*
// @include      https://*serverfault.com/questions/*
// @include      https://*superuser.com/questions/*
// @include      https://*askubuntu.com/questions/*
// @include      https://*mathoverflow.net/questions/*
// @include      https://*stackapps.com/questions/*
// @include      https://*.stackexchange.com/questions/*
//
// @include      https://*stackoverflow.com/election*
// @include      https://*serverfault.com/election*
// @include      https://*superuser.com/election*
// @include      https://*askubuntu.com/election*
// @include      https://*mathoverflow.net/election*
// @include      https://*stackapps.com/election*
// @include      https://*.stackexchange.com/election*
//
// @include      https://stackoverflow.com/c/*/questions/*
//
// @exclude      *chat.*
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
//
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';


    const store = window.localStorage;
    const routePrefix = StackExchange.options.site.routePrefix || '';
    const isElectionPage = document.body.classList.contains('election-page');
    const modflair = '<span class="mod-flair" title="moderator">♦</span>';
    const hasFixedHeader = $('.top-bar').hasClass('_fixed');


    const pluralize = num => num != 1 ? 's' : '';


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

            $.ajax(`https://${location.hostname}${routePrefix}/posts/${pid}/timeline`, {
                    xhr: jQueryXhrOverride
                })
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
        let elem = $(isQuestion ? '#question' : '#answer-'+pid);

        if(isElectionPage || elem.length === 0) {
            elem = $(`#post-${pid}, .candidate-row[data-candidate-id="${pid}"]`).first();
        }

        if(elem.length === 1) {

            if(isElectionPage) {
                history.replaceState(null, document.title, `${location.pathname}${location.search}#post-${pid}`);
            }
            else {
                history.replaceState(null, document.title, `${postBaseUrl}${isQuestion ? '' : '/'+pid+'#'+pid}`);
            }
            $('html, body').animate({ scrollTop: elem.offset().top + 1 }, 400);
            return true;
        }
        return false;
    }


    function gotoAnchor(aid) {
        aid = aid.replace(/^#/, '');

        const postBaseUrl = $('#question-header h1 a').attr('href');
        let elem = $('#' + aid);
        let isQuestion = elem.closest('.answer').length == 0;
        let post = elem.closest('.question, .answer').get(0);
        let pid = post ? Number(post.dataset.questionid || post.dataset.answerid) : 0;

        if(pid && elem.length === 1) {
            history.replaceState(null, document.title, `${postBaseUrl}${isQuestion ? '#'+aid : '/'+pid+'#'+aid}`);
            $('html, body').animate({ scrollTop: elem.offset().top - (hasFixedHeader ? 40 : 50) }, 400);
            return true;
        }
        return false;
    }


    function initStickyPostHeaders() {

        const postsOnPage = $('#question, .answer, .candidate-row').each(function() {
            const post = $(this);
            const isQuestion = post.hasClass('question');
            const pid = isQuestion ? this.dataset.questionid : this.dataset.answerid;
            const isWiki = $(this).find('span.community-wiki').length > 0;

            const postuser = $(this).find('.user-info:last .user-details').last().children('a, span.d-none');
            let postuserHtml = '<span class="deleted-user">' + postuser.last().text() + '</span>'; // default to deleted user
            if(isWiki) {
                postuserHtml = '<span>' + postuser.last().text() + '</span>';
            }
            else if(postuser.length == 2) {
                postuserHtml = postuser.filter('a')[0].outerHTML;
            }

            const postismod = postuser.length != 0 ? postuser.next().hasClass('mod-flair') : false;
            const postdate = $(this).find('.user-info .user-action-time').last().html() || '';

            if(post.find('.post-layout--left').length == 0) {
                post.find('.post-layout--right').before(`<div class="votecell post-layout--left"></div>`);
            }

            const stickyheader = $(`<div class="post-stickyheader">
${isElectionPage ? 'Nomination' : isQuestion ? 'Question' : 'Answer'} by ${postuserHtml}${postismod ? modflair : ''} ${postdate}
<div class="sticky-tools">
  <a href="${routePrefix}/posts/${pid}/revisions">revs</a> | <a href="${routePrefix}/posts/${pid}/timeline?filter=WithVoteSummaries">timeline</a>
</div></div>`);
            post.prepend(stickyheader);
        });

        $('.post-stickyheader a').attr('target', '_blank');
        $('.post-stickyheader').click(function() {
            const isQuestion = $(this.parentNode).hasClass('question');
            const p = this.parentNode;
            const pid = isQuestion ? p.dataset.questionid : p.dataset.answerid || p.id.replace('post-', '') || p.dataset.candidateId;
            gotoPost(pid, isQuestion);
        }).on('click', 'a', function(evt) {
            evt.stopPropagation();
        });

        function hashChange(evt) {
            if(location.hash == null || /^#\d+$/.test(location.hash) == false) return;

            let id = location.hash.match(/\d+/)[0];
            let elem;

            if(location.hash.indexOf('#comment') == 0) {
                elem = $('#comment-'+id);
            }
            else if(location.hash.length > 1) {
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

        if(isElectionPage) {

            $('#sidebar').addClass('show-votes');

            let nominations = $('.candidate-row');
            const answerContainer = nominations.first().parent();

            // Sort by votes if votes shown
            if($('.js-vote-count').length > 0) {
                let sortedList = nominations.get().sort(function(a, b) {
                    const ax = Number($(a).find('.js-vote-count')[0].dataset.value);
                    const bx = Number($(b).find('.js-vote-count')[0].dataset.value);
                    return bx - ax; // desc
                });
                nominations = $(sortedList);
                answerContainer.append(nominations);
            }

            let answerlist = '';
            nominations.each(function() {
                const postuser = $(this).find('.user-details a').first();
                const postusername = postuser.text();
                const pid = this.id.replace('post-', '') || this.dataset.candidateId;
                const votes = $(this).find('.js-vote-count').text();
                const datetime = $(this).find('.relativetime')[0].outerHTML;

                answerlist += `
<div class="spacer" data-answerid="${pid}">
  <a href="#${pid}" title="Vote score (upvotes - downvotes)">
    <div class="answer-votes large">${votes}</div>
  </a>
  <a href="#${pid}" class="post-hyperlink">${postusername}</a>
  ${datetime}
</div>`;
            });

            const qtoc = $(`
<div class="module sidebar-linked" id="qtoc">
  <h4 id="qtoc-header">${nominations.length} Candidate${pluralize(nominations.length)}</h4>
  <div class="linked">${answerlist}</div>
</div>`);

            // If answer is on current page, clicking on them scrolls to the answer
            qtoc.on('click', 'a', function() {
                const pid = this.parentNode.dataset.answerid;
                return !gotoPost(pid);
            });

            // Insert after featured module
            $('#sidebar .module.newuser').after(qtoc);

            return;
        }

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
                const postuser = $(this).find('.js-created-by a, .js-created-by').first();
                const isPostuserDeleted = $(this).find('.js-created-by a').length === 0;
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
  <h4 id="qtoc-header">${v.length} Answer${pluralize(v.length)} <span><input id="qtoc-toggle-del" type="checkbox" checked="checked" /><label for="qtoc-toggle-del" title="toggle deleted">${deletedCount} deleted</label></span></h4>
  <div class="linked">${answerlist}</div>
</div>`);

            // Accepted answer first
            qtoc.find('.answered-accepted').parents('.spacer').prependTo(qtoc.find('.linked'));

            // If answer is on current page, clicking on them scrolls to the answer
            qtoc.on('click', 'a', function() {
                const pid = this.parentNode.dataset.answerid;
                return !gotoPost(pid);
            });

            // Insert after linked or related posts module
            $('.sidebar-linked, .sidebar-related').first().before(qtoc);

            // Remove chat and hot network questions as they take up a lot of sidebar real-estate
            $('#chat-feature, #hot-network-questions').hide();
            $('.js-chat-ad-link').closest('.module').hide();

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


    function initNamedAnchors() {

        // Parse headers and insert anchors
        $('.post-text').find('h1, h2, h3').each(function() {
            // Only if they do not contain links
            if($(this).children('a').length > 0) return;

            const id = this.innerText.toLowerCase().replace(/'/g, '').replace(/\W+/g, '-').replace(/(^\W+|\W+$)/g, '')
            this.id = id;
            $(this).wrap(`<a class="js-named-anchor" href="#${id}"></a>`);
        });

        // Click event
        $('.post-text').on('click', 'a.js-named-anchor', function() {
            gotoAnchor(this.hash);
            return false;
        });

        // On page load, if not answer permalink
        if(location.hash && /^#\d+?$/.test(location.hash) == false) {
            setTimeout(() => gotoAnchor(location.hash), 50);
        }
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

/* Hide newsletter sidebar ad,
   since we need all the space we can get */
#newsletter-ad {
    display: none !important;
}

/* Sticky post votes/sidebar */
.post-layout {
    overflow: visible !important;
}
.post-layout--left.votecell {
    grid-row: 1 / 10;
}
.votecell .vote,
.votecell .js-voting-container {
    position: sticky;
    top: 10px;
    padding-bottom: 20px;
    background-color: rgba(255,255,255,0.5);
}
.deleted-answer .votecell .vote,
.deleted-answer .votecell .js-voting-container {
    background-color: rgba(253, 243, 244, 0.6);
}
.votecell .vote .message,
.votecell .js-voting-container .message {
    min-width: 360px;
}
.downvoted-answer .vote > * {
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
.post-stickyheader a:not([href*="/users/"]) {
    color: inherit;
}
.election-page .votecell .vote,
.election-page .votecell .js-voting-container {
    top: 0px;
}
.post-stickyheader ~ .post-layout .votecell .vote,
.post-stickyheader ~ .post-layout .votecell .js-voting-container {
    top: 51px;
    z-index: 2;
}
.question:hover .post-stickyheader,
.answer:hover .post-stickyheader {
    z-index: 7;
}
.question:hover .votecell .vote,
.question:hover .votecell .js-voting-container,
.answer:hover .votecell .vote,
.answer:hover .votecell .js-voting-container {
    z-index: 6;
}
#postflag-bar {
    z-index: 1000;
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
.election-page .post-stickyheader .sticky-tools {
    display: none;
}

/* Remove timeline button in post sidebar as we have a link in the header now */
.js-post-issue[title="Timeline"] {
    display: none;
}

/* If topbar is fixed */
.top-bar._fixed ~ .container .post-stickyheader,
.election-page .top-bar._fixed ~ .container .votecell .vote,
.election-page .top-bar._fixed ~ .container .votecell .js-voting-container {
    top: 50px;
}
.top-bar._fixed ~ .container .post-stickyheader ~ .post-layout .votecell .vote,
.top-bar._fixed ~ .container .post-stickyheader ~ .post-layout .votecell .js-voting-container {
    top: 101px;
}

/* Table of Contents Sidebar */
body:not(.no-grid-post-layout) .post-layout--full {
    grid-column: 2 / 3;
}
body:not(.no-grid-post-layout) .post-layout--full .question-status {
    position: relative;
    left: -60px;
    width: calc(100% + 60px);
}
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
#qtoc .deleted-answer {
    margin-left: 0;
    padding-left: 0;
    border: 0;
}

/* Named anchors functionality */
a.js-named-anchor {
    text-decoration: none !important;
    color: inherit !important;
}
</style>
`;
        $('body').append(styles);
    }


    appendStyles();
    initStickyPostHeaders();
    initTableOfContentsSidebar();
    initNamedAnchors();

})();
