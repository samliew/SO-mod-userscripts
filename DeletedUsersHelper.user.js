// ==UserScript==
// @name         Deleted Users Helper
// @description  Additional capability and improvements to display/handle deleted users
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.12.1
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
                url: `https://${location.hostname}/posts/${pid}/vote/10`,
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
                url: `https://${location.hostname}/posts/${pid}/vote/11`,
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

        // ignore non-deleted users or already processed
        if($(elem).find('a').length !== 0 || $(elem).children('span').hasClass('d-none')) return;

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
            const url = $(this).find('a').attr('href');
            const pid = url.match(/\/\d+/g).reverse()[0].substr(1);
            $(this).prepend(`<td><input type="checkbox" class="selected-post" value="${pid}" /></td>`);
            $(this).toggleClass('deleted-answer', $(this).children().last().text() === 'Yes');
        });

        // Checkbox toggle
        const boxes = $('.selected-post');
        $('#select-all').change(function() {
            boxes.prop('checked', this.checked);
        });;

        // Action buttons
        const btnDiv = $(`<div class="actions"></div>`).insertAfter(table);
        $(`<input type="button" class="action-btn" value="Delete selected" />`)
            .appendTo(btnDiv)
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
            .appendTo(btnDiv)
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

        const deldate = details[0].split('on ')[1]
          .replace(/(\d+)\/(\d+)\/(\d+) (\d+):(\d+):(\d+) [AP]M/, '$3-0$1-0$2 0$4:0$5:0$6Z').replace(/([^\d])\d?(\d\d)/g, '$1$2'); // cheat way of padding zeros
        const username = details[1].match(/: ([^\(]+)/)[1].trim();
        const userid = details[1].match(/\((\d+)\)/)[1];
        const networkid = details[1].match(/=(\d+)\)/)[1];
        const modname = details[1].match(/deleted by ([^\(]+)/)[1].trim();
        const modid = details[1].match(/\((\d+)\)/g)[1].replace(/[^\d]+/g, '');
        const lastip = details[details.length - 2].split(': ')[1];
        const reason = details.slice(2, details.length - 2).join('\n').replace('Reason: ', '<b>Reason</b><br>').replace('Detail: ', '<br><b>Additional Details</b><br>').replace(/(https?:\/\/[^\s\)]+)\b/gi, '<a href="$1" target="_blank">$1</a>');
        const delInfo = username != modname ? `deleted on <input value="${deldate}"> by <a href="/users/${modid}" target="_blank">${modname} ♦</a>` : `SELF-deleted on <input value="${deldate}">`;

        const $html = $(`
<div class="del-user-info">
  <div>User <input value="${username}"> (#<input value="${userid}">, network#<input value="${networkid}" ondblclick="window.open('https://stackexchange.com/users/${networkid}')">) was ${delInfo}</div>
  <div class="del-reason">${reason}</div>
  <div>Last seen from IP: <input value="${lastip}"></div>
  <div>Network accounts: &nbsp;<a href="https://stackexchange.com/users/${networkid}?tab=accounts" target="_blank">https://stackexchange.com/users/${networkid}?tab=accounts</a></div>
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
        userlinks.append(`<a href="/admin/users-with-ip/${lastip}">Other users with IP address "${lastip}"</a>`);
        userlinks.append(`<a href="/admin/find-users?q=${username}">Find users with "${username}"</a>`);
    }


    function showDetailsFieldWhenPiiClicked() {

        const d = new Date();
        const year = d.getFullYear().toString().slice(2);
        const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
        const piidiv = $('#allPII');
        const piisection = piidiv.closest('.mod-section');

        const networkAccounts = '\n\nNetwork Account: ' + $('.details a').first().attr('href');
        const regdate = '\n' + $('.details .row').first().text().trim().replace(/\s+/g, ' ').replace('Joined network:', 'Joined network: ').replace('Joined site:', '\nJoined site:    ').split(/\s*\n\s*/).map(function(v) {
            if(v.contains('ago')) v = v.split(':')[0] + ':  ' + month + " " + d.getDate() + " '" + year;
            else if(v.contains('yesterday')) v = v.split(':')[0] + ':  ' + month + ' ' + d.getDate() + " '" + year;
            else if(!v.contains("'")) v = v + " '" + year;
            return v;
        }).join('\n');
        const str = piidiv.children('div').slice(0,2).text().trim().replace(/\s+/g, ' ').replace('Email:', 'Email:     ').replace(' Real Name:', '\nReal Name: ').replace(' IP Address:', '\nIP Address:');
        const ta = $(`<textarea id="pii-info" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea>`).val(str + networkAccounts + regdate);
        ta.insertBefore(piidiv).on('focus dblclick', evt => evt.target.select());
    }


    function doPageLoad() {

        findDeletedUsers();

        $('.post-layout, .comments, .review-content').on('mouseover', '.deleted-user', function() {
            const userlink = $(this);
            if(userlink.hasClass('deleted-username-loaded')) return;
            userlink.addClass('deleted-username-loaded');

            getDeletedUsername(this.dataset.uid)
                .then(function(v) {
                    userlink.after(`<div class="orig-username" title="display name before deletion">${v}</div>`);
                });

            return false;
        });

        if(/\d+/.test(location.pathname) === false) return;
        const uid = Number(location.pathname.match(/\d+/)[0]);
        const userUrl = `/users/${uid}`;

        // 404 on user page or mod page with an ID in the URL
        if((document.body.classList.contains('user-page') || document.body.classList.contains('mod-page')) &&
           !isNaN(uid) && document.title.indexOf('Page Not Found') === 0) {

            // Redirect to user profile page if not already on it
            if(location.pathname !== userUrl) location = userUrl;

            return;
        }

        // 404 on short user link page /u/{uid}
        if(/\/u\/\d+/.test(location.pathname) && document.title.indexOf('Page Not Found') === 0) {

            // Redirect to user profile page
            if(location.pathname !== userUrl) location = userUrl;
            return;
        }

        // If on user mod dashboard
        if(location.pathname.startsWith('/users/account-info/')) {

            // Is deleted user
            if($('#mainbar-full').next('a[href^=/admin/posts-by-deleted-user/]').length === 1) {

                // Redirect to profile page
                location.href = location.pathname.replace('/account-info/', '/');
                return;
            }
        }

        // If on user profile page and not 404
        if(location.pathname.indexOf(userUrl) >= 0) {

            // Is on deleted user's page
            if($('#mainbar-full').next('a').length > 0 && $('#mainbar-full').next('a').attr('href').indexOf('/admin/posts-by-deleted-user/') >= 0) {
                formatDeletedUserPage();
            }
        }

        // If on deleted user success page, insert link back to profile
        if(location.pathname.startsWith('/admin/users/') && location.pathname.endsWith('/destroy')) {

            const uid = location.pathname.replace(/[^\d]+/g, '');
            $('pre').first().after(`<a href="/users/${uid}">https://${location.hostname}/users/${uid}</a>`);
        }

        // Show posts by deleted user page
        else if(location.pathname.indexOf('/admin/posts-by-deleted-user/') === 0) {
            initMultiPostsTable();
        }
    }


    function listenToPageUpdates() {

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {

            // More comments loaded or post expanded in mod queue or review loaded
            if(settings.url.includes('/comments') || settings.url.includes('/ajax-load') || settings.url.includes('/review/next-task/')) findDeletedUsers();

            // Pii loaded on mod dashboard page
            if(settings.url.indexOf('/admin/all-pii') >= 0 && location.pathname.startsWith('/users/account-info/')) showDetailsFieldWhenPiiClicked();
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
    min-width: 80%;
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
    white-space: pre-wrap;
    margin: 20px 0;
}
#del-user-links > a {
    display: block;
    margin-bottom: 3px;
}
#pii-info {
    width: 100%;
    height: calc(8.4em + 20px);
    line-height: 1.2em;
    font-family: monospace;
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
