// ==UserScript==
// @name         Post Ids Everywhere
// @description  Inserts post IDs everywhere where there's a post or post link
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0
//
// @match        https://stackoverflow.com/*
// @match        https://serverfault.com/*
// @match        https://superuser.com/*
// @match        https://askubuntu.com/*
// @match        https://mathoverflow.net/*
// @match        https://stackexchange.com/*
//
// @match        https://meta.stackoverflow.com/*
// @match        https://meta.serverfault.com/*
// @match        https://meta.superuser.com/*
// @match        https://meta.askubuntu.com/*
// @match        https://meta.mathoverflow.net/*
// @match        https://meta.stackexchange.com/*
//
// @match        *.stackexchange.com/*
// ==/UserScript==

(function() {
    'use strict';

    function doPageLoad() {

        // Lists
        $('a.answer-hyperlink').each((i,el) => $('<span class="post-id">'+el.href.match(/\d+$/)+'<i> </i></span>').insertBefore(el));
        $('a.question-hyperlink').each((i,el) => $('<span class="post-id">'+el.href.match(/\d+/)[0]+'<i> </i></span>').insertBefore(el));

        // Q&A
        $('[data-questionid], [data-answerid]').not('.close-question-link').each((i,el) => $('<span class="post-id">'+(el.dataset.answerid||el.dataset.questionid)+'<i> </i></span>').prependTo(el));
    }

    function appendStyles() {

        var styles = `
<style>
.post-id {
  display: none;
  margin-right: 10px;
  font-size: 1rem;
  font-family: monospace;
  font-weight: 600;
  color: #222;
}
.post-id + a {
  display: inline !important;
}
#question .post-id,
#answers .post-id,
*:hover > .post-id {
  display: inline-block;
}
#sidebar .post-id,
#question-header .post-id {
  display: none;
}
</style>
`;
        $('body').append(styles);
    }

    // On page load
    appendStyles();
    doPageLoad();

})();
