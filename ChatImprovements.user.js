// ==UserScript==
// @name         Chat Improvements
// @description  Show users in room as a compact list
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.3
//
// @include      https://chat.stackoverflow.com/*
// @include      https://chat.stackexchange.com/*
// @include      https://chat.meta.stackexchange.com/*
// ==/UserScript==

(function() {
    'use strict';


    const fkey = document.getElementById('fkey').value;
    const newuserlist = $(`<div id="present-users-list"></div>`);


    function updateUserlist() {

        const userlist = $('#present-users');

        // Reset new list
        newuserlist.empty().insertAfter(userlist);

        // Bugfix: remove dupes from original list when any new message posted
        userlist.children('.user-container').each(function() {
            $(this).siblings(`[id="${this.id}"]`).remove();
        });

        // Clone remaining users into new list
        userlist.children('.user-container').clone(true).each(function() {

            // Get username from img title attribute
            const username = $(this).find('img')[0].title;

            // Apply a class to inactive users
            $(this).toggleClass('inactive', this.style.opacity == "0.15");

            // Remove other fluff, append username, then insert into new list
            $(this).off().removeAttr('style id alt width height').find('.data').remove();
            $(this).appendTo(newuserlist).append(`<span class="username" title="${username}">${username}</span>`);
        });
    }


    function doPageload() {

        let loaded = false;

        // Always rejoin favourite rooms when joining a chat room
        if(location.pathname.includes('/rooms/') && !location.pathname.includes('/info/')) {
            console.log('rejoining favourite rooms');
            $.post(`https://chat.stackoverflow.com/chats/join/favorite`, {
                quiet: true,
                immediate: true,
                fkey: fkey
            });
        }

        // If on mobile
        if(document.body.classList.contains('mob')) {

            // Append mobile styles
            appendStyles(false);

            // Improve room list toggle (click on empty space to close)
            const roomswitcher = $('.sidebar-middle').click(function(e) {
                e.stopPropagation();
                if(e.target == roomswitcher) {
                    $(document.body).removeAttr('data-panel-visible');
                }
            }).get(0);

            // ignore rest of script
            return;
        }

        // Append desktop styles
        appendStyles();

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {

            // Once: userlist is ready, init new userlist
            if(!loaded && settings.url.includes('/rooms/pingable')) {
                loaded = true; // once
                updateUserlist();
                setTimeout(updateUserlist, 5e3);

                // Occasionally update userlist
                setInterval(updateUserlist, 15e3);
            }

            // On new messages, update userlist
            if(settings.url.includes('/events') || settings.url.includes('/messages/new') || settings.url.includes('/rooms/pingable')) {
                updateUserlist();
            }
        });
    }


    function appendStyles(desktop = true) {

        const mobileStyles = `
<style>
#chat .monologue .message .reply-info {
    width: 18px;
    height: 15px;
    margin-left: -4px;
    margin-right: 2px;
    padding: 0;
    transform: scale(1.2, 1.2);
}
html.fixed-header body.with-footer main {
    padding-bottom: 60px;
}
#input-area textarea {
    height: 52px;
    padding: 4px 0 4px 5px;
    line-height: 1;
}
</style>
`;

        const styles = `
<style>
#present-users {
    width: 1px;
    height: 1px;
    margin: 0;
    padding: 0;
    border: 0;
    opacity: 0;
    overflow: hidden;
}
#present-users-list {
    list-style: none;
    columns: 2;
    padding-bottom: 5px;
    border-bottom: 1px dotted #cfcfcf;
    font-size: 0.85em;
    color: #666;
}
#present-users-list li {
    position: relative;
    margin: 0 0 -9px;
    padding: 4px 0;
    opacity: 1 !important;
    z-index: 1;

    -webkit-column-break-inside: avoid;
              page-break-inside: avoid;
                   break-inside: avoid;
}
#present-users-list li:hover,
#present-users-list li.inactive:hover {
    opacity: 1 !important;
    z-index: 2;
}
#present-users-list li.inactive {
    opacity: 0.4 !important;
}
#present-users-list li .avatar {
    position: relative;
    display: inline-block;
    width: 16px;
    height: 16px;
}
#present-users-list li .avatar img {
    position: absolute;
    width: 16px;
    height: 16px;
    background-color: white;
    font-size: 0; /* hides broken images alt text */
}
#present-users-list li:hover .avatar img {
    width: 24px;
    height: 24px;
    margin-top: -4px;
    margin-left: -4px;
    box-shadow: 0 0 5px rgba(0,0,0,0.3);
}
#present-users-list .username {
    display: inline-block;
    width: calc(100% - 20px);
    height: 1.3em;
    margin-left: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
#present-users-list .username + .username {
    display: none;
}

@media screen and (min-width: 1200px) {
    #present-users-list { columns: 3; }
}
@media screen and (min-width: 1440px) {
    #present-users-list { columns: 4; }
    #present-users-list li { padding: 5px 0; }
}
</style>
`;
        $('body').append(desktop ? styles : mobileStyles);
    }


    // On page load
    doPageload();

})();
