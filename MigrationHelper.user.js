// ==UserScript==
// @name         Migration Helper
// @description  Dropdown list of migration targets displaying site icon/logo/header images and links to the selected site's on-topic page and mod list. Displays additional information for custom flagger for selected network site.
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.5
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
// @exclude      https://stackoverflow.com/jobs*
//
// @require      https://github.com/samliew/SO-mod-userscripts/raw/master/lib/common.js
// ==/UserScript==


(function() {
    'use strict';

    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;


    const store = window.localStorage;
    const cdn = 'https://cdn.sstatic.net/Sites/';
    const apikey = 'Wjm8SDrrbQSDSUwcLaifHA((';
    let networkSites, networkSitenames, flaggeraccounts;


    function getNetworkSites() {
        const fullkey = 'NetworkSites';
        let v = JSON.parse(store.getItem(fullkey));

        return new Promise(function(resolve, reject) {
            if(v != null) { resolve(v); return; }

            $.get(`https://api.stackexchange.com/2.2/sites?pagesize=999&filter=!)QmDp1jjtiQg0J)1qAulk5k1&key=${apikey}`)
                .done(function(data) {
                    store.setItem(fullkey, JSON.stringify(data.items));
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


    function getNetworkUidForUser(uid) {
        return new Promise(function(resolve, reject) {
            if(typeof uid === 'undefined' || uid == null) { reject(); return; }

            $.get(`https://stackoverflow.com/users/${uid}?tab=profile`)
                .done(function(data) {
                    const networkUid = Number($(data).find('.additional-links a:last, .communities:first a:last').first().attr('href').split('//')[1].match(/\/\d+\/?/)[0].replace(/\//g, '')) || null;
                    resolve(networkUid);
                })
                .fail(reject);
        });
    }


    function getNetworkAccountsViaApi(networkUid) {
        return new Promise(function(resolve, reject) {
            if(typeof networkUid === 'undefined' || networkUid == null) { reject(); return; }

            // via API
            $.get(`https://api.stackexchange.com/2.2/users/${networkUid}/associated?filter=!*LB1tJQ3xNMaIJ-W`)
                .done(function(data) {
                    resolve(data.items);
                })
                .fail(reject);
        });
    }


    function getNetworkAccountsForLocalUser(uid) {
        return new Promise(function(resolve, reject) {
            if(typeof uid === 'undefined' || uid == null) { reject(); return; }

            // via mod dashboard
            $.get(`https://stackoverflow.com/users/account-info/${uid}`)
                .done(function(data) {
                    const v = $('.communities .list .row', data).map(function(i, el) {
                        const repText = $(el).find('.rep').text().trim();
                        const url = $(el).find('.site-hyperlink').attr('href');
                        const rep = Number(repText.replace(/\.(\d+)k/, '$100'));
                        return {
                            reputation: rep,
                            user_id: Number(url.match(/\/(\d+)\/$/)[0].replace(/\//g, '')),
                            site_url: url.match(/^https?:\/\/[^/]+/)[0],
                            site_name: $(el).find('.community-name').text(),
                        };
                    }).get();
                    resolve(v);
                })
                .fail(reject);
        });
    }


    function getFlaggerAccounts(uid) {
        return new Promise(function(resolve, reject) {
            if(flaggeraccounts) {
                resolve(flaggeraccounts);
                return;
            }

            getNetworkAccountsForLocalUser(uid).then(function(v) {
                flaggeraccounts = v;
                resolve(flaggeraccounts);
            });
        });
    }


    function updateMigrationPane() {
        if($('#close-question-form').length == 0 || typeof networkSites === 'undefined') return;

        const anywhere = $('#migrate-anywhere');
        const container = anywhere.closest('li');
        const closeSubmitBtn = $('#close-question-form .popup-submit');
        const siteTargetField = $('#destinationSiteIdAC').attr('type', 'hidden');
        const migflaggerStats = $(`<div id="migflagger-stats"></div>`).hide().prependTo(container);
        let flaggerUid, flaggerName;

        // Detect flagger and suggested site(s)
        const modQueueFlags = anywhere.parents('.flagged-post-row').find('.flag-row:not(.js-cleared)');
        const flags = $('.active-flag').filter((i,el) => /\b(migrated?|moved?|site)\b/i.test(el.innerText) || $(el).find('a').length != 0);
        const suggestedSite = modQueueFlags.add(flags).map(function(i,el) {
            const flagtext = el.innerText.toLowerCase();
            const site = networkSites.filter(v => flagtext.contains(v.name.toLowerCase().replace('&amp;', '&')) || flagtext.contains(v.site_url.replace('https://', '').replace(/\.[a-z]+/gi, '')) );
            return site.length > 0 ? {
                elem: $(el),
                name: site[0].name,
                slug: site[0].api_site_parameter,
                site_url: site[0].site_url
            } : null;
        }).get(0);

        // Preload flagger's network accounts
        if(flags.length > 0 && suggestedSite) {
            const flaggerLink = suggestedSite.elem.siblings('a').first();
            flaggerUid = flaggerLink.getUid();
            flaggerName = flaggerLink.text();
            if(flaggerUid) {
                getFlaggerAccounts(flaggerUid);
            }
        }

        const siteDesc = $(`<div id="site-desc"><div>none selected</div></div>`);
        const siteDropdown = $(`<select id="network-site-selector" class="js-chosen-select" data-placeholder="-- select site --"><option value="">-- select site --</option></select>`).insertAfter(siteTargetField).after(siteDesc)
            .on('change', function(evt) {
                if(evt.target.selectedIndex < 0) return;

                const sOpt = evt.target.options[evt.target.selectedIndex];
                const sValue = $(this).val();
                const sUrl = (sOpt.dataset.url || "").replace('https://', '');
                const sSlug = sOpt.dataset.slug;
                const valid = sValue !== '';

                if(valid) {
                    anywhere.click();
                }
                else {
                    migflaggerStats.hide();
                }
                anywhere.val(sUrl).attr('checked', valid).closest('li').toggleClass('action-selected', valid);
                closeSubmitBtn.toggleClass('disabled-button', !valid);
                const currsite = siteDesc.children().removeClass('active').eq(this.selectedIndex).addClass('active');
                siteTargetField.val(sValue);

                // Lazyload images
                currsite.find('img').each(function(i, el) {
                    el.src = el.dataset.src;
                });

                if(flaggerUid) {
                    getFlaggerAccounts(flaggerUid).then(function(a) {
                        let sAccount = a.find(function(v) {
                            return v.site_url === sUrl || v.site_url.indexOf(sSlug) >= 0 || v.site_url.indexOf(sValue.replace(/\s/g, '').toLowerCase()) >= 0;
                        });
                        if(typeof sAccount === 'undefined') {
                            migflaggerStats.html(`Flagger ${flaggerName} not found on selected site.`).show();
                        }
                        else {
                            migflaggerStats.html(`Flagger <a href="${sAccount.site_url}/users/${sAccount.user_id}" target="_blank">${flaggerName}</a> has <span>${sAccount.reputation.toLocaleString()}</span> rep on selected site.</span>`).show();
                        }
                    });
                }
            });

        let siteDescHtml = '';
        let siteDropdownHtml = '';
        networkSites.forEach(site => {

            // Exclude current site
            if(site.site_url === 'https://' + location.hostname) return;

            siteDescHtml += `<div>
<div class="site-logos">
  <img class="site-icon" data-src="${site.icon_url}" />
  <div class="site-header" style="background: url('${cdn}${site.api_site_parameter}/img/bg-body.png'), url('${cdn}${site.api_site_parameter}/img/body-bg.svg'), url('${cdn}${site.api_site_parameter}/img/bg-site.png'), url('${cdn}${site.api_site_parameter}/img/bg-site.jpg');">
    <img class="site-logo" data-src="${site.logo_url}" title="${site.name}" alt="${site.name}" />
  </div>
</div>
Q&A for ${site.audience}<br><a href="${site.site_url}/help/on-topic" target="_blank">on-topic?</a> | <a href="${site.site_url}/users?tab=moderators" target="_blank">moderators</a></div>`;

            siteDropdownHtml += `<option value="${site.name}" data-slug="${site.api_site_parameter}" data-url="${site.site_url}">${site.name}</option>`;
        });

        siteDesc.append(siteDescHtml);
        siteDropdown.append(siteDropdownHtml);

        // Preselect suggested site
        console.log(suggestedSite);
        if(suggestedSite) {
            siteDropdown.val(suggestedSite.name.replace('&amp;', '&')).triggerHandler('change');
        }

        $.getCachedScript('https://cdnjs.cloudflare.com/ajax/libs/chosen/1.8.7/chosen.jquery.min.js', function() {
            $('.js-chosen-select').chosen({
                allow_single_deselect: true,
                no_results_text: "Oops, nothing found!",
            });
        });
    }


    function listenToPageUpdates() {

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {
            if(/.*\/flags\/questions\/\d+\/close\/popup\?.*/.test(settings.url)) {
                updateMigrationPane();
            }
        });
    }


    function doPageLoad() {

        // Do not run if not on question page or mod queue
        const cls = document.body.classList;
        if(!cls.contains('question-page') && !cls.contains('mod-page')) return;

        // Cache list in localstorage
        getMainNetworkSites().then(v => {
            networkSites = v;
            networkSitenames = v.map(site => site.name);
        });
    }


    function appendStyles() {

        const styles = `
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/chosen/1.8.7/chosen.min.css" />
<style>
#network-site-selector {
    padding: 8px 10px 7px;
    cursor: pointer;
}
#site-desc {
    margin-top: 10px;
}
#site-desc > div {
    display: none;
    padding-bottom: 10px;
}
#site-desc > div.active {
    display: block;
}
#site-desc .site-logos {
    display: flex;
    align-items: center;
    max-height: 80px;
    width: calc(100% - 20px);
    margin-bottom: 5px;
    overflow: hidden;
    background-color: white;
}
#site-desc .site-icon {
    max-width: 58px;
    max-height: 58px;
    background-color: white;
}
#site-desc .site-header {
    display: flex;
    width: 100%;
    align-items: center;
    height: 80px;
    padding: 11px;
    background-color: #E0EAF1 !important;
    background-position: bottom -10px center !important;
}
#site-desc .site-logo {
    max-width: 100%;
    max-height: 80px;
}
#popup-close-question .action-list > li {
    position: relative;
}
#migflagger-stats {
    position: absolute;
    top: 0;
    right: 0;
    padding: 5px 10px;
    background: #ccc;
}
#migflagger-stats span {
    font-weight: bold;
}
#popup-close-question #close-question-form {
    overflow: initial;
}
.chosen-container {
    min-width: 300px;
}
.chosen-container-single .chosen-single {
    height: auto;
    padding: 3px 10px;
}
.chosen-container-single .chosen-single div b {
    background-position: top 5px left 0px;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageLoad();
    listenToPageUpdates();

})();
