// ==UserScript==
// @name         Chat Room Info Annotations
// @description  Display users' annotations in chat room info
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.0
//
// @include      https://chat.stackoverflow.com/rooms/info/*
// @include      https://chat.stackexchange.com/rooms/info/*
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';

// Moderator check
if (!$('.topbar-menu-links').text().includes('♦')) return;


function doPageload() {
    var $users = $('#room-usercards-container').find('.usercard');

    // Load 10 users at a time
    for (var i = 0; i < Math.ceil($users.length / 10); i++) {
        setTimeout(u => getUsersInfo(u), 1500 * i, $users.slice(i * 10, i * 10 + 10));
    }
}

function getUsersInfo($users) {

    $users.each(function () {
        // Ignore mods
        var modFlair = $(this).find('.moderator');
        if (modFlair.length) return;

        // Grab annotation acount from user page
        var uid = $(this).attr('id').match(/\d+/);
        $.ajax({
            url: 'https://chat.stackoverflow.com/admin/annotations/' + uid,
            xhr: jQueryXhrOverride,
            success: function (data) {

                // Parse user page
                var annotlist = $('#annotlist', data);
                var annotations = $('li > b:first', annotlist);
                var numAnno = annotations.filter((i, e) => e.innerText.indexOf('Annotation') > -1).length;
                var numSusp = annotations.filter((i, e) => e.innerText.indexOf('Suspension') > -1).length;

                // Add annotation count
                if (numAnno + numSusp > 0) {
                    $('<div id="annotation-count" title="This user has ' + numAnno + ' moderator annotations and has been suspended ' + numSusp + ' times"><a href="/admin/annotations/' + uid + '">' + (numAnno + numSusp) + '</a></div>')
                        .prependTo('#user-' + uid);
                }
            }
        });
    });
}


// On page load
doPageload();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name)
styles.innerHTML = `
#annotation-count {
    transform: scale3d(0.9,0.9,1);
}
`;
document.body.appendChild(styles);