// ==UserScript==
// @name         Display Inline Comment Flag History
// @description  Grabs post timeline and display comment flags beside post comments
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.1
//
// @include      https://*.stackoverflow.com/questions/*
// @include      https://*.serverfault.com/questions/*
// @include      https://*.superuser.com/questions/*
// @include      https://*.askubuntu.com/questions/*
// @include      https://*.mathoverflow.com/questions/*
// @include      https://*.stackexchange.com/questions/*
// ==/UserScript==

(function() {
    'use strict';

    const fkey = StackExchange.options.user.fkey;
    const baseUrl = `${location.protocol}://${location.hostname}/posts/`;


    function doPageload() {
        getPostTimelines();
    }


    function listenToPageUpdates() {

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {
            getPostTimelines();
        });
    }


    function getPostTimelines() {

        $('.question, .answer').not('.js-cmmtflags-loaded').each(function() {

            // So we only load each post's timeline once
            $(this).addClass('js-cmmtflags-loaded');

            const postId = this.dataset.questionid || this.dataset.answerid;
            const isQ = $(this).hasClass('question');
            console.log(postId, isQ);

            $.get(baseUrl + postId + '/timeline');
        });
    }


    function appendStyles() {

        const styles = `
<style>
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();
    listenToPageUpdates();

})();
