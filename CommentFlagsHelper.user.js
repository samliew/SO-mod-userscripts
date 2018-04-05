// ==UserScript==
// @name         Comment Flags Helper
// @description  Highlights flagged user comments in expanded posts, Always expand comments if post is expanded, Highlight common chatty and rude keywords
// @match        https://*stackoverflow.com/admin/dashboard?flag*=comment*
// @match        https://stackoverflow.com/admin/users/*/post-comments*
// @match        https://meta.stackoverflow.com/admin/dashboard?flag*=comment*
// @match        https://meta.stackoverflow.com/admin/users/*/post-comments*
// @match        https://*.stackexchange.com/admin/dashboard?flag*=comment*
// @match        https://*.stackexchange.com/admin/users/*/post-comments*
// @author       @samliew
// ==/UserScript==

(function() {
    'use strict';

    // Special characters must be escaped with \\
    var rudeKeywords = [
        'fuck', 'arse', 'cunt', 'dick', 'cock', 'pussy', 'hell', 'stupid', 'idiot', '!!+', '\\?\\?+',
        'grow\\s?up', 'shame', 'wtf', 'garbage', 'trash', 'spam', 'damn', 'stop', 'horrible', 'inability', 'bother',
        'nonsense', 'never\\s?work', 'illogical', 'fraud', 'crap', 'report(ed)?', 'get\\s?lost', 'go\\s?away',
        'useless', 'delete.+(answer|question)', 'move on',
    ];

    // Special characters must be escaped with \\
    var chattyKeywords = [
        'thanks?', 'up-?voted?', 'updated', 'edited', 'added', '(in)?correct(ed)?', 'done', 'worked', 'works', 'glad',
        'appreciated?', 'my email', 'email me', 'contact', 'good', 'great', 'sorry', '\\+1', 'love', 'wow', 'pointless', 'no\\s?(body|one)',
        'homework', 'no\\s?idea', 'your\\s?mind', 'try\\s?it', 'typo', 'wrong', 'unclear', 'regret', 'we\b', 'every\\s?(body|one)',
        'exactly', 'check',
    ];

    $('.comment-summary, tr.deleted-row > td > span').each(function() {

        // Highlight common chatty keywords
        this.innerHTML = this.innerHTML.replace(new RegExp('(' + chattyKeywords.join('|') + ')', 'gi'), '<b style="color:orange">$1</b>');

        // Highlight common rude keywords
        this.innerHTML = this.innerHTML.replace(new RegExp('(' + rudeKeywords.join('|') + ')', 'gi'), '<b style="color:red">$1</b>');
    });

    // Change "dismiss" link to "decline"
    $('.cancel-comment-flag').text('decline');

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
