// ==UserScript==
// @name         Additional Inline Post Mod Menu
// @description  Adds additional mod-only quick links to each post, underneath system-provided links
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @author       Cody Gray
// @version      4.0
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
/// <reference types="./globals" />

'use strict';

// This is a moderator-only userscript
if (!isModerator()) return;

const newlines = '\n\n';
const seApiKey = 'lSrVEbQTXrJ4eb4c3NEMXQ((';

// Add your user ID here (or set the corresponding value in your Local Storage) to promote yourself
// to a "superuser", which enables rarely-used options and decreases the number of confirmations.
const superusers = [584192, 366904, 6451573];
const isSuperuser = superusers.includes(StackExchange.options.user.userId) ||
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
  if (location.pathname.includes('/admin/dashboard')) return false;
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
}
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
      <strong>created&nbsp;<span title="${dateToIsoString(creationDate).replaceAll(' ', '&nbsp;')}">${dateToRelativeString(creationDate).replaceAll(' ', '&nbsp;')}</span></strong>${modifiedDate ? `, last&nbsp;<strong>modified&nbsp;<span title="${dateToIsoString(modifiedDate).replaceAll(' ', '&nbsp;')}">${dateToRelativeString(modifiedDate).replaceAll(' ', '&nbsp;')}</span></strong>,` : ''}
      and <strong>last&nbsp;seen&nbsp;<span title="${dateToIsoString(accessDate).replaceAll(' ', '&nbsp;')}">${dateToRelativeString(accessDate).replaceAll(' ', '&nbsp;')}</span></strong>.
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
  try {
    const confirmed = await swal({
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
    if (confirmed) {
      const bowdlerize = document.querySelector('#aipmm-bowdlerize-toggle').checked;
      const rudeFlag = !spammer || document.querySelector('#aipmm-noaudit-toggle').checked;
      const suspendOnly = document.querySelector('#aipmm-suspendonly-toggle').checked;
      const details = document.querySelector('.swal-content textarea').value.trim();
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
    alert('An error occurred; please see the console for details on exactly what failed.');
    needsRefresh = false;  // unconditionally prevent refresh to avoid clearing the console
  }
  swal.stopLoading();
  swal.close();
  return needsRefresh;
}


/*
 * UI functions
 */
function addPostModMenuLinks() {

  // If it doesn't exist yet, append the menu of mod quicklinks to each post
  $('.js-post-menu').not('.preview-options').not('.js-init-better-inline-menu').addClass('js-init-better-inline-menu').each(function () {
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
    const isModDeleted = isDeleted && (postStatus.includes('deleted') && postStatus.includes('\u2666'));
    const isBotDeleted = isDeleted && (postStatus.includes('deleted') && postStatusEl.html().toLowerCase().includes('/users/-1/community'));
    const isFlagDeleted = isBotDeleted && isLocked && postStatus.includes('flagged as spam or offensive content');
    const isOldDupe = isQuestion && post.find('.js-post-body blockquote').first().find('strong').text().includes('Possible Duplicate');
    const needsRedupe = postStatus.match(/This question already has( an)? answers? here:(\s|\n|\r)+Closed/i) != null;
    const hasComments = post.find('.comment, .comments-link.js-show-link:not(.dno)').length > 0;
    const pid = post.attr('data-questionid') || post.attr('data-answerid');
    const userbox = post.find('.post-layout .user-info:last .user-action-time').filter((i, el) => el.innerText.includes('answered') || el.innerText.includes('asked')).parent();
    const userlink = userbox.find('a').attr('href');
    const userrep = userbox.find('.reputation-score').text();
    const username = userbox.find('.user-details a').first().text();
    const postdate = userbox.find('.relativetime').attr('title');
    const postage = (Date.now() - new Date(postdate)) / 86400000;
    const posttype = isQuestion ? 'question' : 'answer';

    // .js-post-menu is also found on the post revisions page, but we don't want to touch that
    if (typeof pid === 'undefined') return;

    // Create menu based on post type and state
    function makeLabel(text) {
      return `<span class="inline-label post-label">${text}:&nbsp;</span>`
    }
    function makeItem(action, text, title, enabled = true, style = '', dataAttrib) {
      return `<button type="button" class="s-btn s-btn__link ${style}" data-action="${action}" ${dataAttrib ? dataAttrib : ''} title="${title}" ${enabled ? '' : 'disabled'}>${text}</button>`;
    }

    let menuitems = '';

    menuitems += makeLabel('instant');
    if (isQuestion) {
      const protectVerb = !isProtected ? 'protect' : 'unprotect';
      menuitems += makeItem(protectVerb,
        protectVerb,
        !isProtected ? 'protect this question to prevent it from being answered by anonymous and low-rep users'
          : 'unprotect this question to allow it to be answered by anonymous and low-rep users',
        !isDeleted);
      if (isSO) {
        menuitems += makeItem('close-offtopic',
          'close',
          'close with default off-topic reason',
          !isClosed && !isDeleted);
      }
      if (isSOMeta) {
        menuitems += makeItem('close-meta',
          'close+delete',
          'close and delete as not a Meta question',
          !isDeleted);
      }
    }
    menuitems += makeItem('mod-delete',
      !isDeleted ? 'delete' : 'redelete',
      `(re-)delete ${isQuestion ? 'question' : 'answer'} as moderator to prevent undeletion`,
      true,
      'warning');
    menuitems += makeItem('spam-flag',
      'spam&hellip;',
      `prompt for confirmation to ${!isFlagDeleted ? 'flag-nuke' : 're-flag'} this ${posttype} as spam`,
      !isFlagDeleted,
      'warning',
      `data-islocked="${isLocked}" data-isdeleted="${isDeleted}" data-isflagdeleted="${isFlagDeleted}"`);
    // TODO: If post was already nuked with an R/A flag, disable the following item.
    menuitems += makeItem('abusive-flag',
      'abusive&hellip;',
      `prompt for confirmation to ${!isFlagDeleted ? 'flag-nuke' : 're-flag'} this ${posttype} as rude/abusive`,
      true,
      'warning',
      `data-islocked="${isLocked}" data-isdeleted="${isDeleted}" data-isflagdeleted="${isFlagDeleted}"`);

    if (!isQuestion) {
      menuitems += makeLabel('convert');
      menuitems += makeItem('convert-comment',
        'to-comment',
        'convert this answer to a comment on the question');
      menuitems += makeItem('convert-edit',
        'to-edit',
        'append this answer as an edit to the question');
    }

    menuitems += makeLabel('lock');
    if (!isLocked) {
      menuitems += makeItem('lock-dispute',
        'dispute&hellip;',
        `prompt for number of days to apply a content-dispute lock to this ${posttype}`);
      menuitems += makeItem('lock-comments',
        'cmnts&hellip;',
        `prompt for number of days to apply a comment lock to this ${posttype}`);
      menuitems += makeItem('lock-wiki',
        'wiki&hellip;',
        `prompt for confirmation to apply a permanent wiki lock to this ${posttype}`);
      menuitems += makeItem('lock-obsolete',
        'obsolete&hellip;',
        `prompt for confirmation to apply a permanent obsolete lock to this ${posttype}`);
      if (isQuestion) {  // old, good questions only
        menuitems += makeItem('lock-historical',
          'hist&hellip;',
          `prompt for confirmation to apply a permanent historical lock to this ${posttype}`,
          (postage >= 60 && postScore >= 20) || isSuperuser);
      }
    }
    else {
      menuitems += makeItem('unlock', 'unlock', `unlock this ${posttype}`);
    }

    // Add user-related links only if there is a user and this is not a Meta site
    if (!isMetaSite && userlink && /.*\/\d+\/.*/.test(userlink)) {
      const uid = Number(userlink.match(/\/\d+\//)[0].replace(/\D+/g, ''));
      const allowDestroy = (postage < 60 || isSuperuser) &&
        (/^\d+$/.test(userrep) && Number(userrep) < 500);
      menuitems += makeLabel('user');
      menuitems += makeItem('nuke-spammer', 'spammer&hellip;', `prompt for options and confirmation to nuke this ${posttype} and the user as a spammer (promotional content)`, allowDestroy, 'danger', `data-uid="${uid}" data-username="${username}"`);
      menuitems += makeItem('nuke-troll', 'troll&hellip;', `prompt for options and confirmation to nuke this ${posttype} and the user as a troll/abusive`, allowDestroy, 'danger', `data-uid="${uid}" data-username="${username}"`);
      menuitems += makeItem('no-longer-welcome', 'nlw&hellip;', `prompt for confirmation to delete the user as &quot;no longer welcome&quot;`, true, 'danger', `data-uid="${uid}" data-username="${username}"`);
    }

    $(this).append(`<div class="js-better-inline-menu ${smallerQuicklinks ? 'smaller' : ''}" data-pid="${pid}">${menuitems}</div>`);
  });
}

function initPostModMenuLinks() {
  // Handle clicks on links in the mod quicklinks menu.
  // NOTE: We have to use the tag "main" for mobile web because it doesn't contain the wrapping elem "#content".
  $('#content, main').on('click', '.js-better-inline-menu button[data-action]', function () {
    if ($(this).hasClass('disabled') || $(this).hasClass('dno')) return false;

    // Get question link if in mod queue
    const qlink = $(this).closest('.js-flagged-post').find('.js-body-loader a').first().attr('href');
    const reviewlink = $('.question-hyperlink').attr('href');

    const menuEl = this.parentNode;
    const pid = Number(menuEl.dataset.postId || menuEl.dataset.pid);
    const qid = Number($('#question').attr('data-questionid') || getPostId(qlink) || getPostId(reviewlink)) || null;
    const uid = Number(this.dataset.uid);
    const uName = this.dataset.username;
    //console.log(pid, qid);
    if (isNaN(pid) || isNaN(qid)) return false;

    const post = $(this).closest('.answer, .question');
    const isQuestion = post.hasClass('question');
    const isDeleted = post.hasClass('deleted-answer');
    const postType = isQuestion ? 'question' : 'answer';
    const action = this.dataset.action;
    //console.log(action);

    function removePostFromModQueue() {
      if (location.pathname.includes('/admin/dashboard')) {
        post.parents('.js-flagged-post').remove();
      }
    }

    switch (action) {
      case 'convert-comment':
        undeletePost(pid).then(function () {
          convertToComment(pid, qid).then(function () {
            removePostFromModQueue();
            reloadPage();
          });
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
        closeQuestionAsOfftopic(pid).then(function () {
          removePostFromModQueue();
          goToPost(qid);
        });
        break;
      case 'mod-delete':
        modUndelDelete(pid).then(reloadPage);
        break;
      case 'spam-flag':
      case 'abusive-flag':
        promptToRedFlagPost(pid,
          postType,
          action === 'abusive-flag',
          $(this).data('islocked'),
          $(this).data('isdeleted'),
          $(this).data('isflagdeleted')
        ).then(function (result) {
          if (result) {
            removePostFromModQueue();
            reloadPage();
          }
        });
        break;
      case 'lock-dispute': {
        const d = Number(prompt(`Apply a CONTENT-DISPUTE LOCK to this ${postType} for how many days?`, '3').trim());
        if (!isNaN(d)) lockPost(pid, 20, 24 * d).then(reloadPage);
        else StackExchange.helpers.showErrorMessage(menuEl.parentNode, 'Invalid number of days');
        break;
      }
      case 'lock-comments': {
        const d = Number(prompt(`Apply a COMMENT LOCK to this ${postType} for how many days?`, '1').trim());
        if (!isNaN(d)) lockPost(pid, 21, 24 * d).then(reloadPage);
        else StackExchange.helpers.showErrorMessage(menuEl.parentNode, 'Invalid number of days');
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
        promptToNukePostAndUser(pid,
          isQuestion,
          isDeleted,
          uid,
          uName,
          action === 'nuke-spammer',
          post.find('.post-signature:last .user-info')[0]?.outerHTML
        ).then(function (result) {
          if (result) {
            removePostFromModQueue();
            reloadPage();
          }
        });
        break;
      case 'no-longer-welcome':
        if (confirm(`Are you sure you want to DELETE THE USER "${uName}" as "no longer welcome"?\n\n(Note that this post will not be affected, unless it is negatively-scored, in which case it will be implicitly deleted along with the user account.)`)) {
          deleteUser(uid,
            '', // no details needed
            'This user is no longer welcome to participate on the site'
          ).then(function () {
            reloadPage();
          });
        }
        break;
      default:
        return true;
    }

    return false;
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
    const post = this.closest('.answer, .question');
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
.js-post-menu .s-anchors > .flex--item {
  text-transform: lowercase;
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

/* Post inline menu */
.js-better-inline-menu {
  clear: both;
  float: left;
  min-width: 200px;
  margin: 6px 0 10px;
  font-size: 0.97em;
}
.js-better-inline-menu.smaller {
  margin-top: 4px;
  font-size: 0.88em;
  line-height: 1;
}
.js-better-inline-menu .inline-label,
.js-better-inline-menu button.s-btn.s-btn__link {
  float: left;
  padding: 3px 4px;
}
.js-better-inline-menu .inline-label {
  color: var(--black-800);
  padding-left: 0;
  clear: both;
}
.js-better-inline-menu button.s-btn.s-btn__link {
  color: var(--black-500);
  text-decoration: none;
}
.js-better-inline-menu button.s-btn.s-btn__link.dno {
  display: none;
}
.js-better-inline-menu button.s-btn.s-btn__link:hover {
  color: var(--black-300);
}
.js-better-inline-menu button.s-btn.s-btn__link.warning:hover,
.js-post-menu .s-anchors.s-anchors__muted .s-btn.s-btn__link.js-delete-post:hover {
  color: var(--red-600);
}
.js-better-inline-menu button.s-btn.s-btn__link.danger:hover {
  background-color: var(--red-500);
  color: var(--white);
}
.js-better-inline-menu button.s-btn.s-btn__link:disabled {
  cursor: not-allowed;
  color: var(--black-200);
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
`); // end stylesheet


// On script run
(function init() {
  const isElectionPage = document.body.classList.contains('election-page');

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

    // Once on page load
    initPostModMenuLinks();
    addPostModMenuLinks();
    initPostCommentsModLinks();
    addPostCommentsModLinks();

    // After requests have completed
    $(document).ajaxStop(function () {
      addPostModMenuLinks();
      addPostCommentsModLinks();
    });
  }
})();