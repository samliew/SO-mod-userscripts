// ==UserScript==
// @name         Too Many Comments Flag Queue Helper
// @description  Displays only the important info (comments) and actions (Mod popup)
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.1
//
// @match        */admin/dashboard?flagtype=posttoomanycommentsauto
// ==/UserScript==

(function() {
    'use strict';

    function doPageLoad() {

        // Expand unhandled posts
        var unhandledPosts = $('.flagged-post-row').filter((i,el) => $('.mod-post-actions', el).text().indexOf('ModMovedCommentsToChat') === -1);
        setTimeout((unhandledPosts) => $('.expand-body', unhandledPosts).click(), 300, unhandledPosts);

        // Display "No further action" for handled posts
        $('.flagged-post-row').not(unhandledPosts).find('.post-options').show().find('input').not('.dismiss-all').hide();
    }

    function appendStyles() {

        var styles = `
<style>
.post-text,
.post-taglist,
.post-options.keep,
.dismiss-options,
.mod-message {
    display: none;
}
.tagged-ignored {
    opacity: 1;
}
</style>
`;
        $('body').append(styles);
    }

    // On page load
    appendStyles();
    doPageLoad();

})();
