// ==UserScript==
// @name         Redacted Screenshots
// @description  Masks and hides user-identifing info. Disable when not needed.
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.2
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
    }


    function anonymizeUsers() {

        let usernum = 0;

        // Anonymize userlinks in these sections only...
        const $sections = $('#mod-content, #content, .admin-user-comments, h1');

        // All unique user links that has not been processed yet
        $('a[href*="/users/"]', $sections).each(function(i, el) {

            // Does not match valid user URL
            if(/.*\/users\/-?\d+\/.*/.test(this.href) == false) return;

            // data-anonid already set
            if(typeof this.dataset.anonid !== 'undefined') return;

            const uid = this.href.match(/\/(-?\d+)\//)[1];
            usernum++;

            $(`a[href*="/users/${uid}/"]`, $sections).each(function() {
                this.dataset.uid = uid;
                this.dataset.anonid = usernum;
                this.innerText = "anon-" + usernum;
            });
        });

        // Remove @ replies from beginning of comments
        $('.comment-copy').html((i,v) => v.replace(/^@[a-zA-Z0-9]+\s/, ''));
    }


    function doPageload() {

        $(`<button class="js-redact-page">Redact</button>`).appendTo('body').click(function() {

            // Hide button for X seconds
            $(this).hide().delay(10000).fadeIn(1);

            cleanPage();
            anonymizeUsers();
        });
    }


    function appendStyles() {

        const styles = `
<style>
.js-redact-page {
    position: fixed;
    bottom: 3px;
    left: 3px;
    z-index: 1001;
    opacity: 0.5;
}
.js-redact-page:hover {
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
