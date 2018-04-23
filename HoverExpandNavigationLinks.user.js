// ==UserScript==
// @name         Hover Expand Navigation Links
// @description  On pagination dots "..." mouseover, adds in-between page links (max 30)
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.3.1
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
            var removeWhenDone = true;
            if(nextNum - prevNum > 30) {
                nextNum = prevNum + 30;
                removeWhenDone = false;
            }

            for(let i = prevNum + 1; i < nextNum; i++) {
                $(`<a href="?page=${i}" title="go to page ${i}"> <span class="page-numbers">${i}</span> </a>`).insertBefore(this);
            }

            if(removeWhenDone) $(this).remove();
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
