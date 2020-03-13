// ==UserScript==
// @name         Hover Expand Navigation Links
// @description  On pagination dots "..." mouseover, adds more page links (max 30 per hover)
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.9
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*stackexchange.com/*
//
// @exclude      *chat.*
// @exclude      https://stackoverflow.com/c/*
// ==/UserScript==

(function() {
    'use strict';


    function doPageload() {

        // Fix incorrect nav params on page load
        let queryparams = location.search.replace('?', '').replace(/&?page=\d+/, '');
        if(queryparams.length > 0) queryparams += '&';
        $('.pager > a').each(function() {
            const matches = this.href.match(/[&?]page=(\d+)/);
            if(matches && matches.length) {
                const page = matches[0].replace(/\D+/g, '');
                this.href = '?' + queryparams + 'page=' + page;
            }
        });

        $('#content').on('click mouseover', '.page-numbers.dots, .s-pagination--item__clear', function() {

            let queryparams = location.search.replace('?', '').replace(/&?page=\d+&?/, '');
            if(queryparams.length > 0) queryparams += '&';

            let baseurl = this.previousElementSibling.pathname || '';
            let prevNum = +(this.previousElementSibling.innerText);
            let nextNum = +(this.nextElementSibling.innerText);
            let removeWhenDone = true;
            if(nextNum - prevNum > 30) {
                nextNum = prevNum + 30;
                removeWhenDone = false;
            }

            for(let i = prevNum + 1; i < nextNum; i++) {
                $(`<a class="s-pagination--item" href="${baseurl}?${queryparams}page=${i}" title="go to page ${i}">${i}</a>`).insertBefore(this);
            }

            if(removeWhenDone) $(this).remove();
        });
    }


    function appendStyles() {

        var styles = `
<style>
.pager .page-numbers,
.s-pagination .s-pagination--item {
    margin-bottom: 5px;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();

})();
