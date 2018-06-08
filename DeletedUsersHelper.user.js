// ==UserScript==
// @name         Deleted Users Helper
// @description  Additional capability and improvements to display/handle deleted users
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.1
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*.stackexchange.com/*
//
// @exclude      *chat.*
// ==/UserScript==

(function() {
    'use strict';

    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;

    const fkey = StackExchange.options.user.fkey;
    let ajaxRequests = 0;


    // Get deleted user's username
    function getDeletedUsername(uid) {
        ajaxRequests++;

        return new Promise(function(resolve, reject) {
            if(typeof uid === 'undefined' || uid === null) { reject(); return; }

            $.get(`https://${location.hostname}/users/${uid}`)
                .done(function(data) {
                    const page = $(data);
                    const pageTitle = $('title', data).text();

                    // User not deleted or not found
                    if(pageTitle && pageTitle.indexOf('User deleted') === -1) {
                        reject();
                        return;
                    }

                    // Get username
                    const details = page.find('#mainbar-full').find('pre').first().text().split(/\r?\n/);
                    const username = details[1].match(/: ([^\(]+)/)[1].trim();
                    resolve(username);
                })
                .fail(reject)
                .always(() => ajaxRequests--);
        });
    }


    // Undelete individual post
    function undeletePost(pid) {
        if(typeof pid === 'undefined' || pid === null) return;
        $.post({
            url: `https://stackoverflow.com/admin/posts/${pid}/comments/${cid}/undelete`,
            data: {
                'fkey': fkey
            }
        });
    }


    // Undelete posts
    function undeletePosts(pids) {
        if(typeof pids === 'undefined' || pids.length === 0) return;
        pids.forEach(v => undeletePost(v));
    }


    function doPageLoad() {

        const uid = Number(location.pathname.match(/\d+/)[0]);
        const userUrl = `/users/${uid}`;
        if(uid === null) return;

        // 404 on user page
        if(document.body.classList.contains('user-page') && document.title.indexOf('Page Not Found') === 0) {

            // Redirect to user profile page if not already on it
            if(location.pathname !== userUrl) location = userUrl;

            return;
        }

        // If on user profile page and not 404
        if(location.pathname === userUrl) {
            // TODO
        }

        // If on a question page
        if(location.pathname.indexOf('/questions/') === 0) {

            $('.user-details').each(function() {
                if($(this).find('a').length !== 0) return;

                // Replace generic username with link to profile page
                const username = $(this).text().trim();
                const uid = username.replace(/[^\d]+/g, '');
                $(this).html(`<a href="/users/${uid}" class="deleted-user" data-uid="${uid}">${username}</a>`);
            });
        }

        $('.user-details').on('mouseover', '.deleted-user', function() {
            const userlink = $(this);
            if(userlink.hasClass('deleted-username-loaded')) return;
            userlink.addClass('deleted-username-loaded');

            getDeletedUsername(this.dataset.uid)
                .then(function(v) {
                    userlink.after(`<div class="orig-username" title="display name before deletion">${v}</div>`);
                });
        });
    }


    function appendStyles() {

        const styles = `
<style>
.deleted-user {
    display: inline-block;
    margin-bottom: 2px;
    padding: 3px 5px;
    background: indianred;
    color: white;
}
.deleted-user:hover {
    color: #99F;
}
.orig-username:before {
    content: 'aka "';
}
.orig-username:after {
    content: '"';
}
</style>
`;
        $('body').append(styles);
    }

    // On page load
    appendStyles();
    doPageLoad();

})();
