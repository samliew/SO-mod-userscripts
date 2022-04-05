// ==UserScript==
// @name         Duplicate Answers Flags Helper
// @description  Add action button to delete AND insert duplicate comment at the same time
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      3.1
//
// @updateURL    https://github.com/samliew/SO-mod-userscripts/raw/master/DuplicateAnswersFlagsHelper.user.js
// @downloadURL  https://github.com/samliew/SO-mod-userscripts/raw/master/DuplicateAnswersFlagsHelper.user.js
//
// @include      https://*stackoverflow.com/admin/dashboard?flagtype=answerduplicateanswerauto*
// @include      https://*serverfault.com/admin/dashboard?flagtype=answerduplicateanswerauto*
// @include      https://*superuser.com/admin/dashboard?flagtype=answerduplicateanswerauto*
// @include      https://*askubuntu.com/admin/dashboard?flagtype=answerduplicateanswerauto*
// @include      https://*mathoverflow.net/admin/dashboard?flagtype=answerduplicateanswerauto*
// @include      https://*.stackexchange.com/admin/dashboard?flagtype=answerduplicateanswerauto*
//
// @require      https://raw.githubusercontent.com/samliew/ajax-progress/master/jquery.ajaxProgress.js
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';

// Moderator check
if (typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator) return;

if (unsafeWindow !== undefined && window !== unsafeWindow) {
    window.jQuery = unsafeWindow.jQuery;
    window.$ = unsafeWindow.jQuery;
}

// Detect if SOMU is loaded
const rafAsync = () => new Promise(resolve => { requestAnimationFrame(resolve); });
async function waitForSOMU() {
    while (typeof SOMU === 'undefined' || !SOMU.hasInit) { await rafAsync(); }
    return SOMU;
}


const scriptName = GM_info.script.name;
const fkey = StackExchange.options.user.fkey;
const superusers = [584192];
let duplicateComment = `Please [don't post identical answers to multiple questions](https://meta.stackexchange.com/q/104227). Instead, tailor the answer to the question asked. If the questions are exact duplicates of each other, please vote/flag to close instead.`;


function loadOptions() {
    waitForSOMU().then(function (SOMU) {

        // Set option field in sidebar with current custom value; use default value if not set before
        SOMU.addOption(scriptName, 'Duplicate Comment', duplicateComment);

        // Get current custom value with default
        duplicateComment = SOMU.getOptionValue(scriptName, 'Duplicate Comment', duplicateComment);
    });
}


function doPageLoad() {

    // Remove convert to comment buttons
    $('.convert-to-comment').remove();

    $('.js-flagged-post').each(function () {
        // Add delete and comment button
        $('.js-post-flag-options .ff-row-wrap', this).append(`<input type="button" class="js-hide-on-delete flex--item s-btn s-btn__danger s-btn__outlined js-delete-and-comment" data-post-id="${this.dataset.postId}" value="Delete + Comment" title="delete and add dupe comment" />`);
    })
        .on('click', '.js-delete-and-comment', function () {
            const pid = this.dataset.postId;
            const $post = $(this).closest('.js-flagged-post');

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

    const actionBtns = $('<div id="actionBtns"></div>');
    $('.js-flagged-post').first().parent().prepend(actionBtns);

    if (!superusers.includes(StackExchange.options.user.userId)) return;

    // Delete + Comment ALL
    $('<button class="s-btn s-btn__danger s-btn__filled s-btn__xs">Delete + Comment ALL</button>')
        .appendTo(actionBtns)
        .on('click', function () {
            if (!confirm('Confirm Delete ALL?')) return false;

            $(this).remove();
            const visibleItems = $('.js-delete-and-comment:visible');
            $('body').showAjaxProgress(visibleItems.length * 2, { position: 'fixed' });
            visibleItems.click();
        });
}


// On page load
loadOptions();
doPageLoad();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
#actionBtns {
margin: 25px 24px 20px;
}
#actionBtns button {
margin-top: 10px;
margin-right: 10px;
}

.rec-button {
padding: 3px 5px;
border: 1px solid var(--red-500) !important;
color: var(--red-500) !important;
}
.rec-button:hover {
background-color: var(--black-050);
}
`;
document.body.appendChild(styles);
