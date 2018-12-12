// ==UserScript==
// @name         Lightbox Images
// @description  Opens image links in a lightbox instead of new window/tab in main & chat. Lightbox images that are displayed smaller than it's original size.
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.4
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


    const lbSelector = '.ob-image a, a[href$=".jpg"], a[href$=".png"], a[href$=".gif"]';


    jQuery.getCachedScript = function(url, callback) {
        return $.ajax({
            url: url,
            dataType: 'script',
            cache: true
        }).done(callback);
    };


    function doPageload() {

        // Imgur album link to direct image
        $('a[href^="https://imgur.com/"], a[href^="https://i.stack.imgur.com/"]').attr('href', (i,v) => v.match(/\.(jpg|png|gif)/) != null ? v : v + '.jpg');

        // If unlinked images' width is greater than displayed width of at least 100px, also lightbox the image
        $('img').filter(function() {
            return typeof this.parentNode.href === 'undefined' && !this.parentNode.className.includes('gravatar');
        }).wrap(function() {
            return `<a class="unlinked-image" data-src="${this.src}"></a>`;
        });
        $(window).on('load resize', function() {
            $('.unlinked-image').each(function() {
                const img = this.children[0];
                if(img.width >= 100 && img.width < img.naturalWidth) {
                    this.href = this.dataset.src;
                    this.classList.add('image-lightbox');
                }
                else {
                    this.removeAttribute('href');
                    this.classList.remove('image-lightbox');
                }
            });
        });

        // Load fancybox 3 - https://fancyapps.com/fancybox/3/docs/#options
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
.unlinked-image {
    cursor: default;
}
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
