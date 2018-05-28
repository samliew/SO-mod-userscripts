// ==UserScript==
// @name         Mod Flagger Stats
// @description  On hover userlink in mod flag queue, get and display flagger stats
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0
//
// @include      https://*stackoverflow.com/admin/dashboard*
// @include      https://*serverfault.com/admin/dashboard*
// @include      https://*superuser.com/admin/dashboard*
// @include      https://*askubuntu.com/admin/dashboard*
// @include      https://*mathoverflow.net/admin/dashboard*
// @include      https://*.stackexchange.com/admin/dashboard*
// ==/UserScript==

(function() {
    'use strict';

    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;


    function calculateFlagTier(fTotal = 0, fPerc = 0) {
        let v = { tier: 0, name: 'default' };

        // Best Tier
        if(fPerc < 1 && fTotal >= 8000) {
            return { tier: 4, name: 'best' };
        }

        // Gold Tier
        else if(fPerc < 2 && fTotal >= 3000) {
            return { tier: 3, name: 'gold' };
        }

        // Silver Tier
        else if(fPerc < 3 && fTotal >= 1000) {
            return { tier: 2, name: 'silver' };
        }

        // Bronze Tier
        else if(fPerc < 4 && fTotal >= 100) {
            return { tier: 1, name: 'bronze' };
        }

        // Wtf Tier
        else if(fPerc >= 50 && fTotal >= 10) {
            return { tier: -3, name: 'wtf' };
        }

        // Horrible Tier
        else if(fPerc >= 30 && fTotal >= 10) {
            return { tier: -2, name: 'horrible' };
        }

        // Hmmm Tier
        else if(fPerc >= 10 && fTotal >= 10) {
            return { tier: -1, name: 'hmmm' };
        }

        return v;
    }


    function getUserFlagStats(uid) {
        return new Promise(function(resolve, reject) {
            $.ajax(`https://${location.hostname}/users/flag-summary/${uid}`)
                .done(function(data) {
                    const rep = Number($('.user-details .reputation-score', data).text().replace(/k/, '000').replace(/[^\d]/g, ''));
                    const infotable = $('#flag-stat-info-table', data);

                    let fTotal = 1, fTotalElem = infotable.find('tr').first();
                    if(fTotalElem.length != 0) fTotal = Number(fTotalElem.text().replace(/[^\d]+/g, ''));

                    let fDeclined = 0, fDeclinedElem = infotable.find('a[href="?group=1&status=3"]');
                    if(fDeclinedElem.length != 0) fDeclined = Number(fDeclinedElem.parent().prev().text().replace(/[^\d]+/g, ''));

                    const fPerc = fDeclined / fTotal * 100;
                    resolve([rep, fTotal, fDeclined, fPerc]);
                })
                .fail(reject);
        });
    }


    function doPageload() {

        // Load user stats on hover
        $('.mod-message').on('mouseover', 'a[href^="/users/"]', function() {
            if($(this).hasClass('js-userflagstats-loaded')) return;
            const currLink = $(this);
            const uid = this.href.match(/-?\d+/)[0];

            getUserFlagStats(uid).then(function(v) {
                const tier = calculateFlagTier(v[1], v[3]);
                const badge = `<span class="flag-badge ${tier.name}" title="rep:${v[0]}, total:${v[1]}, declined:${v[2]}, perc:${v[3]}"></span>`;

                // Apply to all instances of same user on page
                $(`.mod-message a[href^="/users/${uid}/"]`).not('.js-userflagstats-loaded').addClass('js-userflagstats-loaded').after(badge);
            });
        });
    }


    function appendStyles() {

        const styles = `
<style>
.flag-badge {
    font-size: 0;
    display: inline-block;
    width: 10px;
    height: 10px;
    margin-left: 2px;
    background: white;
    border-radius: 100%;
}
.flag-badge.best {
    background: #3cb371;
}
.flag-badge.gold {
    background: #ffcc01;
}
.flag-badge.silver {
    background: #b4b8bc;
}
.flag-badge.bronze {
    background: #d1a684;
}
.flag-badge.wtf {
    background: #ff0000;
}
.flag-badge.horrible {
    background: #ff7777;
}
.flag-badge.hmmm {
    background: #ffcccc;
}
.flag-badge.default {
    background: none;
    border: 1px solid #aaa;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();

})();
