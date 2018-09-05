// ==UserScript==
// @name         Migration Helper
// @description  Dropdown list of migration targets displaying site icon/logo/header images and links to the selected site's on-topic page and mod list
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0
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


    const store = window.localStorage;
    const cdn = 'https://cdn.sstatic.net/Sites/';
    let networksites;


    function getNetworkSites() {
        const fullkey = 'NetworkSites';
        let v = JSON.parse(store.getItem(fullkey));

        return new Promise(function(resolve, reject) {
            if(v != null) { resolve(v); return; }

            $.get(`https://api.stackexchange.com/2.2/sites?pagesize=999&filter=!)QmDp1jjtiQg0J)1qAulk5k1`)
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


    function updateMigrationPane() {
        if($('#close-question-form').length == 0 || typeof networksites === 'undefined') return;

        const anywhere = $('#migrate-anywhere');
        const closeSubmitBtn = $('#close-question-form .popup-submit');
        const siteTargetField = $('#destinationSiteIdAC').attr('type', 'hidden');

        const siteDesc = $(`<div id="site-desc"><div>none selected</div></div>`);
        const siteDropdown = $(`<select id="network-site-selector"><option value="">-- select site --</option></select>`).insertAfter(siteTargetField).after(siteDesc)
            .on('change', function() {
                const valid = $(this).val() !== '';
                if(valid) anywhere.click();
                anywhere.attr('checked', valid).closest('li').toggleClass('action-selected', valid);
                closeSubmitBtn.toggleClass('disabled-button', !valid);
                siteDesc.children().removeClass('active').eq(this.selectedIndex).addClass('active');
                siteTargetField.val($(this).val());
            });

        let siteDescHtml = '';
        let siteDropdownHtml = '';
        networksites.forEach(site => {
            siteDescHtml += `<div>
<div class="site-logos">
  <img class="site-icon" src="${site.icon_url}" />
  <div class="site-header" style="background: url('${cdn}${site.api_site_parameter}/img/bg-body.png'), url('${cdn}${site.api_site_parameter}/img/body-bg.svg'), url('${cdn}${site.api_site_parameter}/img/bg-site.png'), url('${cdn}${site.api_site_parameter}/img/bg-site.jpg');">
    <img class="site-logo" src="${site.logo_url}" title="${site.name}" alt="${site.name}" />
  </div>
</div>
Q&A for ${site.audience}<br><a href="${site.site_url}/help/on-topic" target="_blank">on-topic?</a> | <a href="${site.site_url}/users?tab=moderators" target="_blank">moderators</a></div>`;
            siteDropdownHtml += `<option value="${site.name}">${site.name}</option>`;
        });

        siteDesc.append(siteDescHtml);
        siteDropdown.append(siteDropdownHtml);
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
        // Cache list in localstorage
        getMainNetworkSites().then(v => networksites = v);
    }


    function appendStyles() {

        const styles = `
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
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageLoad();
    listenToPageUpdates();

})();
