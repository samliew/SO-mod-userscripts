// ==UserScript==
// @name         Lightbox Images
// @description  Opens image links in a lightbox instead of new window/tab in main & chat. Lightbox images that are displayed smaller than it's original size.
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.2
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://stackapps.com/*
// @include      https://*.stackexchange.com/*
//
// @exclude      https://data.stackexchange.com/*
// @exclude      https://contests.stackoverflow.com/*
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';

if (unsafeWindow !== undefined && window !== unsafeWindow) {
    window.jQuery = unsafeWindow.jQuery;
    window.$ = unsafeWindow.jQuery;
}

const lbSelector = '.image-lightbox, .ob-image a, a[href$=".jpg"], a[href$=".png"], a[href$=".gif"], a[href*="preview.redd.it"]';
const ignoredParentClasses = [
    'avatar',
    'hat',
    '-logo',
    'gravatar-wrapper-24',
    'gravatar-wrapper-32',
    'gravatar-wrapper-48',
    'gravatar-wrapper-64',
    'gravatar-wrapper-128',
    'fancybox-content',
];


/**
 * @summary jQuery plugin to get a script and cache it
 * @param {string} url 
 * @param {function} callback 
 * @returns jQuery
 */
jQuery.getCachedScript = function (url, callback) {
    return $.ajax({
        url: url,
        dataType: 'script',
        cache: true
    }).done(callback);
};


// Function that finds and link images that does not have a parent link element
// Then lightbox the image if the actual size is larger than the displayed size
function linkUnlinkedImages() {

    // Process unprocessed images
    // If image does not have a parent link, wrap a link around it
    $('img').not('.js-checked-link').addClass('js-checked-link').filter(function () {
        return typeof this.parentNode.href === 'undefined' && !this.parentNode.classList.value.split(' ').some(v => ignoredParentClasses.includes(v));
    }).wrap(function () {
        return `<a class="js-was-unlinked" data-src="${this.src}"></a>`;
    });

    // If unlinked images' width is greater than displayed width and at least 100px, also lightbox the image
    $('.js-was-unlinked').each(function () {
        const img = this.children[0];
        if (typeof img === 'undefined') return;

        if (img.width >= 100 && img.width < img.naturalWidth) {
            this.href = this.dataset.src;
            this.classList.add('image-lightbox');
        }
        else {
            this.removeAttribute('href');
            this.classList.remove('image-lightbox');
        }
    });
}

function doPageLoad() {

    // Imgur album link to direct image
    $('a[href^="https://imgur.com/"], a[href^="https://i.stack.imgur.com/"]').attr('href', (i, v) => v.match(/\.(jpg|png|gif)/) != null ? v : v + '.jpg');

    // Large user profile image - remove params
    $('#avatar-card img').attr('src', (i, v) => v.replace(/\?.+$/, ''));

    // Once on page load, and recalculate if each image needs to be lightboxed when window is resized
    $(window).on('load resize', function () {
        linkUnlinkedImages();
    });

    // Load fancybox 3 - https://fancyapps.com/fancybox/3/docs/#options
    $(`<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.3.5/jquery.fancybox.min.css">`).appendTo(document.body);
    $.getCachedScript('https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.3.5/jquery.fancybox.min.js', function () {
        $().fancybox({
            selector: lbSelector
        });
    });

    // Occasionally
    setInterval(() => {
        linkUnlinkedImages();

        // Visually display a zoom-in cursor so we can identify which text links are lightboxes
        $(lbSelector).addClass('image-lightbox')
            // Init lightboxes on dynamically loaded elements which have not been init previously
            .not('.js-lightbox-init').addClass('js-lightbox-init').fancybox();

    }, 2000);
}


// On page load
doPageLoad();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
.js-was-unlinked {
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
`;
document.body.appendChild(styles);
