// ==UserScript==
// @name         Find Users Additional Info
// @description  Loads more user details on the find users page
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.1
//
// @include      https://stackoverflow.com/admin/find-users?*
// @include      https://serverfault.com/admin/find-users?*
// @include      https://superuser.com/admin/find-users?*
// @include      https://askubuntu.com/admin/find-users?*
// @include      https://mathoverflow.net/admin/find-users?*
// @include      https://stackapps.com/admin/find-users?*
// @include      https://*.stackexchange.com/admin/find-users?*
//
// @exclude      *chat.*
// @exclude      https://stackoverflow.com/c/*
// @exclude      https://stackoverflow.blog*
//
// @grant        GM_addStyle
//
// @require      https://github.com/samliew/SO-mod-userscripts/raw/master/lib/common.js
// ==/UserScript==

(function() {
    'use strict';

    if(!isModerator()) return;


    const apikey = 'vbWJDc*G3ug1FpRrCx0pEw((';


    // Get users details
    /* Example fields:
    {
      "answer_count": 123,
      "question_count": 123,
      "account_id": 1235467,
      "last_modified_date": 1552884907,
      "last_access_date": 1463183273,
      "reputation": 123,
      "creation_date": 1413755158,
      "user_type": "registered",
      "user_id": 1234567
    }
    */
    function getUsers(arrUids) {
        return new Promise(function(resolve, reject) {
            if(typeof arrUids === 'undefined' || arrUids === null || arrUids.length == 0) { reject(); return; }

            $.get(`http://api.stackexchange.com/2.2/users/${arrUids.join(';')}?pagesize=100&sort=reputation&site=${location.hostname}&filter=!BTeL)VYJZTHLffEZa-Pp0vhpUAyDVM&key=${apikey}`)
                .done(function(data) {
                    resolve(data.items);
                    return;
                })
                .fail(reject);
        });
    }


    function doPageLoad() {

        // UI stuff
        $('#mainbar-full > .subheader + div > div').removeAttr('style');
        $('.subheader h1').text((i, v) => v.split(' - ')[1]);

        const table = $('#users-list');
        const ids = table.find('tbody tr').find('a:first').attr('target', '_blank').each(function() {
            $(this).closest('tr').attr('id', 'user-' + this.innerText);
        }).get().map(v => Number(v.innerText));

        // Add table headers
        table.children('thead').children('tr').append(`<th>Network</th><th>Creation Date</th><th>Last Seen</th><th>Reputation</th><th>User Type</th><th>Qns</th><th>Ans</th>`);

        // Split API calls, max 100 per call
        for(let i = 0; i < Math.ceil(ids.length / 100); i++) {
            setTimeout(function(ids) {
                getUsers(ids).then(function(users) {
                    users.forEach(function(user) {
                        const dateCreated = new Date(user.creation_date * 1000).toISOString().replace('T', ' ').replace(/:\d+\.\d+Z/, 'Z');
                        const dateLastSeen = new Date(user.last_access_date * 1000).toISOString().replace('T', ' ').replace(/:\d+\.\d+Z/, 'Z');
                        $('#user-' + user.user_id)
                            .append(`<td><a href="https://stackexchange.com/users/${user.account_id}?tab=accounts" target="_blank">${user.account_id}</a></td>
                                     <td>${dateCreated}</td><td>${dateLastSeen}</td><td>${user.reputation}</td><td>${user.user_type}</td><td>${user.question_count}</td><td>${user.answer_count}</td>`);
                    });
                });
            }, 10000 * i, ids.slice(i * 100, (i + 1) * 100));
        }

        console.log(ids.length);
    }


    GM_addStyle(`
/* ===== Style added by "Find Users Additional Info" userscript ===== */

/* More space */
body > .container,
#content {
    max-width: none;
    width: 100%;
}
#content br,
#left-sidebar {
    display: none;
}

/* UI stuff */
.subheader {
    text-align: center;
}
.subheader * {
    float: none !important;
}
#content form {
    margin: 30px auto !important;
    text-align: center;
}
#users-list {
    margin: 30px auto;
    font-family: Consolas, Menlo, Monaco, 'Lucida Console', 'Liberation Mono';
}
#users-list thead th {
    padding-bottom: 8px;
    border-bottom: 2px solid black;
    font-weight: bold;
}
#users-list tbody > tr:first-child td {
    padding-top: 10px;
}
#users-list td,
#users-list th {
    padding: 2px 5px;
}
#users-list tr th:nth-child(5),
#users-list tr td:nth-child(5) {
    display: none;
}
#users-list td {
    max-width: 320px;
    word-break: break-all;
}
`);


    doPageLoad();

})();
