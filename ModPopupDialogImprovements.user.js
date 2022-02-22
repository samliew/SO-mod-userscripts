// ==UserScript==
// @name         Mod Popup Dialog Improvements
// @description  Some simple improvements for posts' Mod popup dialog
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      3.0
//
// @match        https://stackoverflow.com/*
// @match        https://serverfault.com/*
// @match        https://superuser.com/*
// @match        https://askubuntu.com/*
// @match        https://mathoverflow.net/*
// @match        https://stackexchange.com/*
//
// @match        https://meta.stackoverflow.com/*
// @match        https://meta.serverfault.com/*
// @match        https://meta.superuser.com/*
// @match        https://meta.askubuntu.com/*
// @match        https://meta.mathoverflow.net/*
// @match        https://meta.stackexchange.com/*
//
// @match        *.stackexchange.com/*
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';

// Moderator check
if (typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator) return;


$(document).ajaxComplete(function (evt, jqXHR, settings) {

    // When post mod menu link is clicked
    if (settings.url.startsWith('/admin/posts/') && settings.url.includes('/moderator-menu')) {

        const popupForm = $('.js-modal-dialog[data-action="se-mod-menu#submit"]');
        if (popupForm.length === 0) return;

        const listItems = $('#modal-description', popupForm);

        // Move comments to chat is selected by default
        listItems.find('input#se-mod-menu-action-move-comments-to-chat').prop('checked', true).triggerHandler('click');

        // On postlowquality queue, default to convert-to-comment instead
        if (location.href.indexOf('postlowquality') >= 0) {
            listItems.find('input#se-mod-menu-action-convert-to-comment').prop('checked', true).triggerHandler('click');
        }

        // Delete moved comments is checked by default
        listItems.find('#mod-menu-deleteMovedComments').prop('checked', true);

        // Prevent Mod actions in Flag Queue redirecting to post - instead opens in a new tab
        if (location.pathname.startsWith('/admin/dashboard')) {
            popupForm.attr('target', '_blank');
        }

        // Submitting popup form hides the post as well
        popupForm.on('submit', null, function () {
            setTimeout(() => $(this).parents('tr.flagged-post-row').hide(), 300);
        });
    }
});