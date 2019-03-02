// ==UserScript==
// @name         Post Ids Everywhere
// @description  Inserts post IDs everywhere where there's a post or post link
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.7.1
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://stackapps.com/*
// @include      https://*.stackexchange.com/*
//
// @exclude      https://stackoverflow.com/c/*
// ==/UserScript==

(function() {
    'use strict';


    // See also https://github.com/samliew/dynamic-width
    $.fn.dynamicWidth = function () {
        var plugin = $.fn.dynamicWidth;
        if (!plugin.fakeEl) plugin.fakeEl = $('<span>').hide().appendTo(document.body);

        function sizeToContent (el) {
            var $el = $(el);
            var cs = getComputedStyle(el);
            plugin.fakeEl.text(el.value || el.innerText || el.placeholder).css('font', $el.css('font'));
            $el.css('width', plugin.fakeEl.width() + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight));
        }

        return this.each(function (i, el) {
            sizeToContent(el);
            $(el).on('change keypress keyup blur', evt => sizeToContent(evt.target));
        });
    };


    function insertPostIds() {

        // Lists
        $('a.question-hyperlink, a.answer-hyperlink, .js-post-title-link').each((i,el) => {
            if(el.href.includes('/election')) return;
            let pid = el.href.match(/(?<=[/#])(\d+)/g);
            pid = $(this).hasClass('answer-hyperlink') ? pid.pop() : pid.shift();
            $('<input class="post-id" title="double click to view timeline" value="'+el.href.match(/(?<=[/#])(\d+)/g).pop()  +'" readonly />').insertAfter(el)
        });

        // Q&A
        $('[data-questionid], [data-answerid]').not('.close-question-link').each((i,el) => $('<input class="post-id" value="'+(el.dataset.answerid||el.dataset.questionid)+'" readonly />').insertBefore($(el).find('.post-layout')));

        // Remove duplicates if necessary
        $('.post-id ~ .post-id').remove();

        $('.post-id').dynamicWidth();
    }


    function doPageLoad() {
        $(document).ajaxComplete(insertPostIds);
        insertPostIds();

        // Select when focused
        $(document).on('click', 'input.post-id', function() { this.select(); });

        // Open post timeline in new tab when double clicked
        $(document).on('dblclick', 'input.post-id', function() { window.open(`https://${location.hostname}/posts/${this.value}/timeline`, ''); });
    }


    function appendStyles() {

        const styles = `
<style>
[class*='link'],
[data-questionid],
[data-answerid],
[data-post-id],
.count-cell + td,
.user-tab-content td,
.user-tab-content h3,
.summary h3,
.summary-table td,
.history-table td,
.top-posts .post-container,
.mod-section table.table td,
.post-container {
    position: relative;
}
.popup[data-questionid],
.popup[data-answerid] {
    position: absolute;
}
.flagged-post-row .answer-link {
    float: none;
}

.post-id {
    position: absolute;
    top: 0;
    right: 0;
    width: 5rem;
    min-width: 36px;
    margin: 0;
    padding: 3px 0;
    font-size: 1rem;
    font-family: monospace;
    font-weight: 600;
    text-align: right;
    color: #222;
    background: rgba(255,255,255,0.8);
    border: none;
    outline: none !important;
    opacity: 0.15;
    z-index: 1;
}
.post-id + a {
    display: inline !important;
}
#question .post-id,
#answers .post-id {
    position: relative;
}
.question:not(#question) > .post-id {
    top: -20px;
}
#question .post-id,
#answers .post-id,
#user-tab-questions .post-id:hover,
#user-tab-answers .post-id:hover,
#user-tab-activity .post-id:hover,
*:hover > .post-id {
    display: inline-block;
    opacity: 1;
}
#sidebar .post-id,
#question-header .post-id {
    display: none;
}
.post-list .revision-comment {
    position: relative;
    display: block;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageLoad();

})();
