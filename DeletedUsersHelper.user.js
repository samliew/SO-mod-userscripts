// ==UserScript==
// @name         Deleted Users Helper
// @description  Additional capability and improvements to display/handle deleted users
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.3
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


    // 404 on a specific user page that has no content
    if(document.body.innerText === 'User not found.') {
        const uid = Number(location.pathname.match(/\d+/)[0]);

        // Redirect to user profile page
        location = `/users/${uid}`;
        return;
    }


    // See also https://github.com/samliew/dynamic-width
    $.fn.dynamicWidth = function () {
        var plugin = $.fn.dynamicWidth;
        if (!plugin.fakeEl) plugin.fakeEl = $('<span>').hide().appendTo(document.body);

        function sizeToContent (el) {
            var $el = $(el);
            var cs = getComputedStyle(el);
            plugin.fakeEl.text(el.value || el.innerText || el.placeholder).css('font', $el.css('font'));
            $el.css('width', plugin.fakeEl.width() + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight));
        }

        return this.each(function (i, el) {
            sizeToContent(el);
            $(el).on('change keypress keyup blur', evt => sizeToContent(evt.target));
        });
    };


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


    // Delete individual post
    function deletePost(pid) {
        ajaxRequests++;

        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }

            $.post({
                url: `https://stackoverflow.com/posts/${pid}/vote/10`,
                data: {
                    'fkey': fkey
                }
            })
            .fail(reject)
            .always(() => ajaxRequests--);
        });
    }
    // Delete posts
    function deletePosts(pids) {
        if(typeof pids === 'undefined' || pids.length === 0) return;
        pids.forEach(v => deletePost(v));
    }


    // Undelete individual post
    function undeletePost(pid) {
        ajaxRequests++;

        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }

            $.post({
                url: `https://stackoverflow.com/posts/${pid}/vote/11`,
                data: {
                    'fkey': fkey
                }
            })
            .fail(reject)
            .always(() => ajaxRequests--);
        });
    }
    // Undelete posts
    function undeletePosts(pids) {
        if(typeof pids === 'undefined' || pids.length === 0) return;
        pids.forEach(v => undeletePost(v));
    }


    function linkifyDeletedUser(i, elem) {
        if($(elem).find('a').length !== 0) return;

        // Replace generic username with link to profile page
        const username = $(elem).text().trim();
        const uid = username.replace(/[^\d]+/g, '');

        if(username === '' || uid === '') return;

        $(elem).html(`<a href="/users/${uid}" title="deleted user" class="deleted-user" data-uid="${uid}" target="_blank">${username}</a>`);
    }


    function findDeletedUsers() {
        $('.user-details, span.comment-user').each(linkifyDeletedUser);
    }


    function initMultiPostsTable() {
        const table = $('#posts');
        if(table.length === 0) return;

        // Increase width of #mainbar, as there is no right sidebar on this page
        $('#mainbar').width('100%');

        // Add checkboxes
        table.find('.tablesorter-headerRow').prepend(`<th title="Select all"><input type="checkbox" id="select-all" /></th>`);
        table.find('tbody tr').each(function() {
            const pid = $(this).find('a').attr('href').match(/\d+/g).reverse()[0];
            $(this).prepend(`<td><input type="checkbox" class="selected-post" value="${pid}" /></td>`);
            $(this).toggleClass('deleted-answer', $(this).children().last().text() === 'Yes');
        });

        // Checkbox toggle
        const boxes = $('.selected-post');
        $('#select-all').change(function() {
            boxes.prop('checked', this.checked);
        });;

        // Action buttons
        $(`<input type="button" class="action-btn" value="Delete selected" />`)
            .insertAfter(table)
            .click(function() {
                let selPostIds = $('.selected-post').filter(':checked').map((i, v) => v.value).get();
                if(selPostIds.length === 0) {
                    alert('No posts selected!');
                    return false;
                }
                $('.action-btn').remove();
                deletePosts(selPostIds);
                reloadWhenDone();
            });

        $(`<input type="button" class="action-btn" value="Undelete selected" />`)
            .insertAfter(table)
            .click(function() {
                let selPostIds = $('.selected-post').filter(':checked').map((i, v) => v.value).get();
                if(selPostIds.length === 0) {
                    alert('No posts selected!');
                    return false;
                }
                $('.action-btn').remove();
                undeletePosts(selPostIds);
                reloadWhenDone();
            });

        // Linkify userid in header to return to deleted user page
        $('#content h1').first().html((i, v) => v.replace(/(\d+)/, '<a href="/users/$1" target="_blank">$1</a>'));
    }


    function formatDeletedUserPage() {

        // Format info section
        const pre = $('#mainbar-full pre');
        const details = pre.text().split(/\r?\n/);

        const deldate = details[0].split('on ')[1].replace(/(\d+)\/(\d+)\/(\d+) (\d+):(\d+):(\d+) [AP]M/, '$3-0$1-0$2 0$4:0$5:0$6Z').replace(/(?<=[^\d])\d?(\d\d)/g, '$1');
        const username = details[1].match(/: ([^\(]+)/)[1].trim();
        const userid = details[1].match(/\((\d+)\)/)[1];
        const networkid = details[1].match(/=(\d+)\)/)[1];
        const modname = details[1].match(/deleted by ([^\(]+)/)[1].trim();
        const modid = details[1].match(/\((\d+)\)/g)[1].replace(/[^\d]+/g, '');
        const lastip = details[details.length - 2].split(': ')[1];
        const reason = details.slice(2, details.length - 2).join('\n').replace('Reason: ', '').replace(/(https?:\/\/[^\s\)]+)\b/gi, '<a href="$1" target="_blank">$1</a>');

        const $html = $(`
<div class="del-user-info">
  <div>User <input value="${username}"> (#<input value="${userid}">, network#<input value="${networkid}">) was deleted on <input value="${deldate}"> by <a href="/users/${modid}" target="_blank">${modname} ♦</a></div>
  <div class="del-reason">Reason:
${reason}</div>
  <div>Last seen from IP: <input value="${lastip}"></div>
</div>`);

        pre.after($html).remove();

        $html.find('input')
            .attr('readonly', 'readonly')
            .dynamicWidth()
            .on('click dblclick', function() {
                this.select();
            });

        // Format links section
        $('#mainbar-full').next('a').wrap(`<div id="del-user-links"></div>`);
        const userlinks = $('#del-user-links');
        userlinks.append(`<a href="/admin/users-with-ip/${lastip}">Users with IP address "${lastip}"</a>`);
        userlinks.append(`<a href="/admin/find-users?q=${username}">Search users with username "${username}"</a>`);
    }


    function doPageLoad() {

        if(/\d+/.test(location.pathname) === false) return;
        const uid = Number(location.pathname.match(/\d+/)[0]);
        const userUrl = `/users/${uid}`;

        // 404 on user page
        if(document.body.classList.contains('user-page') && document.title.indexOf('Page Not Found') === 0) {

            // Redirect to user profile page if not already on it
            if(location.pathname !== userUrl) location = userUrl;

            return;
        }

        // If on user profile page and not 404
        if(location.pathname.indexOf(userUrl) >= 0) {

            // Is on deleted user's page
            if($('#mainbar-full').next('a').attr('href').indexOf('/admin/posts-by-deleted-user/') >= 0) {

                formatDeletedUserPage();
            }
        }

        // If on a question page
        else if(location.pathname.indexOf('/questions/') === 0) {
            findDeletedUsers();
        }

        // Show posts by deleted user page
        else if(location.pathname.indexOf('/admin/posts-by-deleted-user/') === 0) {
            initMultiPostsTable();
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


    function listenToPageUpdates() {

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {
            // More comments loaded
            if(settings.url.indexOf('/comments') >= 0) findDeletedUsers();
        });
    }


    function reloadWhenDone() {

        // Triggers when all ajax requests have completed
        $(document).ajaxStop(function() {
            location.reload(true);
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
    color: white !important;
}
.deleted-user:hover {
    color: #ffffdd !important;
}
.comment-user .deleted-user {
    color: indianred !important;
    background: none;
    padding: 0;
}
.orig-username:before {
    content: 'aka "';
}
.orig-username:after {
    content: '"';
}
table#posts {
    min-width: 50%;
}
table#posts td {
    position: relative;
    background: none !important;
}
.action-btn {
    margin-right: 10px;
}

.del-user-info {
    margin: 15px 0;
    padding: 12px 14px;
    background: #eff0f1;
    font-family: monospace;
}
.del-user-info input {
    margin: 0;
    padding: 0;
    border: none;
    border-bottom: 1px dashed darkred;
    font-family: monospace;
    background: transparent;
    color: darkred;
}
.del-user-info .del-reason {
    white-space: pre-line;
    margin: 20px 0;
}
#del-user-links > a {
    display: block;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageLoad();
    listenToPageUpdates();

})();
