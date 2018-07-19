// ==UserScript==
// @name         Reduce Clutter
// @description  Reveals comment action icons on comment hover
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
// ==/UserScript==

(function() {
    'use strict';


    function appendStyles() {

        const styles = `
<style>
ul.comments-list .comment-voting,
ul.comments-list .comment-flagging {
    visibility: hidden;
}
ul.comments-list .comment:hover .comment-voting,
ul.comments-list .comment:hover .comment-flagging,
ul.comments-list .comment-up-on {
    visibility: visible;
}
.popup-flag-comment {
    visibility: visible !important;
}
.edited-yes {
    display: inline-block;
    position: relative;
    top: 2px;
    width: 12px;
    height: 12px;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();

})();
