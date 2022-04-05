// ==UserScript==
// @name         Chat Emojis
// @description  Allows users to insert emojis into chat. If chat message contains just an emoji, increase display size
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.8
//
// @include      https://chat.stackoverflow.com/rooms/*
// @include      https://chat.stackexchange.com/rooms/*
// @include      https://chat.meta.stackexchange.com/rooms/*
//
// @include      https://chat.stackoverflow.com/transcript/*
// @include      https://chat.stackexchange.com/transcript/*
// @include      https://chat.meta.stackexchange.com/transcript/*
//
// @include      https://chat.stackoverflow.com/rooms/*/conversation/*
// @include      https://chat.stackexchange.com/rooms/*/conversation/*
// @include      https://chat.meta.stackexchange.com/rooms/*/conversation/*
//
// @include      https://chat.stackoverflow.com/users/*?tab=recent*
// @include      https://chat.stackexchange.com/users/*?tab=recent*
// @include      https://chat.meta.stackexchange.com/users/*?tab=recent*
//
// @include      https://chat.stackoverflow.com/users/*?tab=replies*
// @include      https://chat.stackexchange.com/users/*?tab=replies*
// @include      https://chat.meta.stackexchange.com/users/*?tab=replies*
// ==/UserScript==

/* globals StackExchange, GM_info, jQuery */

'use strict';

(function (jQuery) {
    const $ = jQuery;

    jQuery.getCachedScript = function (url, callback) {
        return $.ajax({
            url: url,
            dataType: 'script',
            cache: true
        }).done(callback);
    };


    const window = unsafeWindow;

    // Emoji regex - https://stackoverflow.com/a/41164587
    const emojiRegex = /^(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])$/;
    const findEmojiMessages = function () {
        $('.message .content').not('.js-emoji-parsed').addClass('js-emoji-parsed').filter(function (i, v) {
            const text = v.textContent.trim() || '';
            return text && text.length <= 2 && emojiRegex.test(text);
        }).addClass('msg-emoji');
    }


    function appendStyles() {

        const overrideStyles = `
<style>
/* ===== SOMU - Chat Emojis ===== */
#bubble {
    /* Relative to position emoji picker */
    position: relative;
    height: 78px;
    text-align: left;
}
#footer-legal {
    /* Needs repositioning due to #bubble relative */
    position: absolute;
    bottom: 9px;
    right: 0;
}
.content.msg-emoji {
    font-size: 2.2em;
    line-height: 1.3;
}

/* Override Plugin CSS */
.emojionearea .emojionearea-editor {
    min-height: 88px;
    height: 88px;
    padding: 6px 28px 6px 6px;
}
.emojionearea.has-button {
    position: absolute !important;
    top: 0;
    right: 0;
}
.emojionearea.has-button .emojionearea-filters,
.emojionearea.has-button .emojionearea-tabs {
    top: initial;
    left: initial;
    right: 0;
    bottom: 100%;
    width: 450px;
}
.emojionearea.has-button .emojionearea-filters {
    bottom: calc(100% + 138px);
}
.emojionearea .emojionearea-button {
    position: absolute;
    top: 0;
    right: 0;
    width: 18px;
    height: 18px;
    padding: 4px;
    margin: 0;
    border: none;
    background: transparent url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0OTYg%0D%0ANTEyIj48cGF0aCBkPSJNMjQ4IDhDMTExIDggMCAxMTkgMCAyNTZzMTExIDI0OCAyNDggMjQ4IDI0%0D%0AOC0xMTEgMjQ4LTI0OFMzODUgOCAyNDggOHptMCA0NjRjLTExOS4xIDAtMjE2LTk2LjktMjE2LTIx%0D%0ANlMxMjguOSA0MCAyNDggNDBzMjE2IDk2LjkgMjE2IDIxNi05Ni45IDIxNi0yMTYgMjE2em05MC4y%0D%0ALTE0Ni4yQzMxNS44IDM1Mi42IDI4Mi45IDM2OCAyNDggMzY4cy02Ny44LTE1LjQtOTAuMi00Mi4y%0D%0AYy01LjctNi44LTE1LjgtNy43LTIyLjUtMi02LjggNS43LTcuNyAxNS43LTIgMjIuNUMxNjEuNyAz%0D%0AODAuNCAyMDMuNiA0MDAgMjQ4IDQwMHM4Ni4zLTE5LjYgMTE0LjgtNTMuOGM1LjctNi44IDQuOC0x%0D%0ANi45LTItMjIuNS02LjgtNS42LTE2LjktNC43LTIyLjYgMi4xek0xNjggMjQwYzE3LjcgMCAzMi0x%0D%0ANC4zIDMyLTMycy0xNC4zLTMyLTMyLTMyLTMyIDE0LjMtMzIgMzIgMTQuMyAzMiAzMiAzMnptMTYw%0D%0AIDBjMTcuNyAwIDMyLTE0LjMgMzItMzJzLTE0LjMtMzItMzItMzItMzIgMTQuMy0zMiAzMiAxNC4z%0D%0AIDMyIDMyIDMyeiIvPjwvc3ZnPg==') center/16px no-repeat;
    background-size: 16px;
    font-size: 0;
}
.emojionearea .emojionearea-button:hover {
    background-color: transparent;
}
.emojionearea .emojionearea-button.placeholder:before,
.emojionearea .emojionearea-button:after,
.emojionearea .emojionearea-button img {
    display: none;
}
</style>
`;
        $('body').append(overrideStyles);
    }


    function initEmojiPicker() {

        // Load emojionearea - https://github.com/mervick/emojionearea/tree/version2
        const liburl = 'https://cdn.jsdelivr.net/gh/mervick/emojionearea@2';
        $(document.body).append(`<link rel="stylesheet" href="${liburl}/css/emojionearea.min.css" />`);

        $.getCachedScript(`${liburl}/js/emojionearea.min.js`, function () {

            const chatfield = document.getElementById('input');
            const el = $(chatfield).emojioneArea({
                template: "<editor/><filters/><tabs/>",
                standalone: true,
                hideSource: false,
                autoHideFilters: true,
                events: {
                    filter_click: function (filter, event) {
                        // Add labels to emojis
                        $('.emojionearea-tab:visible i.emojibtn').each(function (i, el) {
                            $(this).attr('title', el.children[0].dataset.name.replace(/(^:|:$)/g, ''));
                        });
                    },
                    'emojibtn_click': function (button, event) {
                        // Add emoji to chat field
                        const emoji = el.get(0).emojioneArea.getText();
                        chatfield.value += emoji;
                        chatfield.focus();
                    },
                },
            });

            // Close events when open
            $(document).on('keyup', function (evt) {
                if (evt.keyCode === 27 && !$('.emojionearea-filters').hasClass('ea-hidden')) { // esc
                    $('.emojionearea-button').click();
                }
            }).on('keydown click focus', '#input, #chat, #sidebar', function (evt) {
                if (!$('.emojionearea-filters').hasClass('ea-hidden')) {
                    $('.emojionearea-button').click();
                }
            });

        });
    }


    function doPageLoad() {

        // If live chat and not mobile chat UI
        if (/\/rooms\/\d+\//.test(location.pathname) && !document.body.classList.contains('mob')) {

            // Init emoji picker
            initEmojiPicker();

            // Occasionally, look for new single-emoji messages and apply class
            setInterval(findEmojiMessages, 1000);
        }

        findEmojiMessages();
        $(document).ajaxStop(findEmojiMessages);

        appendStyles();
    }


    // On page load
    doPageLoad();

})(jQuery || unsafeWindow.jQuery);
