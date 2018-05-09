// ==UserScript==
// @name         Possible Vandalism Deletions Helper
// @description  Display post score and number of undeleted answers, Recommend action based on post info
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0
//
// @include      https://stackoverflow.com/admin/dashboard?flagtype=postvandalismdeletionsauto
// @include      https://serverfault.com/admin/dashboard?flagtype=postvandalismdeletionsauto
// @include      https://superuser.com/admin/dashboard?flagtype=postvandalismdeletionsauto
// @include      https://askubuntu.com/admin/dashboard?flagtype=postvandalismdeletionsauto
// @include      https://mathoverflow.net/admin/dashboard?flagtype=postvandalismdeletionsauto
// @include      https://*.stackexchange.com/admin/dashboard?flagtype=postvandalismdeletionsauto
//
// @include      https://meta.stackoverflow.com/admin/dashboard?flagtype=postvandalismdeletionsauto
// @include      https://meta.serverfault.com/admin/dashboard?flagtype=postvandalismdeletionsauto
// @include      https://meta.superuser.com/admin/dashboard?flagtype=postvandalismdeletionsauto
// @include      https://meta.askubuntu.com/admin/dashboard?flagtype=postvandalismdeletionsauto
// @include      https://meta.mathoverflow.net/admin/dashboard?flagtype=postvandalismdeletionsauto
// @include      https://meta.stackexchange.com/admin/dashboard?flagtype=postvandalismdeletionsauto
// ==/UserScript==

(function() {
    'use strict';


    function doPageload() {

        $('.flagged-post-row td:first').prepend('<div class="post-recommendation">Dismiss</div>');

        $('.post-list a.answer-hyperlink').each(function() {

            const isQuestion = !$(this).hasClass('answer-hyperlink');
            const total = $(this).parents('.post-list').children().length;
            const flag = $(this).parents('.flagged-post-row');
            const link = $(this);
            const pid = isQuestion ? this.href.match(/\d+/)[0] : this.href.match(/\d+$/)[0];

            // Insert recommendation div
            const rec = flag.find('.post-recommendation');

            // Get post info
            $.get({
                url: this.href,
                success: function(data) {
                    let html = $('#mainbar', data);
                    let answerCount = $('.answer', html).not('.deleted-answer').length;
                    let post = $(isQuestion ? '#question' : '#answer-' + pid, html);
                    let score = Number($('.vote-count-post', post).text());
                    //console.log(html, post, score);

                    link.before(`<span class="info-num post-score ${score > 0 ? 'red' : ''}" title="post score">${score}</span>`);
                    link.before(`<span class="info-num answer-count ${answerCount == 0 ? 'red' : ''}" title="non-deleted answers on question">${answerCount}</span>`);

                    if(score > 0) {
                        let num = (Number(flag.attr('data-positive-posts')) || 0) + 1;
                        flag.attr('data-positive-posts', num);
                        // If more than 2 positive posts, warn
                        if(num >= 2) {
                            rec.text('Warn').css('color', 'red');
                        }
                    }
                    if(answerCount == 0) {
                        let num = (Number(flag.attr('data-only-answer')) || 0) + 1;
                        flag.attr('data-only-answer', num);
                        // If more than 50% of deletions are only answers, warn
                        if(num / total > 0.5) {
                            rec.text('Warn').css('color', 'red');
                        }
                    }
                }
            });

        });
    }


    function appendStyles() {

        const styles = `
<style>
.post-list {
    margin-left: 0;
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
    min-width: 25px;
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
