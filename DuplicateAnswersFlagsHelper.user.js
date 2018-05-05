// ==UserScript==
// @name         Duplicate Answers Flags Helper
// @description  Add action button to delete AND insert duplicate comment at the same time
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0
//
// @include      https://stackoverflow.com/admin/dashboard?flagtype=answerduplicateanswerauto
// @include      https://serverfault.com/admin/dashboard?flagtype=answerduplicateanswerauto
// @include      https://superuser.com/admin/dashboard?flagtype=answerduplicateanswerauto
// @include      https://askubuntu.com/admin/dashboard?flagtype=answerduplicateanswerauto
// @include      https://mathoverflow.net/admin/dashboard?flagtype=answerduplicateanswerauto
// @include      https://*.stackexchange.com/admin/dashboard?flagtype=answerduplicateanswerauto
// ==/UserScript==

(function() {
    'use strict';

    var fkey = StackExchange.options.user.fkey;
    var duplicateComment = `Please [don't post identical answers to multiple questions](https://meta.stackexchange.com/q/104227/584192). Instead, tailor the answer to the question asked. If the questions are exact duplicates of each other, please vote/flag to close instead.`;


    function doPageload() {

        $('.flagged-post-row').each(function() {
            // Add delete and comment button
            $('.delete-options', this).append(`<input type="button" class="js-delete-and-comment" data-post-id="${this.dataset.postId}" value="delete + comment" title="delete and add comment" />`);
        })
        .on('click', '.js-delete-and-comment', function() {
            let pid = this.dataset.postId;
            let $post = $(`#flagged-${pid}`);

            // Delete post
            $.post({
                url: `https://stackoverflow.com/posts/${this.dataset.postId}/comments`,
                data: {
                    'fkey': fkey,
                    'comment': duplicateComment
                }
            });

            // Add comment
            $.post({
                url: `https://stackoverflow.com/posts/${this.dataset.postId}/vote/10`,
                data: {
                    'fkey': fkey,
                }
            });

            // Hide post immediately so we can move on
            $(this).hide();
            $post.hide();
        });
    }

    // On page load
    doPageload();

})();
