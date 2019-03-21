// ==UserScript==
// @name         Personal Mod Message History
// @description  Displays your sent mod messages
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.4
//
// @include      https://stackoverflow.com/*
// @include      https://serverfault.com/*
// @include      https://superuser.com/*
// @include      https://askubuntu.com/*
// @include      https://mathoverflow.net/*
// @include      https://stackexchange.com/*
//
// @include      *.stackexchange.com/*
//
// @exclude      *.meta.stackexchange.com/*
// ==/UserScript==

(function() {
    'use strict';

    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;


    const displayName = $('.my-profile').first().children().attr('title');


    // Solution from https://stackoverflow.com/a/24719409
    function jQueryXhrOverride() {
        const xhr = jQuery.ajaxSettings.xhr();
        const setRequestHeader = xhr.setRequestHeader;
        xhr.setRequestHeader = function(name, value) {
            if(name == 'X-Requested-With') return;
            setRequestHeader.call(this, name, value);
        };
        return xhr;
    }


    function getModMessages(pageNum = 1, pagesize = 100) {

        const $modMessagesList = $('.your-history ul');
        if($modMessagesList.length === 0) return;

        $.ajax({
            url: `https://stackoverflow.com/admin/users/messages?page=${pageNum}&pagesize=${pagesize}`,
            xhr: jQueryXhrOverride,
            success: function(data) {

                // Parse messages
                const $messages = $('<span></span>').html(data).find('table:first tr');
                $messages.filter((i,el) => $(el).find('.annotime').get(0).childNodes[0].nodeValue.indexOf(displayName) > -1).each(function() {
                    const text = $(this).find('.textcell a:first').text().replace(/^[\w',.:\s]+(https:\/\/[\w.\/-]+)\s+/, '');
                    const user = $(this).find('.user-details a');
                    const msg = $('.inbox-item:first').clone(true, true);

                    // Map to cloned element
                    msg.find('.item-type').text('moderator message');
                    msg.find('.relativetime').replaceWith( $(this).find('.relativetime') );
                    msg.children('a').attr('href', $(this).find('.textcell a:first').attr('href') );
                    msg.find('.item-location').text('You sent ' + user.text() + ':');
                    msg.find('.item-summary').text( text );

                    msg.appendTo($modMessagesList);
                });
            }
        });
    }


    function togglePersonalModHistory() {

        // Add mod history results if not added yet
        if($('.modInbox-dialog .your-history').length == 0) {
            const $yourHistory = $('.modInbox-dialog').append('<div class="modal-content your-history"><ul></ul></div>');
            getModMessages(1, 500);
        }

        // Toggle display
        $('.modInbox-dialog .modal-content').first().toggleClass('hidden');

        // Toggle link text
        $('#js-personalModInboxLink').text((i, t) => t === 'your messages' ? 'all messages' : 'your messages');

        // Toggle mod inbox header text
        $('.modInbox-dialog .header h3').first().text((i, t) => t === 'mod messages' ? 'mod messages (personal)' : 'mod messages');
    }


    function doPageload() {

    }


    function listenToPageUpdates() {

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {

            // Loaded mod messages popup
            if(settings.url.indexOf('/topbar/mod-inbox') >= 0) {

                // Add link once if mod inbox has loaded
                if($('#js-personalModInboxLink').length == 0) {
                    $('.modInbox-dialog .-right').prepend('<span><a id="js-personalModInboxLink">your messages</a> | </span>')
                    $('#js-personalModInboxLink').on('click', togglePersonalModHistory);
                }
            }
        });
    }


    function appendStyles() {

        const styles = `
<style>
.modal-content + .modal-content {
    display: none;
}
.modInbox-dialog .modal-content.hidden + .modal-content {
    display: block;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();
    listenToPageUpdates();

})();
