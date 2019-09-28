// ==UserScript==
// @name         Chat Improvements
// @description  Show users in room as a list with usernames, more timestamps, tiny avatars only, timestamps on every message, message parser, collapse room description and room tags, wider search box, mods with diamonds
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.6.1
//
// @include      https://chat.stackoverflow.com/*
// @include      https://chat.stackexchange.com/*
// @include      https://chat.meta.stackexchange.com/*
//
// @grant        GM_xmlhttpRequest
//
// @connect      *
// @connect      self
// @connect      stackoverflow.com
// @connect      serverfault.com
// @connect      superuser.com
// @connect      askubuntu.com
// @connect      mathoverflow.com
// @connect      stackexchange.com
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


    // Get message info
    function getMessage(mid) {
        return new Promise(function(resolve, reject) {
            if(typeof mid === 'undefined' || mid == null) { reject(); return; }

            $.get(`https://${location.hostname}/messages/${mid}/history`)
            .done(function(v) {
                console.log('fetched message info', mid);

                const msg = $('.message:first', v);
                const msgContent = msg.find('.content');
                const userId = Number(msg.closest('.monologue')[0].className.match(/user-(-?\d+)/)[1]);
                const userName = msg.closest('.monologue').find('.username a').text();
                const timestamp = msg.prev('.timestamp').text();
                const permalink = msg.children('a').first().attr('href');
                const roomId = Number(permalink.match(/\/(\d+)/)[1]);

                const parentId = Number(($('.message-source:last', v).text().match(/^:(\d+)/) || ['0']).pop()) || null;

                resolve({
                    id: mid,
                    parentId: parentId,
                    roomId: roomId,
                    timestamp: timestamp,
                    permalink: permalink,
                    userId: userId,
                    username: userName,
                    html: msgContent.html().trim(),
                    text: msgContent.text().trim(),
                    stars: Number(msg.find('.stars .times').text()) || 0,
                    isPinned: msg.find('.owner-star').length == 1,
                });
            })
            .fail(reject);
        });
    }


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
                msgs.prepend(`<div class="timestamp js-dynamic-timestamp">${prefix}${time}</div>`);
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

            // No new messages, do nothing
            if(newMsgs.length == 0) return;

            // Apply timestamps
            const d = new Date();
            let time = d.getHours() + ':' + (d.getMinutes().toString().length != 2 ? '0' : '') + d.getMinutes();
            newMsgs.each(function() {
                $(this).prepend(`<div class="timestamp">${time}</div>`);
            });

        }, 1000);
    }



    /*
       This function is intended to check for new messages and parse the message text
       - It converts non-transcript chatroom links to the room transcript
       - Attempt to display chat domain, and room name or message id with (transcript) label
       - Also unshortens Q&A links that are truncated by default with ellipsis
    */
    function initMessageParser() {

        const transcriptIndicator = ' <i class="transcript-link">(transcript)</i>';


        function parseMessageLink(i, el) {

            // Ignore links to bookmarked conversations
            if(/\/rooms\/\d+\/conversation\//.test(el.href)) { }
            // Ignore X messages moved links
            else if(/^\d+ messages?$/.test(el.innerText)) { }
            // Ignore room info links
            else if(el.href.includes('/info/')) { }
            // Convert all other chatroom links to the room transcript
            else if(el.href.includes('chat.') && el.href.includes('/rooms/')) {
                el.href = el.href.replace('/rooms/', '/transcript/');
                el.innerText = el.innerText.replace('/rooms/', '/transcript/');
            }


            // Attempt to display chat domain, and room name or message id with (transcript) label
            if(el.href.includes('chat.') && el.href.includes('/transcript/') && /stack(overflow|exchange)\.com/.test(el.innerText)) {
                let chatDomain = [
                    { host: 'chat.stackexchange.com', name: 'SE chat' },
                    { host: 'chat.meta.stackexchange.com', name: 'MSE chat' },
                    { host: 'chat.stackoverflow.com', name: 'SO chat' }
                ].filter(v => v.host == el.hostname).pop() || '';
                let roomName = el.href.split('/').pop().replace(/[?#].+$/, '').replace(/-/g, ' ').replace(/\b./g, m => m.toUpperCase());
                let messageId = Number((el.href.match(/(#|\?m=)(\d+)/) || [0]).pop());

                // Check if we have a valid parsed message id
                if(messageId == 0) messageId = roomName;

                // Display message id
                if(el.href.includes('/message/') || el.href.includes('?m=')) {
                    el.innerHTML = chatDomain.name +
                        (!isNaN(Number(roomName)) && !el.href.includes('/message/') ? ', room #' + roomName : '') +
                        ', message #' + messageId + transcriptIndicator;
                }
                // Display room name
                else if(isNaN(Number(roomName))) {
                    // Change link text to room name only if link text is a URL
                    if(/(^https?|\.com)/.test(el.innerText)) {
                        el.innerHTML = roomName + transcriptIndicator;
                    }
                    else {
                        el.innerHTML += transcriptIndicator;
                    }
                }
                // Fallback to generic domain since no room slug
                else {
                    el.innerHTML = chatDomain.name + ', room #' + roomName + transcriptIndicator;
                }

                // Verbose links should not wrap across lines
                $(this).addClass('nowrap');
            }

            // Shorten Q&A links
            else if(((el.href.includes('/questions/') && !el.href.includes('/tagged/')) || el.href.includes('/q/') || el.href.includes('/a/')) && el.innerText.includes('…')) {

                var displayUrl = el.href;

                // Strip certain querystrings
                displayUrl = displayUrl.replace(/[?&]noredirect=1/, '');

                // Get comment target (is it on a question or answer), based on second parameter
                let commentId = null, commentTarget = null;
                if(/#comment\d+_\d+$/.test(el.href)) {
                    commentId = el.href.match(/#comment(\d+)_\d+$/)[1];
                    commentTarget = Number(el.href.match(/#comment\d+_(\d+)$/)[1]);
                }

                // If long answer link
                if(el.href.includes('/questions/') && /\/\d+\/[\w-]+\/\d+/.test(el.href)) {

                    // If has comment in url, check if comment target is answer
                    if(commentId != null && commentTarget != null) {
                        const answerId = Number(el.href.match(/\/\d+\/[\w-]+\/(\d+)/)[1]);

                        if(commentTarget == answerId) {
                            // Convert to short answer link text with comment hash
                            displayUrl = displayUrl.replace(/\/questions\/\d+\/[^\/]+\/(\d+)(#\d+)?(#comment\d+_\d+)?$/i, '/a/$1') +
                                '#comment' + commentId;
                        }
                        else {
                            // Convert to short question link text with comment hash
                            displayUrl = displayUrl.replace(/\/questions\/(\d+)\/[^\/]+\/(\d+)(#\d+)?(#comment\d+_\d+)?$/i, '/q/$1') +
                                '#comment' + commentId;
                        }
                    }
                    else {
                        // Convert to short answer link text
                        displayUrl = displayUrl.replace(/\/questions\/\d+\/[^\/]+\/(\d+)(#\d+)?(#comment\d+_\d+)?$/i, '/a/$1');
                    }
                }
                // If long question link
                else {

                    // Convert to short question link text
                    // Avoid truncating inline question links
                    displayUrl = displayUrl.replace('/questions/', '/q/').replace(/\?(&?(cb|noredirect)=\d+)+/i, '').replace(/(\/\D[\w-]*)+((\/\d+)?#comment\d+_\d+)?$/, '') +
                        (commentId != null ? '#comment' + commentId : '');
                }

                el.innerText = displayUrl;
            }

            // Shorten /questions/tagged links, but ignore tag inline-boxes
            else if(el.href.includes('/questions/tagged/') && el.children.length == 0) {

                el.innerText = el.href.replace('/questions/tagged/', '/tags/');
            }


            // Remove user id if question or answer
            if((el.href.includes('/q/') || el.href.includes('/a/')) && /\/\d+\/\d+$/.test(el.href)) {
                el.href = el.href.replace(/\/\d+$/, '');
                el.innerText = el.innerText.replace(/\/\d+$/, '');
            }


            // For all other links that are still truncated at this stage,
            if(el.innerText.includes('…')) {

                // display full url if url is <64 chars incl protocol
                if(el.href.length < 64) {
                    el.innerText = el.href;
                }
                // else display next directory path if it's short enough
                else {
                    let displayed = el.innerText.replace('…', '');
                    let hiddenPath = el.href.replace(/^https?:\/\/(www\.)?/, '').replace(displayed, '').replace(/\/$/, '').split('/');
                    let hiddenPathLastIndex = hiddenPath.length - 1;
                    let shown1;
                    console.log(hiddenPath);

                    // If next hidden path is short, or is only hidden path
                    if(hiddenPath[0].length <= 25 || (hiddenPath.length == 1 && hiddenPath[hiddenPathLastIndex].length <= 50)) {
                        el.innerText = displayed + hiddenPath[0];
                        shown1 = true;

                        // if there are >1 hidden paths, continue displaying ellipsis at the end
                        if(hiddenPath.length > 1) {
                            el.innerText += '/…';
                        }
                    }

                    // Display last directory path if it's short enough
                    if(hiddenPath.length > 1 && hiddenPath[hiddenPathLastIndex].length <= 50) {
                        el.innerText += '/' + hiddenPath[hiddenPathLastIndex];

                        // if full url is shown at this stage, strip ellipsis
                        if(shown1 && hiddenPath.length <= 2) {
                            el.innerText = el.innerText.replace('/…', '');
                        }
                    }
                }
            }


            // Finally we trim all protocols and trailing slashes for shorter URLs
            if(/(^https?|\/$)/.test(el.innerText)) {
                el.innerText = el.innerText.replace(/^https?:\/\//i, '').replace(/\/$/, '');
            }

        }


        function parseRoomMini(i, el) {

            // Convert main chatroom title link to the room transcript
            const roomLink = el.querySelector('a');
            roomLink.href = roomLink.href.replace('/rooms/', '/transcript/');
            roomLink.innerText = roomLink.innerText.replace('/rooms/', '/transcript/');

            // Show longer description
            const desc = $(el).find('.room-mini-description').each(function(i, el) {
                el.innerHTML = el.title.replace(/https?:\/\/[^\s]+/gi, '<a href="$&" rel="nofollow noopener noreferrer">$&</a>');
                el.title = "";
            });
        }

        setInterval(function() {

            // Get new messages
            const newMsgs = $('.message').not('.js-parsed').addClass('js-parsed');
            if(newMsgs.length > 0) {

                // Parse message links, but ignoring oneboxes, room minis, and quotes
                newMsgs.find('.content a').filter(function() {
                    return $(this).parents('.onebox, .quote, .room-mini').length == 0;
                }).each(parseMessageLink);

                // Parse room minis
                newMsgs.find('.room-mini').each(parseRoomMini);
            }

            // Get new starred messages
            const newStarredMsgs = $('#starred-posts li').not('.js-parsed').addClass('js-parsed');
            if(newStarredMsgs.length > 0) {

                // Parse links, but ignoring transcript links
                newStarredMsgs.find('a').filter(function() {
                    return !this.href.includes('/transcript/');
                }).each(parseMessageLink);
            }

        }, 1000);

    }
    /* End message parser */



    function doPageload() {

        // When joining a chat room
        if(location.pathname.includes('/rooms/') && !location.pathname.includes('/info/')) {

            const roomId = CHAT.CURRENT_ROOM_ID;

            // Rejoin favourite rooms on link click
            let rejoinFavsBtn = $(`<a href="#">rejoin starred</a><span class="divider"> / </span>`).prependTo($('#my-rooms').parent('.sidebar-widget').find('.msg-small').first());
            rejoinFavsBtn.click(function() {
                $(this).next('span.divider').addBack().remove();
                $.post(`https://${location.hostname}/chats/join/favorite`, {
                    quiet: true,
                    immediate: true,
                    fkey: fkey
                }, () => console.log('rejoined favourite rooms'));
                return false;
            });

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
            $('#sidebar-menu').append(`<span> | <a id="room-transcript" title="view room transcript" href="/transcript/${roomId}">transcript</a> | <a id="room-owners" title="view room owners" href="/rooms/info/${roomId}/?tab=access#access-section-owner">owners</a></span>`);
            reapplyPersistentChanges();
            setInterval(reapplyPersistentChanges, 5000);

            // Apply message timestamps to new messages
            applyTimestampsToNewMessages();

            // Parse messages
            initMessageParser();

            // On any user avatar image error in sidebar, hide image
            $('#present-users').parent('.sidebar-widget').on('error', 'img', function() {
                $(this).hide();
            });

            // Sidebar starred messages, show full content on hover
            function loadFullStarredMessage() {
                const el = $(this);
                const mid = Number(this.id.replace(/\D+/g, ''));

                // already fetched or nothing to expand, do nothing (toggle via css)
                if(el.hasClass('js-hasfull') || !/\.\.\.\s*- <a rel="noreferrer noopener" class="permalink"/.test(el.html())) return;

                // prefetch stuff
                el.addClass('js-hasfull').contents().filter(function() {
                    return this.nodeType === 3 || !/(permalink|relativetime|quick-unstar)/.test(this.className) && this.title == "";
                }).wrapAll(`<div class="message-orig"></div>`);
                el.children('.sidebar-vote').prependTo(el);
                el.children('.message-orig').html((i, v) => v.replace(/\s*-\s*by\s*$/, ''));
                el.children('.permalink').before(`<div class="message-full"><i>loading...</i></div><span> - </span>`).after('<span> by </span>');
                el.children('.quick-unstar').before('<span> </span>');

                // load full message content
                getMessage(mid).then(v => {
                    el.children('.message-full').html(v.html);
                });
            }
            setTimeout(() => {
                $('#starred-posts li:visible').each(loadFullStarredMessage); // on page load, after short delay
            }, 5000);
            $('#starred-posts').on('mouseover', 'li', loadFullStarredMessage); // when additional starred messages are viewed

        }
        // When viewing page transcripts and bookmarks
        else if(location.pathname.includes('/transcript/') || location.pathname.includes('/conversation/')) {

            // Append desktop styles
            appendStyles();

            // Parse messages
            initMessageParser();
        }
        // When viewing room access tab
        else if(location.pathname.includes('/rooms/info/') && location.search.includes('tab=access')) {

            // Append desktop styles
            appendStyles();

            const roomId = Number(location.pathname.match(/\/(\d+)\//).pop());

            // Prepare container
            const logdiv = $('<div id="access-section-owner-log"></div>').appendTo('#access-section-owner');

            // Search for and append room owner changelog
            logdiv.load(`https://${location.hostname}/search?q=the+list+of+this+room&user=-2&room=${roomId} .messages`, function(response) {

                // Jump to section again on load if hash present
                if(location.hash == '#access-section-owner') {
                    document.getElementById('access-section-owner').scrollIntoView();
                }

                const messages = logdiv.find('.messages').wrap('<div class="monologue"></div>');
                logdiv.find('.content').find('a:last').replaceWith('<span>list of room owners</span>');
                logdiv.find('.messages a').attr('target', '_blank');

                // Remove invalid entries
                messages.filter((i, el) => !/(has added|has removed).+(to|from) the list of room owners\.$/.test(el.innerText)).remove();
                // Remove empty monologues
                logdiv.children('.monologue:empty').remove();

                // Add indicator icon
                logdiv.find('.content').each(function() {
                    $(this).prepend(this.innerText.includes('has added') ? '<b class="green">+</b>' : '<b class="red">-</b>');
                });

                // Add title
                logdiv.prepend('<h4>Room Owner Changelog</h4>');
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
            if(!loaded && (settings.url.includes('/events') || settings.url.includes('/rooms/pingable'))) {
                loaded = true; // once
                updateUserlist();
                setTimeout(updateUserlist, 1000);

                // Occasionally update userlist
                setInterval(updateUserlist, 15000);
            }

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
#chat-body.mob #present-users-list {
    display: none !important;
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

/* Always use tiny (compact) signatures */
.monologue .tiny-signature {
    display: block !important;
}
.monologue .tiny-signature ~ * {
    display: none !important;
}


/* Other minor stuff */
#loading #loading-message {
    top: 40%;
    left: 50%;
    right: unset;
    height: unset;
    width: unset;
    max-width: 600px;
    transform: translate(-50%, -50%);
}
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
#sidebar .sprite-sec-private,
#sidebar .sprite-sec-gallery {
    margin-right: 1px;
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
.message a i.transcript-link {
    opacity: 0.5;
    font-size: 0.9em;
}


/* Full message previews on hover */
#starred-posts .js-hasfull {
    min-height: 28px;
}
#starred-posts .message-full,
#starred-posts .js-hasfull:hover .message-orig {
    display: none;
}
#starred-posts .message-orig,
#starred-posts .js-hasfull:hover .message-full {
    display: inline;
}
#starred-posts ul.collapsible.expanded {
    max-height: 50vh;
    padding-right: 3px;
    padding-bottom: 50px;
    overflow-y: scroll;
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
@media screen and (max-width: 1400px) {
   #present-users-list li.inactive:nth-child(n + 31) {
       display: none;
   }
}
@media screen and (max-width: 1600px) {
   #present-users-list li.inactive:nth-child(n + 41) {
       display: none;
   }
}
@media screen {
   #present-users-list li.inactive:nth-child(n + 51) {
       display: none;
   }
}
</style>
`;

        const generalstyles = `
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
.system-message-container {
    margin: 15px 0px;
}

/* No wrap chat transcript links, unless in sidebar */
a.nowrap {
    white-space: nowrap;
}
#sidebar a.nowrap {
    white-space: initial;
}

/* Break all links in expanded room mini infobox */
.room-mini-description a {
    word-break: break-all;
}

/* RO changelog */
#access-section-owner-log {
    margin: 10px 0;
    padding-bottom: 32px;
}
#access-section-owner-log h4 {
    margin-bottom: 5px;
}
#access-section-owner-log .flash {
    display: none;
}
#access-section-owner-log .message .content b:first-child {
    display: inline-block;
    width: 20px;
    text-align: center;
}
#access-section-owner-log b.green {
    color: green !important;
}
#access-section-owner-log b.red {
    color: red !important;
}
body.outside .access-section h2 {
    margin-bottom: 5px;
}
.access-section .access-list {
}
.access-section .access-list:after {
    content: "";
    display: table;
    clear: both;
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
        top: 0;
        right: 0;
        font-size: 1.2em;
    }
}
</style>
`;

        const printstyles = `
<style>
@media print {

    body {
        font-size: 11px;
        background-color: #fff;
        background-image: none;
    }

    #feed-ticker,
    #bottom,
    #input-area,
    #sound,
    input,
    button,
    .button,
    #container > a,
    #container > br,
    #widgets > .sidebar-widget:nth-child(2),
    #widgets > .sidebar-widget:last-child,
    #sidebar .more,
    #sidebar .js-hasfull .message-orig,
    #toggle-favorite,
    .js-dynamic-timestamp,
    .monologue .avatar,
    .message-controls
    {
        display: none !important;
    }

    #sidebar #info #roomdesc > div,
    #starred-posts > div > ul > li
    {
        display: block !important;
    }

    #sidebar .js-hasfull .message-full
    {
        display: inline !important;
    }

    #main {
        display: flex;
        flex-direction: column-reverse;
        width: 100%;
    }
    #sidebar {
        position: relative;
        width: auto;
        margin: 10px 0 20px;
        padding: 10px;
        border: 1px dotted black;
    }
    #sidebar #info #roomdesc {
        position: relative !important;
        height: auto !important;
        padding-bottom: 0 !important;
        border: none !important;
        background: transparent !important;
        white-space: unset !important;
    }
    #sidebar #info #roomdesc + #sidebar-menu {
        margin-top: 10px !important;
    }
    #sidebar #present-users-list {
        color: #000;
    }
    #sidebar #present-users-list li {
        flex: 0 0 125px;
    }
    #sidebar #present-users-list li.inactive {
        opacity: 0.7 !important;
    }
    #starred-posts ul.collapsible.expanded {
        max-height: none;
        padding-bottom: 0;
        overflow: auto;
    }
    #chat {
        padding-bottom: 20px;
    }
    .monologue {
        display: flex;
        margin: 10px 20px 0 0;
        padding: 0;
    }
    .monologue .signature {
        flex: 0 1 100px;
        margin-right: 10px;
    }
    .monologue .messages {
        flex: 1 0 80%;
        background-color: #f8f8f8;
    }
    .monologue.catchup-marker {
        padding-top: 0;
        border-top: none;
    }
    #chat .monologue,
    #chat .monologue * {
        float: none !important;
    }
    #chat .messages .timestamp {
        float: right !important;
    }
    .message {
        display: flex;
        page-break-inside: avoid;
        break-inside: avoid;
    }

}
</style>
`;

        $('body').append(generalstyles).append(printstyles);

        if(desktop) {
            $('body').append(desktopStyles);
        }
        else {
            $('body').append(mobileStyles)
        }
    }


    // On page load
    doPageload();
    listenToPageUpdates();

})();
