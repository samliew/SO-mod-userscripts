// ==UserScript==
// @name         Comment User Colours
// @description  Unique colour for each user in comments to make following users in long comment threads easier
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.1.3
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*.stackexchange.com/*
//
// @exclude      *chat.*
// ==/UserScript==

(function() {
    'use strict';


    function getUserColor(uid, username) {
        if(typeof uid === 'string') uid = Number(uid) || 0;
        const colorCode = (uid * 99999999 % 16777216).toString(16) + '000000'; // 16777216 = 16^6
        return colorCode.slice(0, 6);
    }


    function setUserColor(i, el) {
        el.style.setProperty("--usercolor", '#' + getUserColor(this.dataset.uid, this.innerText));
        el.classList.add("js-usercolor");
    }


    function updateUsers() {

        // Pre-parse user ids
        $('.comment-user').not('[data-uid]').each(function() {
            // No href if deleted user, fallback to innerText
            this.dataset.uid = (this.href || this.innerText).match(/\d+/, '')[0];
        });

        // If more than one comment per comment section, set user color
        $('.comments').each(function(i, section) {
            $('.comment-copy + .comment-user', section).not('.js-usercolor').filter(function() {
                return $(`.comment-user[data-uid=${this.dataset.uid}]`, section).length > 1;
            }).each(setUserColor);
        });
    }


    function appendStyles() {

        var styles = `
<style>
.js-usercolor {
    position: relative;
    --usercolor: transparent;
}
.js-usercolor:after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    border-bottom: 3px solid var(--usercolor) !important;
    pointer-events: none;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    updateUsers();
    $(document).ajaxStop(updateUsers);

})();
