// ==UserScript==
// @name         No User Id Share Links
// @description  Removes your user ID from post share links
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.1
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*.stackexchange.com/*
// @include      https://stackapps.com/*
// ==/UserScript==

(function() {
    'use strict';

    $(document.body).on('click', '.js-share-link', function() {
        const popover = $(this).next();
        setTimeout(function(pop) {
            pop.find('input').val((i, v) => v.replace(/(\/\d+)\/\d+/, '$1'));
            pop.find('.js-subtitle').remove();
        }, 10, popover);
    }).on('dblclick', '.s-popover[id^="se-share"] input', function() {
        this.select();
    });

})();
