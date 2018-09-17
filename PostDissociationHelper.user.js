// ==UserScript==
// @name         Post Dissociation Helper
// @description
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0.1
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

    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;


    const newlines = '\n\n';
    const getQueryString = key => new URLSearchParams(window.location.search).get(key);


    function updateModTemplates() {

        const template = $('.popup input[name=mod-template]').filter((i,el) => $(el).next().text().includes('post disassociation'));
        const pids = getQueryString('pid').split('|');
        let addstr = '';

        // Build list of posts
        pids.forEach(function(v) {
            addstr += `https://${location.hostname}/a/${v}` + newlines;
        });

        // Insert to template
        template.val(
            template.val()
            .replace(/:\n/, ':<br>') // remove newline after :
            .replace(/{todo}/, addstr) // replace todo with additional information
        ).click();

        $('.popup-submit').click();
    }


    function appendDissociateLinkToPostActions() {

        // Append link if it doesn't exist yet
        $('.post-menu').each(function() {

            if($(this).children('.dissociate-post-link').length === 0) {
                const post = $(this).parents('.question, .answer');
                const userlink = post.find('.user-info').last().find('a').attr('href');

                // User not found, prob already deleted
                if(userlink == null) return;

                const uid = Number(userlink.match(/\/(\d+)\//)[0].replace(/\//g, ''));
                const pid = post.attr('data-questionid') || post.attr('data-answerid');
                $(this).append(`<span class="lsep">|</span><a href="https://${location.hostname}/admin/cm-message/create/${uid}?action=dissociate&pid=${pid}" title="contact CM to dissociate post" class="dissociate-post-link" target="_blank">dissociate</a>`);
            }
        });
    }


    function doPageload() {

        // If on contact CM page and action = dissocciate, click template link
        if(location.pathname.includes('/admin/cm-message/create/') && getQueryString('action') == 'dissociate') {
            $('#show-templates').click();
            return;
        }

        appendDissociateLinkToPostActions();
    }


    function listenToPageUpdates() {

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {

            appendDissociateLinkToPostActions();

            // If CM templates loaded on contact CM page, and action = dissocciate, update templates
            if(settings.url.includes('/admin/contact-cm/template-popup/') && location.pathname.includes('/admin/cm-message/create/') && getQueryString('action') == 'dissociate') {
                setTimeout(updateModTemplates, 200);
            }
        });

    }


    // On page load
    doPageload();
    listenToPageUpdates();

})();
