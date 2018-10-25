// ==UserScript==
// @name         Create Private Mod Chatroom
// @description  One-click button to create private/mod chat room with user and grant write access
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.2
//
// @include      https://chat.stackoverflow.com/users/*
// @include      https://chat.stackexchange.com/users/*
//
// @include      https://chat.stackoverflow.com/rooms/*
// @include      https://chat.stackexchange.com/rooms/*
// ==/UserScript==

(function() {
    'use strict';


    // Moderator check
    if(!$('.topbar-menu-links').text().includes('♦') && $('#roomtitle span').attr('title').indexOf('Private') !== 0) return;


    const superpingText = `get in here please.`;


    function doPageload() {

        // User general tab
        if(location.pathname.includes('/users/') && $('#tabs a').first().hasClass('youarehere')) {

            const curruserId = $('.topbar-menu-links a').attr('href').match(/\d+/)[0];
            const curruserName = $('.topbar-menu-links a').first().text().replace(/\s+♦$/, '');

            const userId = $('input[name="user"]').val();
            const username = $('.subheader h1').text();

            // Don't create a private room with yourself...
            if(curruserId == userId) return;

            // Clone search form and 'convert' it into create new private room form with userId set in description so we can retrieve it to grant access afterwards
            const sForm = $('.usercard-xxl form[action="/search"]');
            const pForm = sForm.clone(true, true).attr({
                'action': '/rooms/save',
                'method': 'post'
            });

            // Insert necessary fields into private form
            // The secret's in the "defaultAccess" and "noDupeCheck" params
            $('#fkey').clone().prependTo(pForm);
            pForm.find('.button').val('create private room with user');
            pForm.find('input[name="user"]').attr('name', 'description').val((i,v) => 'grant-write:' + v);
            pForm.find('input[name="q"]').attr('name', 'name').val(`Room for ${curruserName} and ${username}`);
            pForm.append(`
<input type="hidden" name="defaultAccess" value="request" />
<input type="hidden" name="host" value="" />
<input type="hidden" name="tags" value="" />
<input type="hidden" name="noDupeCheck" value="true" />
`);

            // Insert this private room form before the search form
            pForm.insertBefore(sForm);

            return;
        }

        // Room created with userId in room description
        if(location.pathname.includes('/rooms/info/') && $('.roomcard-xxl p').text().includes('grant-write:')) {

            const fkey = $('#fkey').val();
            const roomId = location.pathname.match(/\d+/)[0];
            const userId = $('.roomcard-xxl p').text().match(/\d+/)[0];
            const username = $('#name').val().split(' and ')[1];

            // Simple validation
            if(!fkey || !roomId || !userId || !username) return;

            // Grant access to user
            $.post(`/rooms/setuseraccess/${roomId}`, {
                'fkey': fkey,
                'userAccess': 'read-write',
                'aclUserId': userId
            }, function() {

                // Then send a message into the room with the userId
                $.post(`/chats/${roomId}/messages/new`, {
                    'fkey': fkey,
                    'text': `*room created for user ${userId}*`
                });

                // Then clear description, which will also reload page
                $('#description').val('').closest('form').submit();
            });

            return;
        }

        // If in chat room with first two messages containing userId, show superping button
        if(location.pathname.includes('/rooms/') && $('body#chat-body').length > 0) {

            const fkey = $('#fkey').val();
            const roomId = CHAT.CURRENT_ROOM_ID;

            let superpingLoaded = false;
            function findShowSuperping() {

                // Once only
                if(superpingLoaded) return;

                // look for user id message
                const systemMsg = $('.message .content').filter((i, el) => /^\d+$/.test(el.innerText));
                const userId = Number(systemMsg.text().trim());

                // Show superping button
                const superpingBtn = $(`<a class="button superpinger" title="mod superping user">superping</a>`);
                superpingBtn.click(function() {
                    $.post(`/chats/${CHAT.CURRENT_ROOM_ID}/messages/new`, {
                        'fkey': fkey,
                        'text': `@@${userId} ${superpingText}`
                    });
                }).appendTo(systemMsg);
            }

            // On any page update
            $(document).ajaxComplete(function(event, xhr, settings) {

                // When messages are loaded
                if(settings.url.includes('/messages/')) {
                    findShowSuperping();
                }
            });
        }
    }

    function appendStyles() {

        var styles = `
<style>
.private-button {
    background-color: darkred;
}
.superpinger {
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
