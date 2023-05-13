// ==UserScript==
// @name         Mod Message Helper
// @description  Adds menu to quickly send mod messages to users
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      4.8
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
// @exclude      https://api.stackexchange.com/*
// @exclude      https://data.stackexchange.com/*
// @exclude      https://contests.stackoverflow.com/*
// @exclude      https://winterbash*.stackexchange.com/*
// @exclude      *chat.*
// @exclude      *blog.*
// @exclude      */tour
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/se-ajax-common.js
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

/* globals StackExchange, $, jQuery, isModerator, ajaxPromise, jQueryXhrOverride, _w, hasBackoff, addBackoff, htmlDecode, hasInvalidIds, getPostId, isSO, isSOMeta, isMetaSite, parentUrl, fkey */
/// <reference types="./globals" />

'use strict';

// This is a moderator-only userscript
if (!isModerator()) return;


const superusers = [584192, 366904];
const isSuperuser = superusers.includes(selfId);
const showHiddenFields = true || isSuperuser;

const newlines = '\n\n';
const additionalInfo = getQueryParam('info') ? newlines + decodeURIComponent(getQueryParam('info')) : '';
const popupSubmitButtonsSelector = 'button.js-popup-submit, button.popup-submit';
const templateNameModInboxException = {
  maxMessageLengthForNoException: 100,
  reservedLength: 5, // "sent "
  usernameMaxLength: 40, // Max username length on SE
};
templateNameModInboxException.maxTemplateNameLengthForNoException =
  templateNameModInboxException.maxMessageLengthForNoException - (templateNameModInboxException.usernameMaxLength + templateNameModInboxException.reservedLength);

const modMenuOnClick = true;


/* CUSTOM MOD MESSAGE TEMPLATES
 * This may be edited to add more custom templates to mod messages.
 * addPrefix false:    no pleasantries and userlink
 * addSuffix false:    no suspension auto message
 * addSignature true:  add regards and sign off. SE now adds this by default.
 * soOnly true:        use only if template has SO-only meta links, so other sites will not be able to use this template to avoid confusion.
 * sendEmail false:    don't send email to the user, mod message can only be read on-site
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
    templateBody: `As you may have noticed, ${parentName} is currently under a spam wave, receiving a lot of "support number" spam posts.

While we appreciate your willingness to help us out with these as you see them, we noticed that you recently voted to close one or more of these questions. That is not very useful. **Instead of voting to close spam, you should flag it as spam.** You'll find that option at the very top of the "flag" dialog.

Flagging as spam is much more expedient than voting to close, and actually allows spam to be nuked from the site without moderator intervention even being required.

Thank you for your attention to this matter in the future. If you have any questions, please let us know!`,
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
    templateName: "author minor edits bumping post",
    suspensionReason: "for rule violations",
    suspensionDefaultDays: 3,
    templateBody: `You appear to be editing your post to attract attention, rather than to improve it. Periodic cosmetic edits are not constructive and needlessly bump your post, displacing actually active posts that require more community attention. To quote the Help Center [How does editing work?](${parentUrl}/help/editing):

> **Tiny, trivial edits are discouraged**; try to make the post significantly better when you edit, correcting all problems that you observe.

Please only edit your post to correct errors, to include additional insights, or to update the question for changing circumstances. If you continue to only edit it for cosmetic reasons only, we'll have to lock your post from all further edits.`,
  },
  {
    templateName: "minor/trivial suggested edits",
    suspensionReason: "for rule violations",
    suspensionDefaultDays: 3,
    templateBody: `We have noticed that your recent suggested edits are just correcting a typo in the title and haven't handled any of the other problems with a question. Please note that we expect suggested edits to fix all issues with a post, rather than correcting only a single thing. To quote the Help Center [How does editing work?](${parentUrl}/help/editing):

> **Tiny, trivial edits are discouraged**; try to make the post significantly better when you edit, correcting all problems that you observe.

Do keep in mind to clean up all the problems with the post, while you are proposing edits to it. Suggested edits must also be approved by at least two other users prior to being accepted. We therefore ask users to only make edits which make substantial improvements to posts.

Your ability to suggest edits has been revoked for {suspensionDurationDays} days. We encourage you to use this time to review the [relevant guidelines](${parentUrl}/help/editing) about how to edit posts.`,
    addSuffix: false,
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
    templateName: "gold badge abuse (redupe to add answer)",
    suspensionReason: "for rule violations",
    suspensionDefaultDays: 0,
    templateBody: `We have noticed you have used your gold badge privilege to reopen a question closed as duplicate, answer it, and immediately close it again.

- <!-- Add examples of question(s) that user have reopened -->

Please note that this is not how you are supposed to use a gold tag badge.

As you may know, gold badges grant the privilege to single-handedly close and reopen questions as duplicates. This is unlocked after reaching a demanding threshold of answer score in a certain tag and number of answers, under the assumption that you can be **trusted to**:

- recognize when a question is a duplicate of another one, and close it accordingly;
- recognize when a question that is already closed as duplicate is not a duplicate, and reopen it accordingly

By reopening a duplicate with your gold badge you are essentially saying: "this question is not a duplicate and was incorrectly closed". You can answer a question that you reopen this way. However if you immediately proceed to re-close it against the same canonical, we must question your original motivations for reopening. In fact, it doesn't look good at all because you are effectively **disallowing answers to that question except yours**, and **going against others' curation efforts to self-serve your contribution**.

There are a few other appropriate actions that we ask you to consider:

- If you think that the question is not a duplicate, just leave it open. You may add links to other Q&As that are related or complement your own answer.

- If you think that the question is a duplicate, then just leave it closed. If you think the asker might have a hard time understanding how the canonical applies to their question, you may leave an explanatory comment.

- If you think that the question is a duplicate but the available canonical has inadequate answers, you either close as duplicate and then post a new answer to the canonical; or you answer this question and close the canonical as duplicate of this question, and this question becomes the new canonical.`,
  },
  {
    templateName: "gold badge abuse (reopen when answered)",
    suspensionReason: "for rule violations",
    suspensionDefaultDays: 0,
    templateBody: `We have noticed you have used your gold badge privilege to reopen a question others have closed as duplicate, when you have a stake in the question.

- <!-- Add examples of question(s) that user have reopened -->

Please note that this is not how you are supposed to use a gold tag badge.

As you may know, gold badges grant the privilege to single-handedly close and reopen questions as duplicates. This is unlocked after reaching a demanding threshold of answer score in a certain tag and number of answers, under the assumption that you can be **trusted to**:

- recognize when a question is a duplicate of another one, and close it accordingly;
- recognize when a question that is already closed as duplicate is not a duplicate, and reopen it accordingly

By reopening a duplicate with your gold badge you are essentially saying: "this question is not a duplicate and was incorrectly closed". However if you had a stake in the question and later you or others have to re-vote to close the question against the same canonical, we must question your original motivations for reopening. In fact, it doesn't look good at all because you are effectively **going against others' curation efforts to self-serve your contribution**.

There are a few other appropriate actions that we ask you to consider:

- If you think that the question is not a duplicate when **you have already answered the question**, we request that you raise a reopen discussion on [Meta](${parentUrl}/questions/ask?tags=discussion+specific-question+duplicate-questions).`,
  },
  {
    templateName: "reset inappropriate username",
    suspensionReason: "for rule violations",
    suspensionDefaultDays: 0,
    templateBody: `We have received reports that your username may be considered offensive to some members of our community. Our [Code of Conduct](${parentUrl}/conduct) requires that all usernames be appropriate for professional discourse and in keeping with our community standards.

As a result we have reset your username to the default setting. We kindly request that you do not change your username back to the previous one without first consulting with us.

If there has been any misunderstanding regarding the meaning of the username you used, please feel free to reach out to us and provide clarification by responding to this message. Additionally, if you would like to change your username to something else that is appropriate and are experiencing any issues in doing so, please let us know and we will be happy to assist.

Thank you for your understanding and cooperation.`,
  },
  {
    templateName: "account sharing",
    suspensionReason: "for rule violations",
    suspensionDefaultDays: 0,
    addSuffix: false,
    templateBody: `Company-owned or accounts shared by multiple users are not permitted as stated in the [Terms of Service](${parentUrl}/legal/terms-of-service/public):

> To access some of the public Network features you will need to **register for an account as an individual** and consent to these Public Network Terms. If you do not consent to these Public Network Terms, ${parentName} reserves the right to refuse, suspend or terminate your access to the public Network.

As this account appears to be in breach of this policy, it will be deleted. You are welcome to register again for an account as an individual user, subject to the Terms of Service.

Should you wish to appeal this decision, you can use the [Contact Us](${parentUrl}/contact) form and explaining your situation to the Community Management Team.`,
  },
  {
    soOnly: true, // because template has SO-only meta links
    templateName: "ban evasion, multiple accounts",
    suspensionReason: "for rule violations",
    suspensionDefaultDays: 30,
    templateBody: `It has come to our attention that you have been using multiple accounts to work around system limitations. The extra accounts will be removed together with any unanswered questions. Please refrain from using secondary accounts to circumvent our systems in the future.

All system and moderator-imposed limits/blocks/bans/suspensions/etc. apply to the user, not just a single account. You are not permitted to create one or more new accounts in order to get around such limitations. If you are hitting a limit on one account, then you should act as if you were hitting that limit on each of your accounts.

The most common limitations for people to attempt to evade are the system imposed question and answer bans. When you're getting the message 'We are no longer accepting questions/answers from this account', then you should act as if you are getting that message on all of your accounts and not post additional questions or answers (whichever you're hitting), even if you have an alternate account which is not banned. For more detail about question and answer bans and what you can do to get out of them, please see [What can I do when getting “We are no longer accepting questions/answers from this account”?](https://meta.stackoverflow.com/a/255584#255584)

Having more than one account is permitted, if the additional account is not used to circumvent such limitations and the accounts do not interact with each other, or otherwise allow you to do things which you would not be permitted to do with a single account. If you are interested in more information about having more than one account, please see [What are the rules governing multiple accounts (i.e. sockpuppets)?](https://meta.stackoverflow.com/q/388984).`,
  },
  {
    soOnly: true, // because template has SO-only meta links
    templateName: "demands to show effort/\"not a code-writing service\"",
    suspensionReason: "for rule violations",
    suspensionDefaultDays: 0,
    templateBody: `It has come to our attention that you've left one or more comments similar to the following:

> Please show some effort. This is not a code-writing service.

[Stack Overflow *is* a code-writing service](https://meta.stackoverflow.com/a/408565), in the sense that it is a programming Q&A site, and most questions here are solved by writing code in the answer. It is [not a debugging helpdesk for askers](https://meta.stackexchange.com/a/364585)&mdash;we do not require that askers provide existing code to debug. Lack of problem-solving effort is not a reason to close or otherwise object to questions. [The only type of effort we require is the effort required to ask a clear, focused, non-duplicate question](https://meta.stackoverflow.com/a/260909). Including an attempt often adds noise and results in answers that are applicable to just the original asker, rather than anyone doing the same thing.  Many of the most useful questions on the site do not include an existing attempt at solving the problem.

Of course, Stack Overflow is *also* not a free application design and development service. Questions may still be closed as too broad (or unclear) if that is the problem. But please do not try to limit the questions asked here to problems with *existing* code. Instead, focus on the scope and clarity of questions. The goal should be to encourage questions that might help the next person with the same problem.

Please do not post any more of these comments. They add noise for moderators to remove, may be perceived as demanding or unfriendly, and don't assist with our goal of creating a knowledge base. Please vote to close questions that you think are off-topic, unclear, or otherwise not appropriate for Stack Overflow.`,
  },
  {
    soOnly: true, // because template has SO-only meta links
    templateName: "self tag burnination",
    suspensionReason: "for rule violations",
    suspensionDefaultDays: 7,
    templateBody: `As you should be aware, there is [a process for mass tag removal](https://meta.stackoverflow.com/q/324070), also known as burnination. The [policy from Stack Exchange](https://meta.stackoverflow.com/q/356963) is that the process **must** be followed and that burninations of tags which are used on more than 50 questions **must** be discussed on Meta Stack Overflow *prior* to beginning to edit to remove the tag.

You have recently removed many tags from questions without following the burnination process. Do not do that. This message is a warning. If you do this again, with this or any other tag, then there will be further consequences.

The edits you made will be reverted. Some of the edits have other beneficial changes, which you are welcome to reapply. However, you are not permitted to systematically remove tags from questions without following the burnination process.`,
  },
  {
    soOnly: true, // because template has SO-only meta links
    templateName: "mass plagiarism",
    suspensionReason: "for plagiarism",
    suspensionDefaultDays: 30,
    templateBody: `It has come to our attention that some of your answers contain text copied from other answers or websites without giving credit to the source of the text.  This is considered plagiarism, and it is a violation of our Terms of Service and the license agreement.

You are not allowed to copy content already available elsewhere and claim it as your own.  That is, you must _at least_ provide [clear attribution](/help/referencing).

**Posts containing content from other sources must:**

  - Include the name of the original author.
  - Include a link to the original source.
  - Make it clear (using [quote formatting](/editing-help#simple-blockquotes)) **which parts of the answer are copied, and from where.** *Just putting a link to the original source somewhere in the post is not enough*, because it does not make it clear that it is the source of the content.  For more information, see [this answer](https://meta.stackoverflow.com/a/321326).
  - Add your own content to the post.  It should not be entirely (or almost entirely) copied content.

Even if you change some of the wording or code a bit, you still must credit the original source.  As a general rule, if it's recognizable when you compare the two side-by-side, it needs to give credit.

Any answers that we found with copied content that did not reference its source have been deleted.  If you wish to review them, you can view the [list of all of your deleted answers](/users/deleted-answers/current) (which may also have answers deleted for other reasons).  If you have other answers that do not properly credit their sources, and you want to avoid them being removed, please edit them to follow the above requirements.

<!-- Remove if not suspending -->

Due to the large number of plagiarized posts (requiring large amounts of volunteer moderator time to check), **your account has been temporarily suspended for {suspensionDurationDays} days.** While you're suspended, your reputation will show as 1 but will be restored once the suspension ends.

<!-- Remove the following if not bulk deleting -->

Due to the large percentage of plagiarized content, we have also opted to delete many of your answers that we were not able to check for copied content in a reasonable amount of time. While there may be some of your answers that were not plagiarized, we simply don't have the time to check every individual answer that you have posted to this site.

If there are specific answers of yours that you believe were not plagiarized (that is, they are your own, original work), and you would like to have these specific answers undeleted, you may reply to this message with a list of such answers, or raise an "In need of moderator intervention" flag on the answers with an explanation. We will verify those individual answers and consider them for undeletion.`,
    addSuffix: false,
  },
  {
    soOnly: true, // because template has SO-only meta links
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

**Answers must be a self-contained answer to the question:**  \nYour answers need to be actual, complete answers to the question. Just a link to something off-site doesn't make for an answer. [Answers must actually answer the question](https://meta.stackexchange.com/q/225370), without requiring the user to click to some other site to get enough information to solve the problem / answer the question. Please [add context around links](https://meta.stackoverflow.com/a/8259). _[Always quote](${parentUrl}/help/referencing) the most relevant part of an important link, in case the target site is unreachable or goes permanently offline._ If you are linking to a library or framework, then [explain _why_ and _how_ it solves the problem, _and provide code on how to use it_](https://meta.stackoverflow.com/a/251605). Take into account that being _barely more than a link to an external site_ is a reason as to [Why and how are some answers deleted?](${parentUrl}/help/deleted-answers).`,
  },
  {
    soOnly: true, // because template has SO-only meta links
    templateName: "ChatGPT banned; plagiarism (AI); inaccurate AI content",
    suspensionReason: "for rule violations",
    suspensionDefaultDays: 7,
    templateBody: `**Use of ChatGPT for content while its use is banned:**  \nThe use of ChatGPT as a source for content on ${parentName} is currently banned. Please see the Meta Stack Overflow question "[Temporary policy: ChatGPT is banned](https://meta.stackoverflow.com/q/421831)". It is not permitted for you to use ChatGPT to create content on ${parentName} during this ban.

**Plagiarism / failure to indicate or attribute work that's not your own (AI generated text):**  \nWe’ve noticed that at least one of your posts contains text for which you are not the author, which includes AI generated text. Current consensus is that AI generated text requires attribution. See "[Is it acceptable to post answers generated by an AI, such as GitHub Copilot?](https://meta.stackoverflow.com/q/412696)" for more information.

As a general rule, posts should be **your** original work, but including a small passage of text from another source can be a great way to support your post. Please note that **we require full attribution** with a citation/link indicating the original source, and make sure that you **clearly distinguish quoted text from text written by you**. For more information, please see [how to reference material written by others](${parentUrl}/help/referencing).

**Posting AI generated content without regard to accuracy:**  \nIt is our experience that many users who rapidly obtain content which is AI generated and then copy and paste it into answers are not vetting that content for quality. Using AI as a *tool* to *assist* generating good quality content *might be* reasonable.

Using AI, or other tools, to generate a large quantity of answers without regard to if those answers are *correct and actually answer* the question on which they are posted is not acceptable. Relying solely on readers to judge the correctness of the answer, or even that the answer actually answers the question, is not permitted. It brings down the overall quality of the site. It is *harmful* to your fellow users, burdening them with having to wade through a substantial amount of poor answers. It is often harmful to the question authors on whose questions the answers are posted, as the answers often superficially look reasonable, so the question author spends time on trying to understand the answer, thinking that the person who posted it actually knows what they are talking about, when in reality the answer doesn't really answer the question or is substantially incorrect.

The policies for what, if any, use will be acceptable of AI or similar technologies as a *tool* to **assist** *you* creating content, particularly answers, on ${parentName} are currently in flux. The restrictions which were in place prior to the existence of ChatGPT were:

1. *You* confirm that what is posted as an answer *actually answers the question*;
2. *You* have sufficient subject matter expertise in the topic of the question to be able to assure that any answer you post is correct (as if you wrote it); and
3. The content copied from such tools is indicated as not your own work by following the requirements for referencing the work of others in [how to reference material written by others](${parentUrl}/help/referencing), including, but not limited to, that the text which you copy from the AI is indicated as a quote by being in blockquote formatting, and you explicitly attribute the text.

It's expected that whatever is decided upon as the new policy for using such tools will have *at least* the above requirements, if not be even more stringent, perhaps prohibiting the use of such technologies altogether.

**Some, many, or all of your posts have been deleted:**  \nSome, many, or all of your posts may have been or will be deleted, because we believe they violate the rules and guidelines mentioned above. If you believe we are in error regarding a specific post, then feel free to raise an "in need of moderator intervention" flag on that post explaining the issue and request the post be reevaluated. You can find links to your deleted posts from your "[deleted questions](${parentUrl}/users/deleted-questions/current)" and your "[deleted answers](${parentUrl}/users/deleted-answers/current)" pages. Links to the above mentioned deleted post pages can be found at the bottom of the respective [questions](${parentUrl}/users/current?tab=questions) and [answers](${parentUrl}/users/current?tab=answers) tabs in your profile.`,
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
      //addPrefix: false,     // no pleasantries and userlink
      //addSuffix: false,     // no suspension auto message
      //addSignature: false,  // add regards and sign off. SE now adds this by default.
      //soOnly: true,         // use only if template has SO-only meta links
      //sendEmail: false,     // don't send email to the user, mod message can only be read on-site
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


async function initModMessageHelper() {

  if (location.pathname.includes('/users/message/')) {

    // We do not need chat in the sidebar, thanks.
    $('.js-chat-ad-link').closest('.s-sidebarwidget').remove();

    // Move generic warning to sidebar
    $('#mainbar > .s-notice.s-notice__warning').prependTo($('#sidebar')).find('#confirm-new').text((i, v) => v.trim());

    // Show hidden email field
    $('#js-send-email, input[name="email"]')
      .attr('type', 'checkbox')
      .addClass('s-checkbox ml4')
      .change(function () {
        $('#js-to-warning').toggleClass('hidden', !this.checked);
        $('#js-to-warning_2').toggleClass('hidden', this.checked);
      })
      .wrap('<label for="js-send-email" class="d-block">send email: </label>');

    // Show alternate message if no email
    $('#js-to-warning').after(`<div id="js-to-warning_2" class="s-notice s-notice__info mt8">The user will <em>only</em> receive this message on ${parentName}.</div>`);

    if (showHiddenFields) {
      const $userLink = $('#js-msg-form .user-details a').first();
      const username = $userLink.text();
      const maxTemplateNameLengthForNoException = templateNameModInboxException.maxMessageLengthForNoException - (username.length + templateNameModInboxException.reservedLength);

      // Show hidden fields
      $('#js-template-name, #js-suspend-reason, #js-template-edited').attr('type', 'text').addClass('d-inline-block s-input s-input__sm w70');

      $('#js-template-name')
        .on('input', function () {
          const $this = $(this);
          const label = $this.closest('label');
          const length = $this.val().length;
          const diffToMax = length - maxTemplateNameLengthForNoException;
          label.find('.somu-templateName-too-long-span').add(this).attr('title', `This message will ${diffToMax > 0 ? 'not ' : ''}be shown in the moderator inbox. Due to a bug, if ${length} (current template name length) is more than ${maxTemplateNameLengthForNoException} (max characters with this user's username), then this moderator message will not be shown in the moderator inbox.`);
          label.toggleClass('somu-templateName-too-long', length > maxTemplateNameLengthForNoException);
        })
        .wrap('<label for="js-template-name" class="d-block"></label>')
        .before(`<span class="inline-label" title="The template name is displayed only to moderators and Community Managers. It's shown in the moderator inbox, the user's User History, and some other moderator-only pages which track moderator messages.">template name:<span class="somu-templateName-too-long-span">too long for mod inbox</span></span>`);
      $('#js-suspend-reason').wrap('<label for="js-suspend-reason" class="d-block"></label>').before(`<span class="inline-label" title="publicly displayed as 'This account is temporarily suspended _____'"><span style="border-bottom: 1px dotted #000">suspend reason:</span></span>`);
      $('#js-template-edited').wrap('<label for="js-template-edited" class="d-block"></label>').before(`<span class="inline-label">template edited:</span>`);
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
      if (!modalFetchStarted && popup.length === 0) {
        // click select template link on page load
        $('#show-templates, .js-load-modal').first().trigger('click');
        setTimeout(delayedClickForFirstLoadPopupAtIntervalUntilLoading, interval);
      }
    }, delay);
  }

  // Restrict max suspension days to 365, otherwise it fails rudely
  $('#js-suspend-days').attr('type', 'number').attr('max', '365').attr('min', 1);

  const template = getQueryParam('action');
  console.log('MMH: Selected mod message template:', template);

  // Do not support low-quality-questions template, since we have "PostBanDeletedPosts" userscript for that
  // Download from https://github.com/samliew/SO-mod-userscripts/blob/master/PostBanDeletedPosts.user.js
  if (template === 'low-quality-questions') return;

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
        $('#template-0').trigger('click').triggerHandler('click');
        break;
      case 'question-repetition':
        $('#template-1').trigger('click').triggerHandler('click');
        break;
      case 'sockpuppet-upvoting':
        $('#template-2').trigger('click').triggerHandler('click');
        break;
      case 'targeted-votes':
        $('#template-3').trigger('click').triggerHandler('click');
        break;
      case 'abusive':
        $('#template-4').trigger('click').triggerHandler('click');
        break;
      case 'revenge-downvoting':
        $('#template-5').trigger('click').triggerHandler('click');
        break;
      case 'vandalism':
        $('#template-6').trigger('click').triggerHandler('click');
        break;
      case 'signatures-taglines':
        $('#template-7').trigger('click').triggerHandler('click');
        break;
      case 'promotion':
        $('#template-8').trigger('click').triggerHandler('click');
        break;
      case 'excessive-discussion':
        $('#template-9').trigger('click').triggerHandler('click');
        break;
      case 'plagiarism':
        $('#template-10').trigger('click').triggerHandler('click');
        break;
      case 'other':
        $('#template-11').trigger('click').triggerHandler('click');
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
            actionListItem.trigger('click');

            // Set custom susp duration to template default days
            if (defaultSuspendDurationDays > 0) $('#js-suspend-days').val(defaultSuspendDurationDays);
          }
        });
      }
    }

    const popupSubmit = popup.find(popupSubmitButtonsSelector);
    if (!popupSubmit.prop('disabled')) popupSubmit.trigger('click');
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
      return $(`#${id}`).prop('checked', !toState).trigger('click');
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
      $('#js-template-name').trigger('input');
    }, 25);
  }

  function addCustomModMessageTemplates() {

    // Make the popup draggable!
    const popup = $('.s-modal--dialog').first();
    popup.attr('data-controller', 'se-draggable');
    popup.find('h1').first().attr('data-target', 'se-draggable.handle');

    // Watch for the popup to be submitted.
    popup.find(popupSubmitButtonsSelector).on('click input', watchForPopupSubmitClick);

    const actionList = popup.find('.action-list');
    if (actionList.length === 0) return;

    // Do not continue if there are no custom mod message templates
    if (customModMessages.length === 0) return;

    // Add description expand/collapse events for custom templates
    actionList.append('<hr><div class="mb4">Custom Templates:</div>');
    actionList.on('click', '.js-custom-template', function () {
      $(this).addClass('js-action-selected').find('.js-action-desc').removeClass('d-none');
      $(this).find('input:radio').prop('checked', true);
      $(this).siblings().find('.js-action-desc').addClass('d-none');
      $(popupSubmitButtonsSelector).prop('disabled', false);
    });

    // Message vars (should not be edited here)
    const numberOfItems = actionList.children('li').length;
    const sitename = StackExchange.options.site.name;
    const userId = $('#aboutUserId').val();
    const $userLink = $('#js-msg-form .user-details a').first();
    const userLink = location.origin + $userLink.attr('href');
    const username = $userLink.text();

    // Please preserve the line breaks in these string templates
    const messagePrefix = `Hello,

We're writing in reference to your ${sitename} account:

${userLink}

`;

    const messageSuffix = `

{optionalSuspensionAutoMessage}`;

    const messageSignature = `

Regards,  \n${sitename} Moderation Team`;


    customModMessages.forEach(function (item, i) {
      if (item.templateName.length > templateNameModInboxException.maxTemplateNameLengthForNoException) {
        const issue = `Template name "${item.templateName}" is ${item.templateName.length} characters long, which is longer than the "maximum" of 55. Template names which are longer than 55 characters may result in some mod messages that are sent not being seen in the moderator inbox if the user's username is long.`;
        console.error(issue);
      }
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

      $('#js-template-name').wrap('<label for="templateName" class="d-block"></label>').before(`<span class="inline-label">template name:</span>`);
    }
  }

  // The rest of this function is for creating new messages
  if (!location.pathname.includes('/admin/cm-message/create/')) return;

  const template = getQueryParam('action');
  console.log('MMH: Selected CM message template:', template);

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
  $('#show-templates').trigger('click');


  function selectCmMessage(template) {
    const popup = getPopup();
    const actionList = popup.find('.action-list');
    const hr = actionList.children('hr').index();
    const numberOfItems = hr > 0 ? hr : actionList.children('li').length;

    switch (template) {
      case 'profile-merge':
        $('#template-0').trigger('click').triggerHandler('click');
        break;
      case 'post-dissociation':
        $('#template-1').trigger('click').triggerHandler('click');
        break;
      case 'suspicious-voting':
        $('#template-2').trigger('click').triggerHandler('click');
        break;
      case 'spam':
        $('#template-3').trigger('click').triggerHandler('click');
        break;
      case 'suicidal-user':
        $('#template-4').trigger('click').triggerHandler('click');
        break;
      case 'underage-user':
        $('#template-5').trigger('click').triggerHandler('click');
        break;
      case 'other':
        $('#template-6').trigger('click').triggerHandler('click');
        break;
      default: {
        // Try to match a custom template
        template = template.replace(/\W/g, '').toLowerCase();
        customCmMessages.forEach(function (v, i) {
          const match = v.templateName.replace(/\W/g, '').toLowerCase().includes(template);
          if (match) {
            actionList.children('li').eq(numberOfItems + i).trigger('click');
          }
        });
      }
    }

    const popupSubmit = popup.find(popupSubmitButtonsSelector);
    if (!popupSubmit.prop('disabled')) popupSubmit.trigger('click');
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
      $(popupSubmitButtonsSelector).prop('disabled', false);
    });

    // Message vars (should not be edited here)
    const numberOfItems = actionList.children('li').length;
    const sitename = StackExchange.options.site.name;
    const modName = $('#js-msg-form a').first().text();
    const userId = $('#aboutUserId').val();
    const userLink = location.origin + $('#js-msg-form .user-details a').first().attr('href');

    // Please preserve the line breaks in these string templates
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

function generateCmOrModMessageTemplate(isCmMessage, item, i, numberOfItems, messagePrefix, messageSuffix, messageSignature = "") {
  const templateNumber = numberOfItems + i;
  const templateBodyText = (item.addPrefix !== false ? messagePrefix : '') + item.templateBody + (item.addSuffix !== false ? messageSuffix : '') + (item.addSignature === true ? messageSignature : '');
  const templateBodyProcessed = escapeText(templateBodyText);
  const templateShortText = item.templateBody.length > 400 ? item.templateBody.replace(/(\n|\r)+/g, ' ').substr(0, 397) + '...' : item.templateBody;
  const templateSuspensionReason = escapeText(item.suspensionReason || '');
  const templateName = escapeText(item.templateName || '');

  // 2022-10: The HTML for the mod-message templates changed substantially, so it's no longer the same as for CM escalations.
  // So, we return distinctly different HTML. OTOH, there are currently no custom mod message templates.
  if (isCmMessage) {
    // CM message template, maybe (untested)
    return `
      <li style="width: auto" class="js-custom-template"><label>
      <input type="radio" id="template-${templateNumber}" name="mod-template" value="${templateBodyProcessed}">
      <input type="hidden" id="template-${templateNumber}-reason"
        value="${item.suspensionReason || ''}"
        ${item.sendEmail === false ? 'data-send-email="false"' : ''}
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
        ${item.sendEmail === false ? 'data-send-email="false"' : ''}
        data-days="${isNaN(item.suspensionDefaultDays) || item.suspensionDefaultDays <= 0 ? '' : item.suspensionDefaultDays}">
      <span class="js-action-name fw-bold ${item.soOnly ? 'so-only' : ''}">${templateName}</span>
      <span class="js-action-desc d-none"><div class="ml16 mb6">${templateShortText}</div></span>
      </label></li>`;
  }
}


function appendModMessageMenu() {

  // Create menu based on post type and state
  function _createMenu(opts) {
    const { elem, uid, pid = null } = opts;

    const modMessageLink = `${parentUrl}/users/message/create/${uid}`;
    const cmMessageLink = `${parentUrl}/admin/cm-message/create/${uid}`;
    const postIdParam = pid ? '&' + (!isMetaSite ? `pid=${pid}` : `metapid=${pid}`) : '';

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
        if (v.soOnly === true && !(isSO || isSOMeta)) return; // Don't add menu item if not SO-only (including SO meta) template
        menuitems += `<a target="_blank" href="${modMessageLink}?action=${v.templateName.replace(/\W/g, '').toLowerCase()}" class="${v.soOnly ? 'so-only' : ''}">${v.templateName}</a>`;
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

    $(elem).append(`
      <div class="js-mod-message-link flex--item s-btn ta-center py8 somu-mod-message-link ${modMenuOnClick ? 'click-only' : ''}" data-shortcut="O" title="Contact...">
        <svg aria-hidden="true" role="img" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="svg-icon mln1 mr0">
          <path fill="currentColor" d="M464 64H48C21.5 64 0 85.5 0 112v288c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48zM48 96h416c8.8 0 16 7.2 16 16v41.4c-21.9 18.5-53.2 44-150.6 121.3-16.9 13.4-50.2 45.7-73.4 45.3-23.2.4-56.6-31.9-73.4-45.3C85.2 197.4 53.9 171.9 32 153.4V112c0-8.8 7.2-16 16-16zm416 320H48c-8.8 0-16-7.2-16-16V195c22.8 18.7 58.8 47.6 130.7 104.7 20.5 16.4 56.7 52.5 93.3 52.3 36.4.3 72.3-35.5 93.3-52.3 71.9-57.1 107.9-86 130.7-104.7v205c0 8.8-7.2 16-16 16z" class="" data-darkreader-inline-fill="" style="--darkreader-inline-fill:currentColor;"></path>
        </svg>
        <div class="somu-mod-message-menu" id="somu-mod-message-menu" data-pid="${pid}" role="dialog">
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
  }

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
        const userlink = userbox.find('a[href^="/users/"]:not(.deleted-user)');
        uid = getUserId(userlink.attr('href'));
        this.dataset.uid = uid;
      }
      catch (ex) { } // can't put return statements in catch blocks?
      if (typeof uid === 'undefined' || !uid) return; // e.g.: author edit or deleted user

      // if user is self, ignore
      //if (uid == selfId) return;

      const post = userbox.closest('.question, .answer');
      const pid = post.attr('data-questionid') || post.attr('data-answerid');

      const userlink = userbox.find('a').attr('href');
      const userrep = userbox.find('.reputation-score').text();
      const username = userbox.find('.user-details a').first().text();
      const modFlair = userbox.find('.mod-flair');

      // if user is mod, ignore
      //if (uid == -1 || modFlair.length == 1) return;

      _createMenu({
        elem: userbox,
        uid,
        username,
        userlink,
        userrep,
        pid
      });
    });

  // Append link to user header in profile pages
  if (currentUserId) {
    $('.js-user-header .s-navigation').last()
      .not('.js-mod-message-menu')
      .addClass('js-mod-message-menu')
      .each(function () {


        _createMenu({
          elem: $(this),
          uid: currentUserId
        });
      });
  }

  // If we didn't add an actual mod message link, then remove the js-mod-message-menu class.
  $('.js-mod-message-menu')
    .filter(function () { return $(this).find('.js-mod-message-link').length === 0; })
    .removeClass('js-mod-message-menu');
  // Let CSS know that the .user-action-time is blank
  $('.js-mod-message-menu .user-action-time')
    .filter(function () {
      const $this = $(this);
      return $this.children().length === 0 && $this.text().trim().length === 0;
    })
    .addClass('user-action-time-is-blank');

  // Show menu on click only
  if (modMenuOnClick) {
    $(document).on('click', null, function () {
      $('.somu-mod-message-link.active').removeClass('active');
    });
    $('.js-mod-message-menu').on('click', '.somu-mod-message-link', function (evt) {
      const $this = $(this);
      $this.addClass('active');
      evt.stopPropagation();
      const menu = $this.find('.somu-mod-message-menu');
      const menuRect = menu[0].getBoundingClientRect();
      const menuLeftPosition = menuRect.left;
      if (menuLeftPosition < 0) {
        // The menu is currently off the viewport to the left, so adjust it to be inside.
        const menuCssLeftPx = Number((menu.css('left').match(/\d+/) || [0])[0]);
        menu.css({
          'left': `calc(${menuCssLeftPx - menuLeftPosition}px + 1vw)`,
          'right': 'unset',
          'transform': 'translate(-50%, 0)',
        });
      }
      const menuRightPosition = menuRect.right;
      if (menuRightPosition > window.innerWidth) {
        // The menu is currently off the viewport to the right, so adjust it to be inside.
        menu.css({
          'left': 'unset',
          'right': `0`,
          'transform': 'none',
        });
      }
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


// Append styles
addStylesheet(`
.user-info.js-mod-message-menu,
.s-user-card.js-mod-message-menu {
  position: relative;
  border: 1px solid transparent;
}
.user-info.js-mod-message-menu,
  min-height: 88px;
}
.user-info.js-mod-message-menu:hover,
.s-user-card.js-mod-message-menu:hover {
  /*border-color: var(--black-200);*/
}
.user-info.js-mod-message-menu:not(.js-mod-quicklinks):not(.s-topbar--item),
.s-user-card.js-mod-message-menu:not(.js-mod-quicklinks):not(.s-topbar--item):not(.s-user-card__minimal) {
  padding-bottom: 25px;
}
.js-mod-message-menu .user-action-time {
  min-height: 15px;
}
.js-mod-message-menu .user-action-time.user-action-time-is-blank {
  display: none;
}

.so-only:after,
.js-action-name .so-only:after,
.js-mod-message-menu .so-only:after {
  content: '(SO-only)';
  display: inline-block;
  margin-left: 0.5em;
  font-style: italic;
  font-size: 0.8em;
  color: var(--orange-500);
}

.mod-summary .user-info.js-mod-message-menu,
.mod-summary .s-user-card.js-mod-message-menu,
.mod-summary .js-mod-message-menu .user-action-time,
.single-badge-user .user-info.js-mod-message-menu,
.single-badge-user .s-user-card.js-mod-message-menu,
.single-badge-user .js-mod-message-menu .user-action-time,
.cast-votes .user-info.js-mod-message-menu,
.cast-votes .s-user-card.js-mod-message-menu {
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
.js-user-header .s-navigation,
.js-user-header .somu-mod-message-link {
  position: relative !important;
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
  cursor: auto;

  max-width: calc(100vw - 24px);
  z-index: 99999;

  user-select: none;
  white-space: nowrap;

  background: var(--white);
  border-radius: 2px;
  border: 1px solid transparent;
  box-shadow: 0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12), 0 5px 5px -3px rgba(0,0,0,0.2);

  text-align: left;
  font-size: 0.923rem;
  font-family: Roboto,RobotoDraft,Helvetica,Arial,sans-serif;
  letter-spacing: .2px;
  line-height: 20px;
}
#somu-mod-message-menu {
  background: var(--white) !important;
}
.somu-mod-message-link .somu-mod-message-menu > div {
  min-width: 170px;
  /*max-height: min(70vh, 650px);*/
  padding: 0 0 6px;
  overflow: auto;
}
.somu-mod-message-header {
  position: sticky;
  top: 0;

  display: block !important;
  margin-top: 12px;
  margin-bottom: 5px;
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  padding-right: 1rem;
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
  padding: 5px 0;
  padding-left: 1.5rem;
  padding-right: 1rem;
  line-height: 1.15;
  cursor: pointer;
  color: var(--black-900) !important;

  display: flex;
  align-items: center;
  justify-content: space-between;
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
#js-msg-form #js-to-warning.hidden,
#js-msg-form #js-to-warning + #js-to-warning_2 {
  display: none;
}
#js-msg-form #js-to-warning,
#js-msg-form #js-to-warning.hidden + #js-to-warning_2 {
  display: inline-block;
}
#js-msg-form #js-suspend-days {
  width: 70px;
}
#js-msg-form .suspend-info {
  padding: 10px;
  font-weight: bold;
  margin-bottom: 10px;
  margin-top: 5px;
  border: 1px dotted #AE0000;
}
#msg-form textarea#wmd-input,
#js-msg-form textarea#wmd-input {
  min-height: 550px;
}
#js-msg-form .form-submit.js-form-submit-controls {
  position: sticky;
  bottom: 0;
  margin: 0 -10px;
  padding: 20px 10px 15px;
  background: var(--theme-content-background-color);
  z-index: 2;
}
#mainbar > table + div:has(+ h2) {
  /* Add s-notice styles to this unstyled div */
  --_no-bc: var(--bc-medium);
  --_no-bg: var(--black-050);
  --_no-fc: var(--fc-medium);
  --_no-btn-bg-focus: var(--black-100);
  --_no-btn-bg-active: var(--black-150);
  background: var(--_no-bg);
  border-color: var(--_no-bc);
  color: var(--_no-fc);
  border-style: solid;
  font-size: var(--fs-body1);
  border-radius: var(--br-sm);
  border-width: var(--su-static1);
  padding: var(--su16);

  margin-bottom: 2rem;
}
#sidebar .module {
  margin-bottom: 30px;
}
#sidebar .module #confirm-new {
  white-space: break-spaces;
  line-height: 1.2;
}
.user-info.somu-mod-message-is-open {
  overflow: unset;
}
.somu-templateName-too-long input {
  vertical-align: top;
}
.somu-templateName-too-long-span {
  display: none;
  color: red;
  font-weight: bold;
  margin-left: 10px;
}
.somu-templateName-too-long .somu-templateName-too-long-span {
  display: block;
}
.post-ban-textarea {
  min-height: 200px;
}
`); // end stylesheet


// On script run
(function init() {
  appendModMessageMenu();
  initModMessageHelper();
  initCmMessageHelper();

  // 2022-10 SE mod message page update: Fix a new bug in replying when the previous message was recent, which will, hopefully, be fixed quickly.
  $('.hidemsg').addClass('js-hide-msg');

  // After requests have completed
  $(document).ajaxStop(nowAndDelayedAppendModMessageMenu);
})();