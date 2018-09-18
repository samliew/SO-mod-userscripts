// ==UserScript==
// @name         Suspicious Voting Helper
// @description  Assists in building suspicious votes CM messages. Highlight same users across IPxref table.
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0.1
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*.stackexchange.com/*
//
// @exclude      *chat.*
// @exclude      https://stackoverflow.com/c/*
// ==/UserScript==

(function() {
    'use strict';

    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;


    const newlines = '\n\n';


    function mapVotePatternItemsToObject() {
        const link = $('.user-details a', this);
        const votes = $(this).children('td').eq(2).text().split(' / ');
        return {
            uid: link.attr('href').match(/\/(\d+)\//)[0],
            userlink: link.attr('href'),
            username: link.text(),
            type: $(this).children('td').eq(1).text(),
            votes: Number(votes[0]),
            votesTotal: Number(votes[1]),
            votesPct: Math.round(Number(votes[0]) / Number(votes[1]) * 100)
        }
    }


    function updateModTemplates() {

        const uid = location.pathname.match(/\d+$/)[0];
        const userlink = $('.userlink a').filter((i,el) => el.href.includes(`/${uid}/`)).first();
        const template = $('.popup input[name=mod-template]').filter((i,el) => $(el).next().text().includes('suspicious voting'));

        let addstr = `This user has a [suspicious history](https://${location.hostname}/admin/show-user-votes/${uid}) of cross-voting and/or targeted votes.` + newlines;

        // If template is selected
        let flags, votesFrom, votesTo;
        $.when(

            // Load latest flagged posts and get mod flags that suggest suspicious voting
            $.get(`https://${location.hostname}/users/flagged-posts/${uid}`).then(function(data) {
                flags = $('#mainbar .revision-comment', data).filter((i,el) => /\b((up|down)vot(es?|ing)|sock|revenge|serial|suspicious)/.test(el.innerText));
            }),

            // Load votes
            $.get(`https://${location.hostname}/admin/show-user-votes/${uid}`).then(function(data) {
                const tables = $('.cast-votes:first .voters', data);
                votesFrom = tables.first().find('tbody tr').map(mapVotePatternItemsToObject).get();
                votesTo = tables.last().find('tbody tr').map(mapVotePatternItemsToObject).get();
            })

        ).then(function() {

            //console.log(flags);
            //console.table(votesFrom);
            //console.table(votesTo);

            // Build evidence
            let evidence = `Please invalidate the votes shared between these users:` + newlines;

            // Check for users in both vote tables
            votesFrom.forEach(function(v,i) {
                for(let i=0; i<votesTo.length; i++) {
                    if(v.uid === votesTo[i].uid && v.type !== 'acc' && votesTo[i].type !== 'acc') {
                        evidence += `- Although this user has both received ${v.votes} votes from, and given ${votesTo[i].votes} votes to [${v.username}](${v.userlink}), it doesn't seem that this account is a sockpuppet due to different PII and are most likely studying/working together.` + newlines;

                        // Invalidate used entries
                        v.votes = 0;
                        v.votesPct = 0;
                        votesTo[i].votes = 0;
                        votesTo[i].votesPct = 0;
                    }
                }
            });

            // Get users with high vote ratio
            votesFrom.forEach(function(v,i) {
                if(v.votesPct >= 80 && v.type !== 'acc') {
                    evidence += `- This user has received a large percentage of targeted votes (${v.votes}/${v.votesTotal} ${v.votesPct}%) from [${v.username}](${v.userlink}).` + newlines;

                    // Invalidate used entries
                    v.votesPct = 0;
                }
            });
            votesTo.forEach(function(v,i) {
                if(v.votesPct >= 80 && v.type !== 'acc') {
                    evidence += `- This user has given a large percentage of targeted votes (${v.votes}/${v.votesTotal} ${v.votesPct}%) to [${v.username}](${v.userlink}).` + newlines;

                    // Invalidate used entries
                    v.votesPct = 0;
                }
            });

            // Get users with >= 5 targeted votes
            votesFrom.forEach(function(v,i) {
                if(v.votes >= 5 && v.votes !== 'acc') {
                    evidence += `- This user has received a large number of targeted votes (${v.votes}/${v.votesTotal} ${v.votesPct}%) from [${v.username}](${v.userlink}).` + newlines;

                    // Invalidate used entries
                    v.votes = 0;
                }
            });
            votesTo.forEach(function(v,i) {
                if(v.votes >= 5 && v.type !== 'acc') {
                    evidence += `- This user has given a large number of targeted votes (${v.votes}/${v.votesTotal} ${v.votesPct}%) to [${v.username}](${v.userlink}).` + newlines;

                    // Invalidate used entries
                    v.votes = 0;
                }
            });

            // Display flags from users
            if(flags.length > 0) {
                evidence += 'Reported via custom flag:\n';
                flags.each((i,el) => evidence += '> ' + el.innerText + newlines);
            }

            // Insert to template
            addstr += evidence;
            template.val(
                template.val()
                    .replace(/:\n/, ':<br>') // remove newline after :
                    .replace(/(https[^\s]+)/, '$1?tab=reputation') // change userlink to rep tab
                    .replace(/\n\n{todo}/, addstr) // replace todo with evidence
            );

        }); // End then
    }


    function doPageload() {

        // If on xref-user-ips
        if(location.pathname.includes('/admin/xref-user-ips/')) {

            // Populate each user row with their uid
            const userrows = $('#xref-ids td tbody tr').each(function() {
                $(this).attr('data-uid', $(this).find('a').first().attr('href').match(/\d+$/)[0]);
            })

            // Highlight same user across IPs
            .hover(function() {
                const uid = this.dataset.uid;
                userrows.removeClass('active').filter(`[data-uid=${uid}]`).addClass('active');
            }, function() {
                userrows.removeClass('active');
            })

            // Pin highlight on clicked user
            .click(function() {
                const uid = this.dataset.uid;
                const isFocus = $(this).hasClass('focus');
                userrows.removeClass('focus');
                if(!isFocus) userrows.filter(`[data-uid=${uid}]`).addClass('focus');
            });

        }
    }


    function listenToPageUpdates() {

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {

            // If mod popup loaded
            if(settings.url.includes('/admin/contact-cm/template-popup/')) {
                setTimeout(updateModTemplates, 200);
            }
        });

    }


    function appendStyles() {

        const styles = `
<style>
tr[data-uid] {
    cursor: cell;
}
tr[data-uid].active {
    background: #ffc;
}
tr[data-uid].focus {
    background: #cfc;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();
    listenToPageUpdates();

})();
