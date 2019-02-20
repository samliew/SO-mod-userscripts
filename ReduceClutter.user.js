// ==UserScript==
// @name         Reduce Clutter
// @description  Revert recent changes that makes the page more cluttered
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.5.1
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*stackapps.com/*
// @include      https://*.stackexchange.com/*
// ==/UserScript==

(function() {
    'use strict';


    function appendStyles() {

        const styles = `
<style>

/*
   Fix comment upvote and flag always showing
   https://meta.stackexchange.com/q/312794
*/
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

/*
   Make comment edited icon same color as timestamp
   https://meta.stackoverflow.com/q/371313
*/
.s-link,
.iconPencilSm {
    color: #9199a1 !important;
}

/*
   Revert change to permanent "edit tags" link
   https://meta.stackoverflow.com/q/374024
*/
.post-taglist #edit-tags {
    display: none;
}
.post-taglist:hover #edit-tags {
    display: inline;
}

/*
    Hide flag summary explanation
    https://meta.stackexchange.com/q/323055
    https://meta.stackoverflow.com/q/380413
*/
#mainbar.user-flag-history > div:first-child:not(.flagged-post) {
    display: none;
}

</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();

})();
