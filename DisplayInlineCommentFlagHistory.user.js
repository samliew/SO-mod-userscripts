// ==UserScript==
// @name         Display Inline Comment Flag History
// @description  Grabs post timelines and display comment flag counts beside post comments, on comment hover displays flags
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.3.3
//
// @include      https://*stackoverflow.com/questions/*
// @include      https://*serverfault.com/questions/*
// @include      https://*superuser.com/questions/*
// @include      https://*askubuntu.com/questions/*
// @include      https://*mathoverflow.com/questions/*
// @include      https://*.stackexchange.com/questions/*
// ==/UserScript==

(function() {
    'use strict';

    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;

    const baseUrl = `//${location.hostname}/posts/`;


    function doPageload() {

        $('.question, .answer').not('.js-cmmtflags-loaded').each(function() {

            // So we only load each post's timeline once
            $(this).addClass('js-cmmtflags-loaded');

            const postId = this.dataset.questionid || this.dataset.answerid;
            const isQ = $(this).hasClass('question');
            //console.log(postId, isQ);

            $.get(baseUrl + postId + '/timeline', function(data) {
                const cmmtDiv = $('<div class="all-comment-flags"></div>').appendTo('#comments-'+postId);
                const eventRows = $('.event-rows', data);
                const cmmtFlags = eventRows.find('tr[data-eventtype="flag"]').filter((i, el) => $(el).find('.event-type.flag').text() === 'comment flag');

                eventRows.find('tr[data-eventtype="comment"]').filter((i, el) => $(el).find('.toggle-comment-flags').length == 1).each(function() {
                    const cmmt = $(this);
                    const cmmtId = this.dataset.eventid;
                    const cmmtFlagIds = $(this).find('.toggle-comment-flags').attr('data-flag-ids').split(';');
                    const cmmtFlagsDiv = $('<div class="comment-flags"></div>').appendTo(`#comment-${cmmtId} .comment-text`);
                    const cmmtFlagcountDiv = $(`<a class="comment-flagcount supernovabg" title="comment flags" href="${baseUrl}${postId}/timeline#comment_${cmmtId}" target="_blank">${cmmtFlagIds.length}</a>`)
                                                 .appendTo(`#comment-${cmmtId} .comment-actions`);
                    $(`#comment-${cmmtId}`).addClass('hasflags');

                    $.each(cmmtFlagIds, function(i, v) {
                        const fEvent = cmmtFlags.filter(`[data-eventid="${v}"]`).first();
                        const fType = fEvent.find('.event-verb').text().replace(/(^\s+|\s+$)/g, '');
                        const num = Number(cmmt.attr('data-flagtype-'+fType)) || 0;
                        cmmt.attr('data-flagtype-'+fType, num + 1);
                        fEvent.clone(true,true).appendTo(cmmt);
                        fEvent.clone(true,true).appendTo(cmmtFlagsDiv);
                        //console.log(postId, cmmtId, v, fType, fEvent);
                    });
                }).appendTo(cmmtDiv);
                //console.log(cmmtDiv);

                $('.event-comment').filter((i, el) => el.innerText.replace(/(^\s+|\s+$)/g, '') === 'rude or abusive').addClass('rude-abusive');
            });
        });
    }


    function updateCommentsFromTimelines() {

        $('.question, .answer').filter('.js-cmmtflags-loaded').each(function() {

            const postId = this.dataset.questionid || this.dataset.answerid;
            const isQ = $(this).hasClass('question');
            //console.log(postId, isQ);

            const eventRows = $('.all-comment-flags', this).children('tr');

            eventRows.each(function() {
                const cmmt = $(this);
                const cmmtId = this.dataset.eventid;
                const cmmtFlagIds = $(this).find('.toggle-comment-flags').attr('data-flag-ids').split(';');

                const comment = $(`#comment-${cmmtId}`);
                if(comment.hasClass('hasflags')) return;
                comment.addClass('hasflags');

                const cmmtFlagsDiv = $('<div class="comment-flags"></div>').appendTo(`#comment-${cmmtId} .comment-text`);
                const cmmtFlagcountDiv = $(`<a class="comment-flagcount supernovabg" title="comment flags" href="${baseUrl}${postId}/timeline#comment_${cmmtId}" target="_blank">${cmmtFlagIds.length}</a>`)
                                             .appendTo(`#comment-${cmmtId} .comment-actions`);

                cmmt.find('tr[data-eventtype]').each(function() {
                    const fEvent = $(this);
                    $(this).clone(true,true).appendTo(cmmtFlagsDiv);
                    //console.log(postId, cmmtId, cmmtId);
                });
            });
        });

        $('.event-comment').filter((i, el) => el.innerText.replace(/(^\s+|\s+$)/g, '') === 'rude or abusive').addClass('rude-abusive');
    }


    function listenToPageUpdates() {

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {
            if(settings.url.indexOf('/comments') >= 0) updateCommentsFromTimelines();
        });
    }


    function appendStyles() {

        const styles = `
<style>
.all-comment-flags,
.comment-flags {
    display: none;
}
.comment-flags .dno {
    display: block;
}
.comment .comment-text {
    position: relative;
}
.comment:hover .comment-text {
    z-index: 1;
}

.comment.hasflags .comment-actions {
    border-left: 1px solid transparent;
    transition: none;
}
.comment.hasflags .comment-text {
    border-right: 1px solid transparent;
    transition: none;
}
.comment.hasflags:hover .comment-actions,
.comment.hasflags:hover .comment-text {
    border-color: #ddd;
    background: #ffffe8;
}

.comment:hover .comment-flags {
    display: block;
}
.comment .comment-flags {
    position: absolute;
    top: 100%;
    right: -1px;
    width: calc(100% + 7px);
    padding: 0px 10px 10px;
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
    background: #ffffe8;
    border: 1px solid #ddd;
    border-top: none;
    box-shadow: 2px 2px 6px -2px rgba(0,0,0,0.2);
    z-index: 1;
}
.comment .comment-flags td,
.comment .comment-flags td.creation-date .simultaneous-symbol {
    display: none;
}
.comment .comment-flags td.creation-date,
.comment .comment-flags td.event-comment {
    display: inline-block;
    min-width: 100px;
    max-width: 500px;
    margin-top: 8px;
    vertical-align: top;
}
.comment-flagcount {
    min-width: 18px;
    padding: 2px 0;
    border-radius: 3px;
    text-align: center;
    font-size: 0.85em;
    color: white !important;
}
.rude-abusive {
    color: red;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();
    listenToPageUpdates();

})();
