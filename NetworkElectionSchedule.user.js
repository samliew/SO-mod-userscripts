// ==UserScript==
// @name         Network Election Schedule
// @description  Displays a list of upcoming and ongoing elections on https://stackexchange.com/elections
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.3.8
//
// @include      https://stackexchange.com/elections
//
// @require      https://github.com/samliew/SO-mod-userscripts/raw/master/lib/common.js
//
// @grant        GM_xmlhttpRequest
// ==/UserScript==


(function() {
    'use strict';


    const store = window.localStorage;
    const cdn = 'https://cdn.sstatic.net/Sites/';
    const apikey = 'Wjm8SDrrbQSDSUwcLaifHA((';
    let networkSites, networkSitenames, content, outputTable, electionItems;
    let ajaxCount = 0;


    const detectFutureSites = ['stackoverflow', 'serverfault', 'superuser', 'math'];


    let cacheExpireDate = new Date();
    cacheExpireDate.setUTCDate(cacheExpireDate.getUTCDate() - 3);
    cacheExpireDate.setUTCHours(0);
    cacheExpireDate.setUTCMinutes(0);
    cacheExpireDate.setUTCSeconds(0);


    // Simple index-based insertion in array
    // https://stackoverflow.com/a/12710609
    Array.prototype.insert = function(i, v) {
        this.splice(i, 0, v);
    };


    // https://stackoverflow.com/a/15604206
    const pad = str => ('0' + str).slice(-2);
    function replaceAll(str, mapObj) {
        var re = new RegExp(Object.keys(mapObj).join("|"), "gi");

        return str.replace(re, function(matched) {
            return mapObj[matched.toLowerCase()];
        });
    }
    function translateMonths(str) {
        str = replaceAll(str, { "jan":"01", "feb":"02", "mar":"03", "apr":"04", "may":"05", "jun":"06", "jul":"07", "aug":"08", "sep":"09", "oct":"10", "nov":"11", "dec":"12" });
        str = replaceAll(str, { "янв":"01", "фев":"02", "мар":"03", "апр":"04", "май":"05", "июн":"06", "июл":"07", "авг":"08", "сен":"09", "окт":"10", "ноя":"11", "дек":"12" });
        str = replaceAll(str, { "ene.":"01", "feb.":"02", "mar.":"03", "abr.":"04", "may.":"05", "jun.":"06", "jul.":"07", "ago.":"08", "sep.":"09", "oct.":"10", "nov.":"11", "dic.":"12" });
        return str;
    }
    function parseDateString(str) {
        const origStr = str;

        if(typeof str === 'undefined' || str == null || str.trim() == '') return null;
        if(str == 'yesterday') return str;

        if(!/[-'/]\d{2}/.test(str) && !str.includes('a las')) str = str.replace(/(at|a las|às|в)/i, "'" + (new Date().getYear() % 100) + ' $1');

        let arr = str.trim().replace("'", '20').replace(/el /, '').split(/\s*(at|a las|às|в)\s*/i);
        let d = translateMonths(arr[0]);
        let sep = arr[1];

        if(sep && sep.includes('às')) {
            d = d.split('/').reverse();
            let y = '20' + d.shift();
            d.push(y);
        }
        else if(d.includes('/')) {
            d = d.split('/');
        }
        else if(d.includes('-')) {
            d = d.split('-').reverse();
            let y = '20' + d.shift();
            d.push(y);
        }
        else if(sep && sep.includes('в')) {
            d = d.split(' ').reverse();
            let y = d.shift();
            d.push(y);
        }
        else if(sep && sep.includes('a las')) {
            d = d.split(' ').reverse();
            let y = '20' + d.shift();
            d.push(y);
        }
        else {
            d = d.split(' ');
        }

        if(str.includes('undefined')) {
            console.log('undefined in parsed datestring', origStr, str);
            return str;
        }

        return d[2] + '-' + d[0] + '-' + pad(d[1]) + ' ' + arr[2] + ':00Z';
    }


    function getNetworkSites() {
        const fullkey = 'NetworkSites';
        let v = JSON.parse(store.getItem(fullkey));

        return new Promise(function(resolve, reject) {

            // Cache old, clear value
            if(v != null && v.lastChecked <= cacheExpireDate) {
                store.removeItem(fullkey);
            }
            // Still fresh, reuse cache
            else if(v != null && typeof v.lastChecked !== 'undefined' && v.lastChecked > cacheExpireDate) {
                resolve(v.items);
                return;
            }

            $.get(`https://api.stackexchange.com/2.2/sites?pagesize=999&filter=!2*nS2udIcg(YRE6ca*rtD&key=${apikey}`)
                .done(function(data) {
                    store.setItem(fullkey, JSON.stringify({
                        lastChecked: Date.now(),
                        items: data.items
                    }));
                    resolve(data.items);
                })
                .fail(reject);
        });
    }
    function getMainNetworkSites() {
        return new Promise(function(resolve, reject) {
            getNetworkSites()
                .then(function(items) {
                    resolve(items.filter(v => v.site_type == 'main_site'));
                })
                .catch(reject);
        });
    }


    function getSiteElectionPage(site, next = 0) {
        const fullkey = 'NoElection:' + site.api_site_parameter;
        let v = JSON.parse(store.getItem(fullkey));

        return new Promise(function(resolve, reject) {

            // Cache old, clear value
            if(v != null && v.lastChecked <= cacheExpireDate) {
                store.removeItem(fullkey);
            }
            // Still fresh, reuse cache
            else if(v != null && v.lastChecked > cacheExpireDate) {
                //console.log(`using cached data for ${v.site.name}`);

                if(v.lastElection != null) displaySiteLastElection(v.site, v.lastElection, v.lastElectionEndDate);
                else displayNoElectionsYet(v.site);

                resolve(); return;
            }

            // Simple throttle
            if(ajaxCount > 15) {

                // Refresh page after a minute
                setTimeout(() => location.reload(), 60000);

                // Display notice
                $('#more-notice').show();

                reject();
                return;
            }
            ajaxCount++;

            // Scrape election page
            ajaxPromise(site.site_url + '/election' + (next == 0 ? '' : '/' + next), 'html').then(function(data) {

                const html = $($.parseHTML(data));

                // Check if election listing page (no active election)
                if(data.includes('Community Moderator Elections') && data.includes('There are no active community moderator elections') || html.find('#mainbar-full > p').length == 1) {
                    const lastElectionLink = $('a[href*="/election/"]', html).last();
                    let lastElection = null, lastElectionEndDate = null;

                    if(lastElectionLink.length > 0) {
                        lastElectionEndDate = parseDateString(lastElectionLink.parent().next().next().text());
                        lastElection = lastElectionLink.length > 0 ? Number(lastElectionLink.attr('href').match(/\d+$/)[0]) : '';

                        // No election on major sites, check if there is a scheduled one (last election + 1)
                        if(detectFutureSites.includes(site.api_site_parameter)) {
                            getSiteElectionPage(site, lastElection + 1).then(resolve).finally(() => ajaxCount--);
                        }
                        else {
                            //console.log(`No election on ${site.name}. Last election #${lastElection} ended on ${lastElectionEndDate}.`, site.site_url + '/election');
                            displaySiteLastElection(site, lastElection, lastElectionEndDate);
                        }
                    }
                    else {
                        displayNoElectionsYet(site);
                    }

                    store.setItem(fullkey, JSON.stringify({
                        lastChecked: Date.now(),
                        site: site,
                        lastElection: lastElection,
                        lastElectionEndDate: lastElectionEndDate
                    }));
                }
                // Individual election page (ongoing)
                else {
                    const tabs = $('#tabs .youarehere', html).first();

                    if(tabs.length == 0) {
                        displaySiteLastElectionFromCache(site);
                    }
                    else {
                        const link = tabs.get(0);
                        const href = link.href;
                        const electionNum = href.match(/\d+/)[0];

                        const sidebar = $('#sidebar .module:first', html);
                        let sidebarData = [];
                        sidebar.find('.label-value').each(function(i, v) {
                            const val = this.title || this.innerText.trim();
                            sidebarData.push(val);
                        });
                        if(sidebarData.length == 5) sidebarData.insert(1, ""); // missing 'primary' due to insufficient candidates

                        //console.log(`Election ongoing on ${site.name}.`, site.site_url + '/election');
                        //console.log(sidebarData);
                        displaySiteOngoingElection(site, electionNum, ...sidebarData);

                        store.removeItem(fullkey);
                    }
                }

                ajaxCount--;

                if(ajaxCount <= 1) sortTable();

                resolve(); return;
            });
        });
    }


    function getElectionSchedules() {
        networkSites.forEach(v => getSiteElectionPage(v).catch(() => {}) );
    }


    function displaySiteOngoingElection(site, electionNum, nomination, primary, election, endDate, candidates, seats) {
        electionItems.prepend(`<tr class="active-election" data-timestamp="${new Date(endDate).getTime() || Date.now()}">
  <td><img src="${site.icon_url}" class="siteicon" /></td>
  <td><a href="${site.site_url}/election/${electionNum}" target="_blank">${site.name}</a></td>
  <td><a href="${site.site_url}/election/${electionNum}?tab=nomination" target="_blank">${nomination}</a></td>
  <td><a href="${site.site_url}/election/${electionNum}?tab=primary" target="_blank">${primary ? primary : '-'}</a></td>
  <td><a href="${site.site_url}/election/${electionNum}?tab=election" target="_blank">${election}</a></td>
  <td>${endDate}</td>
  <td>${candidates}</td>
  <td>${seats}</td>
</tr>`);
    }


    function displaySiteLastElection(site, lastElectionNum, lastElectionDate) {
        electionItems.append(`<tr class="last-election" data-timestamp="${new Date(lastElectionDate).getTime() || Date.now()}">
  <td><img src="${site.icon_url}" class="siteicon" /></td>
  <td><a href="${site.site_url}/election" target="_blank">${site.name}</a></td>
  <td colspan="6"><a href="${site.site_url}/election/${lastElectionNum}" target="_blank">last election #${lastElectionNum}</a> ended ${lastElectionDate}</td>
</tr>`);
    }
    function displaySiteLastElectionFromCache(site) {
        const fullkey = 'NoElection:' + site.api_site_parameter;
        let v = JSON.parse(store.getItem(fullkey));
        if(v == null || typeof v.lastElectionNum == 'undefined') return;
        displaySiteLastElection(site, v.lastElectionNum, v.lastElectionDate);
    }


    function displayNoElectionsYet(site) {
        electionItems.append(`<tr class="no-elections">
  <td><img xsrc="${site.icon_url}" class="siteicon" /></td>
  <td><a href="${site.site_url}/election" target="_blank">${site.name}</a></td>
  <td colspan="6">no elections</td>
</tr>`);
    }


    function sortTable() {

        const b = $('#elections tbody');
        b.children(':not(.no-elections)').sort(function(a, b) {
            let aTime = a.dataset.timestamp;
            let bTime = b.dataset.timestamp;
            return aTime > bTime ? -1 : 1;
        }).detach().appendTo(b);

        b.children('.no-elections').sort(function(a, b) {
            let aName = a.children[1].innerText.toLowerCase();
            let bName = b.children[1].innerText.toLowerCase();
            return aName < bName ? -1 : 1;
        }).detach().appendTo(b);
    }


    function doPageLoad() {

        document.title = `Elections on the Stack Exchange Network`;

        content = $('#content .contentWrapper').empty();
        outputTable = $(`
<table id="elections">
  <thead><tr>
    <th></th>
    <th>Site</th>
    <th>Nomination</th>
    <th>Primary</th>
    <th>Election</th>
    <th>End</th>
    <th>Candidates</th>
    <th>Seats</th>
  </tr></thead>
</table>`)
            .appendTo(content)
            .before(`<h1>Elections on the Network</h1>`)
            .after(`<p id="more-notice">This page will automatically load more sites in 60 seconds (to avoid throttling).</p>`);
        electionItems = $(`<tbody id="election-items"></tbody>`).appendTo(outputTable);

        // Cache list in localstorage
        getMainNetworkSites().then(v => {
            networkSites = v;
            networkSitenames = v.map(site => site.name);
            getElectionSchedules();
        });
    }


    function appendStyles() {

        const styles = `
<style>
#content .contentWrapper {
    max-width: 1140px;
    width: auto;
    padding: 20px 20px;
}
#elections {
    min-width: 100%;
}
#elections,
#elections th,
#elections td {
    padding: 2px 7px;
    border: 1px solid #ddd;
    border-collapse: collapse;
    text-align: left;
}
#elections a {
    color: #366FB3;
}
#elections td:first-child {
    padding: 0;
    text-align: center;
}
.no-elections td:last-child {
    font-style: italic;
    color: #aaa;
}
.siteicon {
    max-width: 24px;
    max-height: 24px;
}
#more-notice {
    display: none;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageLoad();

})();
