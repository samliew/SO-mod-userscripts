// ==UserScript==
// @name         Lightbox Images
// @description  Opens image links in a lightbox instead of new window/tab in main & chat
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.2
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://stackapps.com/*
// @include      https://*.stackexchange.com/*
// ==/UserScript==

(function() {
    'use strict';


    const lbSelector = '.ob-image a, a[href$=jpg], a[href$=png], a[href$=gif]';


    $.getCachedScript = function(url, callback) {
        return $.ajax({
            url: url,
            dataType: 'script',
            cache: true
        }).done(callback);
    };


    function doPageload() {

        /* Load fancybox 3 - https://fancyapps.com/fancybox/3/docs/#options */
        $(`<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.3.5/jquery.fancybox.min.css">`).appendTo(document.body);
        $.getCachedScript('https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.3.5/jquery.fancybox.min.js', function() {
            $().fancybox({
                selector : lbSelector
            });
        });

        // For text links to images, also visually display an indicator
        $(lbSelector).addClass('image-lightbox');
    }


    function appendStyles() {

        const styles = `
<style>
.image-lightbox {
    cursor: zoom-in;
}
.fancybox-container button {
    box-shadow: none;
}
.fancybox-container button:hover {
    background: rgba(30,30,30,.6);
}
.fancybox-container button[disabled] {
    visibility: hidden;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();

})();
