// ==UserScript==
// @name         Mod Message Helper
// @description  Adds menu to quickly send mod messages to users
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      3.3.0
//
// @match        *://*.askubuntu.com/*
// @match        *://*.mathoverflow.net/*
// @match        *://*.serverfault.com/*
// @match        *://*.stackapps.com/*
// @match        *://*.stackexchange.com/*
// @match        *://*.stackoverflow.com/*
// @match        *://*.superuser.com/*
//
// @exclude      *://api.*
// @exclude      *://blog.*
// @exclude      *://chat.*
// @exclude      *://data.*
// @exclude      *://*/tour
// @exclude      *://stackoverflow.com/c/*
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==
/* globals $, StackExchange, jQuery */
/* globals isModerator, ajaxPromise, jQueryXhrOverride, _w, hasBackoff, addBackoff, htmlDecode, hasInvalidIds, getPostId */ /* Defined in https://github.com/samliew/SO-mod-userscripts/raw/master/lib/common.js */

'use strict';

// Moderator check
if (!isModerator()) return;


const superusers = [584192, 366904];
const isSuperuser = superusers.includes(StackExchange.options.user.userId);
const showHiddenFields = true || isSuperuser;

const newlines = '\n\n';
const fkey = StackExchange.options.user.fkey;
const getQueryParam = key => new URLSearchParams(window.location.search).get(key) || '';
const isSO = location.hostname == 'stackoverflow.com';
const isSOMeta = location.hostname == 'meta.stackoverflow.com';
const isMeta = typeof StackExchange.options.site.parentUrl !== 'undefined';
const parentUrl = StackExchange.options.site.parentUrl || 'https://' + location.hostname;
const additionalInfo = getQueryParam('info') ? newlines + decodeURIComponent(getQueryParam('info')) : '';
const pupupSubmitButtonsSelector = 'button.js-popup-submit, button.popup-submit';



const modMenuOnClick = true;


/* CUSTOM MOD MESSAGE TEMPLATES
 * This may be edited to add more custom templates to mod messages.
 * addPrefix false:    no pleasantries and userlink
 * addSuffix false:    no suspension auto message
 * addSignature false: no regards and sign off
 * soOnly true:        Only use the template on Stack Overflow
 * sendEmail false:    Don't send email to the user.
 *
 * In the template, the following text is used to indicate something or automatically substituted:
 *             text                         What
 *       {todo:suspend}                     User is suspended by default. User is expected to replace with appropriate text.
 *       {suspensionDurationDays}           User is suspended by default. Is replaced by the currently selected number of days.
 *       {todo}                             Just used as a indicator that the moderator is to enter text.
 *       {optionalSuspensionAutoMessage}    Is automatically replaced by a suspension message, if the moderator selects suspension in the UI.
 */
const customModMessages = [
    {
        templateName: "closing spam",
        suspensionReason: "for rule violations",
        suspensionDefaultDays: 0,
        templateBody: `As you may have noticed, Stack Overflow is currently under a spam wave, receiving a lot of "support number" spam posts.

While we appreciate your willingness to help us out with these as you see them, we noticed that you recently voted to close one or more of these questions. That is not very useful. **Instead of voting to close spam, you should flag it as spam.** You'll find that option at the very top of the "flag" dialog.

Flagging as spam is much more expedient than voting to close, and actually allows spam to be nuked from the site without moderator intervention even being required.

Thank you for your attention to this matter in the future. If you have any questions, please let us know!`
    },
    {
        templateName: "promotional content; answers not self-contained",
        suspensionReason: "for promotional content",
        suspensionDefaultDays: 0,
        // The \n characters used below are to get around a Tampermonkey default setting which automatically removes trailing whitespace from changed lines.
        templateBody: `**Promotional content:**  \nWe noticed that at least some of your posts seem to promote and/or link to a product, website, blog, library, YouTube channel/videos, project, source code repository, etc. Per the [help center](${parentUrl}/help/behavior):

> Be careful, because the community frowns on overt self-promotion and tends to vote it down and flag it as spam. Post good, relevant answers, and if some (but not all) happen to be about your product or website, so be it. However, you _must_ disclose your affiliation in your answers. Also, if a huge percentage of your posts include a mention of your product or website, you're probably here for the wrong reasons. Our advertising rates are quite reasonable; [contact our ad sales team for details](${parentUrl}/advertising).

You should also review the content at the following links:

- [**What signifies "Good" self promotion?**](https://meta.stackexchange.com/q/182212),
- [some tips and advice about self-promotion](${parentUrl}/help/promotion),
- [What is the exact definition of "spam" for Stack Overflow?](https://meta.stackoverflow.com/q/260638), and
- [What makes something spam](https://meta.stackexchange.com/a/58035).

Any type of "astroturfing" promotion is not acceptable, regardless of if it's for profit or not. It brings down the overall value of genuine content and recommendations for everyone on the site.

If you do include a link to something, then the link needs to be directly relevant to the question and/or answer (i.e. a specific page that is about the issue(s) in the question and/or answer). It should not be just a general link to your site, product, blog, YouTube channel, etc. If the link is to something you are affiliated with, then you _must_ include explicit disclosure of your affiliation in your post, unless the link is to official documentation for a product/library that is explicitly asked about in the question.

**Answers must be a self-contained answer to the question:**  \nYour answers need to be actual, complete answers to the question. Just a link to something off-site doesn't make for an answer. [Answers must actually answer the question](https://meta.stackexchange.com/q/225370), without requiring the user to click to some other site to get enough information to solve the problem / answer the question. Please [add context around links](https://meta.stackoverflow.com/a/8259). _[Always quote](${parentUrl}/help/referencing) the most relevant part of an important link, in case the target site is unreachable or goes permanently offline._ If you are linking to a library or framework, then [explain _why_ and _how_ it solves the problem, _and provide code on how to use it_](https://meta.stackoverflow.com/a/251605). Take into account that being _barely more than a link to an external site_ is a reason as to [Why and how are some answers deleted?](${parentUrl}/help/deleted-answers).
`
    },
    {
        templateName: "soliciting votes",
        suspensionReason: "for rule violations",
        suspensionDefaultDays: 0,
        templateBody: `We noticed that you've been posting numerous comments asking other users for upvotes and/or accepts. This is not an appropriate use of comments.

Quoting from the [comment privilege page](${parentUrl}/help/privileges/comment):

> You should submit a comment if you want to:
> * Request **clarification** from the author;
> * Leave **constructive criticism** that guides the author in improving the post;
> * Add relevant but **minor or transient information** to a post (e.g. a link to a related question, or an alert to the author that the question has been updated).

Please refrain from leaving comments urging users to accept answers in the future. Such comments may be perceived as begging by other users. The system does have built-in contextual help that recommends new users accept an answer to their question at an appropriate time. Having the message come from the software itself, rather than a comment from a specific user, is preferable for several reasons:

First, it reduces the amount of noise on the site, since the message is displayed only on that user's screen, not as content that every future viewer to the Q&A will see. Second, it eliminates the possibility that your comment comes across as pressuring the user into accepting and/or upvoting your post. The reality is, no matter how politely and neutrally you phrase the comment, if you have also posted an answer to the question, the receiving user is extremely likely to interpret that comment as pressuring them to accept your answer.

In the best case, comments like these are merely noise, redundant with system-level notifications; in the worst case, they may be perceived as an attempt to pressure someone to do something that is, after all, completely optional.`,
    },
    {
        templateName: "minor edits bumping post",
        suspensionReason: "for rule violations",
        suspensionDefaultDays: 0,
        templateBody: `You appear to be editing your post to attract attention, rather than to improve it. Periodic cosmetic edits are not constructive and needlessly bump your post, displacing actually active posts that require more community attention.

Please only edit your post to correct errors, to include additional insights, or to update the question for changing circumstances. If you continue to only edit it for cosmetic reasons only, we'll have to lock your post from all further edits.`,
    },
    {
        templateName: "minor suggested edits",
        suspensionReason: "for rule violations",
        suspensionDefaultDays: 0,
        templateBody: `We have noticed that your recent suggested edits are just correcting a typo in the title and haven't handled any of the other problems with a question. Please note that we expect suggested edits to fix all issues with a post, rather than correcting only a single thing. From [How does editing work?](${parentUrl}/help/editing):

> **Edits are expected to be substantial and to leave the post better than you found it.**

Do keep in mind to clean up all the problems with the post, while you are proposing edits to it. Suggested edits must also be approved by at least two other users prior to being accepted. We therefore ask users to only make edits which make substantial improvements to posts.

We have removed your ability to suggest edits for a few days, to ensure this message reaches you first.`,
    },
    {
        templateName: "tag-wiki plagiarism",
        suspensionReason: "for plagiarism",
        suspensionDefaultDays: 0,
        templateBody: `It has come to our attention that your recent suggested tag wiki edits consisted primarily or entirely of text copied from other websites. We prefer not to simply copy content already available elsewhere in lieu of creating something that adds value to this site, and where possible we prefer that content be your own original work.

Please note that we still require full attribution with a link to the external source, and citing the name of the original author if you are quoting an excerpt. You should also make an effort to seek permission before copying content.

Thank you, and we look forward to your contributions in the future.`,
    },
    {
        soOnly: true, // because template has SO-only meta links
        templateName: "self tag burnination",
        suspensionReason: "for rule violations",
        suspensionDefaultDays: 0,
        templateBody: `As you should be aware, there is [a process for mass tag removal](https://meta.stackoverflow.com/questions/324070), also known as burnination. The [policy from Stack Exchange](https://meta.stackoverflow.com/questions/356963) is that the process **must** be followed and that burninations of tags which are used on more than 50 questions **must** be discussed on Meta Stack Overflow *prior* to beginning to edit to remove the tag.

You have recently removed many tags from questions without following the burnination process. Do not do that. This message is a warning. If you do this again, with this or any other tag, then there will be further consequences.

The edits you made will be reverted. Some of the edits have other beneficial changes, which you are welcome to reapply. However, you are not permitted to systematically remove tags from questions without following the burnination process.`,
    },
    {
        templateName: "ban evasion, multiple accounts",
        suspensionReason: "for rule violations",
        suspensionDefaultDays: 30,
        templateBody: `It has come to our attention that you have been using multiple accounts to work around system limitations. The extra accounts will be removed together with any unanswered questions. Please refrain from using secondary accounts to circumvent our systems in the future.

All system and moderator-imposed limits/blocks/bans/suspensions/etc. apply to the user, not just a single account. You are not permitted to create one or more new accounts in order to get around such limitations. If you are hitting a limit on one account, then you should act as if you were hitting that limit on each of your accounts.

The most common limitations for people to attempt to evade are the system imposed question and answer bans. When you're getting the message 'We are no longer accepting questions/answers from this account', then you should act as if you are getting that message on all of your accounts and not post additional questions or answers (whichever you're hitting), even if you have an alternate account which is not banned. For more detail about question and answer bans and what you can do to get out of them, please see [What can I do when getting “We are no longer accepting questions/answers from this account”?](https://meta.stackoverflow.com/a/255584#255584)

Having more than one account is permitted, if the additional account is not used to circumvent such limitations and the accounts do not interact with each other, or otherwise allow you to do things which you would not be permitted to do with a single account. If you are interested in more information about having more than one account, please see [What are the rules governing multiple accounts (i.e. sockpuppets)?](https://meta.stackoverflow.com/q/388984)`,
    },
    {
        templateName: "account sharing",
        suspensionReason: "for rule violations",
        suspensionDefaultDays: 0,
        addSuffix: false,
        templateBody: `Company-owned or accounts shared by multiple users are not permitted as stated in the [Terms of Service](${parentUrl}/legal/terms-of-service/public):

> To access some of the public Network features you will need to **register for an account as an individual** and consent to these Public Network Terms. If you do not consent to these Public Network Terms, Stack Overflow reserves the right to refuse, suspend or terminate your access to the public Network.

As this account appears to be in breach of this policy, it will be deleted. You are welcome to register again for an account as an individual user, subject to the Terms of Service.

Should you wish to appeal this decision, you can contact the company using [this form](${parentUrl}/contact?referrer=${parentUrl}) or at community@stackexchange.com`,
    },
    {
        templateName: "voluntary suspension",
        suspensionReason: "upon request",
        suspensionDefaultDays: 30,
        templateBody: `We have temporarily suspended your account for {suspensionDurationDays} days upon request.

Since this suspension is fully voluntary, you are welcome to reply to this message and request that the suspension be lifted early. Otherwise it will automatically expire in {suspensionDurationDays} days, upon which time your full reputation and privileges will be restored.

We wish you a pleasant vacation from the site, and we look forward to your return!`,
        addSuffix: false,
    },
    {
        templateName: "demands to show effort/\"not a code-writing service\"",
        suspensionReason: "for rule violations",
        suspensionDefaultDays: 0,
        templateBody: `It has come to our attention that you've left one or more comments similar to the following:

>

[Stack Overflow *is* a code-writing service](https://meta.stackoverflow.com/a/408565), in the sense that it is a programming Q&A site, and most questions here are solved by writing code in the answer. It is [not a debugging helpdesk for askers](https://meta.stackexchange.com/a/364585)&mdash;we do not require that askers provide existing code to debug. Lack of problem-solving effort is not a reason to close or otherwise object to questions. [The only type of effort we require is the effort required to ask a clear, focused, non-duplicate question](https://meta.stackoverflow.com/a/260909). Including an attempt often adds noise and results in answers that are applicable to just the original asker, rather than anyone doing the same thing.  Many of the most useful questions on the site do not include an existing attempt at solving the problem.

Of course, Stack Overflow is *also* not a free application design and development service. Questions may still be closed as too broad (or unclear) if that is the problem. But please do not try to limit the questions asked here to problems with *existing* code. Instead, focus on the scope and clarity of questions. The goal should be to encourage questions that might help the next person with the same problem.

Please do not post any more of these comments. They add noise for moderators to remove, may be perceived as demanding or unfriendly, and don't assist with our goal of creating a knowledge base.`,
    },
    {
        templateName: "spam/abuse year-long ban",
        suspensionReason: "for rule violations",
        suspensionDefaultDays: 365,
        templateBody: `Account removed for spamming and/or abusive behavior. You\'re no longer welcome to participate here.`,
        addPrefix: false,
        addSuffix: false,
        addSignature: false,
        sendEmail: false,
    },
    /* EXAMPLE
    {
        templateName: "a farewell",
        suspensionReason: "for rule violations",
        suspensionDefaultDays: 365,
        templateBody: `goodbye`,
        //addPrefix: false,
        //addSuffix: false,
        //addSignature: false,
        //soOnly: false, // if template has SO-only meta links
        //sendEmail: false,
    },
    */
];


// CUSTOM CM MESSAGE TEMPLATES
// This may be edited to add more custom templates to CM messages
const customCmMessages = [
    //{
    //    templateName: "needs further investigation",
    //    templateBody: `This user needs investigation for ...`,
    //},
    /* EXAMPLE
    {
        templateName: "an example",
        templateBody: `This is an example template.`,
    },
    */
];


// Send mod message + optional suspension
function modMessage(uid, message = '', sendEmail = true, suspendDays = 0) {
    return new Promise(function (resolve, reject) {
        if (typeof uid === 'undefined' || uid === null) { reject(); return; }
        if (suspendDays < 0 || suspendDays > 365) { reject(); return; }

        // Message cannot be empty
        if (message == null || message.trim().length == 0) {
            alert('Mod message cannot be empty.'); reject(); return;
        }

        let suspendUser = false;
        let suspendChoice = 0;
        if (suspendDays > 0) {
            suspendUser = true;
            suspendChoice = suspendDays;
        }

        let templateName = 'something else...';
        let suspendReason = 'for rule violations';
        if (message == 'goodbye') {
            templateName = 'a farewell';
        }

        $.post({
            url: `https://${location.hostname}/users/message/save`,
            data: {
                'userId': uid,
                'lastMessageDate': 0,
                'email': sendEmail,
                'suspendUser': suspendUser,
                'suspend-choice': suspendChoice,
                'suspendDays': suspendDays,
                'templateName': templateName,
                'suspendReason': suspendReason,
                'templateEdited': false,
                'post-text': message,
                'fkey': fkey,
                'author': null,
            }
        })
            .done(resolve)
            .fail(reject);
    });
}


function toShortLink(str, newdomain = null) {

    // Match ids in string, prefixed with either a / or #
    const ids = str.match(/[\/#](\d+)/g);

    // Get last occurance of numeric id in string
    const pid = ids.pop().replace(/\D+/g, '');

    // Q (single id) or A (multiple ids)
    const qa = ids.length > 1 ? 'a' : 'q';

    // Use domain if set, otherwise use domain from string, fallback to relative path
    const baseDomain = newdomain ?
        newdomain.replace(/\/$/, '') + '/' :
        (str.match(/\/+([a-z]+\.)+[a-z]{2,3}\//) || ['/'])[0];

    // Format of short link on the Stack Exchange network
    return pid ? baseDomain + qa + '/' + pid : str;
}


function getDeletedPosts(uid, type) {

    const url = `https://${location.hostname}/search?q=user%3a${uid}%20is%3a${type}%20deleted%3a1%20score%3a..0&tab=newest`;
    $.get(url).done(function (data) {
        const count = Number($('.results-header h2, .fs-body3', data).first().text().replace(/[^\d]+/g, ''));
        const stats = $(`
            <div class="post-ban-deleted-posts">
                User has <a href="${url}" target="_blank">${count} deleted ${type}s</a>, score &lt;= 0
            </div>`).appendTo('#sidebar');

        // If no deleted posts, do nothing
        if (isNaN(count) || count <= 0) return;

        // Add deleted posts to the stats element
        const results = $('.search-results .search-result, .js-search-results .s-card', data);

        // Add copyable element to the results
        const hyperlinks = results.find('a').attr('href', (i, v) => 'https://' + location.hostname + v).attr('target', '_blank');
        const hyperlinks2 = hyperlinks.filter('.s-link[data-searchsession^="/"], .answer-hyperlink').map((i, el) => `[${1 + i}](${toShortLink(el.href)})`).get();
        const comment = `Additionally, you have ${hyperlinks2.length} deleted ${type}${hyperlinks2.length == 1 ? '' : 's'}, which may be contributing to the [${type} ban](https://${location.hostname}/help/${type}-bans): ${hyperlinks2.join(' ')}`;
        const commentArea = $(`<textarea readonly="readonly" class="h128 s-textarea"></textarea>`).val(comment).appendTo(stats);
    });
}


function initModMessageHelper() {

    if (location.pathname.includes('/users/message/')) {

        // We do not need chat in the sidebar, thanks.
        $('.js-chat-ad-link').closest('.s-sidebarwidget').remove();

        // Move generic warning to sidebar
        $('#mainbar > .s-notice.s-notice__warning').prependTo($('#sidebar')).find('#confirm-new').text((i, v) => v.trim());

        // Show hidden email field
        $('#js-send-email, input[name="email"]')
            .attr('type', 'checkbox')
            .change(function () {
                $('#js-to-warning').toggleClass('hidden', !this.checked);
            })
            .wrap('<label for="send-email" class="dblock">send email: </label>');

        // Show alternate message if no email
        $('#js-to-warning').after(`<div id="js-to-warning_2" class="s-notice s-notice__info mt8">The user will <em>only</em> receive this message on Stack Overflow.</div>`);

        $('#js-copy-panel > table').first().addClass('mb12');

        if (showHiddenFields) {

            // Show hidden fields
            $('#js-template-name, #js-suspend-reason, #js-template-edited').attr('type', 'text').addClass('d-inline-block s-input s-input__sm w70');

            $('#js-template-name').wrap('<label for="js-template-name" class="dblock"></label>').before(`<span class="inline-label">template name:</span>`);
            $('#js-suspend-reason').wrap('<label for="js-suspend-reason" class="dblock"></label>').before(`<span class="inline-label" title="publicly displayed as 'This account is temporarily suspended _____'"><span style="border-bottom: 1px dotted #000">suspend reason:</span></span>`);
            $('#js-template-edited').wrap('<label for="js-template-edited" class="dblock"></label>').before(`<span class="inline-label">template edited:</span>`);
        }
    }

    // The rest of this function is for creating new moderator messages
    if (!location.pathname.includes('/users/message/create/')) return;

    let modalFetchStarted = false;
    $(document).ajaxSend(function (event, xhr, settings) {
        // We want to know when the page starts fetching the template popup.
        if (settings.url.includes('/admin/contact-user/template-popup/') || settings.url.includes('/admin/contact-cm/template-popup')) {
            modalFetchStarted = true;
        }
    });

    /* The goal is to click the .js-load-modal button to start loading the template popup
     * for the first time upon page load.  That click now needs to be after SE's code calls
     * StackExchange.prepareEditor().  There's no guarantee that this userscript executes
     * both after StackExchange.prepareEditor() exists and prior to the in-page code calling
     * that function, so wrapping the function isn't guaranteed to work (the button can end
     * up never clicked).  In addition, we haven't found a method to deterministically
     * identify that the function has been called.  As a result of that, we're basically
     * stuck clicking the button, potentially multiple times, until we detect the effects of
     * clicking the button.  The first effect, which is synchronous with the click, is that
     * SE starts an AJAX call to fetch the template popup.  Thus, we wath for that to happen
     * after we click and not click again once that AJAX call is in process.
     *
     * In order to reduce the number of times we click and be more responsive without
     * clicking rapidly, we don't start clicking until we go through the same asynchonous
     * execution path that SE's in-page code does.  Under most conditions, this results in
     * our clicking the button for the first time almost immediately after the page is ready
     * for the button to be clicked.
     */

    StackExchange.ready(() => {
        StackExchange.using("externalEditor", () => {
            if (StackExchange.settings.snippets.snippetsEnabled) {
                StackExchange.using("snippets", () => {
                    StackExchange.using("editor", () => {
                        delayedClickForFirstLoadPopupAtIntervalUntilLoading(25, 500);
                    });
                });
            }
            else {
                StackExchange.using("editor", () => {
                    delayedClickForFirstLoadPopupAtIntervalUntilLoading(25, 500);
                });
            }
        });
    });

    function delayedClickForFirstLoadPopupAtIntervalUntilLoading(delay, interval) {
        /* It's possible, but quite unlikely, for this to be called after something else
         * clicks the load popup button which did trigger a load and for that load to have
         * been started prior to our watching for ajaxSend (above) and for the response not
         * to have been received, so the popup isn't in the DOM.  The timing would have to
         * be fairly contrived for that to end up being the case.
         *
         * The outer setTimeout is to delay a short bit after completing the wait for SE to
         * be ready.  This puts us after any code SE has that's on the same callback list.
         */
        setTimeout(() => {
            const popup = getPopup();
            if (!modalFetchStarted && popup.length === 0){
                // click select template link on page load
                $('#show-templates, .js-load-modal').first().trigger('click');
                setTimeout(delayedClickForFirstLoadPopupAtIntervalUntilLoading, interval);
            }
        }, delay);
    }


    const template = getQueryParam('action');

    // If low-quality-questions template was selected, fetch deleted questions
    const uid = location.pathname.match(/\/(\d+)/)[1];
    if (template === 'low-quality-questions') {
        getDeletedPosts(uid, 'question');
    }

    // Restrict max suspension days to 365, otherwise it fails rudely
    $('#js-suspend-days').attr('type', 'number').attr('max', '365').attr('min', 1);

    // On any page update
    let hasRun = false;
    $(document).ajaxComplete(function (event, xhr, settings) {

        // Once templates loaded, update templates
        if (settings.url.includes('/admin/contact-user/template-popup/')) {

            // Add our own canned templates
            addCustomModMessageTemplates();

            // If template selected via querystring
            if (template != '' && !hasRun) {
                hasRun = true;

                // Try to select selected template from parameter
                setTimeout(selectModMessage, 600, template);
            }
        }
    });


    function selectModMessage(template) {
        const popup = $('.s-modal--dialog').first();
        const actionList = popup.find('.action-list');
        const hr = actionList.children('hr').index();
        const numberOfItems = hr > 0 ? hr : actionList.children('li').length;

        switch (template) {
            case 'low-quality-questions':
                $('#template-0').click().triggerHandler('click');
                break;
            case 'question-repetition':
                $('#template-1').click().triggerHandler('click');
                break;
            case 'sockpuppet-upvoting':
                $('#template-2').click().triggerHandler('click');
                break;
            case 'targeted-votes':
                $('#template-3').click().triggerHandler('click');
                break;
            case 'abusive':
                $('#template-4').click().triggerHandler('click');
                break;
            case 'revenge-downvoting':
                $('#template-5').click().triggerHandler('click');
                break;
            case 'vandalism':
                $('#template-6').click().triggerHandler('click');
                break;
            case 'signatures-taglines':
                $('#template-7').click().triggerHandler('click');
                break;
            case 'promotion':
                $('#template-8').click().triggerHandler('click');
                break;
            case 'excessive-discussion':
                $('#template-9').click().triggerHandler('click');
                break;
            case 'plagiarism':
                $('#template-10').click().triggerHandler('click');
                break;
            case 'other':
                $('#template-11').click().triggerHandler('click');
                break;
            default: {
                // Try to match a custom template
                template = template.replace(/\W/g, '').toLowerCase();
                customModMessages.forEach(function (v, i) {
                    const match = v.templateName.replace(/\W/g, '').toLowerCase().includes(template);
                    if (match) {
                        const actionListItem = actionList.children('li').eq(numberOfItems + i);
                        const defaultSuspendDurationDays = Number(actionListItem.find('input[data-days]').attr('data-days'));

                        // Select template if match found
                        actionListItem.click().triggerHandler('click');

                        // Set custom susp duration to template default days
                        if (defaultSuspendDurationDays > 0) $('#js-suspend-days').val(defaultSuspendDurationDays);
                    }
                });
            }
        }

        const popupSubmit = popup.find(pupupSubmitButtonsSelector);
        if (!popupSubmit.prop('disabled')) popupSubmit.click();
    }


    function watchForPopupSubmitClick() {
        // When a template is selected, the correct values for send email and suspend length are not correctly applied.
        // This watches for when the submit is clicked, and sets the email and suspend values to the correct values for the template.
        const popup = getPopup();
        const selectedEl = popup.find(':checked').first();
        const reasonEl = popup.find(`#${selectedEl.attr('id')}-reason`);
        const newReasonText = selectedEl.val();
        const days = reasonEl.attr('data-days');
        const email = reasonEl.attr('data-send-email');

        function setSEcheckboxById(id, toState) {
            // SE's in-page code does additional things when these are clicked, so we set the checkbox state
            // to the oposite of what we want and then set the desired state with a click().
            return $(`#${id}`).prop('checked', !toState).click();
        }

        setTimeout(() => {
            // Fill in the custom suspension length and select the appropriate length, preferring the predefined lengths.
            setSEcheckboxById('js-suspend-user', days || newReasonText.match(/\{todo:suspend/i) || newReasonText.match(/\{suspensionDurationDays\}/i));
            const useDays = days || 7; // Reset the value to 7 days, if there isn't any value chosen for days in the template, or if it's 0.
            if (useDays) {
                // Always put the length of the suspension in the custom field.
                $('#js-suspend-days').val(useDays);
                // Also click these, as that triggers additional SE things.
                const preExistingDaysEl = setSEcheckboxById(`js-days-${useDays}`, true);
                if (!preExistingDaysEl.length) {
                    setSEcheckboxById('js-days-other', true);
                }
            }
            // Apply the template's selection for sending email
            setSEcheckboxById('js-send-email', email !== 'false');
            $('#wmd-input').prop('selectionEnd', 0).focus();
        }, 25);
    }

    function addCustomModMessageTemplates() {

        // Make the popup draggable!
        const popup = $('.s-modal--dialog').first();
        popup.attr('data-controller', 'se-draggable');
        popup.find('h1').first().attr('data-target', 'se-draggable.handle');

        // Watch for the popup to be submitted.
        popup.find(pupupSubmitButtonsSelector).on('click input', watchForPopupSubmitClick);

        const actionList = popup.find('.action-list');
        if (actionList.length === 0) return;

        // Do not continue if there are no custom mod message templates
        if (customModMessages.length === 0) return;

        // Add description expand/collapse events for custom templates
        actionList.append('<hr />').on('click', '.js-custom-template', function () {
            $(this).addClass('js-action-selected').find('.js-action-desc').removeClass('d-none');
            $(this).find('input:radio').prop('checked', true);
            $(this).siblings().find('.js-action-desc').addClass('d-none');
            $(pupupSubmitButtonsSelector).prop('disabled', false);
        });

        // Message vars (should not be edited here)
        const numberOfItems = actionList.children('li').length;
        const sitename = StackExchange.options.site.name;
        const userId = $('#aboutUserId').val();
        const userLink = 'https://' + location.hostname + $('#js-msg-form .user-details a').first().attr('href');

        const messagePrefix = `Hello,

We're writing in reference to your ${sitename} account:

${userLink}

`;

        const messageSuffix = `

{optionalSuspensionAutoMessage}`;

        const messageSignature = `

Regards,  \n${sitename} Moderation Team`;


        customModMessages.forEach(function (item, i) {
            actionList.append(generateCmOrModMessageTemplate(false, item, i, numberOfItems, messagePrefix, messageSuffix, messageSignature));
        });
    }
}


function initCmMessageHelper() {

    if (location.pathname.includes('/admin/cm-message/')) {

        // Move generic warning to sidebar
        $('#mainbar > .module.system-alert').prependTo($('#sidebar')).find('#confirm-new').text((i, v) => v.trim());

        if (showHiddenFields) {

            // Show hidden fields
            $('#js-template-name').attr('type', 'text').addClass('d-inline-block s-input s-input__sm w70');

            $('#js-template-name').wrap('<label for="templateName" class="dblock"></label>').before(`<span class="inline-label">template name:</span>`);
        }
    }

    // The rest of this function is for creating new messages
    if (!location.pathname.includes('/admin/cm-message/create/')) return;

    const template = getQueryParam('action');

    // Do not support suspicious-voting template, since we have "SuspiciousVotingHelper" userscript for that
    // Download from https://github.com/samliew/SO-mod-userscripts/blob/master/SuspiciousVotingHelper.user.js
    if (template === 'suspicious-voting') return;

    // On any page update
    let hasRun = false;
    $(document).ajaxComplete(function (event, xhr, settings) {

        // Once templates loaded , update templates
        if (settings.url.includes('/admin/contact-cm/template-popup/')) {

            // Add our own canned templates
            addCustomCmMessageTemplates();

            // If template selected via querystring
            if (template != '' && !hasRun) {
                hasRun = true;

                // Try to select selected template from parameter
                setTimeout(selectCmMessage, 600, template);
            }

            // Make the popup draggable!
            const popup = getPopup();
            popup.attr('data-controller', 'se-draggable');
            popup.find('h2').first().attr('data-target', 'se-draggable.handle');
        }
    });

    // click template link
    $('#show-templates').click();


    function selectCmMessage(template) {
        const popup = getPopup();
        const actionList = popup.find('.action-list');
        const hr = actionList.children('hr').index();
        const numberOfItems = hr > 0 ? hr : actionList.children('li').length;

        switch (template) {
            case 'profile-merge':
                $('#template-0').click().triggerHandler('click');
                break;
            case 'post-dissociation':
                $('#template-1').click().triggerHandler('click');
                break;
            case 'suspicious-voting':
                $('#template-2').click().triggerHandler('click');
                break;
            case 'spam':
                $('#template-3').click().triggerHandler('click');
                break;
            case 'suicidal-user':
                $('#template-4').click().triggerHandler('click');
                break;
            case 'underage-user':
                $('#template-5').click().triggerHandler('click');
                break;
            case 'other':
                $('#template-6').click().triggerHandler('click');
                break;
            default: {
                // Try to match a custom template
                template = template.replace(/\W/g, '').toLowerCase();
                customCmMessages.forEach(function (v, i) {
                    const match = v.templateName.replace(/\W/g, '').toLowerCase().includes(template);
                    if (match) {
                        actionList.children('li').eq(numberOfItems + i).click().triggerHandler('click');
                    }
                });
            }
        }

        const popupSubmit = popup.find(pupupSubmitButtonsSelector);
        if (!popupSubmit.prop('disabled')) popupSubmit.click();
    }


    function addCustomCmMessageTemplates() {

        // Make the popup draggable!
        const popup = getPopup();
        popup.attr('data-controller', 'se-draggable');
        popup.find('h2').first().attr('data-target', 'se-draggable.handle');

        const actionList = popup.find('.action-list');
        if (actionList.length === 0) return;

        // If additionalInfo param, replace default templates {todo} placeholder
        if (additionalInfo) {
            actionList.find('input:radio').prop('checked', true).val((i, v) => v.replace(/(\n|\r)+{todo}/, additionalInfo));
        }

        // Do not continue if there are no custom CM templates
        if (customCmMessages.length === 0) return;

        // Add description expand/collapse events for custom templates
        actionList.append('<hr />').on('click', '.js-custom-template', function () {
            $(this).addClass('action-selected').find('.action-desc').slideDown(200);
            $(this).find('input:radio').prop('checked', true);
            $(this).siblings().removeClass('action-selected').find('.action-desc').slideUp(200);
            $(pupupSubmitButtonsSelector).prop('disabled', false);
        });

        // Message vars (should not be edited here)
        const numberOfItems = actionList.children('li').length;
        const sitename = StackExchange.options.site.name;
        const modName = $('#js-msg-form a').first().text();
        const userId = $('#aboutUserId').val();
        const userLink = 'https://' + location.hostname + $('#js-msg-form .user-details a').first().attr('href');

        const messagePrefix = `Hello,

I'm writing in reference to the ${sitename} account:

${userLink}

`;
        const messageSuffix = additionalInfo + `

Regards,  \n${modName}  \n${sitename} moderator`;

        customCmMessages.forEach(function (item, i) {
            actionList.append(generateCmOrModMessageTemplate(true, item, i, numberOfItems, messagePrefix, messageSuffix));
        });
    }
}

function escapeText(text) {
    return text.replace(/[\u00A0-\u9999<">\\&]/gim, function (i) {
        return `&#${i.charCodeAt(0)};`;
    });
}

function generateCmOrModMessageTemplate(isCmMessage, item, i, numberOfItems, messagePrefix, messageSuffix, messageSignature="") {
    const templateNumber = numberOfItems + i;
    const templateBodyText = (item.addPrefix !== false ? messagePrefix : '') + item.templateBody + (item.addSuffix !== false ? messageSuffix : '') + (item.addSignature !== false ? messageSignature : '');
    const templateBodyProcessed = escapeText(templateBodyText);
    const templateShortText = item.templateBody.length > 400 ? item.templateBody.replace(/(\n|\r)+/g, ' ').substr(0, 397) + '...' : item.templateBody;
    const templateSuspensionReason = escapeText(item.suspensionReason || '');
    const templateName = escapeText(item.templateName || '');

    // 2022-10: The HTML for the mod-message templates changed substantially, so it's no longer the same as for CM escalations.
    // So, we return distictly different HTML. OTOH, there are currently no custom mod message templates.
    if (isCmMessage) {
        // CM message template, maybe (untested)
        return `
<li style="width: auto" class="js-custom-template"><label>
<input type="radio" id="template-${templateNumber}" name="mod-template" value="${templateBodyProcessed}">
<input type="hidden" id="template-${templateNumber}-reason"
    value="${item.suspensionReason || ''}"
    ${item.sendEmail === false ? 'data-send-email="false"' :''}
    data-days="${isNaN(item.suspensionDefaultDays) || item.suspensionDefaultDays <= 0 ? '' : item.suspensionDefaultDays}">
<span class="action-name">${item.templateName}</span>
<span class="action-desc" style="display: none;"><div style="margin-left: 18px; line-height: 130%; margin-bottom: 5px;">${templateShortText}</div></span>
</label></li>`;
    } else {
        // Mod message template
        return `
<li class="js-custom-template"><label>
<input type="radio" id="template-${templateNumber}" name="mod-template" value="${templateBodyProcessed}">
<input type="hidden" id="template-${templateNumber}-reason"
    value="${templateSuspensionReason}"
    data-suspension-description="${templateSuspensionReason}"
    ${item.sendEmail === false ? 'data-send-email="false"' :''}
    data-days="${isNaN(item.suspensionDefaultDays) || item.suspensionDefaultDays <= 0 ? '' : item.suspensionDefaultDays}">
<span class="js-action-name fw-bold">${templateName}</span>
<span class="js-action-desc d-none"><div class="ml16 mb6">${templateShortText}</div></span>
</label></li>`;
    }
}


function appendModMessageMenu() {

    // Append link to post sidebar if it doesn't exist yet
    $('.user-info, .s-user-card')
        .filter(function () {
            // Do not add links/classes to users in sidebar or on user tabs without actual links to users.
            const $this = $(this);
            return !($this.closest('#sidebar, .s-topbar').length > 0 || ($this.closest('.js-user-tab').length > 0 && $this.find('.s-user-card--link') === 0));
        })
        .not('.js-mod-message-menu')
        .addClass('js-mod-message-menu')
        .each(function () {
            const userbox = $(this);

            let uid = 0;
            try {
                uid = (userbox.find('a[href^="/users/"]:not(.deleted-user)').attr('href') || '/0/').match(/\/(\d+)/)[1];
                uid = Number(uid);
                this.dataset.uid = uid;
            }
            catch (ex) { } // can't put return statements in catch blocks?
            if (typeof uid === 'undefined' || uid == 0) return; // e.g.: deleted user

            // if user is self, ignore
            if (uid == StackExchange.options.user.userId) return;

            const post = userbox.closest('.question, .answer');
            const pid = post.attr('data-questionid') || post.attr('data-answerid');

            const userlink = userbox.find('a').attr('href');
            const userrep = userbox.find('.reputation-score').text();
            const username = userbox.find('.user-details a').first().text();
            const modFlair = userbox.find('.mod-flair');

            if (uid == -1 || modFlair.length == 1) return;

            const postIdParam = pid ? '&' + (!isMeta ? `pid=${pid}` : `metapid=${pid}`) : '';

            const modMessageLink = parentUrl + '/users/message/create/' + uid;
            const cmMessageLink = parentUrl + '/admin/cm-message/create/' + uid;

            // Create menu based on post type and state
            let menuitems = '';

            menuitems += `<a target="_blank" href="${modMessageLink}?action=low-quality-questions">low quality questions</a>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=question-repetition">question repetition</a>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=promotion">excessive self-promotion</a>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=signatures-taglines">using signatures</a>`;

            menuitems += `<div class="separator"></div>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=excessive-discussion">excessive comments</a>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=abusive">abusive to others</a>`;

            menuitems += `<div class="separator"></div>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=vandalism">vandalism</a>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=plagiarism">plagiarism</a>`;

            menuitems += `<div class="separator"></div>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=sockpuppet-upvoting">sockpuppet upvoting</a>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=targeted-votes">targeted votes</a>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=revenge-downvoting">revenge downvoting</a>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=ban-evasion">ban evasion</a>`;

            // Add custom reasons
            if (customModMessages.length > 0) {
                menuitems += `<div class="separator"></div>`;
                customModMessages.forEach(v => {
                    if(v.soOnly === true && !isSO) return; // Don't add menu item if SO-only template and not SO
                    menuitems += `<a target="_blank" href="${modMessageLink}?action=${v.templateName.replace(/\W/g, '').toLowerCase()}">${v.templateName}</a>`;
                });
            }

            menuitems += `<div class="separator"></div>`;
            menuitems += `<a target="_blank" href="${modMessageLink}?action=other">other...</a>`;


            // Create CM menu
            let cmMenuitems = '';

            cmMenuitems += `<a target="_blank" href="${cmMessageLink}?action=post-dissociation${postIdParam}">post dissociation</a>`;
            cmMenuitems += `<a target="_blank" href="${cmMessageLink}?action=suspicious-voting">suspicious voting</a>`;
            cmMenuitems += `<a target="_blank" href="${cmMessageLink}?action=suicidal-user">suicidal user</a>`;
            cmMenuitems += `<a target="_blank" href="${cmMessageLink}?action=underage-user&info=Underage+user.">underage user</a>`;
            cmMenuitems += `<a target="_blank" href="${cmMessageLink}?action=profile-merge">user profile merge</a>`;
            cmMenuitems += `<a target="_blank" href="${cmMessageLink}?action=spam">spam</a>`;

            cmMenuitems += `<div class="separator"></div>`;
            cmMenuitems += `<a target="_blank" href="${cmMessageLink}?action=other">other...</a>`;


            userbox.append(`
<div class="js-mod-message-link flex--item s-btn ta-center py8 somu-mod-message-link ${modMenuOnClick ? 'click-only' : ''}" data-shortcut="O" title="Contact...">
  <svg aria-hidden="true" role="img" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="svg-icon mln1 mr0">
    <path fill="currentColor" d="M464 64H48C21.5 64 0 85.5 0 112v288c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48zM48 96h416c8.8 0 16 7.2 16 16v41.4c-21.9 18.5-53.2 44-150.6 121.3-16.9 13.4-50.2 45.7-73.4 45.3-23.2.4-56.6-31.9-73.4-45.3C85.2 197.4 53.9 171.9 32 153.4V112c0-8.8 7.2-16 16-16zm416 320H48c-8.8 0-16-7.2-16-16V195c22.8 18.7 58.8 47.6 130.7 104.7 20.5 16.4 56.7 52.5 93.3 52.3 36.4.3 72.3-35.5 93.3-52.3 71.9-57.1 107.9-86 130.7-104.7v205c0 8.8-7.2 16-16 16z" class="" data-darkreader-inline-fill="" style="--darkreader-inline-fill:currentColor;"></path>
  </svg>
  <div class="somu-mod-message-menu grid" id="somu-mod-message-menu" data-pid="${pid}" role="dialog">
    <div class="flex--item fl0 br bc-black-3">
      <div class="somu-mod-message-header">Message user:</div>
      ${menuitems}
    </div>
    <div class="flex--item fl0">
    <div class="somu-mod-message-header">Contact CM:</div>
      ${cmMenuitems}
    </div>
  </div>
</a>`);

        });

    // Show menu on click only
    if (modMenuOnClick) {
        $(document).on('click', null, function () {
            $('.somu-mod-message-link.active').removeClass('active');
        });
        $('.js-mod-message-menu').on('click', '.somu-mod-message-link', function (evt) {
            $(this).addClass('active');
            evt.stopPropagation();
        });
    }
}


function getPopup() {
    return $('#show-templates').siblings('.popup').add($('.s-modal--dialog')).first();
}


let delayedAppendModMessageMenuTimer;
function nowAndDelayedAppendModMessageMenu() {
    appendModMessageMenu();
    clearTimeout(delayedAppendModMessageMenuTimer);
    // SE uses a 150ms animation to fade out the old post when doing a realtime.reloadPosts(), so we need to be after that.
    delayedAppendModMessageMenuTimer = setTimeout(appendModMessageMenu, 175);
}


function doPageLoad() {
    appendModMessageMenu();
    initModMessageHelper();
    initCmMessageHelper();
    // 2022-10 SE mod message page update: Fix a new bug in replying when the previous message was recent, which will, hopefully, be fixed quickly.
    $('.hidemsg').addClass('js-hide-msg');

    // After requests have completed
    $(document).ajaxStop(nowAndDelayedAppendModMessageMenu);
}


// On page load
doPageLoad();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
.user-info,
.s-user-card {
    position: relative;
    border: 1px solid transparent;
}
.user-info,
    min-height: 88px;
}
.user-info:hover,
.s-user-card:hover {
    /*border-color: var(--black-200);*/
}
.user-info.js-mod-message-menu:not(.js-mod-quicklinks):not(.s-topbar--item),
.s-user-card.js-mod-message-menu:not(.js-mod-quicklinks):not(.s-topbar--item):not(.s-user-card__minimal) {
    padding-bottom: 25px;
}
.user-action-time {
    min-height: 15px;
}

.mod-summary .user-info,
.mod-summary .s-user-card,
.mod-summary .user-action-time,
.single-badge-user .user-info,
.single-badge-user .s-user-card,
.single-badge-user .user-action-time,
.cast-votes .user-info,
.cast-votes .s-user-card {
    min-height: 0;
}

#questions .somu-mod-message-link {
    display: none;
}
.somu-mod-message-link {
    position: absolute !important;
    bottom: 2px;
    left: 1px;
    display: inline-block;
    padding: 5px 6px !important;
    line-height: 0;
    color: inherit;
    cursor: pointer;
}
.s-user-card .somu-mod-message-link {
    /* New s-user-card uses grid */
    position: relative !important;
    padding: 2px !important;
}
.somu-mod-message-link svg {
    width: 13px;
    height: 14px;
    color: var(--black-500);
}
.somu-mod-message-link:not(.click-only):hover .somu-mod-message-menu,
.somu-mod-message-link:not(.click-only) .somu-mod-message-menu:hover,
.somu-mod-message-link.click-only.active .somu-mod-message-menu {
    display: flex;
}
.somu-mod-message-link:hover svg {
    /*visibility: hidden;*/
}
.somu-mod-message-link .somu-mod-message-menu {
    display: none;
    position: absolute;
    top: 0;
    left: 36px;
    padding: 0;
    transform: translate(-50%, 0);
    z-index: 3;
    cursor: auto;

    background: var(--white);
    border-radius: 2px;
    border: 1px solid transparent;
    box-shadow: 0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12), 0 5px 5px -3px rgba(0,0,0,0.2);

    text-align: left;
    font-size: 0.923rem;
    font-family: Roboto,RobotoDraft,Helvetica,Arial,sans-serif;
    letter-spacing: .2px;
    line-height: 20px;

    user-select: none;
    white-space: nowrap;
}
#somu-mod-message-menu {
    background: var(--white) !important;
}
.somu-mod-message-link .somu-mod-message-menu > div {
    min-width: 170px;
    padding: 0 0 6px;
}
.somu-mod-message-header {
    display: block !important;
    margin-top: 12px;
    margin-bottom: 5px;
    padding: 8px 0;
    padding-left: 26px;
    padding-right: 26px;
    background-color: var(--yellow-050);
    border-bottom: 1px solid var(--yellow-100);
    color: var(--black);
    font-weight: bold;
}
.somu-mod-message-header:first-child {
    margin-top: 0;
}
.somu-mod-message-menu a {
    display: block;
    min-width: 120px;
    padding: 2px 0;
    padding-left: 22px;
    padding-right: 22px;
    cursor: pointer;
    color: var(--black-900) !important;
}
.somu-mod-message-menu a.dno {
    display: none;
}
.somu-mod-message-menu a:hover {
    background-color: var(--black-100);
}
.somu-mod-message-menu a.disabled {
    background-color: var(--black-050) !important;
    color: var(--black-200) !important;
    cursor: not-allowed;
}
.somu-mod-message-menu a.danger:hover {
    background-color: var(--red-500);
    color: var(--white);
}
.somu-mod-message-menu .separator {
    display: block;
    border-top: 1px solid var(--black-100);
    margin: 5px 0;
}

/* Some elements hide overflow, need to undo */
.suggested-edit .summary {
    overflow: unset;
}

/* Mod message template popup */
#js-msg-form[action="/users/message/save"] .s-modal--dialog {
    max-width: 95vw;
}
.s-modal--header {
    font-size: var(--fs-title);
}
#show-templates + .popup .action-list > li > label {
    margin: 0;
}
#show-templates + .popup .action-list > hr {
    margin: 5px 0;
}

/* Mod message page */
.dbl, .dblock {
    display: block;
}
.action-list:not(.popup-condensed) li > label {
    margin: -2px 0;
}
#js-msg-form label .inline-label {
    display: inline-block;
    width: 110px;
}
#js-msg-form #addressing {
    margin-bottom: 15px;
}
#js-msg-form #js-to-warning + #js-to-warning_2 {
    display: none;
}
#js-msg-form #js-to-warning,
#js-msg-form #js-to-warning.hidden + #js-to-warning_2 {
    display: inline-block;
}
#js-msg-form #js-copy-panel > span + table > tbody > tr:first-child td:first-child {
    width: 170px;
}
#js-msg-form #js-suspend-days {
    width: 70px;
}
#js-msg-form #js-copy-panel > .suspend-info {
    padding: 10px;
    font-weight: bold;
    margin-bottom: 10px;
    margin-top: 5px;
    border: 1px dotted #AE0000;
}
#msg-form #copyPanel textarea#wmd-input,
#js-msg-form #js-copy-panel textarea#wmd-input {
    min-height: 550px;
}
#sidebar .module {
    margin-bottom: 30px;
}
#sidebar .module #confirm-new {
    white-space: break-spaces;
    line-height: 1.2;
}
`;
document.body.appendChild(styles);
