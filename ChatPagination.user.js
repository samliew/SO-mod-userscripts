// ==UserScript==
// @name         Chat Pagination
// @description  Improvements to pagination of user recent messages page. Do not install if you have ChatImprovements as it also implements this.
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.1
//
// @include      https://chat.stackoverflow.com/*
// @include      https://chat.stackexchange.com/*
// @include      https://chat.meta.stackexchange.com/*
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';

const getQueryParam = key => new URLSearchParams(window.location.search).get(key);

function updatePager(curr) {
    curr = Number(curr);
    if (typeof curr !== 'number') return;

    const qs = location.search.replace(/&page=\d+/, '');
    const pager = $('.pager').empty();

    const start = Math.max(1, curr - 5);
    const stop = Math.max(10, curr + 5);
    const prev = Math.max(1, curr - 1);
    const next = curr + 1;

    let htmlstr = `<a href="https://${location.hostname}${location.pathname}${qs}&page=${prev}" data-page="${prev}"><span class="page-numbers prev">prev</span></a>`;
    for (let i = start; i <= stop; i++) {
        htmlstr += `<a href="https://${location.hostname}${location.pathname}${qs}&page=${i}" data-page="${i}"><span class="page-numbers ${i == curr ? 'current' : ''}">${i}</span></a>`;
    }
    htmlstr += `<a href="https://${location.hostname}${location.pathname}${qs}&page=${next}" data-page="${next}"><span class="page-numbers next">next</span></a>`;

    pager.append(htmlstr);
}

function getPage(url, selector, callback = null) {
    window.history.replaceState({}, '', url);

    $.ajax({
        url: url,
        xhr: jQueryXhrOverride,
        success: function (data) {
            let tmp = $(selector, data);
            $(selector).html(tmp.html());

            if (typeof callback === 'function') callback.call();
        }
    });
}

function doPageLoad() {
    const content = $('#content');
    const userpage = location.pathname.includes('/users/') && getQueryParam('tab') == 'recent';
    const roomspage = location.pathname.includes('/rooms');

    if (!userpage) return;

    $('.pager').first().remove();

    const pager = $(`<div class="pager clear-both"></div>`).insertAfter('#content');
    pager.clone(true).insertAfter('#content .subheader');

    let curr = getQueryParam('page') || 1;
    updatePager(curr);
    
    $('.pager').on('click', 'a', function () {
        window.scrollTo(0, 0);
        const num = Number(this.dataset.page);
        getPage(this.href, '#content', function () {
            pager.clone(true).insertAfter('#content .subheader');
            updatePager(num);
        });
        return false;
    });
}


// On page load
doPageLoad();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
#roomlist {
    clear: both;
}
#roomlist .pager,
#roomlist .fr {
    display: inherit;
}
.fr {
    margin: 15px 0;
}
.pager {
    padding: 20px 0 0px;
    text-align: center;
}
.pager > *,
.pager .page-numbers {
    display: inline-block !important;
    float: none;
}
.pager .page-numbers {
    padding: 4px 8px;
    margin: 0 1px;
    border-radius: 2px;
    text-align: center;
    min-width: 14px;
}
#content .subheader ~ div:last-of-type > div[style*="float:left; width:230px"] {
    position: sticky;
    top: 10px;
}
.room-mini {
    min-height: 110px;
}
</style>`;
document.body.appendChild(styles);
