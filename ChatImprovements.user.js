// ==UserScript==
// @name         Chat Improvements
// @description  Show users in room as a list with usernames, more timestamps
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.8
//
// @include      https://chat.stackoverflow.com/*
// @include      https://chat.stackexchange.com/*
// @include      https://chat.meta.stackexchange.com/*
// ==/UserScript==

(function() {
    'use strict';


    const fkey = document.getElementById('fkey') ? document.getElementById('fkey').value : '';
    const newuserlist = $(`<div id="present-users-list"></div>`);
    const tzOffset = new Date().getTimezoneOffset();
    const now = new Date();
    const dayAgo = Date.now() - 86400000;
    const weekAgo = Date.now() - 7 * 86400000;
    let messageEvents = [];


    function processMessageTimestamps(events) {
        if(typeof events === 'undefined') return;

        // Remove existing "yst" timestamps in favour of ours for consistency
        $('.timestamp').filter((i, el) => el.innerText.includes('yst')).remove();

        /*
        event: {
            content
            event_type
            message_id
            parent_id
            room_id
            time_stamp
            user_id
            user_name
        }
        */

        // Find messages without timestamp, then insert timestamp
        events.forEach(function(event) {
            const msgs = $('#message-' + event.message_id).parent('.messages');
            if(msgs.length && msgs.children('.timestamp').length == 0) {
                const d = new Date(event.time_stamp * 1000);
                let time = d.getHours() + ':' + (d.getMinutes().toString().length != 2 ? '0' : '') + d.getMinutes();
                let prefix = '';
                if(d < weekAgo) {
                    prefix = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d) + ', ';
                }
                else if(d.getDate() != now.getDate()) {
                    prefix = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d) + ' ';
                }
                msgs.prepend(`<div class="timestamp">${prefix}${time}</div>`);
            }
        });

        // Cache results
        // Filter out the unique items, then merge with our cache
        // https://stackoverflow.com/a/23080662
        //messageEvents = messageEvents.concat(events.filter(function (item) {
        //    return messageEvents.indexOf(item) < 0;
        //}));
    }


    function getMessageEvents(beforeMsgId = 0, num = 100) {
        return new Promise(function(resolve, reject) {
            if(typeof CHAT === 'undefined' || CHAT.CURRENT_ROOM_ID === 'undefined') { reject(); return; }
            if(fkey == '') { reject(); return; }

            $.post(`https://${location.hostname}/chats/${CHAT.CURRENT_ROOM_ID}/events`, {
                'since': beforeMsgId,
                'mode': 'Messages',
                'msgCount': num,
                'fkey': fkey
            })
            .done(function(v) {
                processMessageTimestamps(v.events);
                resolve(v.events);
            })
            .fail(reject);
        });
    }


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

        // Remove "switch to" from other room title tooltips
        $('#my-rooms > li > a').each(function() {
            if(this.classList.contains('reply-count')) return;
            this.innerText = this.title.replace('switch to ', '');
        });

        // Show other room's latest message in a tooltip when hovered
        $('#my-rooms .last-message .text').each(function() {
            this.title = this.innerText;
        });

        // Expand more starred posts in AMA chatroom since we have a scrolling sidebar
        $('#sidebar-content.wmx3 span.more').filter((i,el) => el.parentNode.innerText.includes('starred') && el.innerText.includes('more')).click();
    }


    function applyTimestampsToNewMessages() {

        setInterval(function() {

            // Append timestamps when new messages detected
            const newMsgs = $('.messages').filter(function() {
                return $(this).children('.timestamp').length == 0;
            });

            // No new messages
            if(newMsgs.length == 0) return;

            // Apply timestamps
            const d = new Date();
            let time = d.getHours() + ':' + (d.getMinutes().toString().length != 2 ? '0' : '') + d.getMinutes();
            newMsgs.each(function() {
                $(this).prepend(`<div class="timestamp">${time}</div>`);
            });

        }, 1000);
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

                // Open links in a new window
                $('#chat').on('click', '.content a, a.signature', function() {
                    $(this).attr('target', '_blank');
                });

                // ignore rest of script
                return;
            }

            // Append desktop styles
            appendStyles();

            // Move stuff around
            $('#room-tags').appendTo('#roomdesc');
            $('#roomtitle + div').not('#roomdesc').appendTo('#roomdesc');
            reapplyPersistentChanges();
            setInterval(reapplyPersistentChanges, 5000);

            // Apply message timestamps to new messages
            applyTimestampsToNewMessages();

            // On any user avatar image error in sidebar, hide image
            $('#present-users').parent('.sidebar-widget').on('error', 'img', function() {
                $(this).hide();
            });
        }

        // When viewing user info page in mobile
        if(location.pathname.includes('/users/') && $('body').width() < 768) {
            appendMobileUserStyles();
        }

    }


    function listenToPageUpdates() {

        // On any page update
        let loaded = false;
        $(document).ajaxComplete(function(event, xhr, settings) {

            // If not a successful ajax call, do nothing
            if(xhr.status == 403 || xhr.status == 500) return;

            // Once: userlist is ready, init new userlist
            if(!loaded && settings.url.includes('/rooms/pingable')) {
                loaded = true; // once
                updateUserlist();
                setTimeout(updateUserlist, 500);
            }

            // Occasionally update userlist
            setInterval(updateUserlist, 15000);

            // On new messages, update userlist
            if(settings.url.includes('/events') || settings.url.includes('/messages/new') || settings.url.includes('/rooms/pingable')) {
                updateUserlist();
            }

            // On new events fetch (on page load and loading older messages), update cache and insert timestamps
            if(settings.url.includes('/events')) {
                processMessageTimestamps(xhr.responseJSON.events);
            }
        });
    }


    function appendMobileUserStyles() {

        const styles = `
<style>
body,
.topbar .topbar-wrapper,
body > #container {
    max-width: 100vw !important;
}
body.outside #container {
    box-sizing: border-box;
}
.topbar,
.topbar .topbar-wrapper {
    height: auto;
}
.topbar .topbar-links {
    position: relative;
}
.topbar .topbar-links .search-container {
    float: right;
    margin-right: 3px;
}
.topbar .topbar-links .search-container input[type=text] {
    margin: 3px 0 0 5px;
    width: 120px;
}
#header {
    margin-top: 72px;
}
#header #hmenu {
    margin-left: 0px;
}
.subheader {
    height: auto;
    border: none;
}
.subheader #tabs a.youarehere {
    font-size: 100%;
}
.subheader #tabs a,
.subheader #tabs .disabled {
    padding: 0 5px;
}
.subheader #tabs {
    float: none;
    margin: 0 auto;
    clear: both;
}
.subheader #tabs:after {
    content: '';
    display: block;
    clear: both;
    position: relative;
    top: -1px;
    border-bottom: 1px solid #666;
    z-index: -1;
}
.subheader h1,
.subheader h2 {
    float: none;
    font-size: 140%;
    line-height: 1.4;
}
div.xxl-info-layout {
    max-width: 100%;
    zoom: 0.85;
}
</style>`;

        $('head meta[name=viewport]').remove(); // remove existing viewport tag
        $('head').append(`<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />`);
        $('body').append(styles);
    }


    function appendStyles(desktop = true) {

        const mobileStyles = `
<style>
/* Increase size of reply link icons */
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

        const desktopStyles = `
<style>
/* Sidebar scrollbar */
#sidebar::-webkit-scrollbar{width:6px;height:6px;}
#sidebar::-webkit-scrollbar-thumb{background-color:rgb(196, 196, 196); border-radius: 5px;}
#sidebar::-webkit-scrollbar-thumb:hover{background-color:rgb(196, 196, 196);}
#sidebar::-webkit-scrollbar-track{background-color:rgba(0, 0, 0, 0.05);}

/* Reduce room description until mouseover */
#roomdesc {
    position: absolute;
    z-index: 2;
    width: calc(100% - 24px);
    height: 20px;
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
    margin-top: 30px !important;
}
#roomdesc > div {
    display: none;
}
#roomtitle:hover + #roomdesc > div,
#roomdesc:hover > div {
    display: block;
}

/* New AMA chatroom UI */
.sidebar-widget.wmx3 .s-card {
    border: none;
    padding: 0;
}
.wxm3 .present-users-list {
    border: 0;
}
#cp-sb-std-jobs {
    display: none;
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
    box-sizing: border-box;
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
.monologue .timestamp {
    color: #444;
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
#present-users-list li:hover {
    color: #000;
    z-index: 2;
}
#present-users-list:hover li.inactive {
    opacity: 1 !important;
}
#present-users-list li.inactive {
    opacity: 0.5 !important;
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
        font-size: 0.9em;
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
</style>
`;

        const styles = `
<style>
/* Show mods with diamonds */
#chat-body .signature .username.moderator {
    color: #4979b9;
}
#chat-body .signature .username.moderator:after {
    content: ' ♦';
}
/* Fix size of avatars in case they don't load */
.avatar-16 {
    width: 16px;
    height: 16px;
    overflow: hidden;
}
.avatar-32 {
    width: 32px;
    height: 32px;
    overflow: hidden;
}
.monologue .signature .avatar-32 {
    float: right;
}
.monologue .signature .avatar-32 + .username {
    clear: both;
    margin-bottom: 2px;
}

@media screen and (min-width: 768px) {
    #chat-body .monologue .signature {
        width: 11%;
    }
    #chat-body .signature .username.moderator {
        position: relative;
        padding-right: 0.8em;
    }
    #chat-body .signature .username.moderator:after {
        content: '♦';
        position: absolute;
        right: 0;
        font-size: 1.2em;
    }
}
</style>
`;

        $('body').append(styles).append(desktop ? desktopStyles : mobileStyles);
    }


    // On page load
    doPageload();
    listenToPageUpdates();

})();
