// ==UserScript==
// @name         User Review Ban Helper
// @description  Display users' prior review bans in review, Insert review ban button in user review ban history page, Load ban form for user if user ID passed via hash
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.2
//
// @include      */review/close*
// @include      */review/reopen*
// @include      */review/suggested-edits*
// @include      */review/helper*
// @include      */review/low-quality-posts*
// @include      */review/triage*
// @include      */review/first-posts*
// @include      */review/late-answers*
//
// @include      */users/history/*?type=User+has+been+banned+from+review
//
// @include      */admin/review/bans
// ==/UserScript==

(function() {
    'use strict';

    // Solution from https://stackoverflow.com/a/24719409/584192
    function jQueryXhrOverride() {
        var xhr = jQuery.ajaxSettings.xhr();
        var setRequestHeader = xhr.setRequestHeader;
        xhr.setRequestHeader = function(name, value) {
            if (name == 'X-Requested-With') return;
            setRequestHeader.call(this, name, value);
        };
        return xhr;
    }

    function doPageload() {

        // Load ban form for user if passed via querystring
        if(location.pathname === '/admin/review/bans') {
            var params = location.hash.substr(1).split('|');
            var uid = params[0];

            // Insert UID
            $('#user-to-ban').val(uid);

            // Submit lookup
            setTimeout(() => $('#lookup').click(), 500);

            // Insert ban message if review link found
            if(typeof params[1] !== 'undefined') {
                var banMsg = `Your review on https://${location.hostname}${params[1]} wasn't helpful. Please review the history of the post and consider how choosing a different action would help achieve that outcome more quickly.`;
                setTimeout(() => $('textarea[name=explanation]').val(banMsg), 3000);
            }
        }
        // Review queues
        else if(location.pathname.indexOf('/users/history') >= 0) {
            var uid2 = location.pathname.match(/\d+/)[0];
            $(`<a class="button reviewban-button" href="/admin/review/bans#${uid2}">Review Ban User</a>`).insertAfter('.subheader h1');
        }
        else {
            $(document).ajaxComplete(function(event, xhr, settings) {
                if(settings.url.indexOf('/review/next-task') >= 0) getUsersInfo();
            });
        }
    }

    function getUsersInfo() {

        $('.review-summary').find('a[href^="/users/"]').each(function() {
            // Ignore mods
            var modFlair = $(this).next('.mod-flair');
            if(modFlair.length) return;

            var userlink = $(this);
            var uid = $(this).attr('href').match(/\d+/)[0];
            var url = '/users/history/' + uid + '?type=User+has+been+banned+from+review';
            var banUrl = `/admin/review/bans#${uid}|${location.pathname}`;

            // Add ban link
            $(`<a class="reviewban-link" href="${banUrl}" title="Ban user from reviews" target="_blank">X</a>`)
                .insertBefore(userlink);

            // Grab user's history
            $.ajax({
                url: url,
                xhr: jQueryXhrOverride,
                success: function(data) {

                    // Parse user history page
                    var numBans = 0;
                    var summary = $('#summary', data);
                    var numBansLink = summary.find('a[href="?type=User+has+been+banned+from+review"]').get(0);
                    if(typeof numBansLink !== 'undefined')
                        numBans = Number(numBansLink.nextSibling.nodeValue.match(/\d+/)[0]);

                    console.log("Review bans for " + uid, numBans);

                    // Add annotation count
                    $(`<a class="reviewban-count ${numBans > 2 ? 'warning' : ''}" href="${url}" title="${numBans} prior review bans" target="_blank">${numBans}</a>`)
                        .insertBefore(userlink);
                }
            });
        });
    }

    function appendStyles() {

        var styles = `
<style>
a.reviewban-count,
a.reviewban-link {
    position: relative;
    top: -2px;
    display: inline-block;
    width: 16px;
    height: 16px;
    margin-right: 5px;
    text-align: center;
    font-size: 0.8em;
    line-height: 14px;
    border-radius: 50%;
    border: 1px solid #666;
    color: #666;
}
a.reviewban-count.warning {
    background: #FF9;
    border-color: red;
    color: red;
}
a.reviewban-link {
    border: 1px solid red;
    background: red;
    color: white;
}
a.reviewban-button {
    float: right;
}
</style>
`;
        $('body').append(styles);
    }

    // On page load
    doPageload();
    appendStyles();

})();
