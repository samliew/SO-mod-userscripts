// ==UserScript==
// @name         Expand Short Links
// @description  Appends more characters to short link texts in posts and comments so they can be easily seen and clicked on
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.2.2
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*.stackexchange.com/*
// ==/UserScript==

(function() {
    'use strict';


    function expandShortLinks() {
        $('.post-text, .comment-copy').find('a').not('.post-tag').not('.shortlink').filter((i,el) => el.innerText.length <= 2 && el.children.length == 0).addClass('shortlink');
    }


    function appendStyles() {

        const styles = `
<style>
a.shortlink {
    font-weight: bold;
    color: red !important;
}
a.shortlink:after {
    content: '_link';
    color: green;
    font-style: italic;
    font-weight: normal;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    expandShortLinks();
    $(document).ajaxComplete(expandShortLinks);

})();
