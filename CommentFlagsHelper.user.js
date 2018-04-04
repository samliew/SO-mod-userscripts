// ==UserScript==
// @name         Comment Flags Helper
// @description  Highlights flagged user comments in expanded posts, Always expand comments if post is expanded, Highlight common chatty keywords
// @match        https://*stackoverflow.com/admin/dashboard?flag*=comment*
// @match        https://meta.stackoverflow.com/admin/dashboard?flag*=comment*
// @match        https://*.stackexchange.com/admin/dashboard?flag*=comment*
// @author       @samliew
// ==/UserScript==

(function() {
    'use strict';

    // Special characters must be escaped with \\
    var chattyKeywords = [
        'thanks?', 'up-?voted?', 'updated', 'edited', 'added', 'corrected', 'done', 'worked', 'works', 'glad', 'appreciated?', 'email', 'contact', 'good', 'great', 'correct', 'sorry',
    ];

    // If comment is short, highlight common chatty keywords
    $('.comment-summary').each(function() {
        if(this.innerText.length < 100)
            this.innerHTML = this.innerHTML.replace(new RegExp('(' + chattyKeywords.join('|') + ')', 'gi'), '<b style="color:red">$1</b>');
    });

    // Warning when declining comment flags
    $('.cancel-comment-flag').click(function(evt) {
        return confirm('Really DECLINE this flag?') ? true : evt.preventDefault();
    });

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
