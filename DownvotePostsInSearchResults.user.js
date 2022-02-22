// ==UserScript==
// @name         Downvote Posts in Search Results
// @description  Button to mass downvote posts in search results when searching for not locked posts
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.1
//
// @include      https://*stackexchange.com/search*
// @include      https://*stackoverflow.com/search*
// @include      https://*serverfault.com/search*
// @include      https://*superuser.com/search*
// @include      https://*askubuntu.com/search*
// @include      https://*mathoverflow.net/search*
// @include      https://*.stackexchange.com/search*
//
// @exclude      *chat.*
//
// @require      https://raw.githubusercontent.com/samliew/ajax-progress/master/jquery.ajaxProgress.js
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';

// Run only when search results has filter for "not locked" posts
if (!/locked%3a(no|0)/.test(location.search)) return;


const fkey = StackExchange.options.user.fkey;
let noMoreVotes = false;
let actionButtons;

function downvoteAllPosts() {
    const btn = $('#btn-dv-all');
    const postIds = $('.js-search-results .search-result').map((i, el) => el.id.replace(/\D+/, '')).get();
    console.log('Downvote', postIds);

    $('body').showAjaxProgress(postIds.length, { position: 'fixed' });

    let index = 0, errors = 0;
    let executeQueue = function (index) {
        let pid = postIds[index];
        btn.text(`processing ${index} of ${postIds.length}`);

        $.post({
            url: `https://${location.hostname}/posts/${pid}/vote/3`,
            data: {
                fkey: fkey
            }
        }).done(function (data) {

            if (!data.Success) {
                console.log(`Failed to downvote ${pid}`);
                errors++;
            }
            else {
                console.log(`Downvoted ${pid}`);
            }

            noMoreVotes = noMoreVotes || data.Message.includes('Daily vote limit reached');
            if (noMoreVotes) {
                console.log(`Daily vote limit reached.`);
                actionButtons.remove();
                return;
            }
            if (errors > 3) {
                console.log(`Too many errors. Terminating.`);
                actionButtons.remove();
                return;
            }

            // check if there are more
            index++;
            if (postIds[index] != undefined) {
                setTimeout(() => executeQueue(index), 1000);
            }
            else {
                actionButtons.remove();
            }
        }).fail(function () {
            console.log(`An error occurred.`);
            actionButtons.remove();
        });
    }
    executeQueue(index);
}

actionButtons = $(`<div class="search-action-buttons"><button id="btn-dv-all">Downvote ALL</button></div>`).appendTo('body');
actionButtons.one('click', 'button', function (evt) {
    downvoteAllPosts();
    return false;
});


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
.search-action-buttons {
    position: fixed !important;
    bottom: 3px;
    right: 3px;
    z-index: 999999;
}
.search-action-buttons:hover button {
    display: inline-block !important;
}
.search-action-buttons button {
    display: none;
    margin-right: 3px;
    opacity: 0.5;
}
.search-action-buttons button:hover {
    opacity: 1;
}
.search-action-buttons button:nth-last-child(1) {
    display: inline-block;
    margin-right: 0;
}`;
document.body.appendChild(styles);