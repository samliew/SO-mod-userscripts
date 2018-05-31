// ==UserScript==
// @name         Comment User Colours
// @description  Unique colour for each user in comments to make following users in long comment threads easier
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0.1
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
        const nonHexChars = username.replace(/[0-9A-F]+/gi, '') + '66';
        const hexChars = username.replace(/[^0-9A-F]+/gi, '') + '66';
        const one = (nonHexChars.charCodeAt(0) * 7 % 11 + 4).toString(16);
        const two = (nonHexChars.charCodeAt(1) * 7 % 11 + 4).toString(16);
        const colorCode = one + two + hexChars.slice(0, 2) + (uid % 4096).toString(16) + hexChars.charAt(1) + '66';
        return colorCode.slice(0, 6);
    }


    function setUserColor(i, el) {
        // No href if deleted user, fallback to innerText
        const uid = (this.href || this.innerText).replace(/[^\d]+/g, '');
        const usercolor = getUserColor(uid, this.innerText);
        el.style.setProperty("--usercolor", '#' + usercolor);
    }


    function updateUsers() {
        $('.comment-copy + .comment-user').not('.owner').each(setUserColor);
    }


    function appendStyles() {

        var styles = `
<style>
.comment-user {
    position: relative;
    --usercolor: transparent;
}
.comment-user:after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    border-bottom: 3px solid var(--usercolor);
    pointer-events: none;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    updateUsers();
    $(document).ajaxComplete(updateUsers);

})();
