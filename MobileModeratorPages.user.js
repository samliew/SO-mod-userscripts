// ==UserScript==
// @name         Mobile Moderator Pages
// @description  Converts mod pages to mobile-friendly UI
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.2
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


    const isMobile = () => devicePixelRatio > 2 || outerWidth <= 500;
    const isModPage = () => document.body.classList.contains('mod-page');


    function doPageload() {

        if(!isMobile() || !isModPage()) return;

        appendStyles();

        // Transform page
        $('html').addClass('html__responsive');
        $('head').append(`<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />`);
        $('#left-sidebar > div').appendTo('.leftnav-dialog');
        $('table.mod-summary').parent('div').attr('style', 'overflow-x:scroll!important;');
    }


    function appendStyles() {

        const styles = `
<style>
/* General */
html, body {
    min-width: 0;
}
body > * {
    max-width: 100% !important;
}
.container *, [style*='width']:not(input) {
    width: auto !important;
    word-break: break-word;
}
.float-right, .fr {
    float: none !important;
}
.float-left, .fl {
    float: none !important;
}
#left-sidebar,
#footer,
.help-button-item,
#tabs .bounty-indicator-tab,
input.post-id[readonly] {
    display: none !important;
}
.leftnav-dialog .left-sidebar--sticky-container {
    padding: 10px 10px 0;
}
#content {
    width: 100%;
    max-width: 100vw;
    margin-left: 0;
    padding: 10px;
    overflow-x: hidden;
}
#sidebar {
    float: none;
    margin: 50px 0;
}
.subheader #tabs {
    float: left;
    width: 100%;
    clear: both;
    margin: 20px 0;
}
#tabs, .tabs {
    position: relative;
}
#tabs a.youarehere, .tabs a.youarehere {
    z-index: 1;
}
#tabs:after, .tabs:after {
    border-bottom: 1px solid #e4e6e8;
    position: absolute;
    bottom: 1px;
    width: 100%;
    z-index: 0;
}
.subheader {
    margin: 10px 0 10px;
}

/* Specific */
table.mod-summary td {
    min-width: 60px !important;
}
#a-apply-filters {
    font-size: 11px;
}
a.expander-arrow-small-hide {
    float: left;
    width: 13px !important;
    margin-bottom: 5px;
    transform: scale3d(2,2,1);
}
.user-info .user-gravatar32,
.user-info + br {
    display: none;
}
.user-info .user-gravatar32+.user-details {
    margin: 0;
}
table.flagged-posts .mod-audit {
    min-width: 150px !important;
    padding-left: 10px;
}
.mod-audit-user-info:not(.owner) {
    background: #f3f3f3;
}
.badge1, .badge2, .badge3 {
    width: 6px !important;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    doPageload();

})();
