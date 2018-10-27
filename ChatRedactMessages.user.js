// ==UserScript==
// @name         Chat Redact Messages
// @description  Add "Redact + Purge + Delete" button to message history page
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.2
//
// @include      https://chat.stackoverflow.com/*
// @include      https://chat.stackexchange.com/*
// @include      https://chat.meta.stackexchange.com/*
// ==/UserScript==

(function() {
    'use strict';


    const window = unsafeWindow;
    const store = window.localStorage;
    let cachedfkey = store.getItem('fkey');
    let redactText = `[message redacted by moderator]`;


    function doPageload() {

        // On message history page
        if(/^\/messages\/\d+\/history$/.test(location.pathname) && cachedfkey != null) {

            const mid = Number(location.pathname.replace(/[^\d]+/g, ''));
            const header = $('#content h2').first();
            const currMessage = $('.message:first .content').text().trim();
            const isDeleted = header.text().includes('deletion');
            const isRedacted = currMessage === redactText || currMessage.includes('redact');

            // If already redacted, do nothing
            if(isRedacted) return;

            // Add redact button next to header
            const redactBtn = $(`<input class="button" type="submit" value="Redact + Purge + Delete" id="redactpurge" />`).appendTo(header);

            // Click event on button
            redactBtn.on('click', function(evt) {

                // Disable button to prevent double-clicking
                $(evt.target).attr('disabled', true);

                // Delete if not already deleted
                if(!isDeleted) {
                    $.post(`https://${location.hostname}/messages/${mid}/delete`, {
                        fkey: cachedfkey
                    });
                }

                // Edit to replace message with redactText
                $.post(`https://${location.hostname}/messages/${mid}`, {
                    text: '*' + redactText + '*',
                    fkey: cachedfkey
                })
                .then(function() {

                    // Purge history
                    $.post(`https://${location.hostname}/messages/${mid}/purge-history`, {
                        fkey: cachedfkey
                    })
                    .then(function() {

                        // Refresh page to reflect changes
                        location.reload(true);
                    });
                });
            });
        }

        // Other chat pages
        else {

            // Always re-cache latest fkey if available
            if(typeof window.fkey === 'function') {

                // Cache fkey for use in message history page
                store.setItem('fkey', window.fkey().fkey);
            }

            // When message actions link is clicked
            $('#chat, #transcript').on('click', '.action-link', function() {
                const popup = $(this).siblings('.popup');

                // If no history link in popup, insert history link after permalink
                if(popup.find('a[href$=history]').length === 0) {
                    const permalink = popup.find('a[href^="/transcript/message/"]');
                    const mid = $(this).parents('.message').attr('id').replace(/[^\d]+/g, '');
                    permalink.after(` - <a href="/messages/${mid}/history">history</a>`);
                }
            });
        }
    }


    function appendStyles() {

        const styles = `
<style>
#redactpurge {
    position: relative;
    top: -2px;
    margin-left: 10px;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();

})();
