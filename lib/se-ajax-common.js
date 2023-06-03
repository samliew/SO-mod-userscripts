/*
  Common SE AJAX wrapper functions
  https://github.com/samliew/SO-mod-userscripts

  Sections:
  - Users
  - Posts
  - Comments
  - Votes
  - Flags
  - Mods
 */



/**
 * ================================
 * Users
 * ================================
 */

// Retrieve detailed user information from the SE API
function getUserInfoFromApi(uid, filter = 'default', sort = 'creation', order = 'desc', site = siteApiSlug) {
  return new Promise(function (resolve, reject) {
    if (typeof uid === 'undefined' || uid === null) { reject(); return; }
    if (site === 'stackoverflowteams') { reject('SO Teams not supported.'); return; }

    // Use this default filter (excludes collectives info, adds question and answer counts)
    // https://api.stackexchange.com/docs/users-by-ids#order=desc&sort=activity&filter=!Fr2Mp67JgV4r*EdeOBbOQsbi3-&site=stackoverflow
    filter = filter === 'default' ? '!Fr2Mp67JgV4r*EdeOBbOQsbi3-' : filter;

    // Fallback for seApiUrl
    const _seApiUrl = typeof seApiUrl === 'string' ? seApiUrl : 'https://api.stackexchange.com/2.2';

    // Use a default apikey if none provided
    const _apikey = typeof apikey === 'string' ? apikey : '';

    const url = `${_seApiUrl}/users/${uid}?sort=${sort}&order=${order}&site=${site}&filter=${filter}&key=${_apikey}`;

    $.get(url)
      .done(function (response) {
        if (!response ||
          Object.hasOwn(response, 'error_id') ||
          !Object.hasOwn(response, 'items')) {
          console.error(`Call to SE API to get user info failed in getUserInfoFromApi(${uid}): `,
            response);
          reject(response);
        }
        else if ((response.items.length !== 1) ||
          !Object.hasOwn(response.items[0], 'user_id') ||
          (response.items[0].user_id !== uid)) {
          console.error(`Call to SE API to get user info succeeded in getUserInfoFromApi(${uid}), but returned unexpected results.`,
            response);
          reject(response);
        }
        else {
          console.debug(`Call to SE API to get user info in getUserInfoFromApi(${uid}) succeeded.`,
            response);
          resolve(response.items[0]);
        }
      })
      .fail(function (response) {
        console.error(`getUserInfoFromApi(${uid}) failed: `, response);
        reject(response);
      });
  });
}

// Retrieve PII (real name, email address, and IP address) for user
function getUserPii(uid) {
  return new Promise(function (resolve, reject) {
    if (typeof uid === 'undefined' || uid === null) { reject(); return; }

    /* Confirm that the user wants to retrieve PII, to prevent accidental retrieval of PII which is logged
     *
     * The userscripts that are known to use this function to fetch user PII are:
     * - AdditionalInlinePostModMenu : When mod selects troll or spammer delete options in the post inline menu
     * - AdditionalPostModActions : When mod selects troll or spammer delete options in the post popup menu
     * - DeletedUsersHelper : When mod selects delete or destroy link under "Actions" on the left sidebar on the user dashboard
     */
    if (!confirm(`Are you sure you want to retrieve PII for user ${uid}? If no, action will be cancelled.`)) {
      console.error(`getUserPii(${uid}) cancelled.`);
      reject(`getUserPii(${uid}) cancelled.`);
      return;
    }

    $.post({
      url: `${location.origin}/admin/all-pii`,
      data: {
        fkey: fkey,
        id: uid
      }
    })
      .done(function (response) {
        // Upon success, the returned response is just a string containing some HTML.
        // I don't know what failure looks like.
        console.debug(`getUserPii(${uid}) succeeded: `, response);
        const html = $(response);
        const ip = html.find('div:contains("IP Address:") + div > span.ip-address-lookup');
        const pii = {
          name: html.find('div:contains("Real Name:") + div > a').text().trim(),
          email: html.find('div:contains("Email:") + div > a').text().trim(),
          ip: ip.text().trim(),
          tor: ip.data('tor').trim(),
        };
        resolve(pii);
      })
      .fail(function (response) {
        console.error(`getUserPii(${uid}) failed: `, response);
        reject(response);
      });
  });
}

// Edit user profile, setting specified fields
async function editUserProfile(uid, data) {
  if (typeof uid === 'undefined' || uid == null) {
    throw new Error('A required parameter is missing in a call to editUserProfile().');
  }

  // Get "ticks" value, which substitutes for the hidden "i1l" field on the user profile
  // "edit" page, which cannot be retrieved programmatically.
  const ticks = await $.get(`${location.origin}/questions/ticks`);

  // A delay of at least 2 seconds is required between fetching the "ticks" value and
  // submitting the edit to the profile. This is an old bug that manifests both
  // programmatically and when attempting to edit the profile using the web interface.
  // Apparently, this throttle is a "security" measure.
  // See https://meta.stackexchange.com/q/223761
  // and https://meta.stackexchange.com/q/183508, with answers by (former) SE developers.
  await new Promise((result) => setTimeout(result, 2000));

  // Ensure that certain fields in the specified data are set properly.
  data.fkey = fkey;
  data.i1l = ticks;

  // Submit the request to edit the user profile.
  let response;
  try {
    response = await $.post({
      url: `${location.origin}/users/edit/${uid}/post`,
      data: data,
    });

    // Upon success, the returned object looks like the following:
    //     {
    //         redirect: "https://stackoverflow.com/users/XXX/userXXX"
    //     }
    // On failure, it is a string.
    if (typeof response === 'object') {
      console.debug(`editUserProfile(${uid}) returned success: `, response);
      return response;
    }
    else {
      console.error(`editUserProfile(${uid}) returned an error: `, response);
      throw new Error(response);
    }
  }
  catch (e) {
    console.error(`editUserProfile(${uid}) failed: `, e);
    throw new Error(e);
  }
}

// Edit user profile to set/clear their display name
async function resetUserDisplayName(uid, displayName = '') {
  return editUserProfile(uid,
    {
      'fields': '',
      'author': '',
      'push': true,         // copy changes to all sites
      'DisplayName': displayName,
      //'RealName'       : '',           // do not reset this field
      //'ProfileImageUrl': '',           // do not reset this field
      //'Location'       : '',           // do not reset this field
      //'LocationPlaceId': '',           // do not reset this field
      //'Title'          : '',           // do not reset this field
      //'WebsiteUrl'     : '',           // do not reset this field
      //'TwitterUrl'     : '',           // do not reset this field
      //'GitHubUrl'      : '',           // do not reset this field
      //'AboutMe'        : '',           // do not reset this field
    });
}

// Edit user profile, clearing all fields
async function resetUserProfile(uid, displayName = '') {
  return editUserProfile(uid,
    {
      'fields': '',
      'author': '',
      'push': true,               // copy changes to all sites
      'DisplayName': displayName,
      //'RealName'       : '',    // DO NOT reset this field
      'ProfileImageUrl': '',
      'Location': '',
      'LocationPlaceId': '',
      'Title': '',
      'WebsiteUrl': '',
      'TwitterUrl': '',
      'GitHubUrl': '',
      'AboutMe': '',
    });
}

// Send mod message + optional suspension
function modMessageUser(uid, message = '', sendEmail = true, suspendDays = 0, templateName = 'something else...', suspendReason = 'for rule violations') {
  return new Promise(function (resolve, reject) {
    if (typeof uid === 'undefined' || uid == null) { reject(); return; }
    if (suspendDays < 0 || suspendDays > 365) { reject(); return; }

    // Message cannot be empty
    message = message?.trim();
    if (message == null || message.length === 0) {
      alert('Mod message cannot be empty.'); reject(); return;
    }

    $.post({
      url: `${location.origin}/users/message/save`,
      data: {
        'fkey': fkey || _getFkey(),
        'userId': uid,
        'lastMessageDate': 0,
        'email': sendEmail,
        'suspendUser': (suspendDays > 0),
        'suspend-choice': ((suspendDays > 0) ? suspendDays : 0),
        'suspendDays': suspendDays,
        'templateName': templateName,
        'suspendReason': suspendReason,
        'templateEdited': false,
        'post-text': message,
        'author': null
      }
    })
      .done(function (response) {
        // Upon success, this returns a string of HTML for the message page.
        // On failure, it is a string containing an error message.
        // Unfortunately, this means there is no truly reliable way of detecting
        // whether the action has succeeded, but we can get close by looking to
        // see if the response string is HTML, since an error message should not.
        // In addition, known possible response strings are checked explicitly
        // at the beginning, both to improve the accuracy of detection and to
        // allow better error-handling to be implemented in the future.
        const responseTrimmed = response.trim();
        if (responseTrimmed.trim() === 'A more recent message has been posted about this user; please review this and retry if appropriate') {
          console.error(`modMessageUser(${uid}) returned an error: `, response);
          reject(response);
        }
        else {
          if (responseTrimmed.startsWith('<!DOCTYPE html') ||
            responseTrimmed.startsWith('<html')) {
            console.debug(`modMessageUser(${uid}) succeeded: `, response);
            resolve(response);
          }
          else {
            console.error(`modMessageUser(${uid}) returned an error: `, response);
            reject(response);
          }
        }
      })
      .fail(function (response) {
        console.error(`modMessageUser(${uid}) failed: `, response);
        reject(response);
      });
  });
}

async function removeUser(uid, destroy, details, reason, userInfo = null, pii = null) {
  if ((typeof uid === 'undefined' || uid == null) ||
    (typeof destroy === 'undefined' || destroy == null) ||
    (typeof details === 'undefined' || details == null) ||
    (typeof reason === 'undefined' || reason == null)) {
    throw new Error('One or more required parameters are missing in a call to removeUser().');
  }

  if (!userInfo) {
    try {
      userInfo = await getUserInfoFromApi(uid);
    }
    catch (e) {
      console.warn(`getUserInfoFromApi(${uid}) failed in removeUser(): `, e);
      console.assert(userInfo == null);
    }
  }

  if (!pii) {
    try {
      pii = await getUserPii(uid);
    }
    catch (e) {
      console.warn(`getUserPii(${uid}) failed in removeUser(): `, e);
      console.assert(pii == null);
    }
  }

  let piiDetails = '';
  if (pii) {
    piiDetails += `Real Name:          ${pii?.name ?? '-?-'}\n`;
    piiDetails += `Email Address:      ${pii?.email ?? '-?-'}\n`;
    piiDetails += `IP Address:         ${pii?.ip ?? '-?-'} (tor: ${pii?.tor ?? '-?-'})\n`;
  }

  let userDetails = '';
  if (userInfo) {
    userDetails += `Display Name:       ${userInfo?.display_name}\n`;
    if (pii) {
      userDetails += piiDetails;
    }
    userDetails += `User Type:          ${userInfo?.user_type ?? '-?-'}\n`;
    userDetails += `Creation Date:      ${dateToIsoString(seApiDateToDate(userInfo?.creation_date)) ?? '-?-'}\n`;
    userDetails += `Last Modified Date: ${dateToIsoString(seApiDateToDate(userInfo?.last_modified_date)) ?? '-?-'}\n`;
    userDetails += `Last Access Date:   ${dateToIsoString(seApiDateToDate(userInfo?.last_access_date)) ?? '-?-'}\n`;
    userDetails += `Profile Location:   ${userInfo?.location ?? '-?-'}\n`;
    userDetails += `Website URL:        ${userInfo?.website_url ?? '-?-'}\n`;
    userDetails += `Avatar Image:       ${userInfo?.profile_image ?? '-?-'}\n`;
    userDetails += `Reputation:         ${userInfo?.reputation ?? '-?-'}\n`;
    userDetails += `Badges:             ${userInfo?.badge_counts?.bronze ?? '-?-'} bronze; ${userInfo?.badge_counts?.silver ?? '-?-'} silver; ${userInfo?.badge_counts?.gold ?? '-?-'} gold\n`;
    userDetails += `Upvote Count:       ${userInfo?.up_vote_count ?? '-?-'}\n`;
    userDetails += `Downvote Count:     ${userInfo?.down_vote_count ?? '-?-'}\n`;
  }
  else if (pii) {
    userDetails += piiDetails;
  }

  const fullDetails = `\n${userDetails}\n${details ? `${details.trim()}\n` : ''}`;
  const mode = destroy ? 'destroy' : 'delete';
  let response;
  try {
    response = await $.post({
      url: `${location.origin}/admin/users/${uid}/${mode}`,
      data: {
        'fkey': fkey || _getFkey(),
        'annotation': '',
        'mod-actions': mode,
        [`${mode}Reason`]: reason,
        [`${mode}ReasonDetails`]: fullDetails
      }
    });

    // Upon success, the returned object looks like the following:
    //     {
    //         "success": true,
    //         "message": "<pre class=\"m0\">Renaming user from &quot;User Name&quot; to &quot;userXXXX&quot;\n...</pre>"
    //     }
    // On failure, it may be an object, or it may be a string;
    // the endpoint is frustratingly inconsistent.
    if ((typeof response === 'object') && response?.success) {
      console.debug(`removeUser(${uid}) returned success: `, response);
      return response;
    }
    else {
      console.error(`removeUser(${uid}) returned an error: `, response);
      throw new Error(response);
    }
  }
  catch (e) {
    console.error(`removeUser(${uid}) failed: `, e);
    throw new Error(e);
  }
}
async function deleteUser(uid, details, reason, userInfo = null, pii = null) {
  return removeUser(uid, false, details, reason, userInfo, pii);
}
async function destroyUser(uid, details, reason, userInfo = null, pii = null) {
  return removeUser(uid, true, details, reason, userInfo, pii);
}



/**
 * ================================
 * Posts
 * ================================
 */

// Get posts from API
function getPostsFromApi(postIds, filter = 'default', sort = 'creation', order = 'desc', site = siteApiSlug) {
  return new Promise(function (resolve, reject) {
    if (typeof postIds === 'undefined' || !postIds?.length) { reject(); return; }
    if (site === 'stackoverflowteams') { reject('SO Teams not supported.'); return; }

    // Convert to array of unique IDs, and delimit with semicolons
    if (Array.isArray(postIds)) {
      postIds = [...new Set(postIds)].join(';');
    }

    // Limit to first 100, otherwise the API will throw HTTP400
    if (postIds.length > 100) {
      console.warn(`getPostsFromApi() called with ${postIds.length} unique ids; only the first 100 will be used.`);
      postIds = postIds.slice(0, 100);
    }

    // Use this default filter (excludes collectives info), adds post title (even on answers), post upvotes & downvotes
    // https://api.stackexchange.com/docs/posts-by-ids#order=desc&sort=activity&filter=!2)tptOiAYce9)*ZPQJ7Xb&site=stackoverflow
    filter = filter === 'default' ? '!2)tptOiAYce9)*ZPQJ7Xb' : filter;

    // Fallback for seApiUrl
    const _seApiUrl = typeof seApiUrl === 'string' ? seApiUrl : 'https://api.stackexchange.com/2.2';

    // Use a default apikey if none provided
    const _apikey = typeof apikey === 'string' ? apikey : '';

    const url = `${_seApiUrl}/posts/${postIds}?sort=${sort}&order=${order}&site=${site}&filter=${filter}&key=${_apikey}`;

    $.get(url)
      .done(function (response) {
        if (!response || Object.hasOwn(response, 'error_id') || !Object.hasOwn(response, 'items')) {
          console.error(`getPostsFromApi failed: `, response);
          reject(response);
        }
        else {
          resolve(response.items);
        }
      })
      .fail(function (response) {
        console.error(`getPostsFromApi failed: `, response);
        reject(response);
      });
  });
}

// Close individual post
// closeReasonId: 'NeedMoreFocus', 'SiteSpecific', 'NeedsDetailsOrClarity', 'OpinionBased', 'Duplicate'
// if closeReasonId is 'SiteSpecific', offtopicReasonId : 11-norepro, 13-nomcve, 16-toolrec, 3-custom
function closeQuestionAsOfftopic(pid, closeReasonId = 'SiteSpecific', offtopicReasonId = 3, offTopicOtherText = 'I\u2019m voting to close this question because ', duplicateOfQuestionId = null) {

  // OffTopic has been replaced with SiteSpecific
  if (closeReasonId === 'OffTopic') closeReasonId = 'SiteSpecific';

  return new Promise(function (resolve, reject) {
    if (!isSO) { reject(); return; }
    if (typeof pid === 'undefined' || pid === null) { reject(); return; }
    if (typeof closeReasonId === 'undefined' || closeReasonId === null) { reject(); return; }
    if (closeReasonId === 'SiteSpecific' && (typeof offtopicReasonId === 'undefined' || offtopicReasonId === null)) { reject(); return; }

    if (closeReasonId === 'Duplicate') offtopicReasonId = null;

    // Logging actual action
    console.log(`%c Closing ${pid} as ${closeReasonId}, reason ${offtopicReasonId}.`, 'font-weight: bold');

    $.post({
      url: `${location.origin}/flags/questions/${pid}/close/add`,
      data: {
        'fkey': fkey || _getFkey(),
        'closeReasonId': closeReasonId,
        'duplicateOfQuestionId': duplicateOfQuestionId,
        'siteSpecificCloseReasonId': offtopicReasonId,
        'siteSpecificOtherText': offtopicReasonId == 3 && isSO ? 'This question does not appear to be about programming within the scope defined in the [help]' : offTopicOtherText,
        //'offTopicOtherCommentId': '',
        'originalSiteSpecificOtherText': 'I\u2019m voting to close this question because '
      }
    })
      .done(resolve)
      .fail(reject);
  });
}
function closeQuestionAsDuplicate(pid, targetPid) {
  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid === null) { reject(); return; }
    if (typeof targetPid === 'undefined' || targetPid === null) { reject(); return; }
    closeQuestionAsOfftopic(pid, 'Duplicate', null, 'I\'m voting to close this question as off-topic because ', targetPid)
      .then(resolve)
      .catch(reject);
  });
}
function closeSOMetaQuestionAsOfftopic(pid, closeReason = 'SiteSpecific', offtopicReasonId = 6) {
  return new Promise(function (resolve, reject) {
    if (!isSOMeta) { reject(); return; }
    if (typeof pid === 'undefined' || pid === null) { reject(); return; }
    if (typeof closeReason === 'undefined' || closeReason === null) { reject(); return; }
    if (closeReason === 'SiteSpecific' && (typeof offtopicReasonId === 'undefined' || offtopicReasonId === null)) { reject(); return; }

    addComment(pid, `You are on [Meta](/help/whats-meta). This question will not be answered here and you may want to go over the [Checklist](//meta.stackoverflow.com/q/260648) and [ask] before you repost on [main].`);

    $.post({
      url: `${location.origin}/flags/questions/${pid}/close/add`,
      data: {
        'fkey': fkey || _getFkey(),
        'closeReasonId': closeReason,
        'siteSpecificCloseReasonId': offtopicReasonId
      }
    })
      .done(resolve)
      .fail(reject);
  });
}

// Reopen individual question
function reopenQuestion(pid) {
  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid === null) { reject(); return; }

    $.post({
      url: `${location.origin}/flags/questions/${pid}/reopen/add`,
      data: { 'fkey': fkey || _getFkey() }
    })
      .done(resolve)
      .fail(reject);
  });
}

// Delete post/posts
async function deletePost(pid) {
  if (typeof pid !== 'number' || isNaN(pid) || pid <= 0) { Promise.reject(); return; }

  return await $.post({
    url: `${location.origin}/posts/${pid}/vote/10`,
    data: { 'fkey': fkey || _getFkey() }
  });
}
async function deletePosts(pids) {
  if (!Array.isArray(pids)) pids = [pids];
  pids.forEach(async pid => await deletePost(pid));
}

// Undelete post/posts
async function undeletePost(pid) {
  if (typeof pid !== 'number' || isNaN(pid) || pid <= 0) { Promise.reject(); return; }

  return await $.post({
    url: `${location.origin}/posts/${pid}/vote/11`,
    data: { 'fkey': fkey || _getFkey() }
  });
}
async function undeletePosts(pids) {
  if (!Array.isArray(pids)) pids = [pids];
  pids.forEach(async pid => await undeletePost(pid));
}

// Mod re-delete post/posts (to prevent user from undeleting)
async function redeletePost(pid) {
  if (typeof pid !== 'number' || isNaN(pid) || pid <= 0) { Promise.reject(); return; }

  try {
    await undeletePost(pid);
    await deletePost(pid);
  } catch (e) {
    console.error(`Error re-deleting post ${pid}`, e);
    Promise.reject();
  }
}
async function redeletePosts(pids) {
  if (!Array.isArray(pids)) pids = [pids];
  pids.forEach(async pid => await redeletePost(pid));
}

// Lock individual post
// Type: 20 - content dispute
//       21 - offtopic comments
function lockPost(pid, type, hours = 24) {
  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid === null) { reject(); return; }
    if (typeof type === 'undefined' || type === null) { reject(); return; }

    $.post({
      url: `${location.origin}/admin/posts/${pid}/lock`,
      data: {
        'fkey': fkey || _getFkey(),
        'mod-actions': 'lock',
        'noticetype': type,
        'duration': hours
      }
    })
      .done(resolve)
      .fail(reject);
  });
}

// Unlock individual post
function unlockPost(pid) {
  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid === null) { reject(); return; }

    $.post({
      url: `${location.origin}/admin/posts/${pid}/unlock`,
      data: {
        'fkey': fkey || _getFkey(),
        'mod-actions': 'unlock'
      }
    })
      .done(resolve)
      .fail(reject);
  });
}

// Protect/unprotect individual post
function _protectOrUnprotectPost(pid, protect) {
  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid === null) { reject(); return; }

    $.post({
      url: `${location.origin}/admin/posts/${pid}/${protect}`,
      data: {
        'fkey': fkey || _getFkey(),
        'mod-actions': protect,
        'duration': 1
      }
    })
      .done(resolve)
      .fail(reject);
  });
}
function protectPost(pid) {
  return _protectOrUnprotectPost(pid, 'protect');
}
function unprotectPost(pid) {
  return _protectOrUnprotectPost(pid, 'unprotect');
}

// Edit individual post to remove more than one @ symbols to be able to convert to comment without errors
// Will fail if there is already a pending edit
function tryRemoveMultipleAtFromPost(pid) {
  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid === null) { reject(); return; }

    $.get(`${location.origin}/posts/${pid}/edit`)
      .done(function (data) {
        const editUrl = $('#post-form-' + pid, data).attr('action');
        let postText = $('#wmd-input-' + pid, data).val();

        const matches = postText.match(/[@]/g);
        if (matches === null || matches && matches.length <= 1) { resolve(); return; }

        postText = postText.replace(/ [@]([\w.-]+)\b/g, ' $1');
        //console.log(editUrl, postText);

        $.post({
          url: `${location.origin}${editUrl}`,
          data: {
            'fkey': fkey || _getFkey(),
            'is-current': true,
            'edit-comment': 'remove additional @ for converting to comment',
            'post-text': postText
          }
        })
          .done(resolve)
          .fail(reject);
      });
  });
}

// Convert to comment
function convertToComment(pid, targetId) {
  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid === null) { reject(); return; }
    if (typeof targetId === 'undefined' || targetId === null) { reject(); return; }

    tryRemoveMultipleAtFromPost(pid).then(v => {
      $.post({
        url: `${location.origin}/admin/posts/${pid}/convert-to-comment`,
        data: {
          'fkey': fkey || _getFkey(),
          'mod-actions': 'convert-to-comment',
          'duration': 1,
          'target-post-id': targetId
        }
      })
        .done(resolve)
        .fail(reject);
    });
  });
}

// Convert to edit
function convertToEdit(pid, targetId) {
  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid === null) { reject(); return; }
    if (typeof targetId === 'undefined' || targetId === null) { reject(); return; }

    $.post({
      url: `${location.origin}/admin/posts/${pid}/convert-to-edit`,
      data: {
        'fkey': fkey || _getFkey(),
        'mod-actions': 'convert-to-edit',
        'duration': 1,
        'target-post-id': targetId
      }
    })
      .done(resolve)
      .fail(reject);
  });
}

// Delete as plagiarism
function deleteAsPlagiarism(pid) {
  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid === null) { reject(); return; }

    $.post({
      url: `${location.origin}/admin/posts/${pid}/delete-as-plagiarism`,
      data: { 'fkey': fkey || _getFkey() }
    })
      .done(resolve)
      .fail(reject);
  });
}

// Flag as plagiarism
function flagAsPlagiarism(pid, flagText = 'Plagiarized content', source = '') {
  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid === null) { reject(); return; }
    if (!flagText || flagText.length < 10) { reject(); return; }
    if (!source || source.length < 10) { reject(); return; }

    $.post({
      url: `${location.origin}/flags/posts/${pid}/add/PlagiarizedContent`,
      data: {
        'fkey': fkey || _getFkey(),
        'otherText': flagText,
        'customData': {
          'plagiarizedSource': source,
        },
        'overrideWarning': false
      }
    })
      .done(resolve)
      .fail(reject);
  });
}

// Flag and delete as plagiarism
function flagAndDeleteAsPlagiarism(pid, flagText = 'Plagiarized content', source = '') {
  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid === null) { reject(); return; }

    flagAsPlagiarism(pid, flagText, source).then(v => {
      deleteAsPlagiarism(pid).then(resolve).catch(reject);
    }).catch(reject);
  });
}

// Get post timeline
async function getPostTimeline(postId) {
  // Get default timeline: without daily vote summary
  const url = `${location.origin}/posts/${postId}/timeline?_=${Date.now()}`;
  const resp = await fetch(url);
  const html = await resp.text();
  const dom = getDomFromHtml(html);

  // Map each row in timeline to object
  const arr = [];
  const timelineRows = dom.querySelectorAll('tbody.event-rows > tr');
  [...timelineRows].forEach(row => {
    const actionCell = row.children[2];
    const actionLink = actionCell?.querySelector('a');
    const whoLink = row.children[3].querySelector('a') || row.children[3].querySelector('span');
    const isMod = row.children[3].querySelector('span.mod-flair') ? true : false;

    const item = {
      date: new Date(row.querySelector('.relativetime')?.title),
      type: row.querySelector('.event-type')?.textContent.trim(),
      actionText: actionCell?.textContent.trim(),
      actionUrl: actionLink?.href || (actionLink?.dataset.revisionGuid && `${location.origin}/posts/${postId}/revisions/${actionLink.dataset.revisionGuid}`),
      who: whoLink?.textContent.trim(),
      whoUrl: whoLink?.href,
      isMod,
      licence: row.querySelector('a[href^="https://creativecommons.org/"]')?.textContent.trim(),
      comment: row.querySelector('.revision-comment, .event-comment span, .event-comment')?.textContent.trim(),
    };

    arr.push(item);
  });
  return arr;
}

async function getPostRevisionsFromTimeline(postId) {
  const timeline = await getPostTimeline(postId);
  const revisions = timeline.filter(v => v.type === 'history' && (v.actionText === 'edited' || v.actionText === 'suggested')) || [];
  return revisions;
}

async function getLatestPostRevisionGuid(postId) {
  const url = `${location.origin}/posts/${postId}/revisions?&_=${Date.now()}`;

  let resp, html, dom;
  try {
    resp = await fetch(url);
    html = await resp.text();
    dom = getDomFromHtml(html);

    const sourceLink = dom?.querySelector('.js-revision a[href$="/view-source"]')?.getAttribute('href')?.match(/\/revisions\/([a-z0-9-]+)\/view-source/)?.pop();
    const sourceBtn = dom?.querySelector('.js-revision button[data-guid]')?.getAttribute('data-guid');
    return sourceLink || sourceBtn;
  }
  catch (e) {
    console.error(e, resp, html, dom);
    return;
  }
}

async function getRevisionSource(guidOrUrl) {
  const guid = guidOrUrl?.match(/\/revisions\/([a-z0-9-]+)\/view-source/)?.pop() || guidOrUrl;
  const url = `${location.origin}/revisions/${guid}/view-source`;

  let resp, html, dom, revisionBody;
  try {
    resp = await fetch(url);
    html = await resp.text();
    dom = getDomFromHtml(html);
    revisionBody = dom.querySelector('pre');
  }
  catch (e) {
    console.error(e, resp, html, dom, revisionBody);
    return;
  }

  // Get revision body
  if (!revisionBody)
    return console.error(`No revision source found: ${url}`);

  // Simple strip markdown formatting
  // https://regex101.com/r/IdRz6K
  return revisionBody.textContent
    .replace(/^ *#{1,3} */gm, '\n\n') // remove headings
    .replace(/^[ ]*\[\d+\]:\s+/gm, '') // remove links at bottom
    .replace(/!?\[(.*?)\](\(.*?\)|\[\d+\])/g, '$1') // remove links and images
    .replace(/```\s(.*?)\s```/gs, '$1') // remove code blocks
    .replace(/`([^`]+)`/g, '$1') // remove inline code
    .replace(/^(?: *(-|\d+\.) *)+/gm, '') // remove lists and hr
    .replace(/^(?: *> *)+/gm, '') // remove blockquotes
    .replace(/(^| )\*\*(.*?)\*\*/gm, '$1$2') // Remove bold
    .replace(/(^| )[*_](.*?)[*_]/gm, '$1$2') // Remove italics
    .trim();
}

async function getLatestPostRevisionSource(postId) {
  const guid = await getLatestPostRevisionGuid(postId);
  return await getRevisionSource(guid);
}



/**
 * ================================
 * Comments
 * ================================
 */

// Post comment on post
function addComment(pid, commentText) {
  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid === null) { reject(); return; }
    if (typeof commentText !== 'string' || commentText.trim() === '') { reject(); return; }

    $.post({
      url: `${location.origin}/posts/${pid}/comments`,
      data: {
        'fkey': fkey || _getFkey(),
        'comment': commentText
      }
    })
      .done(resolve)
      .fail(reject);
  });
}

// Delete individual comment
function deleteComment(cid, sendCommentBackInMessage = false) {
  return new Promise(function (resolve, reject) {
    if (typeof cid === 'undefined' || cid === null) { reject(); return; }

    $.post({
      url: `https://${location.hostname}/posts/comments/${cid}/vote/10`,
      data: {
        'fkey': fkey || _getFkey(),
        'sendCommentBackInMessage': sendCommentBackInMessage
      }
    })
      .done(resolve)
      .fail(reject);
  });
}

// Delete all comments on post
function deleteCommentsOnPost(pid) {
  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid == null) { reject(); return; }

    $.post({
      url: `${location.origin}/admin/posts/${pid}/delete-comments`,
      data: {
        'fkey': fkey || _getFkey(),
        'mod-actions': 'delete-comments'
      }
    })
      .done(function (data) {
        $('#comments-' + pid).remove();
        $('#comments-link-' + pid).html('<b>Comments deleted.</b>');
        resolve();
      })
      .fail(reject);
  });
}

// Move all comments on post to chat
function moveCommentsOnPostToChat(pid) {
  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid == null) { reject(); return; }

    $.post({
      url: `${location.origin}/admin/posts/${pid}/move-comments-to-chat`,
      data: {
        'fkey': fkey || _getFkey(),
        'deleteMovedComments': 'true'
      }
    })
      .done(function (data) {
        $('#comments-' + pid).remove();
        $('#comments-link-' + pid).html(`<span>${data.info}</span>`);
        resolve();
      })
      .fail(reject);
  });
}



/**
 * ================================
 * Votes
 * ================================
 */



/**
 * ================================
 * Flags
 * ================================
 */

// Spam/rude flag individual post
function flagPost(pid, rudeFlag = false) {
  return new Promise(function (resolve, reject) {
    if (typeof pid === 'undefined' || pid === null) { reject(); return; }

    const flagType = rudeFlag ? 'PostOffensive' : 'PostSpam';
    $.post({
      url: `${location.origin}/flags/posts/${pid}/add/${flagType}`,
      data: {
        'fkey': fkey || _getFkey(),
        'otherText': null,
        'overrideWarning': true
      }
    })
      .done(function (response) {
        // Upon success, the returned object looks like the following:
        //     {
        //         "Success":            true,
        //         "Message":            "Thanks, we'll take a look at it",
        //         "FlagType":           2,
        //         "ResultChangedState": true,
        //         "Outcome":            0
        //     }
        // On failure, it may be an object, or it may be a string;
        // the endpoint is frustratingly inconsistent.
        if ((typeof response === 'object') && response?.Success) {
          console.debug(`flagPost(${pid}) returned success: `, response);
          resolve(response);
        }
        else {
          console.error(`flagPost(${pid}) returned an error: `, response);
          reject(response);
        }
      })
      .fail(function (response) {
        console.error(`flagPost(${pid}) failed: `, response);
        reject(response);
      });
  });
}
function spamFlagPost(pid) {
  return flagPost(pid, false);
}
function rudeFlagPost(pid) {
  return flagPost(pid, true);
}



/**
 * ================================
 * Mods
 * ================================
 */
// Send mod message + optional suspension
function sendModMessage(userId, templateName = 'something else...', postText = '', sendEmail = true, suspendReason = 'for rule violations', suspendDays = 0) {
  return new Promise(function (resolve, reject) {
    // Validation
    if (typeof userId !== 'number' || isNaN(userId) || userId <= 0) { reject(`sendModMessage() - invalid userId ${userId}`); return; }
    if (typeof postText !== 'string' || postText.trim().length === 0) { reject(`sendModMessage() - postText cannot be empty`); return; }
    if (suspendDays < 0 || suspendDays > 365) { reject(`sendModMessage() - invalid suspendDays ${suspendDays}`); return; }

    $.post({
      url: `${parentUrl}/users/message/save`,
      data: {
        'fkey': fkey || _getFkey(),
        userId,
        'lastMessageDate': 0,
        'email': sendEmail,
        'templateName': templateName,
        'suspendReason': suspendReason,
        'templateEdited': templateName === 'something else...',
        'post-text': message,
        'suspendUser': suspendDays > 0,
        'suspend-choice': suspendDays,
        'suspendDays': suspendDays,
        'author': null, // not in use?
      }
    })
      .done(function (response) {
        console.log(`sendModMessage(${pid}) success: `, response);
        resolve(response);
      })
      .fail(function (response) {
        console.error(`sendModMessage(${pid}) failed: `, response);
        reject(response);
      });
  });
}

// Send CM message
function sendCmMessage(userId, templateName, postText) {
  return new Promise(function (resolve, reject) {
    // Validation
    if (typeof userId !== 'number' || isNaN(userId) || userId <= 0) { reject(`sendCmMessage() - invalid userId ${userId}`); return; }
    if (typeof postText !== 'string' || postText.trim().length === 0) { reject(`sendCmMessage() - postText cannot be empty`); return; }

    $.post({
      url: `${parentUrl}/admin/cm-message/save`,
      data: {
        'fkey': fkey || _getFkey(),
        userId,
        templateName,
        'post-text': postText,
      }
    })
      .done(function (response) {
        console.log(`sendCmMessage(${userId}) success: `, response);
        resolve(response);
      })
      .fail(function (response) {
        console.error(`sendCmMessage(${userId}) failed: `, response);
        reject(response);
      });
  });
}



// EOF