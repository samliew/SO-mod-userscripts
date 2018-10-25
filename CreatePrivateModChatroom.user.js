// ==UserScript==
// @name         Create Private Mod Chatroom
// @description  One-click button to create private/mod chat room with user and grant write access
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.1
//
// @include      https://chat.stackoverflow.com/users/*
// @include      https://chat.stackexchange.com/users/*
//
// @include      https://chat.stackoverflow.com/rooms/info/*
// @include      https://chat.stackexchange.com/rooms/info/*
// ==/UserScript==

(function() {
    'use strict';

    // Moderator check
    if(!$('.topbar-menu-links').text().includes('♦')) return;


    function doPageload() {

        // User general tab
        if(location.pathname.includes('/users/') && $('#tabs a').first().hasClass('youarehere')) {

            const ownname = $('.topbar-menu-links a').first().text().replace(/\s+♦$/, '');
            const username = $('.subheader h1').text();

            const sForm = $('.usercard-xxl form[action="/search"]');
            const pForm = sForm.clone(true, true);
            $('#fkey').clone().prependTo(pForm);
            pForm.find('.button').val('create private room with user');
            pForm.find('input[name="user"]').attr('name', 'description').val((i,v) => 'grant-write:' + v);
            pForm.find('input[name="q"]').attr('name', 'name').val(`Room for ${ownname} and ${username}`);
            pForm.append(`
<input type="hidden" name="defaultAccess" value="request" />
<input type="hidden" name="host" value="" />
<input type="hidden" name="tags" value="" />
<input type="hidden" name="noDupeCheck" value="true" />
`);
            pForm.attr({
                'action': '/rooms/save',
                'method': 'post'
            }).insertBefore(sForm);
        }

        if(location.pathname.includes('/rooms/info/') && $('.roomcard-xxl p').text().includes('grant-write:')) {

            const fkey = $('#fkey').val();
            const roomId = location.pathname.match(/\d+/)[0];
            const userId = $('.roomcard-xxl p').text().match(/\d+/)[0];
            const username = $('#name').val().split(' and ')[1];

            $.post(`/rooms/setuseraccess/${roomId}`, {
                'fkey': fkey,
                'userAccess': 'read-write',
                'aclUserId': userId,
            }, function() {
                $('#description').val('').closest('form').submit();
            });
        }
    }

    function appendStyles() {

        var styles = `
<style>
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();

})();
