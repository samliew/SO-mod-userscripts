// ==UserScript==
// @name         Deleted Users Helper
// @description  Additional capability and improvements to display/handle deleted users
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      3.1
//
// @match        https://*.stackoverflow.com/*
// @match        https://*.serverfault.com/*
// @match        https://*.superuser.com/*
// @match        https://*.askubuntu.com/*
// @match        https://*.mathoverflow.net/*
// @match        https://*.stackapps.com/*
// @match        https://*.stackexchange.com/*
// @match        https://stackoverflowteams.com/*
//
// @exclude      https://api.stackexchange.com/*
// @exclude      https://data.stackexchange.com/*
// @exclude      https://contests.stackoverflow.com/*
// @exclude      https://winterbash*.stackexchange.com/*
// @exclude      *chat.*
// @exclude      *blog.*
// @exclude      */tour
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/se-ajax-common.js
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
//
// @grant        GM_xmlhttpRequest
// ==/UserScript==

/* globals StackExchange, fkey */
/// <reference types="./globals" />

'use strict';

// 404 on a specific user page that has no content
if (document.body.innerText === 'User not found.') {
  const uid = Number(location.pathname.match(/\d+/)[0]);

  // Redirect to user profile page
  location = `/users/${uid}`;
  return;
}

// Moderator check, after the redirection for 404 page above
// This is a moderator-only userscript
if (!isModerator()) return;


// Reload functions
const reloadWhenDone = () => {

  // Triggers when all ajax requests have completed
  $(document).ajaxStop(function () {
    location.reload();
  });
};


let ajaxRequests = 0;

// Get deleted user's username
function getDeletedUsername(uid) {
  ajaxRequests++;

  return new Promise(function (resolve, reject) {
    if (typeof uid === 'undefined' || uid === null) { reject(); return; }

    $.get(`${location.origin}/users/${uid}`)
      .done(function (data) {
        const page = $(data);
        const pageTitle = $('title', data).text();

        // User not deleted or not found
        if (pageTitle && pageTitle.indexOf('User deleted') === -1) {
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

  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid === null) { reject(); return; }

    $.post({
      url: `${location.origin}/posts/${pid}/vote/10`,
      data: { 'fkey': fkey }
    })
      .fail(reject)
      .always(() => ajaxRequests--);
  });
}
// Delete posts
function deletePosts(pids) {
  if (typeof pids === 'undefined' || pids.length === 0) return;
  pids.forEach(v => deletePost(v));
}


// Undelete individual post
function undeletePost(pid) {
  ajaxRequests++;

  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid === null) { reject(); return; }

    $.post({
      url: `${location.origin}/posts/${pid}/vote/11`,
      data: { 'fkey': fkey }
    })
      .fail(reject)
      .always(() => ajaxRequests--);
  });
}
// Undelete posts
function undeletePosts(pids) {
  if (typeof pids === 'undefined' || pids.length === 0) return;
  pids.forEach(v => undeletePost(v));
}


function getUserDetails(uid) {
  return new Promise(function (resolve, reject) {
    if (typeof uid === 'undefined' || uid === null) { reject(); return; }

    $.post(`https://api.stackexchange.com/2.2/users/${uid}?order=desc&sort=reputation&site=${location.hostname.replace(/(\.stackexchange)?\.com$/, '')}&filter=!--1nZv)deGu1&key=lSrVEbQTXrJ4eb4c3NEMXQ((`)
      .done(function (data) {
        resolve(data);
      })
      .fail(reject);
  });
}


function getUserPii(uid) {
  return new Promise(function (resolve, reject) {
    if (typeof uid === 'undefined' || uid === null) { reject(); return; }

    $.post({
      url: `${location.origin}/admin/all-pii`,
      data: {
        'fkey': fkey,
        'id': uid
      }
    })
      .done(function (data) {
        const html = $(data).get();
        resolve({
          email: html[1].children[1].innerText.trim(),
          name: html[1].children[3].innerText.trim(),
          ip: html[3].children[1].innerText.trim()
        });
      })
      .fail(reject);
  });
}


function initDeleteUserHelper() {
  $(document).ajaxComplete(function (event, xhr, settings) {
    if (settings.url.includes('/moderator-menu?initialAction=delete') || settings.url.includes('/moderator-menu?initialAction=destroy')) {
      const uid = Number(settings.url.match(/\/admin\/users\/(\d+)\//)[1]);

      getUserPii(uid).then(v => {
        const userDetails = `Email:     ${v.email}\nReal Name: ${v.name}`;
        const deleteReasonDetails = userDetails;
        $('#deleteReasonDetails, #destroyReasonDetails').val('\n\n' + userDetails);
      });
    }
  });
}


function linkifyDeletedUser(i, elem) {

  // Ignore non-deleted users or already processed
  if ($(elem).children('a').length !== 0) return;

  // Ignore post editor usercard if no avatar found (i.e.: post author)
  if ($(elem).hasClass('user-details') && $(elem).siblings('.user-gravatar32').children().length == 0) return;

  // Get display name from hidden element in usercard stub, or (self) comment user span
  let username = $(elem).children('span.d-none').addBack('.comment-user').text().trim();

  // If no username yet (i.e.: old templates like mod messages), try get username from display text
  if (username == '') username = $(elem).text().trim();

  // Grab numeric digits from display name
  const uid = Number(username.replace(/\D+/g, ''));

  // Simple validation
  if (username === '' || isNaN(uid)) return;

  // Replace generic username with link to profile page
  $(elem).html(`<a href="/users/${uid}" title="deleted user" class="deleted-user" data-uid="${uid}" target="_blank">${username}</a>`);
}


function findDeletedUsers() {
  $('.post-signature .user-details').each(linkifyDeletedUser);
  $('span.comment-user').each(linkifyDeletedUser);
  $('.msg.msg-moderator .user-details').each(linkifyDeletedUser);
  if (location.href.indexOf('post-comments-by-deleted-user') !== -1) {
    const header = document.querySelector('div.subheader h1');
    if (!header) return;
    let user = header.innerText.match(/\d+/);
    let text = header.innerText.substring(0, user.index);
    header.innerHTML = text + '<a href="/users/' + user + '" title="deleted user" class="deleted-user" data-uid="' + user + '" target="_blank">' + user + '</a>';
  }
}


function initMultiPostsTable() {
  const table = $('#posts');
  if (table.length === 0) return;

  // Increase width of #mainbar, as there is no right sidebar on this page
  $('#mainbar').width('100%');

  // Add checkboxes
  table.find('.tablesorter-headerRow').prepend(`<th title="Select all"><input type="checkbox" id="select-all" /></th>`);
  table.find('tbody tr').each(function () {
    const url = $(this).find('a').attr('href');

    if (url && /\/\d+\//.test(url)) {
      const pid = url.match(/\/\d+/g).reverse()[0].substr(1);
      $(this).prepend(`<td><input type="checkbox" class="selected-post" value="${pid}" /></td>`);
      $(this).toggleClass('deleted-answer', $(this).children().last().text() === 'Yes');
    }
    // possible that the row doesn't have a post link if it's a mod nomination post
    else {
      $(this).prepend(`<td></td>`);
    }
  });

  // Checkbox toggle
  const boxes = $('.selected-post');
  $('#select-all').change(function () {
    boxes.prop('checked', this.checked);
  });;

  // Action buttons
  const btnDiv = $(`<div class="actions"></div>`).insertAfter(table);
  $(`<input type="button" class="action-btn" value="Delete selected" />`)
    .appendTo(btnDiv)
    .on('click', function () {
      let selPostIds = $('.selected-post').filter(':checked').map((i, v) => v.value).get();
      if (selPostIds.length === 0) {
        alert('No posts selected!');
        return false;
      }
      $('.action-btn').remove();
      deletePosts(selPostIds);
      reloadWhenDone();
    });
  $(`<input type="button" class="action-btn" value="Undelete selected" />`)
    .appendTo(btnDiv)
    .on('click', function () {
      let selPostIds = $('.selected-post').filter(':checked').map((i, v) => v.value).get();
      if (selPostIds.length === 0) {
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

  const deldate = details[0].split('on ')[1].replace(/(\d+)\/(\d+)\/(\d+) (\d+):(\d+):(\d+) ([AP]M)/, function (match, p1, p2, p3, p4, p5, p6, p7) {
    const hourOffset = p7 == 'PM' ? 12 : 0;
    return `${p3}-0${p1}-0${p2} 0${(Number(p4) + hourOffset) % 24}:0${p5}:0${p6}Z`;
  }).replace(/([^\d])\d?(\d\d)/g, '$1$2'); // cheat way of padding zeros
  const username = details[1].match(/: ([^\(]+)/)[1].trim();
  const userid = details[1].match(/\((\d+)\)/)[1];
  const networkid = details[1].match(/=(\d+)\)/)[1];
  const networkAccountsUrl = `https://stackexchange.com/users/${networkid}?tab=accounts`;
  const modname = details[1].match(/deleted by ([^\(]+)/)[1].trim();
  const modid = details[1].match(/\((\d+)\)/g)[1].replace(/[^\d]+/g, '');
  const lastip = details.filter((line) => line.includes('IP:')).reverse()[0].split(': ')[1];
  const reason = details.slice(2, details.length - 2).join('\n').replace('Reason: ', '<b>Reason</b><br>').replace('Detail: ', '<br><b>Additional Details</b><br>').replace(/(https?:\/\/[^\s\)]+)\b/gi, '<a href="$1" target="_blank">$1</a>');
  const delInfo = username != modname ? `deleted on <input value="${deldate}"> by <a href="/users/${modid}" target="_blank">${modname}♦</a>` : `SELF-deleted on <input value="${deldate}">`;

  const $html = $(`
    <div class="del-user-info">
      <div>User <input value="${username}"> (#<input value="${userid}">, network#<input value="${networkid}" ondblclick="window.open('${networkAccountsUrl}')">) was ${delInfo}</div>
      <div class="del-reason">${reason}</div>
      <div>Last seen from IP: <input value="${lastip}"></div>
      <div>Network accounts: &nbsp;<a href="${networkAccountsUrl}" target="_blank">${networkAccountsUrl}</a></div>
    </div>`);

  pre.after($html).remove();

  $html.find('input')
    .attr('readonly', 'readonly')
    .dynamicWidth()
    .on('click dblclick', function () {
      this.select();
    });

  // Show Google account avatar
  $('unknown a[href*="googleusercontent.com/a/"]').each(function() {
    $(this).html(`<img src="${this.href}" style="max-width:128px; max-height:128px;">`);
  });


  // Format links section
  const userlinks = $('#mainbar-full').next('ul').attr('id', 'del-user-links');
  userlinks.append(`<li><a href="/admin/users-with-ip/${lastip}">Other users with IP address "${lastip}"</a></li>`);
  userlinks.append(`<li><a href="/admin/find-users?q=${username}">Find users with "${username}"</a></li>`);

  // Fetch network accounts
  // Note: can't use https://api.stackexchange.com/docs/associated-users#pagesize=100&ids=851&types=main_site&filter=!mxdR15FV-W&run=true as max-page size limit is 100
  const networkaccsList = $(`<ul id="del-user-networkaccs" class="js-loading"></ul>`).insertAfter(userlinks);
  ajaxPromise(networkAccountsUrl)
    .then(function (data) {
      networkaccsList.removeClass('js-loading');
      const accounts = $('.account-container', data);
      if (accounts.length > 0) {
        accounts.find('a').attr('target', '_blank');
        accounts.each(function () {
          $(this).appendTo(networkaccsList);
        });
      }
      else {
        networkaccsList.addClass('js-no-accounts');
      }
    });

  // Format account history section
  const networkHeader = $('#content > h2').html((i, v) => v.replace('Account history for account # ', 'Network account history for #'));
  const networkTable = networkHeader.next('table');
  networkTable.find('tbody th[colspan]').html((i, v) => v.replace('history for user # ', 'history for user #'));
}


function showDetailsFieldWhenPiiClicked() {
  const d = new Date();
  const year = d.getFullYear().toString();
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
  const piidiv = $('#mod-content .mod-credentials').parent();
  const piisection = piidiv.closest('.mod-section');

  const networkAccounts = '\n\nNetwork Account: ' + $('.details a').first().attr('href');
  const regdate = '\n' + $('.details .row').first().find('span').remove().end().text().trim().replace(/\s+/g, ' ').replace('Joined network:', 'Joined network: ').replace('Joined site:', '\nJoined site:    ').split(/\s*\n\s*/).map(function (v) {
    if (v.contains('ago')) v = v.split(':')[0] + ':  ' + month + " " + d.getDate() + " '" + year;
    else if (v.contains('yesterday')) v = v.split(':')[0] + ':  ' + month + ' ' + d.getDate() + " '" + year;
    else if (!v.contains(", ")) v = v + ", " + year;
    return v;
  }).join('\n');
  const str = piidiv.children('div').slice(0, 2).text().trim().replace(/\s+/g, ' ').replace('Email:', 'Email:     ').replace(' Real Name:', '\nReal Name: ').replace(' IP Address:', '\nIP Address:');
  const ta = $(`<textarea id="pii-info" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea>`).val(str + networkAccounts + regdate);
  ta.insertBefore(piidiv).on('focus dblclick', evt => evt.target.select());
}

function listenToPageUpdates() {

  // On any page update
  $(document).ajaxComplete(function (event, xhr, settings) {

    // More comments loaded or post expanded in mod queue or review loaded
    if (settings.url.includes('/comments') || settings.url.includes('/ajax-load') || settings.url.includes('/review/next-task/')) findDeletedUsers();

    // Pii loaded on mod dashboard page
    if (settings.url.indexOf('/admin/all-pii') >= 0 && location.pathname.startsWith('/users/account-info/')) showDetailsFieldWhenPiiClicked();
  });
}


// Append styles
addStylesheet(`
.deleted-user {
  display: inline-block;
  margin-bottom: 2px;
  padding: 3px 5px;
  background: var(--red-600);
  color: var(--white) !important;
}
.deleted-user:hover {
  color: #ffffdd !important;
}
.comment-user .deleted-user {
  background: none !important;
  color: var(--red-600) !important;
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
  background: var(--black-050);
  font-family: Consolas,Menlo,Monaco,Lucida Console,Liberation Mono,DejaVu Sans Mono,Bitstream Vera Sans Mono,Courier New,monospace,sans-serif;
}
.del-user-info input {
  margin: 0;
  padding: 0;
  border: none;
  border-bottom: 1px dashed var(--red-700);
  font-family: Consolas,Menlo,Monaco,Lucida Console,Liberation Mono,DejaVu Sans Mono,Bitstream Vera Sans Mono,Courier New,monospace,sans-serif;
  background: transparent;
  color: var(--red-700);
}
.del-user-info .del-reason {
  white-space: pre-wrap;
  margin: 20px 0;
}
#del-user-links {
  margin-top: 10px;
  margin-bottom: 30px;
}
#del-user-links:before {
  content: 'User links';
  display: block;
  margin: 0 0 8px -30px;
  font-weight: bold;
}
#del-user-links li {
  margin-bottom: 4px;
}
#pii-info,
#deleteReasonDetails,
#destroyReasonDetails {
  width: 100%;
  height: calc(8.4em + 20px);
  line-height: 1.2em;
  font-family: Consolas,Menlo,Monaco,Lucida Console,Liberation Mono,DejaVu Sans Mono,Bitstream Vera Sans Mono,Courier New,monospace,sans-serif;
}

/* Network Account container */
#del-user-networkaccs {
  margin-top: 10px;
  margin-bottom: 30px;
}
#del-user-networkaccs:before {
  content: 'Network accounts';
  display: block;
  margin: 0 0 8px -30px;
  font-weight: bold;
  clear: both;
}
#del-user-networkaccs:after {
  content: '';
  display: block;
  clear: both;
}
#del-user-networkaccs.js-loading:after {
  content: 'loading...';
}
#del-user-networkaccs.js-no-accounts:after {
  content: '(none)';
  font-style: italic;
  color: var(--black-400);
}
.account-container {
  float: left;
  width: 100%;
  margin-left: -10px;
  padding: 10px;
  text-align: left;
  font-size: 0.9em;
  border-bottom: 1px solid var(--black-050);
  clear: both;
}
.account-container .account-icon {
  width: 48px;
  height: 48px;
  float: left;
  margin-right: 15px;
  text-align: center;
  border-bottom: 1px solid var(--black-075);
  border-left: 1px solid var(--black-025);
  border-right: 1px solid var(--black-025);
  border-top: 1px solid var(--black-025);
}
.account-container .account-icon img {
  width: 48px;
  height: 48px;
  display: block;
  -ms-interpolation-mode: bicubic;
  image-rendering: optimizeQuality;
}
.account-container .account-site {
  float: left;
  width: 424px;
}
.account-container .account-site h2 {
  font-size: 16px;
  line-height: 16px;
  margin-bottom: 4px;
  margin-top: 0 !important;
}
.account-container .account-site p {
  margin-bottom: 2px;
}
.account-container .account-stat {
  width: 80px;
  height: 52px;
  text-align: center;
  color: #A1A1A1;
  font-size: 12px;
  float: left;
  margin-left: 15px;
}
.account-container .account-stat .account-number {
  color: var(--black-600);
  display: inline-block;
  width: 100%;
  font-size: 20px;
  font-family: Arial,Helvetica,sans-serif;
  line-height: 1.6;
  background: var(--black-025);
}
.account-container .account-stat .account-number,
.account-container .account-stat .account-badges {
  height: 32px;
}
.account-container .account-stat .account-badges {
  font-size: 15px;
  line-height: 31px;
  height: 31px !important;
  color: var(--black-600);
}
.account-container .account-stat .account-badges .badgecount {
  font-size: 15px;
}
.account-container .account-stat .account-badges .badge1,
.account-container .account-stat .account-badges .badge2,
.account-container .account-stat .account-badges .badge3 {
  margin-top: -5px;
}
.account-container .account-stat.account-stat-wide {
  width: 138px;
}
.account-container.hidden {
  background: var(--black-075);
}
.account-container.hidden .account-number {
  background: var(--black-075);
}
.account-container.hidden .account-icon {
  border: 1px solid var(--black-075);
}
`); // end stylesheet


// On script run
(function init() {
  findDeletedUsers();

  $('.post-layout, .comments, .review-content').on('mouseover', '.deleted-user', function () {
    const userlink = $(this);
    if (userlink.hasClass('deleted-username-loaded')) return;
    userlink.addClass('deleted-username-loaded');

    getDeletedUsername(this.dataset.uid)
      .then(function (v) {
        userlink.after(`<div class="orig-username" title="display name before deletion">${v}</div>`);
      });
    return false;
  });

  if (/\d+/.test(location.pathname) === false) return;
  const is404 = document.title.toLowerCase().includes('page not found');
  const uid = Number(location.pathname.match(/\d+/)[0]);
  const userUrl = `/users/${uid}`;

  // 404 on user page or mod page with an ID in the URL
  if ((document.body.classList.contains('user-page') || document.body.classList.contains('mod-page')) &&
    !isNaN(uid) && is404) {

    // Redirect to user profile page if not already on it
    if (location.pathname !== userUrl) location = userUrl;
    return;
  }

  // 404 on short user link page /u/{uid}
  if (/\/u\/\d+/.test(location.pathname) && is404) {
    // Redirect to user profile page
    if (location.pathname !== userUrl) location = userUrl;
    return;
  }

  // If on user mod dashboard
  if (location.pathname.startsWith('/users/account-info/')) {
    // Is deleted user
    if ($('#content').find('a[href^="/admin/posts-by-deleted-user/"]').length > 0) {

      // Redirect to profile page
      location.href = location.pathname.replace('/account-info/', '/');
      return;
    }
    initDeleteUserHelper();
  }

  // If on user profile page
  if (location.pathname.indexOf(userUrl) >= 0) {

    // Is on deleted user's page
    if ($('#content').find('a[href*="/admin/posts-by-deleted-user/"]').length > 0) {
      formatDeletedUserPage();
    }
  }

  // If on deleted user success page, insert link back to profile
  if (location.pathname.startsWith('/admin/users/') && location.pathname.endsWith('/destroy')) {
    const uid = location.pathname.replace(/[^\d]+/g, '');
    $('pre').first().after(`<a href="/users/${uid}">${location.origin}/users/${uid}</a>`);
  }

  // Show posts by deleted user page
  else if (location.pathname.indexOf('/admin/posts-by-deleted-user/') === 0) {
    initMultiPostsTable();
  }

  listenToPageUpdates();
})();