// ==UserScript==
// @name         Flag Retractor
// @description  Implements retract flag button on own flag history page
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.1
//
// @include      https://*stackoverflow.com/users/flag-summary/*
// @include      https://*serverfault.com/users/flag-summary/*
// @include      https://*superuser.com/users/flag-summary/*
// @include      https://*askubuntu.com/users/flag-summary/*
// @include      https://*mathoverflow.net/users/flag-summary/*
// @include      https://*.stackexchange.com/users/flag-summary/*
//
// @exclude      *chat.*
// @exclude      *blog.*
// @exclude      https://stackoverflow.com/c/*
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';

const fkey = StackExchange.options.user.fkey;
const flagTypes = {
    CommentNoLongerNeeded: 'no longer needed',
    CommentUnwelcoming: 'unfriendly or unkind',
    CommentRudeOrOffensive: 'harassment, bigotry, or abuse',

    PostSpam: 'spam',
    PostOffensive: 'rude or abusive',
    PostLowQuality: 'very low quality',
    AnswerNotAnAnswer: 'not an answer',
};

const mapFlagTypeToName = flagtype => flagTypes[flagtype] || 'PostOther';
const mapFlagNameToType = flagname => Object.keys(flagTypes).find(key => flagTypes[key] === flagname.toLowerCase()) || 'PostOther';


// Retract post flag
function retractFlag(pid, flagType) {
    return new Promise(function (resolve, reject) {
        if (typeof pid === 'undefined' || pid === null) { reject(); return; }
        if (typeof flagType === 'undefined' || flagType === null) { reject(); return; }

        $.post({
            url: `https://${location.hostname}/flags/posts/${pid}/retract/${flagType}`,
            data: {
                'fkey': fkey,
                'otherText': '',
            }
        })
            .done(resolve)
            .fail(reject);
    });
}

function doPageLoad() {

    // Work only on OWN flag history page (e.g.: mods can't retract another user's flags)
    if (location.pathname !== '/users/flag-summary/' + StackExchange.options.user.userId) return;

    // Cannot work on comment flags
    if (location.search.includes('group=4')) return;

    $('.user-flag-history').on('click', '[data-retractflagtype]', function () {
        retractFlag(this.dataset.postid, this.dataset.retractflagtype);
        $(this).remove();
        return false;
    });

    $('.user-flag-history .mod-flag-indicator').parent('.mod-flag').each(function () {
        const link = $(this).closest('.flagged-post').find('.answer-hyperlink').attr('href');
        const pid = getPostId(link);
        const flagname = $(this).children('.revision-comment, .bounty-indicator-tab').first().text().toLowerCase(); // spam flags still use class ".bounty-indicator-tab"
        const flagtype = mapFlagNameToType(flagname);
        $(this).append(`<button class="s-btn s-btn__xs s-btn__github" data-retractflagtype="${flagtype}" data-postid="${pid}">Retract ${flagtype} flag</button>`);
    });
}


// On page load
doPageLoad();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
.user-flag-history .mod-flag button {
    font-size: 0.8em !important;
}
`;
document.body.appendChild(styles);