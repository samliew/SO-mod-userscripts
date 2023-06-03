// ==UserScript==
// @name         Additional Post Mod Actions
// @description  Adds a menu with mod-only quick actions in post sidebar
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      5.6.11
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
// @require      https://unpkg.com/sweetalert/dist/sweetalert.min.js
// ==/UserScript==

/* eslint-disable no-multi-spaces */
/* global swal:readonly          */
/* global $:readonly             */
/* global StackExchange:readonly */
/* global fkey:readonly          */
/* global isSO:readonly          */
/* global isSOMeta:readonly      */
/* global isMetaSite:readonly    */
/* global selfId:readonly        */
/// <reference types="./globals" />

'use strict';

// This is a moderator-only userscript
if (!isModerator()) return;

// Yes, you can declare the variable apikey here and have it picked up by the functions in se-ajax-common.js
const apikey = 'lSrVEbQTXrJ4eb4c3NEMXQ((';
const newlines = '\n\n';

// Add your user ID here (or set the corresponding value in your Local Storage) to promote yourself
// to a "superuser", which enables rarely-used options and decreases the number of confirmations.
const superusers = [584192, 366904, 6451573];
const isSuperuser = superusers.includes(selfId) ||
  ((localStorage.getItem('SOMU-aipmm.isSuperuser') ?? 'false') === 'true');

// This option defaults to "false". Manually set it to "true" (or set the corresponding value
// in your Local Storage) to allow destroying spam accounts as fast as possible
// without multiple confirmations.
const underSpamAttackMode = (localStorage.getItem('SOMU-aipmm.underSpamAttackMode') ?? 'false') === 'true';

// This option defaults to "true". Manually set it to "false" (or set the corresponding value
// in your Local Storage) to make the size of the inserted quicklinks match the standard ones.
const smallerQuicklinks = (localStorage.getItem('SOMU-aipmm.smallerQuicklinks') ?? 'true') === 'true';


/*
 * Reload functions
 */
const reloadPage = () => {
  // If in mod queues, do not reload
  if (isModDashboardPage) return false;
  location.reload();
};
const reloadWhenDone = () => {
  // Triggers when all ajax requests have completed
  $(document).ajaxStop(function () {
    // Stop subsequent calls
    $(this).off("ajaxStop");
    reloadPage();
  });
};
const reloadPost = async pid => {
  if (pid && StackExchange?.realtime?.reloadPosts) {
    const result = await StackExchange.realtime.reloadPosts(pid);
    if (result) return true;
  }
  return reloadPage();
};


/*
 * Post dissociation feature functions
 */
const sendCmDissociateMessage = async (uid, pid, postType = 'question') => {

  // Build message
  const messageText = `Hello,

I'm writing in reference to the Stack Overflow account:

${location.origin}/users/${uid}

The following ${postType} need to be dissociated from the author's profile:

${location.origin}/${postType === 'question' ? 'q' : 'a'}/${pid}

**This was requested by the post author via custom flag.**

Regards,
A ${StackExchange.options.site.name} moderator`;

  // Send CM message
  return await sendCmMessage(pid, 'post-dissociation', messageText);
};

function updateModTemplates() {

  const template = $('.popup input[name=mod-template]').filter((i, el) => $(el).next().text().includes('post disassociation'));
  let addstr = '';

  // Build list of posts
  const pids = getQueryParam('pid').split('|');
  pids.forEach(function (v) {
    if (v.length === 0) return;
    addstr += `${location.origin}/a/${v}` + newlines;
  });

  // Build list of meta posts
  const metaPids = getQueryParam('metapid').split('|');
  metaPids.forEach(function (v) {
    if (v.length === 0) return;
    addstr += `${metaUrl}/a/${v}` + newlines;
  });

  if (addstr === '') addstr = newlines;

  // Insert to template
  template.val(template.val()
    .replace(/:\s+{todo}/, ':<br>\n' + addstr + '**Requested via custom flag.**' + newlines) // replace todo with additional information
  ).trigger('click');

  $('.popup-submit').trigger('click');

  // Failsafe
  $('#templateName').val('post disassociation');
};

function initPostDissociationHelper() {

  // Only on main sites
  if (isMetaSite) return;

  // Run once, whether on AdditionalPostModActions or AdditionalInlinePostModMenu
  if (document.body.classList.contains('SOMU-PostDissociationHelper')) return;
  else document.body.classList.add('SOMU-PostDissociationHelper');

  // If on contact CM page and action = dissocciate
  if (location.pathname.includes('/admin/cm-message/create/') && getQueryParam('action') == 'post-dissociation') {

    // On any page update
    $(document).ajaxComplete(function (event, xhr, settings) {

      // If CM templates loaded on contact CM page, and action = dissocciate, update templates
      if (settings.url.includes('/admin/contact-cm/template-popup/')) {

        // Run once only. Unbind ajaxComplete event
        $(event.currentTarget).unbind('ajaxComplete');

        // Update CM mod templates
        setTimeout(updateModTemplates, 500);
      }
    });

    // click template link
    $('#show-templates').trigger('click');

    return;
  }

  // If on mod flag queues, remove close question and convert to comment buttons when flag message contains "di(sa)?ssociate", and add "dissociate" button
  if (isModDashboardPage) {
    const dissocFlags = $('.revision-comment.active-flag').filter((i, v) => v.innerText.match(/di(sa)?ssociate/));
    const dissocPosts = dissocFlags.closest('.js-flagged-post');
    dissocPosts.each(function () {
      const post = $(this);
      const userlink = post.find('.mod-audit-user-info a');
      const uid = getUserId(userlink.attr('href'));

      // User not found, probably already deleted
      if (!uid) return;

      const pid = post.attr('data-post-id') || post.attr('data-questionid') || post.attr('data-answerid');
      $('.js-post-flag-options', this).prepend(`<a href="${location.origin}/admin/cm-message/create/${uid}?action=post-dissociation&pid=${pid}" class="btn" target="_blank">dissociate</a>`);

      $('.close-question-button, .js-convert-to-comment', this).hide();
    });
    return;
  }
};


/*
 * Confirm functions
 */
async function promptToRedFlagPost(pid, postType, rudeFlag, isLocked, isDeleted, isFlagDeleted) {
  if (typeof pid === 'undefined' || pid === null) { throw new Error('null or undefined pid'); }

  const noun = rudeFlag ? 'rude/abusive' : 'spam';
  const confirmMsg = !isFlagDeleted
    ? `Are you sure you want to red-flag nuke this ${postType} (post\xa0ID\xa0${pid}) as ${noun.toUpperCase()}?\n\n(All penalties associated with a ${noun} flag will apply.)`
    : `Are you sure you want to change the red flag on this ${postType} (post\xa0ID\xa0${pid}) to ${noun.toUpperCase()}?\n\n(This should only be done to change a spam flag to a rude/abusive flag in order to prevent the post from being chosen as an audit. Do not choose this option if you have already flagged the post as rude/abusive, as you cannot re-raise a flag of the same type, even as a moderator. All penalties associated with a ${noun} flag will still apply.)`;
  let needsRefresh = false;
  if (confirm(confirmMsg)) {
    try {
      if (isLocked || isFlagDeleted) {
        await unlockPost(pid);
        needsRefresh = true;
      }
      if (isLocked || isFlagDeleted || isDeleted) {
        await undeletePost(pid);
        needsRefresh = true;
      }
      await flagPost(pid, rudeFlag);
      needsRefresh = true;
    }
    catch (e) {
      alert('An error occurred; please see the console for details on exactly what failed.');
      needsRefresh = false;  // unconditionally prevent refresh to avoid clearing the console
    }
  }
  return needsRefresh;
};
async function promptToNukePostAndUser(pid, isQuestion, isDeleted, uid, uName, spammer, usercardHtml = null) {
  if (typeof uid === 'undefined' || uid === null) { throw new Error('null or undefined uid'); }

  const postType = spammer ? 'spam' : 'trolling/abusive';
  const userType = spammer ? 'spammer' : 'troll';
  const nukePost = pid && !isDeleted;
  const userInfo = (await Promise.allSettled([getUserInfoFromApi(uid)]))[0].value;

  // Display the confirmation and options dialog.
  let swalContentHtml = `<div class="group"><div class="info">`; // begin first info group
  if (usercardHtml) {
    swalContentHtml += usercardHtml;
  }
  if (userInfo) {
    // To counteract information overload, only display what is not already displayed in the user-card
    // (which is always visible on the page on the associated post, and also added inline to this dialog,
    // if possible). Therefore, reputation and badge information is not included in this text.
    // The user account name and ID are still displayed for double-checking purposes and for linkability
    // (since clicking on links in the user-card under the post would dismiss the modal dialog).
    const creationDate = seApiDateToDate(userInfo?.creation_date);
    const modifiedDate = seApiDateToDate(userInfo?.last_modified_date);
    const accessDate = seApiDateToDate(userInfo?.last_access_date);
    const hasOtherPosts = isQuestion ? (Number(userInfo?.question_count) > 1 || Number(userInfo?.answer_count) > 0)
      : (Number(userInfo?.question_count) > 0 || Number(userInfo?.answer_count) > 1);

    swalContentHtml += `
      The <i>${userInfo.user_type}</i> user,
      &quot;<a href="${userInfo.link}"><strong>${uName}</strong></a>&quot;
      (ID&nbsp;<code>${uid}</code>${userInfo?.account_id ? `; <a href="https://stackexchange.com/users/${userInfo.account_id}?tab=accounts">network&nbsp;account</a>&nbsp;ID&nbsp;<code>${userInfo.account_id}</code>` : ''}),
      was
      <strong>created&nbsp;<span title="${dateToIsoString(creationDate).replaceAll(' ', '&nbsp;')}">${dateToRelativeTime(creationDate).replaceAll(' ', '&nbsp;')}</span></strong>${modifiedDate ? `, last&nbsp;<strong>modified&nbsp;<span title="${dateToIsoString(modifiedDate).replaceAll(' ', '&nbsp;')}">${dateToRelativeTime(modifiedDate).replaceAll(' ', '&nbsp;')}</span></strong>,` : ''}
      and <strong>last&nbsp;seen&nbsp;<span title="${dateToIsoString(accessDate).replaceAll(' ', '&nbsp;')}">${dateToRelativeTime(accessDate).replaceAll(' ', '&nbsp;')}</span></strong>.
      They have
      <a href="${userInfo.link}?tab=questions&sort=newest"><strong>${userInfo.question_count}</strong>&nbsp;non&#8209;deleted&nbsp;question${userInfo.question_count !== 1 ? 's' : ''}</a>
      and
      <a href="${userInfo.link}?tab=answers&sort=newest"><strong>${userInfo.answer_count}</strong>&nbsp;non&#8209;deleted&nbsp;answer${userInfo.answer_count !== 1 ? 's' : ''}</a>.`;

    if (hasOtherPosts > 0) {
      swalContentHtml += `<div class="s-notice s-notice__warning" role="status">User has other non-deleted posts: be sure to check these before destroying the account!</div>`;
    }
  }

  // end first info group and begin next group
  swalContentHtml += `
    </div></div>
    <div class="group">
      <div class="header">Optional Overrides:</div>`;

  swalContentHtml += `
    <div class="option">
      <input type="checkbox" name="aipmm-bowdlerize-toggle" id="aipmm-bowdlerize-toggle" />
      <label for="aipmm-bowdlerize-toggle" title="Enabling this option will clear all fields in the user's profile to remove spam content and reset the display name.&#13;(If the account is removed on this site, the original info is still retrieved and recorded in the deleted user record.)">
        Bowdlerize profile and push edits to all sites
      </label>
    </div>`;

  if (spammer) {
    swalContentHtml += `
      <div class="option">
        <input type="checkbox" name="aipmm-noaudit-toggle" id="aipmm-noaudit-toggle" ${nukePost ? '' : 'disabled'}/>
        <label for="aipmm-noaudit-toggle" title="Enabling this option will nuke the post as &quot;rude/abusive&quot;, thus preventing it from being automatically selected as an audit.&#13;Otherwise, if this option is not enabled, the post will be nuked as &quot;spam&quot, thus allowing it to be selected as an audit.">
          Prevent post from becoming a spam audit
        </label>
      </div>`;
  }

  swalContentHtml += `
    <div class="option">
      <input type="checkbox" name="aipmm-suspendonly-toggle" id="aipmm-suspendonly-toggle" />
      <label for="aipmm-suspendonly-toggle" title="Enabling this option will prevent the account from being destroyed. Instead, it will automatically send a message that suspends the user for the maximum duration that is permitted for moderators (365 days).&#13;This is intended to be used in situations where you'd prefer to keep the account around (e.g., for follow-up investigations or because staff has requested it).">
        Skip destroying user&mdash;only suspend for maximum duration of 1 year
      </label>
    </div>`;

  // end second group
  swalContentHtml += `</div>`;

  // final group
  swalContentHtml += `
    <div class="group">
      <div class="header">Destroy Details:</div>
      <textarea autocapitalize="sentences"
        autocomplete="on"
        autocorrect="on"
        placeholder="Optional context and details for why you are destroying the account. (This will be included with the deleted user profile.)"
      ></textarea>
    </div>`;

  const swalContent = document.createElement('div');
  swalContent.innerHTML = swalContentHtml;
  // TODO: Add option to report to Smokey before nuking, with checkbox and nested textbox, a la SIM.
  //       (For spammer, default message to 'reported by site moderator as spam';
  //        for troll, default message to 'reported by site moderator for training'.)
  swalContent.querySelector('#aipmm-suspendonly-toggle').addEventListener('click', (event) => {
    const suspendOnly = event.target.checked;
    const modal = event.target.closest('.swal-modal');
    if (modal) {
      const textarea = modal.querySelector('textarea');
      if (textarea) {
        textarea.disabled = suspendOnly;
      }

      const submitBtn = modal.querySelector('.swal-button--confirm.swal-button--danger');
      if (submitBtn) {
        let label = submitBtn.textContent;
        if (suspendOnly) label = label.replace('Destroy', 'Suspend');
        else label = label.replace('Suspend', 'Destroy');
        submitBtn.textContent = label;
      }
    }
  });
  let needsRefresh = false;
  const skipAllDialogs = selfId === 584192;
  try {
    const confirmed = skipAllDialogs || await swal({
      title: `Nuke ${nukePost ? `this post as ${postType} and ` : ''} the user "${uName}" as a ${userType}?`,
      buttons:
      {
        confirm:
        {
          text: `Destroy "${uName}" as ${userType}`,
          value: true,
          visible: true,
          closeModal: false,
          className: 's-btn s-btn__filled s-btn__danger',
        },
        cancel:
        {
          text: 'Cancel',
          value: null,
          visible: true,
          closeModal: true,
          className: 's-btn s-btn__muted',
        }
      },
      dangerMode: true,
      closeOnEsc: true,
      closeOnClickOutside: true,
      backdrop: false,
      content: swalContent,
    });
    if (skipAllDialogs || confirmed) {
      const bowdlerize = skipAllDialogs ? false : document.querySelector('#aipmm-bowdlerize-toggle').checked;
      const rudeFlag = skipAllDialogs ? false : !spammer || document.querySelector('#aipmm-noaudit-toggle').checked;
      const suspendOnly = skipAllDialogs ? false : document.querySelector('#aipmm-suspendonly-toggle').checked;
      const details = skipAllDialogs ? '' : document.querySelector('.swal-content textarea').value.trim();
      if ((spammer && underSpamAttackMode) ||
        isSuperuser ||
        confirm(`Are you certain that you want to${nukePost ? ' nuke this post and ' : ' '}${suspendOnly ? 'SUSPEND' : 'DESTROY'} the account "${uName}" as a ${userType}?`)) {
        // TODO: If post has already been flag-nuked as spam, but "rudeFlag" is set, change it.
        //       (This requires undeleting the post, unlocking it, and then re-flagging it.
        //       But, more importantly, it requires determining how the post has been flagged.)
        //       For now, if the post has already been deleted, just don't do anything.
        //       (The option to raise a rude flag instead will have been disabled.)
        if (nukePost) {
          await flagPost(pid, rudeFlag);
          needsRefresh = true;
        }

        // If we are to suspend the user, then do so first. This ensures that their *current*
        // name appears in the mod message, not what it gets reset to after bowdlerization.
        // Note that we no longer send a suspension before destroying the account. This is because:
        // (1) a recent system change makes it obsolete (accounts destroyed for the reason we use
        // are blocked for 365 days, instead of 14 days), and (2) doing so without the workaround
        // to prevent the message from showing up in the global mod inbox (padding the message name
        // out with spaces to make it extremely long), which is virtually necessary to keep the
        // mod inbox usable on Stack Overflow, generates exceptions, causing staff to request that
        // we stop using it. Sending the suspension first does marginally improve the UX for users
        // who recreate the account (which is stupidly easy to do), in that the reason why their
        // old account was destroyed appears in their inbox (although they cannot actually view it,
        // only see the preview), but (1) it is not all that important to improve the UX for users
        // whose account has been destroyed, (2) this is not a big enough improvement to justify
        // irritating staff/devs, and (3) if this is actually desirable (which it probably is), it
        // should simply be implemented at the system level when any account that has been destroyed
        // or deleted for the reasons that automatically suspend upon re-creation is re-created.
        if (suspendOnly) {
          await modMessageUser(uid,
            'Account disabled for spamming and/or abusive behavior. You\'re no longer welcome to participate here.',
            false,  // do not email (show message on-site only)
            365,    // suspend for 365 days (maximum duration)
            `suspend ${userType}`,
            spammer ? 'for promotional content' : 'for rule violations');
          needsRefresh = true;
        }

        // Before bowdlerizing, which will reset some of the PII fields, retrieve the current PII
        // so that it can be recorded in the deletion record (this info is inaccessible or perhaps
        // removed entirely for deleted/destroyed accounts, so this step is critical to preserve
        // the information for later investigations, if necessary). Of course, we don't want to
        // retrieve PII unnecessary, not only for information-privacy reasons, but also for speed
        // and rate-limiting concerns. Therefore, we only retrieve the PII if we are actually
        // going to destroy the account (i.e., if we are not only suspending).
        const pii = !suspendOnly ? await getUserPii(uid) : null;
        if (bowdlerize) {
          await resetUserProfile(uid);
          needsRefresh = true;
        }

        // If we are to destroy the user, then do so now, after everything else has been done.
        // Pass in the user information and PII that we cached in order for it to be recorded.
        if (!suspendOnly) {
          await destroyUser(uid,
            details,
            'This user was created to post spam or nonsense and has no other positive participation',
            userInfo,
            pii);
          needsRefresh = true;
        }

        // If the account was bowdlerized and/or destroyed, show the user profile page
        // in a new pop-up window. (Exception: don't do it when destroying a spammer's
        // account when the site is under a spam attack, or ever for superusers.)
        if ((bowdlerize || !suspendOnly) && (!underSpamAttackMode || !spammer) && !isSuperuser) {
          window.open(`${location.origin}/users/${uid}`,
            '_blank',
            'popup=true');
        }
      }
    }
  }
  catch (e) {
    console.error(e);
    alert('An error occurred; please see the console for details on exactly what failed.');
    needsRefresh = false;  // unconditionally prevent refresh to avoid clearing the console
  }

  // Try closing swal dialog
  try {
    swal.stopLoading();
    swal.close();
  }
  catch (e) { }

  return needsRefresh;
};


/*
 * UI functions
 */
function addPostModMenuLinks() {

  // Add post issues container in mod flag queues, as expanded posts do not have this functionality
  $('.js-flagged-post .votecell .vote').filter(function () {
    return $(this).children('.js-post-issues').length == 0;
  }).each(function () {
    const post = $(this).closest('.answer, .question');
    const pid = post.attr('data-questionid') || post.attr('data-answerid') || post.attr('data-post-id');
    $(this).append(`
      <div class="js-post-issues grid fd-column ai-stretch gs4 mt16">
        <a class="grid--item s-btn s-btn__muted" href="/posts/${pid}/timeline" data-shortcut="T" title="Timeline" target="_blank">
        <svg aria-hidden="true" class="svg-icon mln1 mr0 iconHistory" width="19" height="18" viewBox="0 0 19 18">
          <path d="M3 9a8 8 0 1 1 3.73 6.77L8.2 14.3A6 6 0 1 0 5 9l3.01-.01-4 4-4-4h3zm7-4h1.01L11 9.36l3.22 2.1-.6.93L10 10V5z"></path>
        </svg></a>
      </div>`);
  });

  // Append link to post sidebar if it doesn't exist yet
  $('.question, .answer').find('.js-voting-container').not('.js-post-mod-menu-init').addClass('js-post-mod-menu-init').each(function () {
    const post = $(this).closest('.question, .answer');
    const postScore = Number(post.find('.js-vote-count').text());
    const postStatusEl = post.find('.js-post-notice, .special-status, .question-status');
    const postStatus = postStatusEl.text().toLowerCase();
    const isQuestion = post.hasClass('question');
    const isClosed = postStatusEl.find('b').text().toLowerCase().includes('closed') || postStatus.includes('on hold') || postStatus.includes('duplicate') || postStatus.includes('already has');
    const isMigrated = postStatus.includes('migrated to');
    const isProtected = postStatusEl.find('b').text().toLowerCase().includes('highly active question');
    const isLocked = isMigrated || postStatus.includes('locked');
    const isDeleted = post.hasClass('deleted-answer');
    const isModDeleted = isDeleted && (postStatus.includes('deleted') && containsDiamondUnicode(postStatus));
    const isBotDeleted = isDeleted && (postStatus.includes('deleted') && postStatusEl.html().toLowerCase().includes('/users/-1/community'));
    const isFlagDeleted = isBotDeleted && isLocked && postStatus.includes('flagged as spam or offensive content');
    const isOldDupe = isQuestion && post.find('.js-post-body blockquote').first().find('strong').text().includes('Possible Duplicate');
    const needsRedupe = postStatus.match(/This question already has( an)? answers? here:(\s|\n|\r)+Closed/i) != null;
    const hasComments = post.find('.comment, .comments-link.js-show-link:not(.dno)').length > 0;
    const pid = post.attr('data-questionid') || post.attr('data-answerid');
    const userbox = post.find('.post-layout .user-info:last .user-action-time').filter((i, el) => el.innerText.includes('answered') || el.innerText.includes('asked')).parent();
    const userlink = userbox.find('a').first();
    const uid = getUserId(userlink.attr('href'));
    const userRep = userbox.find('.reputation-score').text();
    const username = userbox.find('.user-details a').first().text();
    const userAttributes = { uid, username };
    const postDate = userbox.find('.relativetime').attr('title');
    const postAge = (Date.now() - new Date(postDate)) / 86400000;
    const postType = isQuestion ? 'question' : 'answer';
    const postAttributes = { isClosed, isProtected, isLocked, isDeleted, isFlagDeleted };
    const dissocPostIdParam = pid ? '&' + (!isMetaSite ? `pid=${pid}` : `metapid=${pid}`) : '';
    const allowDestroyUser = (postAge < 60 || isSuperuser) && Number(userRep) < 500;

    // .js-post-menu is also found on the post revisions page, but we don't want to touch that
    if (typeof pid === 'undefined') return;

    // Create menu based on post type and state
    function makeLabel(text) {
      return `<div class="separator"></div>` + `<div class="inline-label">${text}:&nbsp;</div>`;
    }
    function makeItem(action, text, title = '', enabled = true, style = '', dataAttribs = '') {
      // Convert data attributes object to string
      if (typeof dataAttribs === 'object' && dataAttribs !== null) {
        dataAttribs = Object.entries(dataAttribs).map(([key, value]) => `data-${camelToKebab(key)}="${value}"`).join(' ');
      }
      return `<button type="button" class="s-btn ${style}" data-action="${action}" ${dataAttribs} title="${title}" ${enabled ? '' : 'disabled'}>${text}</button>`;
    }

    const items = {
      'redupeLabel': isSO && isOldDupe && needsRedupe && makeLabel('instant'),
      'redupeOldQuestion': isSO && isOldDupe && needsRedupe &&
        makeItem('old-redupe', 'close as proper duplicate', '', true, '', { 'redupe-pid': oldDupePid }),

      'instantLabel': makeLabel('instant'),
      'instantProtect': isQuestion && !isProtected && makeItem('protect', 'protect question', 'protect this question to prevent it from being answered by anonymous and low-rep users', !isDeleted),
      'instantUnprotect': isQuestion && isProtected && makeItem('unprotect', 'unprotect question', 'unprotect this question to allow it to be answered by anonymous and low-rep users', !isDeleted),
      'instantSOClose': isQuestion && isSO && makeItem('close-offtopic', 'close question', 'close with default off-topic reason', !isClosed && !isDeleted),
      'instantSOMetaClose': isQuestion && isSOMeta && makeItem('close-meta', 'close+delete question', 'close and delete as not a Meta question', !isDeleted),
      'instantModDelete': makeItem('mod-delete', !isDeleted ? 'mod-delete' : 'redelete', `re-delete as moderator to prevent undeletion`, true, 'warning'),
      'instantSpamFlag': makeItem('spam-flag', 'spam flag..', `prompt for confirmation to ${!isFlagDeleted ? 'flag-nuke' : 're-flag'} this ${postType} as spam`, !isFlagDeleted, 'warning', postAttributes),
      'instantAbusiveFlag': makeItem('abusive-flag', 'abusive flag..', `prompt for confirmation to ${!isFlagDeleted ? 'flag-nuke' : 're-flag'} this ${postType} as rude/abusive`, true, 'warning', postAttributes),

      // Convert answers
      'convertLabel': !isQuestion && makeLabel('convert'),
      'convertToComment': !isQuestion && makeItem('convert-comment', 'to-comment', 'convert this answer to a comment on the question'),
      'convertToEdit': !isQuestion && makeItem('convert-edit', 'to-edit', 'append this answer as an edit to the question'),

      // Lock posts
      'lockLabel': makeLabel('lock'),
      'lockDispute': !isLocked && makeItem('lock-dispute', 'dispute lock..', `prompt for number of days to apply a content-dispute lock to this ${postType}`),
      'lockComments': !isLocked && makeItem('lock-comments', 'comment lock..', `prompt for number of days to apply a comment lock to this ${postType}`),
      'lockWiki': !isLocked && makeItem('lock-wiki', 'wiki lock..', `prompt for confirmation to apply a permanent wiki lock to this ${postType}`),
      'lockObsolete': !isLocked && makeItem('lock-obsolete', 'obsolete lock..', `prompt for confirmation to apply a permanent obsolete lock to this ${postType}`),
      'lockHistorical': !isLocked && isQuestion && makeItem('lock-historical', 'historical lock..', `prompt for confirmation to apply a permanent historical lock to this ${postType}`, (postAge >= 60 && postScore >= 20) || isSuperuser),
      'lockUnlock': isLocked && makeItem('unlock', 'unlock', `unlock this ${postType}`),

      // Add user-related links only if there is a post author, and is not a Meta site
      'userLabel': !isMetaSite && uid && makeLabel('user'),
      'userSpammer': !isMetaSite && uid && makeItem('nuke-spammer', 'nuke spammer..', `prompt for options and confirmation to nuke this ${postType} and the user as a spammer (promotional content)`, allowDestroyUser, 'danger', userAttributes),
      'userTroll': !isMetaSite && uid && makeItem('nuke-troll', 'nuke troll..', `prompt for options and confirmation to nuke this ${postType} and the user as a troll/abusive`, allowDestroyUser, 'danger', userAttributes),
      'userNoLongerWelcome': !isMetaSite && uid && makeItem('no-longer-welcome', 'user no longer welcome..', `prompt for confirmation to delete the user as &quot;no longer welcome&quot;`, true, 'danger', userAttributes),

      // Add CM message options, if user is not deleted
      'cmLabel': uid && makeLabel('cm'),
      'cmPostDissociation': uid && makeItem('cm-post-dissociation', 'dissociate post..', isSuperuser ? `send CM dissociation message for this ${postType}` : `compose CM dissociation message in a new window`, true, '', userAttributes),
      'cmSuspiciousVotes': uid && makeItem('cm-suspicious-votes', 'suspicious votes..', `compose CM suspicious voting message in a new window`, true, '', userAttributes),
    };

    // Add menu items to menu
    let menuitems = '';
    for (const item in items) {
      const val = items[item];
      if (val) menuitems += val;
    }

    $(this).append(`
      <div class="js-post-issue flex--item s-btn s-btn__unset ta-center py8 js-post-mod-menu-link" data-shortcut="O" title="Other mod actions">
        <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 512" class="svg-icon mln1 mr0"><path fill="currentColor"
          d="M64 208c26.5 0 48 21.5 48 48s-21.5 48-48 48-48-21.5-48-48 21.5-48 48-48zM16 104c0 26.5 21.5 48 48 48s48-21.5 48-48-21.5-48-48-48-48 21.5-48 48zm0 304c0 26.5 21.5 48 48 48s48-21.5 48-48-21.5-48-48-48-48 21.5-48 48z"></path>
        </svg>
        <div class="js-post-mod-menu" title="" data-pid="${pid}" role="dialog">
        <div class="js-post-mod-menu-header">${postType} ${pid}:</div>
        ${menuitems}
        </div>
      </div>`);

    // If we are testing auto-reduping of posts
    // Seems like Community -1 user will auto remove the old post notices after we redupe
    if (isOldDupe && isSuperuser) {
      $('.js-post-mod-menu button[data-action="old-redupe"]').trigger('click');
    }
  });
}

function initPostModMenuLinks() {
  // Handle clicks on links in the mod quicklinks menu.
  // NOTE: We have to include the tag "main" for mobile web because it doesn't contain the wrapping elem "#content".
  $('#content, main').on('click', '.js-post-mod-menu button[data-action]', async function () {
    if (this.disabled) return; // should not need this because s-btn[disabled] already has pointer-events: none

    // Get question link if in mod queue
    const qlink = $(this).closest('.js-flagged-post').find('.js-body-loader a').first().attr('href');
    const reviewlink = $('.question-hyperlink').attr('href');

    const menuEl = this.parentNode;
    const pid = Number(menuEl.dataset.postId || menuEl.dataset.pid);
    const qid = Number($('#question').attr('data-questionid') || getPostId(qlink) || getPostId(reviewlink)) || null;
    const uid = Number(this.dataset.uid);
    const uName = this.dataset.username;
    //console.log(pid, qid);
    if (isNaN(pid) || isNaN(qid)) return;

    const post = $(this).closest('.answer, .question');
    const isQuestion = post.hasClass('question');
    const isDeleted = post.hasClass('deleted-answer');
    const postType = isQuestion ? 'question' : 'answer';
    const action = this.dataset.action;
    //console.log(action);

    const removePostFromModQueue = pid => {
      if (isModDashboardPage) {
        post.parents('.js-flagged-post').remove();
        return true;
      }
      return false;
    };
    const removePostFromModQueueOrReloadPage = pid => {
      removePostFromModQueue() || reloadPage();
    };

    switch (action) {
      case 'old-redupe':
        const redupePid = Number(this.dataset.redupePid);
        if (!redupePid) return;
        reopenQuestion(pid).then(function (v) {
          closeQuestionAsDuplicate(pid, redupePid).finally(reloadPage);
        });
        break;
      case 'convert-comment':
        undeletePost(pid).then(function () {
          convertToComment(pid, qid).then(removePostFromModQueueOrReloadPage);
        });
        break;
      case 'convert-edit':
        undeletePost(pid).then(function () {
          convertToEdit(pid, qid).then(function () {
            removePostFromModQueue();
            goToPost(qid);
          });
        });
        break;
      case 'protect':
        protectPost(pid).finally(reloadPage);
        break;
      case 'unprotect':
        unprotectPost(pid).finally(reloadPage);
        break;
      case 'close-meta':
        closeSOMetaQuestionAsOfftopic(pid).then(function () {
          deletePost(pid).finally(reloadPage);
        });
        break;
      case 'close-offtopic':
        closeQuestionAsOfftopic(pid).finally(function () {
          removePostFromModQueue();
          goToPost(qid);
        });
        break;
      case 'mod-delete':
        redeletePost(pid).finally(removePostFromModQueueOrReloadPage);
        break;
      case 'spam-flag':
      case 'abusive-flag':
        promptToRedFlagPost(pid,
          postType,
          action === 'abusive-flag',
          this.dataset.isLocked,
          this.dataset.isDeleted,
          this.dataset.isFlagDeleted
        ).then(function (result) {
          if (result) removePostFromModQueueOrReloadPage();
        });
        break;
      case 'lock-dispute': {
        const input = prompt(`Apply a CONTENT-DISPUTE LOCK to this ${postType} for how many days?`, '3')?.trim();
        const days = Number(input);
        if (!isNaN(days) && days > 0) lockPost(pid, 20, 24 * days).then(reloadPage);
        else if (input && isNaN(days)) StackExchange.helpers.showErrorMessage(menuEl.parentNode, 'Invalid number of days');
        break;
      }
      case 'lock-comments': {
        const input = prompt(`Apply a COMMENT LOCK to this ${postType} for how many days?`, '1')?.trim();
        const days = Number(input);
        if (!isNaN(days) && days > 0) lockPost(pid, 21, 24 * days).then(reloadPage);
        else if (input && isNaN(days)) StackExchange.helpers.showErrorMessage(menuEl.parentNode, 'Invalid number of days');
        break;
      }
      case 'lock-wiki':
        if (confirm(`Are you sure you want to apply a PERMANENT WIKI LOCK to this ${postType}?`)) {
          lockPost(pid, 23, -1).then(reloadPage);
        }
        break;
      case 'lock-obsolete':
        if (confirm(`Are you sure you want to apply a PERMANENT OBSOLETE LOCK to this ${postType}?`)) {
          lockPost(pid, 28, -1).then(reloadPage);
        }
        break;
      case 'lock-historical':
        if (confirm('Are you sure you want to apply a PERMANENT HISTORICAL LOCK to this entire Q&A?')) {
          lockPost(pid, 22, -1).then(reloadPage);
        }
        break;
      case 'unlock':
        unlockPost(pid).then(reloadPage);
        break;
      case 'nuke-spammer':
      case 'nuke-troll':
        promptToNukePostAndUser(
          pid,
          isQuestion,
          isDeleted,
          uid,
          uName,
          action === 'nuke-spammer',
          post.find('.post-signature:last .user-info')[0]?.outerHTML
        ).then(function (result) {
          if (result) {
            removePostFromModQueueOrReloadPage();
          }
        });
        break;
      case 'no-longer-welcome':
        if (confirm(`Are you sure you want to DELETE THE USER "${uName}" as "no longer welcome"?\n\n(Note that this post will not be affected, unless it is negatively-scored, in which case it will be implicitly deleted along with the user account.)`)) {
          deleteUser(
            uid,
            '', // no details needed
            'This user is no longer welcome to participate on the site'
          ).then(function () {
            removePostFromModQueueOrReloadPage();
          });
        }
        break;
      case 'cm-post-dissociation':
        if (isSuperuser && confirm(`Are you sure you want to SEND (without review) a CM message to dissociate this ${postType} (ID: ${pid}) by "${uName}"?`)) {
          sendCmDissociateMessage(uid, pid, postType).then(function () {
            StackExchange.helpers.showSuccessMessage(menuEl.parentNode, 'CM dissociation message sent successfully.');
          });
          return;
        }
        else if (!isSuperuser) {
          // Open CM message in new window/tab
          window.open(`${parentUrl}/admin/cm-message/create/${uid}?action=post-dissociation`);
        }
        break;
      case 'cm-suspicious-votes':
        // Open CM message in new window/tab
        window.open(`${parentUrl}/admin/cm-message/create/${uid}?action=suspicious-voting`);
        break;
      default:
    }

    return;
  });
}

function addPostCommentsModLinks() {
  $('div[id^="comments-link-"]').addClass('js-comments-menu');

  // Append link to post sidebar if it doesn't exist yet
  const allCommentMenus = $('.js-comments-menu');

  // Init those that are not processed yet
  allCommentMenus.not('.js-comments-menu-init').addClass('js-comments-menu-init').each(function () {
    const post = $(this).closest('.answer, .question');
    const pid = Number(post.attr('data-answerid') || post.attr('data-questionid')) || null;
    this.dataset.postId = pid;

    // If there are deleted comments, move from sidebar to bottom
    const delCommentsBtn = post.find('.js-fetch-deleted-comments');
    if (delCommentsBtn.length === 1) {
      const numDeletedComments = (delCommentsBtn.attr('title') || delCommentsBtn.attr('aria-label')).match(/\d+/)[0];
      $(this).append(`
        <span class="js-link-separator2">&nbsp;|&nbsp;</span>
        <a class="s-link__danger js-show-deleted-comments-link" role="button"
            title="Expand to show all comments on this post, including deleted"
            href="${delCommentsBtn.attr('href')}">
          Show <b>${numDeletedComments}</b> deleted comment${numDeletedComments > 1 ? 's' : ''}
        </a>`);
      delCommentsBtn.hide();
    }

    // Add move to chat and purge links
    $(this).children('.mod-action-links').remove(); // in case added by another US
    $(this).append(`
      <div class="mod-action-links dno" style="float:right; padding-right:10px">
        <a data-post-id="${pid}" class="s-link__danger js-move-comments-link" title="Move all comments to chat, then delete all comments">move to chat</a>
        <span class="js-link-separator3">&nbsp;|&nbsp;</span>
        <a data-post-id="${pid}" class="s-link__danger js-purge-comments-link" title="Delete all comments">purge all</a>
      </div>`);
  });

  // Show move/purge links depending on comments
  allCommentMenus.each(function () {
    const hasComments = $(this).prev().find('.comment').length > 0;
    $(this).find('.mod-action-links').toggle(hasComments);
  });
}

function initPostCommentsModLinks() {
  const d = $('body').not('.js-comments-menu-events').addClass('js-comments-menu-events');

  d.on('click', 'a.js-show-deleted-comments-link', function (e) {
    e.preventDefault();
    const post = $(this).closest('.answer, .question');
    post.find('.js-fetch-deleted-comments').trigger('click');
    $(this).prev('.js-link-separator2').addBack().remove();
  });

  d.on('click', 'a.js-move-comments-link', function (e) {
    e.preventDefault();
    const post = $(this).closest('.answer, .question');
    const pid = Number(this.dataset.postId) || null;
    $(this).remove();
    moveCommentsOnPostToChat(pid);
  });

  d.on('click', 'a.js-purge-comments-link', function (e) {
    e.preventDefault();
    const post = $(this).closest('.answer, .question');
    const pid = Number(this.dataset.postId) || null;
    deleteCommentsOnPost(pid);
  });
}


// Append styles
addStylesheet(`
/* Better post menu links */
.js-post-menu {
  margin-top: 7px !important;
}
.js-post-menu .s-anchors > .flex--item {
  margin-top: 0 !important;
}
.js-post-menu .s-anchors > div.flex--item {
  margin-left:  0;  /* Move margins from container to item... */
  margin-right: 0;  /* ...to allow hiding individual items.   */
}
.js-post-menu .s-anchors > div.flex--item button,
.js-post-menu .s-anchors > div.flex--item a {
  text-transform: lowercase;
  font-size: 0.97em;
  margin-left:  calc(var(--su8) / 2);
  margin-right: calc(var(--su8) / 2);
}
.js-post-menu .s-anchors.s-anchors__muted .s-btn.s-btn__link,
.js-post-menu .s-anchors.s-anchors__muted a:not(.s-link) {
  color: var(--black-500);
}
.js-post-menu .s-anchors.s-anchors__muted .s-btn.s-btn__link:hover,
.js-post-menu .s-anchors.s-anchors__muted a:not(.s-link):hover {
  color: var(--black-300);
}

.post-signature {
  min-width: 180px;
  width: auto;       /* allow the usercard to shrink, if possible...          */
  max-width: 200px;  /* ...but never allow to expand larger than default size */
}


/* Overflow each post in mod dashboard so the menu can be visible */
.js-loaded-body,
.js-loaded-body.overflow-x-auto {
  overflow: initial !important;
}

/* Mod menu link in sidebar */
.js-post-mod-menu-link {
  position: relative;
  display: inline-block;
  margin-top: 8px;
  padding: 8px;
  color: inherit;
  cursor: pointer;
}
.js-post-mod-menu-link svg {
  max-width: 19px;
  max-height: 18px;
  width: 19px;
  height: 18px;
}
.js-post-mod-menu-link:hover .js-post-mod-menu,
.js-post-mod-menu-link .js-post-mod-menu:hover {
  display: flex;
}
.js-post-mod-menu-link:hover svg {
  visibility: hidden;
}

/* Mod menu popup */
.js-post-mod-menu-link .js-post-mod-menu {
  --menu-padding-left: 24px;
  --menu-padding-right: 36px;

  display: none;
  flex-wrap: wrap;
  position: absolute;
  top: 0;
  left: 0;
  padding: 0 0 6px;
  z-index: 3;
  cursor: auto;

  background: var(--white);
  border-radius: 2px;
  border: 1px solid transparent;
  box-shadow: 0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12), 0 5px 5px -3px rgba(0,0,0,0.2);

  text-align: left;
  white-space: nowrap;
}
.js-post-mod-menu-link * {
  font-family: inherit;
  font-size: inherit;
  letter-spacing: inherit;
}
.js-post-mod-menu .js-post-mod-menu-header {
  display: block !important;
  width: 100%;
  margin-bottom: 5px;
  padding: 8px 0;
  padding-left: var(--menu-padding-left);
  padding-right: var(--menu-padding-right);
  background-color: var(--yellow-050);
  border-bottom: 1px solid var(--yellow-100);
  color: var(--black);
  font-weight: bold;
}
.js-post-mod-menu > button {
  display: block;
  min-width: 120px;
  width: 100%;
  padding: 5px 0;
  padding-left: var(--menu-padding-left);
  padding-right: var(--menu-padding-right);
  cursor: pointer;
  color: var(--black-900);
  text-align: left;
  user-select: none;
}
.js-post-mod-menu .inline-label {
  margin-top: -0.5rem;
  margin-bottom: 0rem;
  padding-left: 2px;
  font-size: 0.85rem;
  pointer-events: none;
  z-index: 1;
}
.js-post-mod-menu > button:hover {
  background-color: var(--black-100);
}
.js-post-mod-menu > button.disabled {
  background-color: var(--black-050) !important;
  color: var(--black-200) !important;
  cursor: not-allowed;
}
.js-post-mod-menu > button.danger:hover {
  background-color: var(--red-500);
  color: var(--white);
}
.js-post-mod-menu .js-post-mod-menu-header + .separator {
  display: none;
}
.js-post-mod-menu .separator {
  display: block;
  width: 100%;
  margin: 5px 0;
  border-top: 1px solid var(--black-100);
  pointer-events: none;
}

@media screen and (max-width: 500px) {
  header.-summary {
    overflow: initial;
  }
  .js-post-mod-menu-link svg {
    max-width: 17px;
    max-height: 16px;
    color: var(--black-500);
  }
}


/* Comments form and links */
.js-comment-form-layout > div:nth-child(2),
.js-comments-menu {
  display: block !important;
}
.js-comment-form-layout > div:nth-child(2) br {
  display: none;
}
.js-edit-comment-cancel {
  display: block;
  margin-bottom: 5px;
}
a.js-load-deleted-nomination-comments-link,
a.js-show-deleted-comments-link,
a.js-move-comments-link,
a.js-purge-comments-link {
  color: var(--red-600);  /* slightly darken "danger" color (.bg-danger) */
}
a.js-show-deleted-comments-link,
a.js-move-comments-link,
a.js-purge-comments-link {
  padding: 0 3px 2px 3px;
  text-decoration: none;
}
.comment-help {
  max-width: none;
}


/* Pop-up dialog for destroy user */
.swal-overlay {
  background-color: hsl(358deg 67% 6% / 50%); /* Stacks' --_mo-bg */
  /*background: 0; */
}
.swal-overlay,
.swal-overlay--show-modal .swal-modal {
  transition: ease-in-out 0.1s;
  animation: 0;
}
.swal-modal,
.swal-overlay--show-modal .swal-modal {
  padding: 18px;
  border-radius: 0;
  will-change: unset;
}
.swal-modal {
  width: 700px;
  background-color: var(--white);
  border: solid 1px var(--black-300);
  box-shadow: var(--bs-sm);
}
body.theme-dark .swal-modal,
.theme-dark__forced .swal-modal,
body.theme-system .theme-dark__forced .swal-modal {
  background-color: var(--black-100);
}
@media only screen and (max-width: 750px) {
  .swal-modal {
    width: 495px;
  }
}
.swal-content {
  margin: 0;
  padding: 0;
  color: inherit;
  font-size: var(--fs-body2);
  width: 100%
}
.swal-title:first-child,
.swal-title:not(:last-child) {
  margin: -3px 0 18px 0;
  padding: 0;
  text-align: left;
  font-size: var(--fs-title);
  font-weight: 400;
  color: var(--red-600); /* Stacks' --_mo-header-fc */
}
.swal-content .group {
  display: block;
  margin: 18px 0;
  text-align: left;
}
.swal-content .header {
  font-weight: bold;
}
.swal-content .info {
  margin: 18px 0;
  font-size: var(--fs-body2);
}
.swal-content code {
  padding: 0;
  background-color: inherit;
}
.swal-content .user-info {
  float: right;
  margin-left: 18px;
  font-size: 90%;
  background-color: var(--theme-secondary-050);  /* ALTERNATIVE: var(--highlight-bg); */
  border: 1px solid var(--br-md);                /* ALTERNATIVE: var(--bc-light);     */
}
.swal-content .s-notice {
  clear: both;
  float: left;
  width: 100%;
  margin: 9px 0 18px;
  padding: 9px;
}
.swal-content .option {
  margin: 6px 18px;
}
.swal-content .option input,
.swal-content .option input + label {
  cursor: pointer;
}
.swal-content .option input:disabled,
.swal-content .option input:disabled + label {
  cursor: not-allowed;
}
.swal-content .option input:disabled + label {
  opacity: 0.5;
}
.swal-content textarea {
  width: 100%;
  height: 80px;
  margin: 4px 0 0 0;
  font: inherit;
  font-weight: normal;
}
.swal-footer {
  margin: 0;
  padding: 0;
}
.swal-button-container {
  float: left;
  margin: 0 5px 0 0;
}
.swal-button__loader {
  width: 100%;
  padding: 9px 0;
  background-color: var(--red-500);  /* Stacks' .bg-danger */
}


/* Hide question summary in mod dashboard if in spam mode */
body.js-spam-mode .post-layout.expandable-question-summary {
  display: none !important;
}
body.js-spam-mode .visited-post {
  opacity: 1 !important;
}

/* Sidebar has too high of a z-index */
#left-sidebar {
  z-index: 1;
}
`); // end stylesheet


// On script run
(function init() {

  // Election pages
  if (isElectionPage) {

    // Allow loading of deleted comments under nominations
    $('#mainbar').find('.candidate-row').each(function () {
      const pid = this.id.match(/\d+$/)[0];
      const cmmtlinks = $(this).find('[id^="comments-link-"]');
      const builtin = $(this).find('.js-fetch-deleted-comments');
      const count = builtin.text();
      cmmtlinks.append(`
        <span class="js-link-separator">&nbsp;|&nbsp;</span>
        <a class="js-show-link comments-link s-link__danger js-load-deleted-nomination-comments-link"
            title="Expand to show all comments on this post, including deleted"
            data-pid="${pid}">
          Show <b>${count}</b> deleted comment${count > 1 ? 's' : ''}
        </a>`);
      builtin.hide();
    });

    // Handle the click event
    $('.js-load-deleted-nomination-comments-link').on('click', function () {
      const pid = this.dataset.pid;
      const commentsUrl = `/posts/${pid}/comments?includeDeleted=true&_=${Date.now()}`;
      $('#comments-' + pid).show().children('ul.comments-list').load(commentsUrl);
    });
  }

  // Non-election pages
  else {

    // If spam mode is switched on
    if (underSpamAttackMode) {
      document.body.classList.add('js-spam-mode'); // CSS styling purposes only

      // If filtered to spamoffensive flags in mod dashboard, expand all flagged posts
      if (location.search.includes('flags=spamoffensive')) {
        setTimeout(function () {
          $('.js-expand-body:visible').trigger('click');
        }, 1000); // short wait for dashboard scripts to init
      }
    }

    // Once on page load
    initPostModMenuLinks();
    addPostModMenuLinks();
    initPostCommentsModLinks();
    addPostCommentsModLinks();

    initPostDissociationHelper();

    // After requests have completed
    $(document).ajaxStop(function () {
      addPostModMenuLinks();
      addPostCommentsModLinks();
    });
  }
})();