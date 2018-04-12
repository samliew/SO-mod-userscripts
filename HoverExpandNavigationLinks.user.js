// ==UserScript==
// @name         Hover expand navigation links
// @description  On pagination dots mouseover, adds all in-between page links
// @match        https://stackoverflow.com/*
// @match        https://meta.stackoverflow.com/*
// @match        https://*.stackexchange.com/*
// @author       @samliew
// @version      1.0
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
