// ==UserScript==
// @name         Mod User Quicklinks Everywhere
// @description  Adds user moderation links sidebar with quicklinks & user details (from Mod Dashboard) to user-specific pages, Adds quicklinks to user infobox in posts
// @match        https://stackoverflow.com/*
// @match        https://meta.stackoverflow.com/*
// @match        https://*.stackexchange.com/*
// @exclude      https://stackoverflow.com/c/*
// @author       @samliew
// @version      1.2.2
// ==/UserScript==

(function() {
    'use strict';

    function getCurrentUserId() {
        if(location.pathname.indexOf('/users/message/') === 0 || location.pathname.indexOf('/admin/cm-message/') === 0) {
            return $('.msg-moderator:first a[href^="/users/"]').last().attr('href').match(/\d+/)[0];
        }
        if(/\/(users?|-user-)\//.test(location.href)) {
            return location.href.match(/\d+/);
        }
        return null;
    }

    function doPageload() {
        var uid = getCurrentUserId();
        if(uid) {
            console.log(`Current User: ${uid}`);

            // Get user's mod dashboard page
            $.get('https://stackoverflow.com/users/account-info/' + uid, function(data) {
                var $dataHtml = $(data);
                var username = $(data).find('h1').first().get(0).childNodes[0].nodeValue;

                // Modify quicklinks and user details, then append to page
                var $quicklinks = $dataHtml.find('div.mod-links').attr('id', 'usersidebar');
                $quicklinks.find('.mod-actions').last().remove();
                var $infoHeader = $quicklinks.find('.title-section').click(function() {
                    $(this).nextAll('div,ul').first().slideToggle(150);
                }).last().text(username).prependTo($quicklinks);
                var $info = $dataHtml.find('.mod-section .details').insertAfter($infoHeader);
                $info.children('.row').each(function() {
                    $(this).children().first().unwrap();
                });
                $info.children('.col-2').removeClass('col-2').addClass('info-header');
                $info.children('.col-4').removeClass('col-4').addClass('info-value');
                $('body').append($quicklinks);

                // Add history link to quicklinks, so you don't have to open the mod popup and switch tabs
                $('.mod-quick-links').prepend(`<li><a href="/users/history/${uid}">history</a></li>`);
            });
        }

        addUserLinks();
    }

    function listenToPageUpdates() {
        $(document).ajaxComplete(function() {
            addUserLinks();
        });
    }

    function addUserLinks() {
        $('.post-user-info, .user-details')
            .not('[js-mod-quicklinks]')
            .attr('js-mod-quicklinks', 'true')
            .find('a[href^="/users/"]:first').each(function() {

                // Ignore mods
                var modFlair = $(this).next('.mod-flair');
                if(modFlair.length) return;

                // Add Votes and IP-xref links after the user link
                var uid = this.href.match(/\d+/);
                $('<div class="mod-userlinks">[ <a href="/users/account-info/'+uid+'" target="_blank">mod</a> | <a href="/admin/show-user-votes/'+uid+'" target="_blank">votes</a> | <a href="/admin/xref-user-ips/'+uid+'" target="_blank">xref</a> ]</div>')
                    .insertAfter(this);
            });
    }

    function appendStyles() {

        var styles = `
<style>
#usersidebar {
    position: fixed;
    z-index: 10001;
    top: 50px;
    right: 100%;
    width: 190px;
    max-height: calc(100vh - 50px);
    padding: 10px 5px 0;
    border: 1px solid #ccc;
    background: white;
    opacity: 0.7;
}
#usersidebar:after {
    content: 'user';
    position: absolute;
    left: 100%;
    top: 5px;
    width: 40px;
    height: 30px;
    padding: 5px 8px;
    background: white;
    border: 1px solid #ccc;
    border-left: none;
}
#usersidebar:hover {
    left: -1px;
    right: initial;
    opacity: 1;
}
#usersidebar .title-section {
    cursor: pointer;
}
#usersidebar .details {
    margin-bottom: 15px;
}
#usersidebar .details .info-header {
    font-size: 0.95em;
    font-style: italic;
    color: #777;
}
#usersidebar .details .info-value {
    margin-bottom: 10px;
}
#usersidebar .details > div:nth-child(-n + 2),
#usersidebar .details > div:nth-child(n+3):nth-child(-n+4),
#usersidebar .details > div:nth-child(n + 17) {
    display: none;
}
.mod-userlinks {
    display: none;
    font-size: 1em;
    transform: scale(0.9, 0.9);
    transform-origin: left center;
}
.post-user-info:hover .mod-userlinks,
.user-info:hover .mod-userlinks {
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
