// ==UserScript==
// @name         Review Queue Helper
// @description  Keyboard shortcuts, skips accepted questions and audits (to save review quota)
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.6
//
// @include      https://*stackoverflow.com/review*
// @include      https://*serverfault.com/review*
// @include      https://*superuser.com/review*
// @include      https://*askubuntu.com/review*
// @include      https://*mathoverflow.net/review*
// @include      https://*.stackexchange.com/review*
//
// @exclude      *chat.*
// @exclude      *meta.*
// @exclude      https://stackoverflow.com/c/*
// @exclude      https://stackoverflow.blog*
//
// @grant        GM_addStyle
// ==/UserScript==


// Detect if SOMU is loaded
const rafAsync = () => new Promise(resolve => { requestAnimationFrame(resolve); });
async function waitForSOMU() {
    while(typeof SOMU === 'undefined' || !SOMU.hasInit) { await rafAsync(); }
    return SOMU;
}


(function() {
    'use strict';


    const scriptName = GM_info.script.name;
    const queueType = /^\/review/.test(location.pathname) ? location.href.replace(/\/\d+(\?.*)?$/, '').split('/').pop() : null;
    const filteredElem = document.querySelector('.review-filter-tags');
    const filteredTags = filteredElem ? (filteredElem.value || '').split(' ') : [''];
    let processReview, post = {}, skipAccepted = false;
    let isLinkOnlyAnswer = false, isCodeOnlyAnswer = false;


    function loadOptions() {
        waitForSOMU().then(function(SOMU) {

            // Set option field in sidebar with current custom value; use default value if not set before
            SOMU.addOption(scriptName, 'Skip Accepted Questions', skipAccepted, 'bool');

            // Get current custom value with default
            skipAccepted = SOMU.getOptionValue(scriptName, 'Skip Accepted Questions', skipAccepted, 'bool');
        });
    }


    function skipReview() {
        setTimeout(function() {
            $('.review-actions').find('input[value$="Skip"], input[value$="Next"]').click();
        }, 500);
    }


    function isAudit() {

        let audit = false;

        // Post does not have any of the filtered tags
        if(post.tags && post.tags.length && filteredTags[0] !== '' && !filteredTags.some(t => post.tags.includes(t))) {
            audit = true;
        }

        // Check post score
        else if(!isNaN(post.votes)) {

            let votes, error = false;
            $.ajax({
                url: `https://${location.hostname}/posts/${post.id}/vote-counts`,
                async: false
            }).done(function(data) {
                votes = Number(data.up) + Number(data.down);
            }).fail(function() {
                console.error('failed fetching vote counts');
                error = true;
            });

            // Displayed post score not same as fetched vote score
            if(!error && votes !== post.votes) audit = true;
        }

        console.log("audit:", audit);
        return audit;
    }


    function processCloseReview() {

        // Question has an accepted answer, skip if enabled
        if(skipAccepted && post.isQuestion && post.accepted) {
            console.log("skipping accepted question");
            skipReview();
            return;
        }
    }


    function processLowQualityPostsReview() {

        const postEl = $('.reviewable-answer .post-text');
        const postText = postEl.text();
        const postHtml = postEl.html();
        const postNoCodeHtml = postEl.clone(true, true).find('pre, code').remove().end().html();

        // If post type is an answer
        if(!post.isQuestion) {

            // If is a short answer and there is a link in the post, select "link-only answer" option in delete dialog
            if(postText.length < 300 && /https?:\/\//.test(postHtml)) {
                isLinkOnlyAnswer = true;
                console.log('Possible link-only answer detected.');
            }

            // Try to detect if the post contains mostly code
            else if(postEl.find('pre, code').length > 0 &&
                    (postNoCodeHtml.length < 50 || postHtml.length / postNoCodeHtml.length > 0.9)) {
                isCodeOnlyAnswer = true;
                console.log('Possible code-only answer detected.');
            }
        }
    }


    function doPageLoad() {

        // No queue detected, do nothing
        if(queueType == null) return;
        console.log('Review queue:', queueType);

        // Add additional class to body based on review queue
        document.body.classList.add(queueType + '-review-queue');

        // Detect queue type and set appropriate process function
        switch(queueType) {
            case 'close':
                processReview = processCloseReview; break;
            case 'reopen':
                processReview = processCloseReview; break;
            case 'suggested-edits':
                processReview = processCloseReview; break;
            case 'helper':
                processReview = processCloseReview; break;
            case 'low-quality-posts':
                processReview = processLowQualityPostsReview; break;
            case 'triage':
                processReview = processCloseReview; break;
            case 'first-posts':
                processReview = processCloseReview; break;
            case 'late-answers':
                processReview = processCloseReview; break;
            default:
                break;
        }

        // Focus VTC button when radio button in close dialog popup is selected
        $(document).on('click', '#popup-close-question input:radio', function() {
            // Not migrate anywhere radio
            if(this.id === 'migrate-anywhere') return;

            $('#popup-close-question').find('input:submit').focus();
        });

        // Focus Delete button when radio button in delete dialog popup is selected
        $(document).on('click', '#delete-question-popup input:radio', function() {
            $('#delete-question-popup').find('input:submit').focus();
        });

        // Focus Flag button when radio button in flag dialog popup is selected
        $(document).on('click', '#popup-flag-post input:radio', function() {
            $('#popup-flag-post').find('input:submit').focus();
        });

        // Focus Reject button when radio button in edit reject dialog popup is selected
        $(document).on('click', '#rejection-popup input:radio', function() {
            $('#rejection-popup').find('input:submit').focus();
        });

        // Cancel existing handlers and implement our own keyboard shortcuts
        $(document).off('keypress keyup');

        // Keyboard shortcuts event handler
        $(document).on('keyup', function(evt) {

            // Back buttons: escape (27) or tilde (192)
            const cancel = evt.keyCode === 27;
            const goback = evt.keyCode === 27 || evt.keyCode === 192;

            // Get numeric key presses
            let index = evt.keyCode - 49; // 49 = number 1 = 0 (index)
            if(index < 0 || index > 6) { // handle 1-7 number keys only (index 0-6)

                // Try keypad keycodes instead
                let altIndex = evt.keyCode - 97; // 97 = number 1 = 0 (index)
                if(altIndex >= 0 && altIndex <= 6) {
                    index = altIndex; // handle 1-7 number keys only (index 0-6)
                }
                else {
                    // Both are invalid
                    index = null;
                }
            }
            console.log("keypress", evt.keyCode, "index", index);

            // Do nothing if key modifiers were pressed
            if(evt.shiftKey || evt.ctrlKey || evt.altKey) return;

            // If edit mode, cancel if esc is pressed
            if(cancel && $('.editing-review-content').is(':visible')) {
                $('.review-cancel-editing').click();
                return;
            }

            // Do nothing if a textbox or textarea is focused
            if($('input:text:focus, textarea:focus').length > 0) return;

            // Is close menu open?
            const closeMenu = $('#popup-close-question:visible');
            if(closeMenu.length > 0) {

                // If escape key pressed, go back to previous pane, or dismiss popup if on main pane
                if(goback) {
                    // Get link in breadcrumbs
                    const link = closeMenu.find('.popup-breadcrumbs a').last();
                    // Go back to previous pane if possible
                    if(link.length) {
                        link.click();
                    }
                    // Dismiss popup if on main pane
                    else {
                        closeMenu.find('.popup-close a').click();
                    }
                    return false;
                }

                // If valid index, click it
                else if(index != null) {
                    // Get active (visible) pane
                    const pane = closeMenu.find('.popup-active-pane');
                    // Get options
                    const opts = pane.find('input:radio');
                    // Click option
                    const opt = opts.eq(index).click();
                    // Job is done here. Do not bubble if an option was clicked
                    return opt.length !== 1;
                }

                return;
            }

            // Is delete menu open?
            const deleteMenu = $('#delete-question-popup:visible');
            if(deleteMenu.length > 0) {

                // Dismiss popup on escape key
                if(goback) {
                    deleteMenu.find('.popup-close a').click();
                    return false;
                }

                // If valid index, click it
                else if(index != null) {
                    // Get active (visible) pane
                    const pane = deleteMenu.find('.popup-active-pane');
                    // Get options
                    const opts = pane.find('input:radio');
                    // Click option
                    const opt = opts.eq(index).click();
                    // Job is done here. Do not bubble if an option was clicked
                    return opt.length !== 1;
                }

                return;
            }

            // Is flag menu open?
            const flagMenu = $('#popup-flag-post:visible');
            if(flagMenu.length > 0) {

                // Dismiss popup on escape key
                if(goback) {
                    flagMenu.find('.popup-close a').click();
                    return false;
                }

                // If custom mod flag box is focused, do nothing
                else if($('.mod-attention-subform textarea:focus').length == 1) {
                    return false;
                }

                // If valid index, click it
                else if(index != null) {
                    // Get options
                    const opts = flagMenu.find('input:radio');
                    // Click option
                    const opt = opts.eq(index).click();
                    // Job is done here. Do not bubble if an option was clicked
                    return opt.length !== 1;
                }

                return;
            }

            // Is reject menu open?
            const rejectMenu = $('#rejection-popup:visible');
            if(rejectMenu.length > 0) {

                // Dismiss popup on escape key
                if(goback) {
                    rejectMenu.find('.popup-close a').click();
                    return false;
                }

                // If custom mod flag box is focused, do nothing
                else if($('textarea.custom-reason-text:focus').length == 1) {
                    return false;
                }

                // If valid index, click it
                else if(index != null) {
                    // Get options
                    const opts = rejectMenu.find('input:radio');
                    // Click option
                    const opt = opts.eq(index).click();
                    // Job is done here. Do not bubble if an option was clicked
                    return opt.length !== 1;
                }

                return;
            }

            // If escape key pressed and close popup dialog not open, do nothing
            if(goback) {
                return;
            }

            if(index != null) {
                const btns = $('.review-actions input');

                // If there is only one button and is "Next", click it
                if(btns.length === 1) {
                    index = 0;
                }

                // Default to clicking review buttons based on index
                btns.eq(index).click();

                return false;
            }
        });
    }


    function listenToPageUpdates() {

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {

            // Do nothing with fetching vote counts
            if(settings.url.includes('/vote-counts')) return;

            // Do nothing with saving preferences
            if(settings.url.includes('/users/save-preference')) return;

            // Close dialog loaded
            if(settings.url.includes('/close/popup')) {
                setTimeout(function() {

                    // Select default radio based on previous votes
                    let opts = $('#popup-close-question .bounty-indicator-tab').slice(0, -1).get().sort((a, b) => Number(a.innerText) - Number(b.innerText));
                    const selOpt = $(opts).last().closest('label').find('input').click();
                    console.log(selOpt);

                    // If selected option is in a subpane, display off-topic subpane instead
                    const pane = selOpt.closest('.popup-subpane');
                    if(pane.attr('id') !== 'pane-main') {

                        // Get pane name
                        const paneName = pane.attr('data-subpane-name');

                        // Select radio with same subpane name
                        $(`#popup-close-question input[data-subpane-name="${paneName}"]`).click();

                        // Re-select option
                        selOpt.click();
                    }
                }, 50);
            }

            // Delete dialog loaded
            else if(settings.url.includes('/posts/popup/delete/')) {
                setTimeout(function() {

                    // Select recommended option if there are no comments on post yet
                    if(post.comments.length == 0 && isLinkOnlyAnswer) {
                        $('.popup-active-pane .action-name').filter((i, el) => el.innerText.includes('link-only answer')).prev('input').click();
                    }

                    // Focus Delete button
                    $('#delete-question-popup').find('input:submit').focus();
                }, 50);
            }

            // Flag dialog loaded
            else if(settings.url.includes('/flags/posts/') && settings.url.includes('/popup')) {
                // Do nothing by default
            }

            // Question was closed
            else if(settings.url.includes('/close/add')) {
                $('.review-actions input[value*="Close"]').attr('disabled', true);
            }

            // Next review loaded, transform UI and pre-process review
            else if(settings.url.includes('/review/next-task') || settings.url.includes('/review/task-reviewed/')) {

                // Reset variables for next task
                isLinkOnlyAnswer = false;
                isCodeOnlyAnswer = false;

                // Get additional info about review from JSON response
                let responseJson = {};
                try {
                    responseJson = JSON.parse(xhr.responseText);
                    console.log(responseJson);
                }
                catch (e) {
                    console.error('error parsing JSON', xhr.responseText);
                }

                // If action was taken (post was refreshed), don't do anything else
                if(responseJson.isRefreshing) return;

                setTimeout(function() {

                    // Get post type
                    const isQuestion = $('.reviewable-post:first .answers-subheader').text().includes('Question');

                    // Get post status
                    const isClosedOrDeleted = $('.reviewable-post').first().find('.question-status, .deleted-answer').length > 0;
                    console.log('isClosedOrDeleted', isClosedOrDeleted);

                    // If no more reviews, refresh page every 10 seconds
                    // Can't use responseJson.isUnavailable here, as it can also refer to current completed review
                    if($('.review-instructions').text().includes('This queue has been cleared!')) {
                        setTimeout(() => location.reload(true), 10000);
                        return;
                    }

                    // If first-posts or late-answers queue, and not already reviewed (no Next button)
                    const reviewStatus = $('.review-status').text();
                    if((location.pathname.includes('/review/first-posts/') || location.pathname.includes('/review/late-answers/') || location.pathname.includes('/review/helper/'))
                       && !reviewStatus.includes('This item is no longer reviewable.') && !reviewStatus.includes('Review completed')) {

                        // If question, insert "Close" option
                        if(isQuestion) {
                            const closeBtn = $(`<input type="button" value="Close" title="close question" />`).attr('disabled', isClosedOrDeleted);
                            closeBtn.click(function() {
                                // If button not disabled
                                if(!$(this).prop('disabled')) {
                                    $('.post-menu').first().find('.close-question-link').click();
                                }
                                return false;
                            });
                            $('.review-actions input').first().after(closeBtn);
                        }

                        // Else if answer and user has delete privs, insert "Delete" option
                        else if(!isQuestion && (StackExchange.options.user.isModerator || StackExchange.options.user.rep >= 10000 && $('.post-menu a[title="vote to delete this post"]').length === 1)) {
                            const delBtn = $(`<input type="button" value="Delete" title="delete answer" />`).attr('disabled', isClosedOrDeleted);
                            delBtn.click(function() {
                                // If button not disabled
                                if(!$(this).prop('disabled')) {
                                    $('.post-menu').first().find('a[title*="delete"]').click();
                                }
                                return false;
                            });
                            $('.review-actions input').first().after(delBtn);
                        }

                        // Show post menu if in the H&I queue
                        if(location.pathname.includes('/review/helper/')) {
                            StackExchange.question.fullInit('.question');
                            $('.close-question-link').show();
                        }
                    }

                    // Remove "Delete" option for suggested-edits queue, if not already reviewed (no Next button)
                    if(location.pathname.includes('/review/suggested-edits/') && !$('.review-status').text().includes('This item is no longer reviewable.')) {
                        $('.review-actions input[value*="Delete"]').remove();
                    }

                    // Modify buttons
                    $('.review-actions input').val(function(i, v) {
                        if(v.includes('] ')) return v; // do not modify twice
                        return '[' + (i+1) + '] ' + v;
                    });

                    // Get review vars
                    post = {
                        id: responseJson.postId,
                        permalink: `https://${location.hostname}/${isQuestion ? 'q':'a'}/${responseJson.postId}`,
                        title: $('h1[itemprop="name"] a').text(),
                        content: $('.post-text').first().text(),
                        votes: parseInt($('.js-vote-count').first().text(), 10),
                        tags: $('.post-taglist .post-tag').get().map(v => v.innerText),
                        isQuestion: isQuestion,
                        isClosedOrDeleted: isClosedOrDeleted,
                        comments: $('.reviewable-post:first .comment-copy').get().map(v => v.innerText),
                    };
                    // Parse post stats from sidebar
                    $('.reviewable-post:first .reviewable-post-stats tr').each(function() {
                        let k = $(this).find('.label-key').text();
                        let v = $(this).find('.label-value').text();

                        if(k.length == 0 && v.length == 0) return;

                        // convert key to camelCase (in case of two words, like "is accepted" or "other answers"
                        k = k.replace(/[^\S\r\n]([^\s])/g, x => x.toUpperCase()).replace(/\s+/g, '');

                        // try convert to primitive
                        let d = new Date($(this).find('.label-value').attr('title')).getTime();
                        let b = v == 'no' ? false : v == 'yes' ? true : null;
                        let n = parseInt(v, 10);

                        if(!isNaN(d)) v = d; // date
                        else if(b !== null) v = b; // bool
                        else if(!isNaN(n)) v = n; // number

                        post[k] = v;
                    });
                    console.log(post);

                    // Check for audits and skip them
                    if(responseJson.isAudit) {
                        console.log('skipping review audit');
                        skipReview();
                        return;
                    }
                    else if(isAudit()) {
                        console.log('skipping review audit via manual check');
                        skipReview();
                        return;
                    }

                    // Process post based on queue type
                    if(typeof processReview === 'function') processReview();

                }, 100);
            }
        });
    }


    GM_addStyle(`
#footer {
    display: none !important;
}
pre {
    max-height: 320px;
}

.suggested-edits-review-queue .review-bar .review-summary {
    flex-basis: 45%;
}
.suggested-edits-review-queue .review-bar .review-actions-container {
    flex-basis: 55%;
}

/* Edit reasons link to take up less space */
.popup a.edit-link {
    position: absolute;
    bottom: 25px;
    left: 25px;
}

/* Number options in popups */
.popup-pane,
.popup-subpane:not(.close-as-duplicate-pane) {
    padding-left: 14px;
}
.popup .action-list li {
    position: relative;
}
.popup .action-list .action-name {
    margin-left: 0px;
}
.popup .action-list li:before {
    position: absolute;
    top: 10px;
    left: -18px;
    font-weight: bold;
    color: #333;
}
.popup .action-list li:nth-of-type(1):before {
    content: '[1]';
}
.popup .action-list li:nth-of-type(2):before {
    content: '[2]';
}
.popup .action-list li:nth-of-type(3):before {
    content: '[3]';
}
.popup .action-list li:nth-of-type(4):before {
    content: '[4]';
}
.popup .action-list li:nth-of-type(5):before {
    content: '[5]';
}
.popup .action-list li:nth-of-type(6):before {
    content: '[6]';
}
.popup .action-list li:nth-of-type(7):before {
    content: '[7]';
}
`);


    // On page load
    loadOptions();
    doPageLoad();
    listenToPageUpdates();


})();
