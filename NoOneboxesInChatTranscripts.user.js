// ==UserScript==
// @name         No Oneboxes in Chat Transcripts
// @description  Collapses oneboxes from chat transcripts, click to display onebox
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0
//
// @include      https://chat.stackoverflow.com/transcript/*
// @include      https://chat.stackexchange.com/transcript/*
// @include      https://chat.meta.stackexchange.com/transcript/*
// ==/UserScript==

(function() {
    'use strict';


    function doPageload() {

        $('.onebox').hide().each(function() {
            let url = $(this).find('a').first().attr('href');
            if($(this).hasClass('ob-tweet')) url = $(this).find('a').last().attr('href');

            $(`<span class="has-onebox" title="click to load onebox">${url}</span>`)
                .click(function() {
                    $(this).hide().next().show();
                }).insertBefore(this);
        });
    }


    function appendStyles() {

        const styles = `
<style>
.has-onebox {
    padding-left: 10px;
    border-left: 3px solid orange;
    cursor: zoom-in;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();

})();
