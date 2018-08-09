// ==UserScript==
// @name         Lightbox Images
// @description  Opens image links in a lightbox instead of new window/tab in main & chat
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.1
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


    $.getCachedScript = function(url, callback) {
        return $.ajax({
            url: url,
            dataType: "script",
            cache: true
        }).done(callback);
    };


    function doPageload() {

        $(`<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.3.5/jquery.fancybox.min.css">`).appendTo(document.body);

        $.getCachedScript('https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.3.5/jquery.fancybox.min.js', function() {
            $().fancybox({
                selector : ".ob-image a, a[href$=jpg], a[href$=png], a[href$=gif]"
            });
        });
    }


    // On page load
    doPageload();

})();
