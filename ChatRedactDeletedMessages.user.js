// ==UserScript==
// @name         Chat Redact Deleted Messages
// @description  Add "Redact + Purge + Delete" button to message history page
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0
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
            const isRedacted = currMessage === redactText;

            // If already redacted, do nothing
            if(isRedacted) return;

            // Add redact button next to header
            const redactBtn = $(`<input class="button" type="submit" value="Redact + Purge + Delete" id="redactpurge" />`).appendTo(header);

            // Click event on button
            redactBtn.on('click', function(evt) {

                // Disable button to prevent double-clicking
                $(evt.target).attr('disabled', true);

                // Edit to replace message with redactText
                $.post(`https://${location.hostname}/messages/${mid}`, {
                    text: '*' + redactText + '*',
                    fkey: cachedfkey
                })
                .then(function() {

                    // Delete if not already deleted
                    if(!isDeleted) {
                        $.post(`https://${location.hostname}/messages/${mid}/delete`, {
                            fkey: cachedfkey
                        });
                    }

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

            // If fkey not already cached
            if(cachedfkey == null && typeof window.fkey === 'function') {

                // Cache fkey for use in message history page
                store.setItem('fkey', window.fkey().fkey);
            }
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
