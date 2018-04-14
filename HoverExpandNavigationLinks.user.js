// ==UserScript==
// @name         Hover Expand Navigation Links
// @description  On pagination dots "..." mouseover, adds all in-between page links
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.2
//
// @include      https://stackoverflow.com/*
// @include      https://serverfault.com/*
// @include      https://superuser.com/*
// @include      https://askubuntu.com/*
// @include      https://mathoverflow.net/*
//
// @include      https://meta.stackoverflow.com/*
// @include      https://meta.serverfault.com/*
// @include      https://meta.superuser.com/*
// @include      https://meta.askubuntu.com/*
// @include      https://meta.mathoverflow.net/*
//
// @include      /^https?:\/\/.*\.stackexchange\.com\/.*/
// ==/UserScript==

(function() {
    'use strict';

    function doPageload() {

        $('.page-numbers.dots').on('click mouseover', null, function() {

            var prevNum = +($(this).prev().text());
            var nextNum = +($(this).next().text());
            for(let i = prevNum + 1; i < nextNum; i++) {
                $(`<a href="?page=${i}" title="go to page ${i}"> <span class="page-numbers">${i}</span> </a>`).insertBefore(this);
            }
            $(this).remove();
        });
    }

    function appendStyles() {

        var styles = `
<style>
.page-numbers.dots:hover {
    background-color: #f69c55;
    color: white;
    cursor: pointer;
}
</style>
`;
        $('body').append(styles);
    }

    // On page load
    doPageload();
    appendStyles();

})();
