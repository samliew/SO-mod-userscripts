// ==UserScript==
// @name         Mod User Quicklinks Everywhere
// @description  Adds user moderation links sidebar with quicklinks & user details (from Mod Dashboard) to user-specific pages, Adds quicklinks to user infobox in posts
// @match        https://stackoverflow.com/*
// @match        https://meta.stackoverflow.com/*
// @match        https://*.stackexchange.com/*
// @exclude      https://stackoverflow.com/c/*
// @author       @samliew
// @version      1.0
// ==/UserScript==

(function() {
    'use strict';

    function getCurrentUserId() {
        if(/\/(users?|-user-|)\//.test(location.href)) {
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
                var $quicklinks = $dataHtml.find('div.mod-links');
                $quicklinks.find('.mod-actions').last().remove();
                var $infoHeader = $quicklinks.find('.title-section').last().text(username).prependTo($quicklinks);
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
body > .mod-links {
    position: fixed;
    z-index: 10001;
    top: 50px;
    right: 100%;
    min-width: 125px;
    max-width: 190px;
    width: calc((100vw - 1100px) / 2);
    padding: 10px 5px 0;
    border: 1px solid #ccc;
    background: white;
}
body > .mod-links:after {
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
body > .mod-links:hover {
    left: -1px;
    right: initial;
}
body > .mod-links .details {
    margin-bottom: 15px;
}
body > .mod-links .details .info-header {
    font-size: 0.95em;
    font-style: italic;
    color: #777;
}
body > .mod-links .details .info-value {
    margin-bottom: 10px;
}
.mod-userlinks {
    font-size: 0.85em;
    text-transform: uppercase;
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
