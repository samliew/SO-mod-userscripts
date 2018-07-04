// ==UserScript==
// @name         Searchbar & Nav Improvements
// @description  Site search selector on meta sites, as well as advanced search helpers
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
// ==/UserScript==


(function() {
    'use strict';


    const isChildMeta = typeof StackExchange.options.site.isChildMeta !== 'undefined';
    const mainName = StackExchange.options.site.name.replace('Meta ', '');
    const mainUrl = StackExchange.options.site.parentUrl || 'https://' + location.hostname;
    const metaUrl = StackExchange.options.site.childUrl || 'https://' + location.hostname;
    const metaSearchSelector = $(`<div class="grid--cell f-select w20 wmn1"><select id="search-channel-selector" class="search-channel-switcher w100 pr24">
  <option data-url="${metaUrl}/search" selected="selected">Meta</option>
  <option data-url="${mainUrl}/search" data-mixed="0">${mainName}</option>
</select></div>`);
    const lsidebar = $('#left-sidebar');
    const searchform = $('#search');


    // If on Stack Overflow, make logo go to /questions
    function soLogoToQuestions() {

        if(location.hostname === 'stackoverflow.com') {
            $('.-main .-logo').attr('href', '/questions');
        }
    }


    function doPageLoad() {

        soLogoToQuestions();

        // If on meta site, use new search bar
        if(isChildMeta) {

            searchform
                .find('.ps-relative').first().removeClass('ps-relative').addClass('grid')
                .prepend(metaSearchSelector);

            searchform.addClass('search-channel-context')
                .find('.js-search-field, .js-search-submit').wrapAll('<div class="grid--cell ps-relative fl1"></div>');

            searchform
                .append('<input name="mixed" value="0" type="hidden" id="search-channel-mixed">')
                .find('.js-search-field').addClass('search-channel-switcher-field');
        }
        // If on main and using new search bar
        else {
            $('#search-channel-selector option[selected]').after(`<option data-url="${metaUrl}/search">Meta ${mainName}</option>`);
        }

        // New left navigation, link to parent/meta site
        if(isChildMeta) {
            const backUrl = mainUrl + (mainUrl === 'https://stackoverflow.com' ? '/questions' : '');
            lsidebar.find('.pl8').removeClass('pl8');
            $('ol.nav-links', lsidebar).first().prepend(`<li><a id="nav-main" href="${backUrl}" class="nav-links--link -link__with-icon pl8">
<svg aria-hidden="true" class="svg-icon iconGlobe" width="16" height="16" viewBox="0 0 1000 1000">
  <path d="M570,318.4V173.2c0-26.8-14.2-51.4-37-64.1c-22.7-12.6-50.4-11.2-71.9,3.6l-420,290.5C21.7,416.7,10,439.4,10,463.7c0,24.3,11.7,47,31.2,60.4l420,290.5c21.5,14.9,49.1,16.3,71.9,3.6c22.7-12.7,37-37.2,37-64.1V608.9c182.8,0,337.9,121.4,395.6,290.5C981.1,854,990,805.2,990,754.2C990,513.5,802,318.4,570,318.4z"></path></svg>
<span class="-link--channel-name">${mainName}</span></a></li>`);
        }
        // If on main site,
        else {
            $('ol.nav-links ol.nav-links', lsidebar).first().append(`<li><a id="nav-meta" href="${metaUrl}" class="nav-links--link">Meta</a></li>`);
        }

        // If on a question page
        if(location.pathname.indexOf('/questions/') === 0) {

        }
    }


    function appendStyles() {

        const styles = `
<style>
/* Left sidebar */
.nav-links .nav-links--link.-link__with-icon {
    display: flex;
    padding: 8px 6px 8px 0;
}
/* Search */
.grid {
    display: flex;
}
.f-select {
    position: relative;
}
.wmn1 {
    min-width: 8.1025641rem !important;
}
.w20 {
    width: 20% !important;
}
.f-select>select {
    margin: 0;
    padding-top: 6px;
    padding-bottom: 6px;
}
.f-select > select {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    flex: 1 auto;
    padding: 8px 16px;
    padding-right: 32px;
    font-size: 13px;
    font-family: Arial,"Helvetica Neue",Helvetica,sans-serif;
    line-height: 1.46153846;
    color: #3b4045;
    background-color: #FFF;
    border: 1px solid #c8ccd0;
    border-radius: 2px;
    transition: color 600ms cubic-bezier(.165, .84, .44, 1),border-color 600ms cubic-bezier(.165, .84, .44, 1),box-shadow 600ms cubic-bezier(.165, .84, .44, 1),background-color 600ms cubic-bezier(.165, .84, .44, 1);
}
.search-channel-switcher {
    height: 36px;
    border-radius: 3px !important;
    border-top-right-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
    border-right: none !important;
    background-color: #eff0f1 !important;
}
.search-channel-switcher-field {
    border-top-left-radius: 0 !important;
    border-bottom-left-radius: 0 !important;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageLoad();

})();
