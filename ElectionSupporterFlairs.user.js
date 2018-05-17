// ==UserScript==
// @name         Election Supporter Flairs
// @description  Flair users who voted in the elections when you were elected
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0
//
// @include      https://stackoverflow.com/*
// ==/UserScript==

(function() {
    'use strict';

    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;


    const store = window.localStorage;
    const myUserId = StackExchange.options.user.userId;
    let myElectionNum;


    function toBool(v) {
        return v == null ? null : v === true || v.toLowerCase() === 'true';
    }


    function getUserElectionNum(uid) {
        const keyroot = 'UserElectionNum';
        const fullkey = `${keyroot}:${uid}`;
        let v = Number(store.getItem(fullkey));

        return new Promise(function(resolve, reject) {
            if(v != null && !isNaN(v)) { resolve(v); return; }

            $.ajax(`https://stackoverflow.com/users/history/${uid}?type=Promoted+to+moderator+for+winning+an+election`)
                .done(function(data) {
                    const hist = $('#user-history tbody tr', data);
                    const comment = hist.first().children().eq(2).text().match(/\d+/)[0];
                    v = comment;
                    store.setItem(fullkey, v);
                    resolve(v);
                });
        });
    }


    function getUserParticipationForElection(uid, electionNum) {
        const keyroot = 'UserParticipationForElection' + electionNum;
        const fullkey = `${keyroot}:${uid}`;
        let v = toBool(store.getItem(fullkey));

        return new Promise(function(resolve, reject) {
            if(v != null) { resolve(v); return; }

            $.get(`https://stackoverflow.com/help/badges/1974/constituent?userid=${uid}`)
                .done(function(data) {
                    v = $(`.single-badge-reason a[href$="${electionNum}"]`, data).length == 1;
                    store.setItem(fullkey, v);
                    resolve(v);
                });
        });
    }


    function doPageload() {

        // Get all unique users on page except own
        let userIds = $('a[href^="/users/"]').map((i, el) => $(el).attr('href').match(/\d+/)[0]).get();
        userIds = userIds.filter(function(value, index, self) {
            return self.indexOf(value) === index && value !== myUserId.toString();
        });

        // Flair users who voted in the elections when you were elected
        userIds.forEach(function(uid) {
            getUserParticipationForElection(uid, myElectionNum).then(function(v) {
                if(v) $('.user-details, .comment-body, .question-status').find(`a[href^="/users/${uid}/"]`).addClass('election-supporter');
            });
        });
    }


    function appendStyles() {

        var styles = `
<style>
.election-supporter:after {
    content: '■';
    position: relative;
    top: -2px;
    margin-left: 3px;
    font-size: 12px;
    line-height: 1;
    color: #5A5;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    getUserElectionNum(myUserId).then(function(v) {
        myElectionNum = v;
        if(!isNaN(myElectionNum)) doPageload();
    });

})();


unsafeWindow.lsRemoveItemsWithPrefix =
    unsafeWindow.lsRemoveItemsWithPrefix ||
    function(prefix, log = false) {
        const items = [];
        for(let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if(key && key.indexOf(prefix) === 0) {
                items[key] = localStorage.getItem(key);
                localStorage.removeItem(key);
            }
        }
        if(log) console.table(items);
        return items.length;
    };


unsafeWindow.purgeElectionSupporterFlairs = function() {
    lsRemoveItemsWithPrefix('UserElectionNum');
    lsRemoveItemsWithPrefix('UserParticipationForElection');
};
