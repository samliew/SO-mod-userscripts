// ==UserScript==
// @name         Personal Mod Message History
// @description  Displays link to switch to your sent mod messages in the inbox dialog
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0
//
// @include      https://stackoverflow.com/*
// @include      https://serverfault.com/*
// @include      https://superuser.com/*
// @include      https://askubuntu.com/*
// @include      https://mathoverflow.net/*
// @include      https://stackexchange.com/*
//
// @include      https://meta.stackoverflow.com/*
// @include      https://meta.serverfault.com/*
// @include      https://meta.superuser.com/*
// @include      https://meta.askubuntu.com/*
// @include      https://meta.mathoverflow.net/*
// @include      https://meta.stackexchange.com/*
//
// @include      *.stackexchange.com/*
// ==/UserScript==

(function() {
    'use strict';

    // Solution from https://stackoverflow.com/a/24719409/584192
    function jQueryXhrOverride() {
        var xhr = jQuery.ajaxSettings.xhr();
        var setRequestHeader = xhr.setRequestHeader;
        xhr.setRequestHeader = function(name, value) {
            if (name == 'X-Requested-With') return;
            setRequestHeader.call(this, name, value);
        };
        return xhr;
    }

    const displayName = $('.my-profile').first().children().attr('title');

    function getModMessages(pageNum) {

        var $modMessagesList = $('.your-history ul');
        if($modMessagesList.length === 0) return;

        $.ajax({
            url: 'https://stackoverflow.com/admin/users/messages?page=' + pageNum,
            xhr: jQueryXhrOverride,
            success: function(data) {

                // Parse messages
                var $messages = $('<span></span>').html(data).find('table:first tr');
                $messages.filter((i,el) => $(el).find('.annotime').get(0).childNodes[0].nodeValue.indexOf(displayName) > -1).each(function() {
                    var text = $(this).find('.textcell a:first').text().replace(/^[\w',.:\s]+(https:\/\/[\w.\/-]+)\s+/, '');
                    var user = $(this).find('.user-details a');
                    var msg = $('.inbox-item:first').clone(true, true);

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
            var $yourHistory = $('.modInbox-dialog').append('<div class="modal-content your-history"><ul></ul></div>');

            // Load 1 page with 10 messages at a time
            for(var i = 0; i < 20; i++) {
                setTimeout(getModMessages, 1500 * i, i+1);
            }
        }

        // Toggle display
        $('.modInbox-dialog .modal-content').first().toggleClass('hidden');

        // Toggle text
        $('.modInbox-historylink').text((i, t) => t === 'your history' ? 'all messages' : 'your history');
    }

    function doPageload() {

    }

    function listenToPageUpdates() {

        // On any page update
        $(document).ajaxComplete(function() {

            // Add link if mod inbox has loaded
            if($('.modInbox-historylink').length == 0)
                $('<span><a class="modInbox-historylink">your history</a> | </span>').prependTo('.modInbox-dialog .-right').on('click', null, togglePersonalModHistory);
        });
    }


    function appendStyles() {

        var styles = `
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
