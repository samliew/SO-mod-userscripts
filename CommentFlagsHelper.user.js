// ==UserScript==
// @name         Comment Flags Helper
// @description  Highlights flagged user comments in expanded posts, Always expand comments if post is expanded
// @match        https://stackoverflow.com/admin/dashboard?flagtype=comment*
// @match        https://meta.stackoverflow.com/admin/dashboard?flagtype=comment*
// @match        https://*.stackexchange.com/admin/dashboard?flagtype=comment*
// @author       @samliew
// ==/UserScript==

(function() {
    'use strict';

    // On any page update
    $(document).ajaxComplete(function() {

        // Always expand comments if post is expanded
        $('.js-show-link.comments-link').trigger('click');

        // Highlight flagged user comments in expanded posts
        var $user = $('.js-flagged-comments .comment-link + a');
        $user.each(function() {
            $(this).parents('.messageDivider').find('.comment-user').filter((i,e) => e.href === this.href).closest('.comment').children().css('background', '#ffc');
        });
    });

})();