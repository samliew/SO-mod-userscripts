// ==UserScript==
// @name         Lightbox Images
// @description  Opens image links in a lightbox instead of new window/tab in main & chat. Lightbox images that are displayed smaller than it's original size.
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      3.3
//
// @match        https://*.stackoverflow.com/*
// @match        https://*.serverfault.com/*
// @match        https://*.superuser.com/*
// @match        https://*.askubuntu.com/*
// @match        https://*.mathoverflow.net/*
// @match        https://*.stackapps.com/*
// @match        https://*.stackexchange.com/*
// @match        https://stackoverflowteams.com/*
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/se-ajax-common.js
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

/* globals StackExchange */
/// <reference types="./globals" />

'use strict';

const lbSelector = '.image-lightbox, .ob-image a, a[href$=".jpg"], a[href$=".png"], a[href$=".gif"], a[href*="preview.redd.it"]';
const ignoredParentClasses = [
  'avatar',
  'hat',
  'gravatar-wrapper-24',
  'gravatar-wrapper-32',
  'gravatar-wrapper-48',
  'gravatar-wrapper-64',
  'gravatar-wrapper-128',
  'fancybox-content',
  'js-post-menu',
];


// Function that finds and link images that does not have a parent link element
// Then lightbox the image if the actual size is larger than the displayed size
function linkUnlinkedImages() {

  // Process unprocessed images
  // If image does not have a parent link, wrap a link around it
  $('img').not('.js-checked-link').addClass('js-checked-link').filter(function () {
    return this.parentElement.nodeName !== 'A' && this.closest('.' + ignoredParentClasses.join(',.')) === null;
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


// Append styles
addStylesheet(`
.js-was-unlinked {
  cursor: default;
}
.image-lightbox {
  cursor: zoom-in;
}
.fancybox-image {
  scale: 1;
  transition: 0.4s all ease;
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
`); // end stylesheet


// On script run
(function init() {

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
      .not('.js-lightbox-init').addClass('js-lightbox-init').fancybox({

        afterShow: function (instance) {
          //console.log('afterShow', instance);

          // When lightbox is opened, add event listener to allow mouse scroll to zoom in/out
          const stage = instance.$refs.stage.get()[0];
          const content = stage.querySelector('.fancybox-content');
          const img = content.querySelector('img');

          instance.$refs.stage.on('wheel', function (evt) {
            evt.stopPropagation();
            evt.preventDefault();

            const direction = evt.originalEvent?.deltaY > 0 ? -1 : 1;
            const currentScale = Number(img.style.scale || 1);
            const scaleAmount = Math.max(1, Math.min(3, currentScale + (direction * 0.2)));
            img.style.scale = scaleAmount;

            //console.log('zoom', evt, direction, currentScale, scaleAmount);
          });
        },

        beforeClose: function (instance) {
          //console.log('beforeClose', instance);

          // When lightbox is closed, reset image zoom
          const stage = instance.$refs.stage.get()[0];
          const content = stage.querySelector('.fancybox-content');
          const img = content.querySelector('img');
          img.style.scale = 1;
        },
      });

  }, 2000);
})();