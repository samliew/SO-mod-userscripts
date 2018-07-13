// ==UserScript==
// @name         Redacted Screenshots
// @description  Masks and hides user-identifing info. Disable when not needed.
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0
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


    function anonymizeUsers() {

        // Anonymize userlinks in these sections only...
        const $sections = $('#mod-content, #content, .admin-user-comments, h1');

        let usernum = 0;
        // All unique user links that has not been processed yet
        $('a[href*="/users/"]', $sections).not('[usernum]').each(function() {
            const uid = this.href.match(/-?\d+/)[0];
            usernum++;

            $(`a[href^="/users/${uid}/"]`, $sections).each(function() {
                this.dataset.uid = uid;
                this.dataset.usernum = usernum;
                this.innerText = "anon-" + usernum;
            });
        });
    }


    function listenToPageUpdates() {
        $(window).on('load resize', function() {
            $('body').removeClass('usersidebar-open');
        });

        $(document).ajaxStop(function() {
            anonymizeUsers();
        });
    }


    function appendStyles() {

        const styles = `
<style>
.my-profile,
.user-gravatar32,
.user-info .-flair,
.js-post-issues {
    display: none !important;
}
.user-info .user-gravatar32+.user-details {
    margin-left: 0;
}
input.post-id {
    display: none !important;
}
table.flagged-posts .relativetime.old-comment,
.comment-summary b {
    color: inherit !important;
    font-weight: normal;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    anonymizeUsers();
    listenToPageUpdates();

})();
