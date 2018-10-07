// ==UserScript==
// @name         User Info Sidebar
// @description  Adds user moderation links sidebar with quicklinks & user details (from Mod Dashboard) to user-specific pages
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.1.1
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*.stackexchange.com/*
//
// @exclude      *chat.*
// @exclude      https://stackoverflow.com/c/*
// ==/UserScript==

(function() {
    'use strict';

    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;


    function getCurrentUserId() {
        if(location.pathname.indexOf('/users/message/') === 0 || location.pathname.indexOf('/admin/cm-message/') === 0) {
            return $('.msg-moderator:first a[href^="/users/"], #addressing .user-details a').last().attr('href').match(/\d+/)[0];
        }
        if(/(\/users?\/|-user-)/.test(location.href)) {
            return location.href.match(/\d+/);
        }

        const questionUser = $('#question .user-info:last a').first();
        if(questionUser.length !== 0) {
            return questionUser.attr('href').match(/\d+/)[0];
        }
        return null;
    }


    function doPageload() {
        const uid = getCurrentUserId();
        if(uid) {
            //console.log(`Current User: ${uid}`);

            // Get user's mod dashboard page
            $.get('/users/account-info/' + uid, function(data) {
                const username = $('h1', data).first().get(0).childNodes[0].nodeValue.trim();

                // Modify quicklinks and user details, then append to page
                const $quicklinks = $('div.mod-links', data).attr('id', 'usersidebar');
                const $modActions = $quicklinks.find('.mod-actions');

                // Move contact links
                $modActions.find('li').slice(-4, -2).appendTo($quicklinks.find('ul:first'));

                // Remove other actions as they need additional work to get popup working
                $modActions.last().remove();

                // Collapse headers on click
                const $infoHeader = $quicklinks.find('h3').click(function() {
                    $(this).nextAll('div, ul').first().slideToggle(150);
                }).last().text(username).prependTo($quicklinks);

                // Insert user details
                const $info = $('.mod-section .details', data).insertAfter($infoHeader);
                $info.children('.row').each(function() {
                    $(this).children().first().unwrap();
                });

                // Transform user details to list format
                $info.children('.col-2').removeClass('col-2').addClass('info-header');
                $info.children('.col-4').removeClass('col-4').addClass('info-value');

                // Add history link to quicklinks, so you don't have to open the mod popup and switch tabs
                $('.mod-quick-links', $quicklinks).prepend(`<li><a href="/users/history/${uid}">history</a></li>`);

                // Add history link to quicklinks, so you don't have to open the mod popup and switch tabs
                $quicklinks.find('a[href*="xref-user-ips"]').attr('href', (i, v) => v += '?daysback=30&threshold=2');

                // If on meta,
                if(StackExchange.options.site.isMetaSite) {
                    // enable contact user link
                    $('.mod-quick-links span.disabled', $quicklinks).replaceWith(`<a title="use to contact this user and optionally suspend them" href="/users/message/create/${uid}">contact user</a>`);

                    // change links to main
                    $('.mod-quick-links a', $quicklinks).attr('href', (i, v) => StackExchange.options.site.parentUrl + v);
                }

                // Check if user is currently suspended, highlight username
                const susMsg = $('.system-alert', data).first().text();
                if(susMsg.indexOf('suspended') >= 0) {
                    const susDur = susMsg.split('ends')[1].replace(/(^\s|(\s|\.)+$)/g, '');
                    $quicklinks.find('h3').first().css({ color: 'red' }).attr('title', `currently suspended (ends ${susDur})`);
                }

                // Append to page
                $('body').append($quicklinks);
            });
        }
    }


    function listenToPageUpdates() {
        $(window).on('load resize', function() {
            $('body').toggleClass('usersidebar-open', $(document).width() >= 1660);
            $('body').toggleClass('usersidebar-compact', $(window).height() <= 680);
        });
    }


    function appendStyles() {

        const styles = `
<style>
#usersidebar {
    position: fixed;
    z-index: 8950;
    top: 44px;
    right: 100%;
    width: 190px;
    max-height: calc(100vh - 50px);
    padding: 10px 5px 0;
    background: white;
    opacity: 0.7;
    border: 1px solid #ccc;
    box-shadow: 2px 2px 14px -3px rgba(0,0,0,0.25);
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
    box-shadow: 3px 2px 10px -2px rgba(0,0,0,0.25);
}
.usersidebar-open #usersidebar,
#usersidebar:hover {
    left: -1px;
    right: initial;
    opacity: 1;
}
.usersidebar-open #usersidebar {
    top: 50px;
    box-shadow: none;
}
.usersidebar-open #usersidebar:after {
    display: none;
}
.usersidebar-compact #usersidebar {
    top: 0px;
    max-height: 100vh;
}
.usersidebar-compact #usersidebar:after {
    top: 49px;
}
#usersidebar h3 {
    margin-bottom: 15px !important;
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
#usersidebar .details > div:nth-child(n+7):nth-child(-n+8),
#usersidebar .details > div:nth-child(n+13):nth-child(-n+14),
#usersidebar .details > div:nth-child(n+19) {
    display: none;
}
.mod-quick-links .bounty-indicator-tab {
    float: left;
    margin-right: 4px !important;
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
