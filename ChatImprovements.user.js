// ==UserScript==
// @name         Chat Improvements
// @description  Show users in room as a compact list
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.5.6
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


    function reapplyPersistentChanges() {

        $('#my-rooms > li > a').each(function() {
            if(this.classList.contains('reply-count')) return;
            this.innerText = this.title.replace('switch to ', '');
        });

        $('#my-rooms .last-message .text').each(function() {
            this.title = this.innerText;
        });
    }


    function doPageload() {

        // When joining a chat room
        if(location.pathname.includes('/rooms/') && !location.pathname.includes('/info/')) {

            // Always rejoin favourite rooms
            $.post(`https://${location.hostname}/chats/join/favorite`, {
                quiet: true,
                immediate: true,
                fkey: fkey
            }, () => console.log('rejoined favourite rooms'));

            // If on mobile chat
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

            // Move stuff around
            $('#room-tags').appendTo('#roomdesc');
            reapplyPersistentChanges();
            setInterval(reapplyPersistentChanges, 5000);

            // On any page update
            let loaded = false;
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

        // On any user avatar image error in sidebar, hide image
        $('#present-users').parent('.sidebar-widget').on('error', 'img', function() {
            $(this).hide();
        });

        // Append desktop styles
        appendStyles();
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
</style>
`;

        const styles = `
<style>
/* Reduce room description until mouseover */
#roomdesc {
    position: absolute;
    z-index: 2;
    width: calc(100% - 24px);
    height: 15px;
    padding: 0 !important;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
#roomtitle:hover + #roomdesc,
#roomdesc:hover {
    height: auto;
    padding-bottom: 20px !important;
    border-bottom: 1px dotted #cfcfcf;
    background: white;
    white-space: unset;
}
#sidebar #info #roomtitle {
    position: relative;
    margin-bottom: 0;
    padding-bottom: 5px;
    padding-right: 18px;
    line-height: 1.2em;
}
#roomdesc + #sidebar-menu {
    margin-top: 30px;
}

/* Increase height of textbox */
#bubble {
    position: relative;
    height: 87px;
}
#input-area {
    height: 100px;
    background-color: #eee;
}
#input {
    height: 88px;
    padding-right: 26px;
}
#tabcomplete-container {
    bottom: 87px;
}

/* Other minor stuff */
#chat-body #container {
    padding-left: 10px;
    padding-right: 10px;
}
#sidebar #info #roomtitle #toggle-favorite {
    position: absolute;
    top: 0;
    right: 0;
    margin-top: 2px;
}
#chat-body #searchbox,
#transcript-body #searchbox {
    width: 150px;
    margin-top: -1px;
    padding: 2px 5px;
}
ul#my-rooms .quickleave {
    float: left;
    margin: 4px 3px 0 0;
}
ul#my-rooms > li > a {
    display: inline-block;
    max-width: calc(100% - 15px);
    margin: 3px 0 -5px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
ul#my-rooms > li > a span {
    display: none;
}
.monologue {
    min-width: 300px;
}


/* New userlist */
#present-users {
    height: 1px;
    margin: 0 0 -1px;
    padding: 0;
    border: 0;
    opacity: 0;
    visibility: hidden;
    overflow: hidden;
}
#present-users-list {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-content: flex-start;
    align-items: flex-start;

    max-height: 300px;
    overflow-y: auto;
    padding-bottom: 16px;
    border-bottom: 1px dotted #cfcfcf;
    list-style: none;
    font-size: 8.8px;
    color: #666;
}
#present-users-list li {
    flex: 1 0 50%;
    align-self: auto;

    position: relative;
    min-width: 80px;
    margin: 0 0 -14px;
    padding: 7px 0;
    opacity: 1 !important;
    background-color: transparent !important;
    z-index: 1;

    -webkit-column-break-inside: avoid;
              page-break-inside: avoid;
                   break-inside: avoid;
}
#present-users-list:hover li.inactive {
    display: block !important;
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
    box-shadow: 0 0 2px 1px rgba(0,0,0,0.2);
}
#present-users-list .username {
    display: inline-block;
    min-width: 58px;
    width: calc(100% - 24px);
    height: 1.3em;
    margin-left: 5px;
    padding-right: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
#present-users-list .username + .username {
    display: none;
}

@media screen and (max-width: 700px) {
    #present-users {
        height: auto;
        margin: 0 0 5px;
        padding: 0 0 5px;
        border-bottom: 1px dotted #cfcfcf;
        opacity: 1;
        visibility: visible;
        overflow: auto;
    }
    #present-users > .present-user,
    #present-users .more,
    #present-users .user-gravatar32 {
        height: 22px;
        width: 22px !important;
    }
    #present-users-list {
        display: none;
    }
}
@media screen and (max-width: 999px) {
    #my-rooms .activity-4 .room-info,
    #my-rooms .activity-5 .room-info,
    #my-rooms .activity-6 .room-info {
        display: none;
    }
}
@media screen and (min-width: 1000px) {
    #present-users-list {
        max-height: none;
        overflow: visible;
        font-size: 0.85em;
    }
    #present-users-list li { flex-grow: 0; flex-basis: 33.33%; }
}
@media screen and (min-width: 1400px) {
    #present-users-list li { flex-basis: 25%; }
    #main { width: 65%; }
    #sidebar { width: 33%; }
}
@media screen and (min-width: 1600px) {
    #present-users-list li { flex-basis: 20%; padding: 8px 0; }
}

/* Hide extra inactive users until userlist is focused */
@media screen and (max-width: 999px) {
   #present-users-list li.inactive:nth-child(n + 15) {
       display: none;
   }
}
@media screen and (max-width: 1339px) {
   #present-users-list li.inactive:nth-child(n + 25) {
       display: none;
   }
}

/* Show mods with diamonds */
.monologue .signature {
    width: 11%;
}
.signature .username.moderator {
    position: relative;
    padding-right: 0.8em;
}
.signature .username.moderator:after {
    content: '♦';
    position: absolute;
    top: -0.1em;
    right: 0;
    font-size: 1.2em;
}
</style>
`;
        $('body').append(desktop ? styles : mobileStyles);
    }


    // On page load
    doPageload();

})();
