// ==UserScript==
// @name         Suspicious Voting Helper
// @description  Assists in building suspicious votes CM messages. Highlight same users across IPxref table. Also provides support for SEDE query https://data.stackexchange.com/stackoverflow/query/968803
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      3.0
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
// ==/UserScript==

/* globals StackExchange */
/// <reference types="./globals" />

'use strict';

// This is a moderator-only userscript
if (!isModerator()) return;

const newlines = '\n\n';
const strToRep = str => Number(str.replace(/\.(\d)k/, '$100').replace(/k/, '000').replace(/[^\d]+/g, ''));
const getQueryParam = key => new URLSearchParams(window.location.search).get(key) || '';
const apikey = 'yZcUvuGAMj25rYZ)a5YNqg((';


// Helper functions
function toSeDateFormat(dateObj) {
  return dateObj.toISOString().replace('T', ' ').replace('.000', '');
}


// Mapper functions
function mapVotePatternItemsToObject() {
  const link = $('.user-details a', this);
  const uRep = $('.reputation-score', this);
  const vArr = $(this).children('td').eq(2).text().split(' / ');
  const vNum = Number(vArr[0]);
  const vTotal = Number(vArr[1]);
  const vtype = $(this).children('td').eq(1).text().trim();
  const vtypeText = vtype === 'dn' ? 'down' : (vtype === 'up' ? 'up' : 'acc');
  const vPct = Math.round(vNum / vTotal * 100);
  return link.length == 0 ? null : {
    uid: link.attr('href').match(/\/(-?\d+)\//)[0],
    userlink: link.attr('href'),
    username: link.text(),
    userrep: strToRep(uRep.text()),
    type: vtypeText,
    votes: vNum,
    votesTotal: vTotal,
    votesPct: vPct,
    size: (vNum >= 10 || vPct >= 25) ? 'large' : '',
    used: false,
  }
}

function mapInvVotePatternItemsToObject() {
  const link = $('.user-details a', this);
  const uRep = $('.reputation-score', this);
  const vNum = Number($(this).children('td').eq(1).text());
  return link.length == 0 ? null : {
    uid: link.attr('href').match(/\/(\d+)\//)[0],
    userlink: link.attr('href'),
    username: link.text(),
    userrep: strToRep(uRep.text()),
    type: 'invalidated ',
    votes: vNum,
    votesTotal: vNum,
    votesPct: '',
    size: vNum >= 5 ? 'large' : '',
    used: false,
  }
}


// Main functions
let updateModTemplates = function () {
  updateModTemplates = () => 0; // this function should run once only

  const uid = location.pathname.match(/\d+$/)[0];
  const userlink = $('.userlink a').filter((i, el) => el.href.includes(`/${uid}/`)).first();
  const template = $('.popup input[name=mod-template]').filter((i, el) => $(el).next().text().includes('suspicious voting'));

  let addstr = `This user has a [suspicious history](${location.origin}/admin/show-user-votes/${uid}) of cross-voting and/or targeted votes.` + newlines;
  let appstr = `*(there may also be other minor instances of targeted votes that are unknown to us, as we can only view votes between users if they are above a certain threshold)*`;
  let additionalInfo = getQueryParam('info');

  // After template dialog has opened
  let flags, votesFrom, votesTo, votesFromInv = [], votesToInv = [];
  $.when(

    // Load latest flagged posts and get mod flags that suggest suspicious voting
    $.get(`${location.origin}/users/flagged-posts/${uid}`).then(function (data) {
      flags = $('#mainbar .mod-flag', data);

      // Format flags
      flags = flags.filter(function (i, el) {
        return $(el).find('.flag-outcome').length == 0 &&
          /\b((up|down)?vot(es?|ing)|sock|revenge|serial|suspicious)/.test($(el).find('.revision-comment').text());
      })
        .each(function (i, el) {
          $(el).find('a').each(function () { this.innerText = this.href; });
          $(el).find('.relativetime').each(function () { this.innerText = '*' + this.title + '*'; });
          $(el).find('.mod-flag-indicator').remove();
        })
        .get().map(v => v.innerText
          .replace(/\s*(\n|\r)\s*/g, ' ') // remove excessive whitespace
          .replace(/\s*[|]\s*/g, '<br>\n') // convert pipes to newlines
          .replace(/\s*([‒–—―])/g, '<br>\n$1') // add newlines before hyphens
          .replace(/\b((\d{1,2} )?[a-z]{3} (\d{1,2})?,? (\d{4}|'\d{2}))\b/gi, '**$1**') // bold dates
          .replace(' site://', ' https://' + location.hostname + '/') // convert SEDE site:// links to proper urls
          .trim()
        );
    }),

    // Load votes
    $.get(`${location.origin}/admin/show-user-votes/${uid}`).then(function (data) {
      const sections = $('#mainbar-full [class*="md:fd-column"]', data);

      const tables = sections.first().find('table');
      votesFrom = tables.first().find('tbody tr').map(mapVotePatternItemsToObject).get();
      votesTo = tables.last().find('tbody tr').map(mapVotePatternItemsToObject).get();

      if (sections.length > 1) {
        const tablesInv = sections.last().find('table');
        votesFromInv = tablesInv.first().find('tbody tr').map(mapInvVotePatternItemsToObject).get();
        votesToInv = tablesInv.last().find('tbody tr').map(mapInvVotePatternItemsToObject).get();
      }
    })

  ).then(function () {

    //console.log(flags);
    //console.table(votesFrom);
    //console.table(votesTo);
    //console.table(votesFromInv);
    //console.table(votesToInv);

    // Build evidence
    let evidence = `Please investigate the votes shared between these users:` + newlines;

    // Check for users in the four vote tables
    votesFrom.forEach(function (v, i) {

      for (let i = 0; i < votesTo.length; i++) {
        if (v.uid === votesTo[i].uid && v.type !== 'acc' && votesTo[i].type !== 'acc') {
          evidence += `- Although this user has both received ${v.votes} ${v.type}votes from, and given ${votesTo[i].votes} ${votesTo[i].type}votes to [${v.username}](${v.userlink}),
it doesn't seem that this account is a sockpuppet due to different PII and are most likely studying/working together.` + newlines;

          // Invalidate used entries
          v.used = true;
          votesTo[i].used = true;
          return;
        }
      }

      // Also check for already invalidated votes
      for (let i = 0; i < votesToInv.length; i++) {
        if (v.uid === votesToInv[i].uid && v.type !== 'acc') {
          evidence += `- Although this user has both received ${v.votes} ${v.type}votes from, and previously given ${votesToInv[i].votes} *invalidated* votes to [${v.username}](${v.userlink}),
it doesn't seem that this account is a sockpuppet due to different PII and are most likely studying/working together.` + newlines;

          // Invalidate used entries
          v.used = true;
          votesToInv[i].used = true;
          return;
        }
      }
    });

    // Get users with high vote ratio
    votesFrom.filter(v => !v.used).forEach(function (v, i) {
      if (v.votesPct >= 50 && v.type !== 'acc' && v.userrep < 100000) {

        let temp = `- This user has received a ${v.size} percentage of targeted ${v.type}votes (${v.votes}/${v.votesTotal} **${v.votesPct}%**) from [${v.username}](${v.userlink})`;

        // Targeted and targeted invalidated
        for (let i = 0; i < votesFromInv.length; i++) {
          if (v.uid === votesFromInv[i].uid) {
            evidence += temp + ` *(some votes are already invalidated)*.` + newlines;

            // Invalidate used entries
            v.used = true;
            return;
          }
        }

        // No targeted (default)
        evidence += temp + '.' + newlines;
        v.used = true;
      }
    });
    votesTo.filter(v => !v.used).forEach(function (v, i) {
      if (v.votesPct >= 50 && v.type !== 'acc' && v.userrep < 100000) {
        evidence += `- This user has given a ${v.size} percentage of targeted ${v.type}votes (${v.votes}/${v.votesTotal} **${v.votesPct}%**) to [${v.username}](${v.userlink}).` + newlines;
        v.used = true;
      }
    });

    // Get users with >= 5 targeted votes
    votesFrom.filter(v => !v.used).forEach(function (v, i) {
      if (v.votes >= 5 && v.type !== 'acc' && v.userrep < 100000) {

        let temp = `- This user has received a ${v.size} number of targeted ${v.type}votes (**${v.votes}**/${v.votesTotal} *${v.votesPct}%*) from [${v.username}](${v.userlink})`;

        // Targeted and targeted invalidated
        for (let i = 0; i < votesFromInv.length; i++) {
          if (v.uid === votesFromInv[i].uid) {
            evidence += temp + ` *(some votes are already invalidated)*.` + newlines;

            // Invalidate used entries
            v.used = true;
            return;
          }
        }

        // No targeted (default)
        evidence += temp + '.' + newlines;
        v.used = true;
      }
    });
    votesTo.filter(v => !v.used).forEach(function (v, i) {
      if (v.votes >= 5 && v.type !== 'acc' && v.userrep < 100000) {
        evidence += `- This user has given a ${v.size} number of targeted ${v.type}votes (**${v.votes}**/${v.votesTotal} *${v.votesPct}%*) to [${v.username}](${v.userlink}).` + newlines;
        v.used = true;
      }
    });

    // Display flags from users
    if (flags.length > 0) {
      let flagtext = `\nReported via [custom flag](${location.origin}/users/flagged-posts/${uid}):\n\n`;
      flags.forEach(function (v) {
        flagtext += '> ' + v + newlines;
      });

      appstr = flagtext + newlines + appstr;
    }

    // Additional information from querystring, mostly for use with
    // https://data.stackexchange.com/stackoverflow/query/968803
    if (additionalInfo) {
      let infotext = `Additional information:` + newlines + ' - ' + decodeURIComponent(additionalInfo) + newlines;
      appstr = infotext + newlines + appstr;
    }

    // Insert to template
    addstr += evidence;
    template.val(
      template.val()
        .replace(/:\n/, ':<br>') // remove newline after :
        .replace(/(https[^\s]+)/, '$1?tab=reputation') // change userlink to rep tab
        .replace(/\n\n{todo}/, addstr + appstr) // replace todo with evidence
    );

    // Show help message if template selected
    var selBtn = template.closest('.popup').find('.popup-submit');
    selBtn.on('click', function () {
      if (template.is(':checked')) {
        //StackExchange.helpers.showMessage($('#show-templates').parent(),
        //   'Ensure confirmed socks (matching IP & PII) are deleted first. Then in this canned message, remove users that are not cross-voting or targeted voting.');
      }
    });

    // Finally select the template option if we are automating via query params
    if (getQueryParam('action') == 'suspicious-voting') {
      template.trigger('click');
      selBtn.removeAttr('disabled').trigger('click');

      // Failsafe
      $('#templateName').val('suspicious voting');
    }

  }); // End then
}


function doPageLoad() {

  // If on xref-user-ips page
  if (location.pathname.includes('/admin/xref-user-ips/')) {

    // Populate each user row with their uid
    const userrows = $('#xref-ids td tbody tr').each(function () {
      $(this).attr('data-uid', $(this).find('a').first().attr('href').match(/\d+$/)[0]);
    })

      // Highlight same user across IPs
      .hover(function () {
        const uid = this.dataset.uid;
        userrows.removeClass('active').filter(`[data-uid=${uid}]`).addClass('active');
      }, function () {
        userrows.removeClass('active');
      })

      // Pin highlight on clicked user
      .on('click', function (evt, curruser) {
        const uid = this.dataset.uid;
        const isFocus = $(this).hasClass('focus');
        userrows.removeClass('focus');
        if (curruser) userrows.filter(`[data-uid=${uid}]`).addClass('curruser');
        if (!isFocus) userrows.filter(`[data-uid=${uid}]`).addClass('focus');
      });

    // Select current user on page load
    const currUid = location.pathname.split('/').pop() || '';
    $(`a[href$="/users/${currUid}"]`).first().closest('tr').triggerHandler('click', true);

    // Fix compare links that are on the same date, so we don't get the "to date precedes or equal to start date" error
    $('a[href^="/admin/user-activity"]').each(function () {
      const params = this.href.split('#')[1].split('|');
      const date1 = params[0];
      const date2 = params[1];
      const users = params[2];
      if (date1 == date2) {
        let y = Number(date1.split('/')[0]);
        let m = Number(date1.split('/')[1]);
        let d = Number(date1.split('/')[2]) - 1;
        if (d < 0) {
          d = 31;
          m -= 1;

          if (m < 0) {
            m = 12;
            y -= 1;
          }
        }
        this.href = `/admin/user-activity#${y}/${m}/${d}|${date2}|${users}`;
      }
    });

    // Move rows that only contain a single user to the bottom
    $('.odd, .even', '#xref-ids').removeClass('even odd').addClass('ip-group');
    const singleUserRows = $('.ip-address').next('td').children('table').filter(function () { return $(this).find('tr').length == 1 }).parents('.ip-group').addClass('single-user');
    singleUserRows.reverse().appendTo('#xref-ids > tbody');
  }

  // If on user votes page
  else if (location.pathname.includes('/show-user-votes/')) {

    // Sort invalidated votes table by date of invalidation instead, but still allow sorting by other columns
    const activeVotesTables = $('.cast-votes:first table');
    const invalidatedVotesTables = $('.cast-votes:last table');

    activeVotesTables.on('click', 'th', function () {
      let sortFunction;
      switch ($(this).index()) {

        case 0: // user
          sortFunction = function (a, b) {
            let aTxt = $(a).find('.user-details a').text(),
              bTxt = $(b).find('.user-details a').text();

            if (aTxt == bTxt) return 0;
            return (aTxt > bTxt) ? 1 : -1;
          };
          break;

        case 1: // type
          sortFunction = function (a, b) {
            let aTxt = $(a).find('.vote-type span').text(),
              bTxt = $(b).find('.vote-type span').text();

            if (aTxt == bTxt) return 0;
            return (aTxt > bTxt) ? 1 : -1;
          };
          break;

        case 2: // num
          sortFunction = function (a, b) {
            let aTxt = Number(a.children[2].innerText.split(' / ')[0]),
              bTxt = Number(b.children[2].innerText.split(' / ')[0]);

            console.log(a.children[2].innerText, aTxt);
            if (aTxt == bTxt) return 0;
            return (aTxt < bTxt) ? 1 : -1;
          };
          break;

        case 3: // perc
          sortFunction = function (a, b) {
            let aTxt = Number($(a).find('.number span').text().replace('%', '')),
              bTxt = Number($(b).find('.number span').text().replace('%', ''));

            if (aTxt == bTxt) return 0;
            return (aTxt < bTxt) ? 1 : -1;
          };
          break;

        default:
          return; // do nothing
      }
      // Sort posts in-memory then reattach to container
      const tbody = $(this).closest('table').find('tbody');
      tbody.children().sort(sortFunction).detach().appendTo(tbody);

      return false;
    });

    invalidatedVotesTables.on('click', 'th', function () {
      let sortFunction;
      switch ($(this).index()) {

        case 0: // user
          sortFunction = function (a, b) {
            let aTxt = $(a).find('.user-details a').text(),
              bTxt = $(b).find('.user-details a').text();

            if (aTxt == bTxt) return 0;
            return (aTxt > bTxt) ? 1 : -1;
          };
          break;

        case 1: // num
          sortFunction = function (a, b) {
            let aTxt = Number($(a).find('.number').text()),
              bTxt = Number($(b).find('.number').text());

            if (aTxt == bTxt) return 0;
            return (aTxt < bTxt) ? 1 : -1;
          };
          break;

        case 2: // date
          sortFunction = function (a, b) {
            let aTxt = $(a).find('.relativetime').attr('title'),
              bTxt = $(b).find('.relativetime').attr('title');

            if (aTxt == bTxt) return 0;
            return (aTxt < bTxt) ? 1 : -1;
          };
          break;

        default:
          return; // do nothing
      }
      // Sort posts in-memory then reattach to container
      const tbody = $(this).closest('table').find('tbody');
      tbody.children().sort(sortFunction).detach().appendTo(tbody);

      return false;
    });
  }

  // CM message page
  else if (location.pathname.includes('/admin/cm-message/')) {

    // Linkify user ids in preformatted elements
    const uidRegex = /\b(\d{4,})\b/g;
    $('.msg-body pre code').each(function () {
      this.innerHTML = this.innerHTML.replace(uidRegex, `<a href="${location.origin}/users/$1" target="_blank">$1</a>`);
    });

    // click template link if we are automating via query params
    if (getQueryParam('action') == 'suspicious-voting') {
      $('#show-templates').trigger('click');
    }
  }

  // User dashboard
  else if (location.pathname.includes('/users/account-info/')) {
    const uid = location.pathname.match(/\/(\d+)/)[1];
    const networkUid = $('.account-info a[href^="https://stackexchange.com/users/"]').attr('href').match(/\/(\d+)\/?/)[1];

    const dateNetworkRegContainer = $(` <span class="d-inline-block ml12"></span>`);
    $('#mod-content .details .col-4').eq(0).append(dateNetworkRegContainer);

    const dateSiteRegContainer = $(` <span class="d-inline-block ml12"></span>`);
    $('#mod-content .details .col-4').eq(1).append(dateSiteRegContainer);

    // Fetch network accounts info of this user from API
    $.get(`https://api.stackexchange.com/2.2/users/${networkUid}/associated?pagesize=100&types=main_site&filter=!myEHrh)iPP&key=${apikey}`)
      .done(function (data) {
        const accounts = data.items.sort((a, b) => {
          return a.creation_date > b.creation_date ? 1 : -1;
        });
        const networkSiteTimestamp = new Date(accounts[0].creation_date * 1000);
        dateNetworkRegContainer.text(toSeDateFormat(networkSiteTimestamp));

        const currSite = accounts.filter(v => v.site_url.includes(location.hostname))[0];
        const currSiteTimestamp = new Date(currSite.creation_date * 1000);
        dateSiteRegContainer.text(toSeDateFormat(currSiteTimestamp));
      });
  }
}


// Append styles
addStylesheet(`
tr[data-uid] {
  cursor: cell;
}
tr[data-uid].active {
  background: var(--powder-400);
}
tr[data-uid].focus {
  background: var(--powder-400);
}
tr[data-uid].curruser {
  background: var(--green-300);
}
.sorter th {
  cursor: pointer;
}
`); // end stylesheet


// On script run
(function init() {
  doPageLoad();

  // On any page update
  $(document).ajaxComplete(function (event, xhr, settings) {
    // If mod popup loaded
    if (settings.url.includes('/admin/contact-cm/template-popup/')) {
      setTimeout(updateModTemplates, 200);
    }
  });
})();