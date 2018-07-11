// ==UserScript==
// @name         Broken Annotation Links Fix
// @description  Fixes broken links in user annotations
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.2
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


    function doPageLoad() {

        $('#annotations tr').each(function() {
            const td = $(this).children('td, th').eq(3);

            // Special class for message/suspension rows
            const aType = $(this).children().first().text().trim().toLowerCase();
            if(/(suspension|message)/.test(aType)) {
                $(this).addClass('user-message');
            }

            // Fix broken links in message
            if(td.children().length > 0) return; // already has links, ignore
            const str = td.text()
              .replace(/(<a href="|">.+<\/a>)/g, '') // strip existing bad links
              .replace(/\s(\/users\/\d+\/[a-z-]+)\s/, ' <a href="$1">$1</a> ') // relink users
              .replace(/(https?:\/\/[^\s\)]+)\b/gi, '<a href="$1">$1</a>'); // all other urls
            td.html(str);
        });

        // Links open in new window
        $('#annotations a').attr('target', '_blank');
    }


    function appendStyles() {

        const styles = `
<style>
#annotations th {
    font-weight: bold;
    border-bottom: 1px solid #aaa;
}
#annotations th,
#annotations td {
    padding: 5px;
}
#annotations td:nth-child(-n + 3) {
    white-space: nowrap;
}
#annotations th,
#annotations tr:nth-child(even) {
    background-color: #f3f3f3;
}
#annotations tr.user-message td:nth-child(4) {
    padding-left: 25px;
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M464 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm0 48v40.805c-22.422 18.259-58.168 46.651-134.587 106.49-16.841 13.247-50.201 45.072-73.413 44.701-23.208.375-56.579-31.459-73.413-44.701C106.18 199.465 70.425 171.067 48 152.805V112h416zM48 400V214.398c22.914 18.251 55.409 43.862 104.938 82.646 21.857 17.205 60.134 55.186 103.062 54.955 42.717.231 80.509-37.199 103.053-54.947 49.528-38.783 82.032-64.401 104.947-82.653V400H48z"></path></svg>') left 5px top 6px/14px no-repeat;
}
#annotations table.annotation {
    border: 1px solid #ddd;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageLoad();

})();
