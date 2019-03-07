// ==UserScript==
// @name         Chat Improvements
// @description  Show users in room as a compact list
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.1.1
//
// @include      https://chat.stackoverflow.com/*
// @include      https://chat.stackexchange.com/*
// @include      https://chat.meta.stackexchange.com/*
// ==/UserScript==

(function() {
    'use strict';


    const newuserlist = $(`<div id="present-users-list"></div>`);


    function updateUserlist() {

        const userlist = $('#present-users');

        // Reset new list
        newuserlist.empty().insertBefore(userlist);

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
            $(this).off().removeClass('present-user').removeAttr('style id alt width height').find('.data').remove();
            $(this).appendTo(newuserlist).append(`<span class="username" title="${username}">${username}</span>`);
        });
    }


    function doPageload() {

        let loaded = false;

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {

            // Once: userlist is ready
            if(!loaded && settings.url.includes('/rooms/pingable')) {
                loaded = true; // once
                updateUserlist(); // init

                // Occasionally update userlist
                setInterval(updateUserlist, 30e3);
            }

            // On new messages
            if(settings.url.includes('/events') || settings.url.includes('/messages/new')) {
                updateUserlist();
            }
        });
    }


    function appendStyles() {

        const styles = `
<style>
#present-users {
    display: none;
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
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();

})();
