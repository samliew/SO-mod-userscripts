// ==UserScript==
// @name         Additional Post Mod Actions
// @description  Adds a menu with mod-only quick actions in post sidebar
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.1
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
    const getQueryParam = key => new URLSearchParams(window.location.search).get(key);


    function updateModTemplates() {

        const template = $('.popup input[name=mod-template]').filter((i,el) => $(el).next().text().includes('post disassociation'));
        const pids = getQueryParam('pid').split('|');
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
                const userlink = post.find('.user-info').last().find('a').not('.deleted-user').attr('href') || '';
                const matches = userlink.match(/\/(\d+)\//);

                // User not found, prob already deleted
                if(userlink == null || matches == null) return;

                const uid = Number(matches[0].replace(/\//g, ''));
                const pid = post.attr('data-questionid') || post.attr('data-answerid');
                $(this).append(`<span class="lsep">|</span><a href="https://${location.hostname}/admin/cm-message/create/${uid}?action=dissociate&pid=${pid}" title="contact CM to dissociate post" class="dissociate-post-link" target="_blank">dissociate</a>`);
            }
        });
    }


    function initPostDissociationHelper() {

        // Only on main sites
        if(typeof StackExchange.options.site.parentUrl !== 'undefined') return;

        // If on contact CM page and action = dissocciate, click template link
        if(location.pathname.includes('/admin/cm-message/create/') && getQueryParam('action') == 'dissociate') {
            $('#show-templates').click();
            return;
        }

        // If on mod flag queues, remove close question and convert to comment buttons when flag message contains "di(sa)?ssociate", and add "dissociate" button
        if(location.pathname.includes('/admin/dashboard')) {
            const dissocFlags = $('.revision-comment.active-flag').filter((i,v) => v.innerText.match(/di(sa)?ssociate/));
            const dissocPosts = dissocFlags.closest('.flagged-post-row');
            dissocPosts.each(function() {
                const post = $(this);
                const userlink = post.find('.mod-audit-user-info a').attr('href');

                // User not found, prob already deleted
                if(userlink == null) return;

                const uid = Number(userlink.match(/\/(\d+)\//)[0].replace(/\//g, ''));
                const pid = post.attr('data-post-id') || post.attr('data-questionid') || post.attr('data-answerid');
                $('.delete-options', this).prepend(`<a href="https://${location.hostname}/admin/cm-message/create/${uid}?action=dissociate&pid=${pid}" class="btn" target="_blank">dissociate</a>`);

                $('.close-question-button, .convert-to-comment', this).hide();
            });
            return;
        }

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {

            appendDissociateLinkToPostActions();

            // If CM templates loaded on contact CM page, and action = dissocciate, update templates
            if(settings.url.includes('/admin/contact-cm/template-popup/') && location.pathname.includes('/admin/cm-message/create/') && getQueryParam('action') == 'dissociate') {
                setTimeout(updateModTemplates, 200);
            }
        });

        // Once on page load
        appendDissociateLinkToPostActions();
    }


    function appendPostModMenuLink() {

        // Add post issues container in mod flag queues, as expanded posts do not have this functionality
        $('.flagged-post-row .votecell .vote').filter(function() {
            return $(this).children('.js-post-issues').length == 0;
        }).each(function() {
            const post = $(this).closest('.answer, .question');
            const pid = post.attr('data-questionid') || post.attr('data-answerid');
            $(this).append(`
<div class="js-post-issues grid fd-column ai-stretch gs4 mt16">
  <a class="grid--item s-btn s-btn__muted" href="/posts/${pid}/timeline" data-shortcut="T" title="Timeline" target="_blank"><svg aria-hidden="true" class="svg-icon mln1 mr0 iconHistory" width="19" height="18" viewBox="0 0 19 18"><path d="M3 9a8 8 0 1 1 3.73 6.77L8.2 14.3A6 6 0 1 0 5 9l3.01-.01-4 4-4-4h3zm7-4h1.01L11 9.36l3.22 2.1-.6.93L10 10V5z"></path></svg></a>
</div>
`);
        });

        // Append link to post sidebar if it doesn't exist yet
        $('.js-post-issues').not('.js-post-mod-menu').addClass('js-post-mod-menu')
            .append(`
<div class="grid--item s-btn s-btn__muted post-mod-menu-link" data-shortcut="O" title="Other mod actions">
  <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 512" class="svg-icon mln1 mr0"><path fill="currentColor" d="M64 208c26.5 0 48 21.5 48 48s-21.5 48-48 48-48-21.5-48-48 21.5-48 48-48zM16 104c0 26.5 21.5 48 48 48s48-21.5 48-48-21.5-48-48-48-48 21.5-48 48zm0 304c0 26.5 21.5 48 48 48s48-21.5 48-48-21.5-48-48-48-48 21.5-48 48z" class=""></path></svg>
  <div class="post-mod-menu" title="">
    <a data-action="move-comments">move comments to chat</a>
    <a data-action="purge-comments">purge comments</a>
    <a data-action="toggle-protect">toggle protect</a>
    <a data-action="mod-delete">mod-delete post</a>
    <a data-action="lock-dispute">lock - dispute (1d)</a>
    <a data-action="lock-offtopic">lock - offtopic (1d)</a>
    <a data-action="unlock">unlock</a>
    <a data-action="dissociate">request dissociation</a>
    <div class="separator"></div>
    <a data-action="destroy-user">destroy spammer</a>
  </div>
</a>`);
    }


    function initPostModMenuLinks() {

        // Handle mod actions menu link click
        $('#content').on('click', '.post-mod-menu-link', function() {
            const post = $(this).closest('.question, .answer');
            const pid = post.attr('data-questionid') || post.attr('data-answerid');

            console.log(post, pid);

            return false;
        });

        // Once on page load
        appendPostModMenuLink();
    }


    function doPageload() {

        initPostModMenuLinks();
        initPostDissociationHelper();

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {

            appendPostModMenuLink();
            appendDissociateLinkToPostActions();

            // If CM templates loaded on contact CM page, and action = dissocciate, update templates
            if(settings.url.includes('/admin/contact-cm/template-popup/') && location.pathname.includes('/admin/cm-message/create/') && getQueryParam('action') == 'dissociate') {
                setTimeout(updateModTemplates, 200);
            }
        });
    }


    function appendStyles() {

        const styles = `
<style>
/* Disable transitions so z-index will work instantly */
.downvoted-answer .comment-body,
.downvoted-answer .post-signature,
.downvoted-answer .post-text,
.downvoted-answer .vote > * {
    transition: unset;
}

.post-mod-menu-link {
    position: relative;
    display: inline-block;
    cursor: pointer;
}
.post-mod-menu-link svg {
    max-width: 19px;
    max-height: 18px;
}
.post-mod-menu-link:hover .post-mod-menu,
.post-mod-menu-link .post-mod-menu:hover {
    display: block;
}
.post-mod-menu-link:hover svg {
    visibility: hidden;
}
.post-mod-menu-link .post-mod-menu {
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    padding: 6px 0;
    z-index: 3;
    cursor: auto;

    background: white;
    border-radius: 2px;
    box-shadow: 0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12), 0 5px 5px -3px rgba(0,0,0,0.2);

    text-align: left;
    font-size: 0.923rem;
    font-family: Roboto,RobotoDraft,Helvetica,Arial,sans-serif;
    letter-spacing: .2px;
    line-height: 20px;

    user-select: none;
    white-space: nowrap;
}
.post-mod-menu a {
    display: block;
    min-width: 120px;
    padding: 5px 0;
    padding-left: 26px;
    padding-right: 48px;
    cursor: pointer;
    color: #202124;
}
.post-mod-menu a:hover {
    background-color: #eee;
}
.post-mod-menu .separator {
    display: block;
    border-top: 1px solid #ddd;
    margin: 5px 0;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageload();

})();
