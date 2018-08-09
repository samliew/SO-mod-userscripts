// ==UserScript==
// @name         Lightbox Images
// @description  Opens image links in a lightbox instead of new window/tab in main & chat
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0
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


    jQuery.cachedScript = function(url, options) {

        // Allow user to set any option except for dataType, cache, and url
        options = $.extend(options || {}, {
            dataType: "script",
            cache: true,
            url: url
        });

        // Use $.ajax() since it is more flexible than $.getScript
        // Return the jqXHR object so we can chain callbacks
        return jQuery.ajax(options);
    };


    function doPageload() {

        $(`<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.3.5/jquery.fancybox.min.css">`).appendTo(document.body);
        $.cachedScript('https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.3.5/jquery.fancybox.min.js', function() {
            $().fancybox({
                selector : '.ob-image a, a[href$=jpg], a[href$=png], a[href$=gif]'
            });
        });
    }


    // On page load
    doPageload();

})();
