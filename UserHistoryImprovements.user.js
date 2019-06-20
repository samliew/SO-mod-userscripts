// ==UserScript==
// @name         User History Improvements
// @description  Fixes broken links in user annotations, and minor layout improvements
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.2.8
//
// @include      https://*stackoverflow.com/users/history/*
// @include      https://*serverfault.com/users/history/*
// @include      https://*superuser.com/users/history/*
// @include      https://*askubuntu.com/users/history/*
// @include      https://*mathoverflow.net/users/history/*
// @include      https://*.stackexchange.com/users/history/*
// ==/UserScript==


(function() {
    'use strict';

    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;


    function doPageLoad() {

        $('#annotations tr').each(function() {
            const td = $(this).children('td, th').eq(3);

            // Pad dates to same length
            const date = $(this).children('td, th').eq(2).find('span');
            date.text((i,v) => v.replace(/\s(\d)\b/g, ' 0$1'));

            // Special class for message/suspension rows
            const aType = $(this).children().first().text().trim().toLowerCase();
            if(/(suspension|message)/.test(aType)) {
                $(this).addClass('user-message');
                return;
            }

            // Fix broken links
            const str = td.html()
              .replace(/" title="([^"]+)/g, '') // remove title attribute
              .replace(/" rel="nofollow noreferrer/g, '') // remove auto-inserted rel attribute from external links
              .replace(/(<a href="|">[^<]+<\/a>)/g, '') // strip existing links (text)
              .replace(/(&lt;a href="|"&gt;[^&]+&lt;\/a&gt;)/g, '') // strip existing links (html-encoded)
              .replace(/\s(\/users\/\d+\/[^\s\b]+)\b/gi, ' <a href="$1">$1</a> ') // relink users relative urls
              .replace(/(https?:\/\/[^\s\)]+)\b/gi, '<a href="$1">$1</a>') // all other urls
              .replace(/\s(\d{6,})\b/g, ' <a href="/users/$1">$1</a>') // assume numeric digits of >= 6 chars are user ids

            td.html(str);
        });

        // Links open in new window
        $('#annotations a').attr('target', '_blank');
    }


    function appendStyles() {

        const styles = `
<style>
#annotations span.mod-flair {
    display: none;
}
#annotations th {
    font-weight: bold;
    border-bottom: 1px solid #aaa;
}
#annotations th,
#annotations td {
    padding: 7px 5px;
    text-overflow: ellipsis;
    overflow: hidden;
}
#annotations td:nth-child(-n + 3) {
    white-space: nowrap;
}
#annotations td:nth-child(1) {
    max-width: 52px;
}
#annotations td:nth-child(3) {
    max-width: 95px;
}
#annotations td:nth-child(4) {
    width: 100%;
}
#annotations td:nth-child(5) {
    min-width: 150px;
    max-width: 150px;
}
#annotations th:nth-child(6),
#annotations td:nth-child(6) {
    display: none;
}
#annotations tbody tr:nth-child(odd) {
    background-color: #f3f3f3;
}
#annotations table.annotation {
    border: 1px solid #ddd;
}
#annotations tr.user-message td:nth-child(4) {
    padding-left: 25px;
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M464 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm0 48v40.805c-22.422 18.259-58.168 46.651-134.587 106.49-16.841 13.247-50.201 45.072-73.413 44.701-23.208.375-56.579-31.459-73.413-44.701C106.18 199.465 70.425 171.067 48 152.805V112h416zM48 400V214.398c22.914 18.251 55.409 43.862 104.938 82.646 21.857 17.205 60.134 55.186 103.062 54.955 42.717.231 80.509-37.199 103.053-54.947 49.528-38.783 82.032-64.401 104.947-82.653V400H48z"></path></svg>') left 5px top 7px/14px no-repeat;
}
body.SOMU-SEDM #annotations tr.user-message td:nth-child(4) {
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path stroke="white" fill="white" d="M464 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm0 48v40.805c-22.422 18.259-58.168 46.651-134.587 106.49-16.841 13.247-50.201 45.072-73.413 44.701-23.208.375-56.579-31.459-73.413-44.701C106.18 199.465 70.425 171.067 48 152.805V112h416zM48 400V214.398c22.914 18.251 55.409 43.862 104.938 82.646 21.857 17.205 60.134 55.186 103.062 54.955 42.717.231 80.509-37.199 103.053-54.947 49.528-38.783 82.032-64.401 104.947-82.653V400H48z"></path></svg>') left 5px top 7px/14px no-repeat;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageLoad();

})();
