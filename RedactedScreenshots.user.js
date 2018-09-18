// ==UserScript==
// @name         Redacted Screenshots
// @description  Masks and hides user-identifing info. Disable when not needed.
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.3.2
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*.stackexchange.com/*
//
// @exclude      *chat.*
// @exclude      https://stackoverflow.com/c/*
// ==/UserScript==

(function() {
    'use strict';


    const ipRegex = /\s(?<=(?:\b|\s|"))(\d{1,3})(\.\d{1,3}){3}(?=(?:\b|\s|"))\s/g;
    const emailRegex = /\s(?<=(?:\b|\s|"))([^@\s]{1,3})([^@\s]+)@(.+)\.([a-z]+)(?=(?:\b|\s|"))\s/gi;


    function redactPii(i, elem) {
        if(!(ipRegex.test(elem.innerHTML) || emailRegex.test(elem.innerHTML)) || $(this).find('*').length > 10) return;

        elem.innerHTML = elem.innerHTML
            .replace(ipRegex, ' $1.███.███$2 ')
            .replace(emailRegex, ' $1██████@██████.$4 ');
    }


    function cleanPage() {

        // Remove/Reset other SOMU items
        $('body').removeClass('usersidebar-open');
        $('.old-comment, .comment-summary b').css({
            'color': 'inherit',
            'font-weight': 'normal'
        });
        $('.post-id').remove();

        // Remove other userscript items
        $('#roombaTableDiv').remove();

        // Remove unnecessary stuff from page
        $('.my-profile, .user-gravatar32, .user-info .-flair').remove();

        // Remove admin stuff from page
        $('.js-post-issues, .js-mod-inbox-button, .flag-count-item').remove();

        // Redact IP and email addresses
        $('input, a').each(redactPii);
        $('.post-text li, .post-text p').each(redactPii);
        $('div > div, div > p, div > span').each(redactPii);
    }


    function anonymizeUsers(fullWipe) {

        const dataSet = [];
        let usernum = 1;

        // Anonymize userlinks in these sections only...
        const $sections = $('#mod-content, #content, .admin-user-comments, h1');

        // All unique user links that has not been processed yet
        $('a[href*="/users/"]', $sections).each(function(i, el) {

            // Does not match valid user URL
            const match = this.href.match(/.*\/users\/-?(\d+)(\/.*)?/);
            if(!match) return;

            const uid = match[1];

            if (!dataSet[uid]) {
                dataSet[uid] = usernum++;
            }
            this.innerText = fullWipe ? "anon" : "anon-" + dataSet[uid];
        });

        // Remove @ replies from beginning of comments
        $('.comment-copy').html((i,v) => v.replace(/^@[\wŒŠŽÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖØÙÚÛÜÝÞßðÿ]+[,:]?\s/i, ''));
    }


    function doPageload() {

        const redactButton = $(`<button class="js-redact-page">Redact</button>`);
        const redactFullButton = $(`<button class="js-redact-full-page">Redact Full</button>`);
        redactButton.appendTo('body').click(function() {

            // Hide button for X seconds
            redactButton.hide().delay(10000).fadeIn(1);
            redactFullButton.hide().delay(10000).fadeIn(1);

            cleanPage();
            anonymizeUsers(false);
        });

        redactFullButton.appendTo('body').click(function() {

            // Hide button for X seconds
            redactButton.hide().delay(10000).fadeIn(1);
            redactFullButton.hide().delay(10000).fadeIn(1);

            cleanPage();
            anonymizeUsers(true);
        });
    }


    function appendStyles() {

        const styles = `
<style>
.js-redact-page {
    position: fixed !important;
    bottom: 3px;
    left: 3px;
    z-index: 1001;
    opacity: 0.5;
}
.js-redact-full-page {
    position: fixed !important;
    bottom: 3px;
    left: 75px;
    z-index: 1001;
    opacity: 0.5;
}
.js-redact-page:hover, .js-redact-full-page:hover {
    opacity: 1;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();

})();
