// ==UserScript==
// @name         Expand Short Links
// @description  Appends more characters to short link texts in posts and comments so they can be easily seen and clicked on
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.1
//
// @match        https://*stackoverflow.com/*
// @match        https://*serverfault.com/*
// @match        https://*superuser.com/*
// @match        https://*askubuntu.com/*
// @match        https://*mathoverflow.net/*
// @match        https://*.stackexchange.com/*
// ==/UserScript==

(function() {
    'use strict';


    function expandShortLinks() {
        $('.post-text, .comment-copy').find('a').not('.shortlink').filter((i,el) => el.innerText.length <= 2).addClass('shortlink');
    }


    function appendStyles() {

        const styles = `
<style>
a.shortlink {
    font-weight: bold;
    color: red !important;
}
a.shortlink:after {
    content: '-shortlink';
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
