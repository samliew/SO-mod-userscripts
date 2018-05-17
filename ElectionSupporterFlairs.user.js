// ==UserScript==
// @name         Election Supporter Flairs
// @description  Flair users who voted in the elections when you were elected, or if non-mod, for the latest election
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0
//
// @include      https://stackoverflow.com/*
// ==/UserScript==

(function() {
    'use strict';

    const store = window.localStorage;
    const myUserId = StackExchange.options.user.userId;
    let electionNum;


    function toBool(v) {
        return v == null ? null : v === true || v.toLowerCase() === 'true';
    }


    function getLastElectionNum() {
        const keyroot = 'LastElectionNum';
        const fullkey = `${keyroot}`;
        let v = Number(store.getItem(fullkey));

        return new Promise(function(resolve, reject) {
            if(v != null && !isNaN(v)) { resolve(v); return; }

            $.ajax(`https://stackoverflow.com/election/-1`)
                .done(function(data) {
                    const elections = $('table.elections tr', data);
                    const eLatest = elections.last().find('a').first().attr('href').match(/\d+$/)[0]
                    v = Number(eLatest);
                    store.setItem(fullkey, v);
                    resolve(v);
                });
        });
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
                    const eNum = hist.first().children().eq(2).text().match(/\d+/)[0];
                    v = Number(eNum);
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


    function initUserElectionParticipation() {

        // Get all unique users on page except own
        let userIds = $('a[href^="/users/"]').map((i, el) => $(el).attr('href').match(/\d+/)[0]).get();
        userIds = userIds.filter(function(value, index, self) {
            return self.indexOf(value) === index && value !== myUserId.toString();
        });

        // Flair users who voted in the elections
        userIds.forEach(function(uid) {
            getUserParticipationForElection(uid, electionNum).then(function(v) {
                if(v) $('.user-details, .comment-body, .question-status').find(`a[href^="/users/${uid}/"]`).addClass('election-supporter');
            });
        });
    }


    function doPageload() {
        
        let promise;
        if(StackExchange.options.user.isModerator) {
            promise = getUserElectionNum(myUserId);
        }
        else {
            promise = getLastElectionNum();
        }
        
        promise.then(function(v) {
            electionNum = v;
            if(!isNaN(electionNum)) initUserElectionParticipation();
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
    doPageload();

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
    lsRemoveItemsWithPrefix('LastElectionNum');
    lsRemoveItemsWithPrefix('UserElectionNum');
    lsRemoveItemsWithPrefix('UserParticipationForElection');
};
