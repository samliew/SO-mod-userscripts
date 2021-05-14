// ==UserScript==
// @name         Reduce Clutter
// @description  Revert updates that makes the page more cluttered or less accessible
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.30.1
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*stackapps.com/*
// @include      https://*.stackexchange.com/*
//
// @exclude      *chat.*
// @exclude      *blog.*
//
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==


(function() {
    'use strict';


    // Show announcement bar if it does not contain these keywords
    const blacklistedAnnouncementWords = [ 'podcast', 'listen', 'tune' ];

    // Hide ads/clickbaity blog posts titles if they contain these keywords
    const blacklistedBlogWords = [ 'the loop', 'podcast', 'worst', 'bad', 'surprise', 'trick', 'terrible', 'will change', 'actually', 'team', 'try', 'free', 'easy', 'easier' ];


        GM_addStyle(`


/*
   Fix comment upvote and flag always showing
   https://meta.stackexchange.com/q/312794
*/
ul.comments-list .comment-voting,
ul.comments-list .comment-flagging {
    visibility: hidden;
}
ul.comments-list .comment:hover .comment-voting,
ul.comments-list .comment:hover .comment-flagging,
ul.comments-list .comment-up-on {
    visibility: visible;
}
.popup-flag-comment {
    visibility: visible !important;
}


/*
   Make comment edited icon same color as timestamp
   https://meta.stackoverflow.com/q/371313
*/
.s-link,
.iconPencilSm {
    color: #9199a1 !important;
}


/*
   Revert change to permanent "edit tags" link
   https://meta.stackoverflow.com/q/374024
*/
.post-taglist #edit-tags {
    opacity: 0.5;
}
.post-layout:hover .post-taglist #edit-tags {
    opacity: 1;
}


/*
   Remove Products menu in the top bar
   https://meta.stackoverflow.com/q/386393
*/
.top-bar .-marketing-link {
    display: none !important;
}


/*
   Hide announcements bar before page load,
     then check text for blacklisted words after page load
   https://meta.stackoverflow.com/q/390709
*/
#announcement-banner {
    display: none !important;
}


/*
   Hide newsletter sidebar ad to reclaim vertical space
   https://meta.stackoverflow.com/q/360450
*/
#newsletter-ad {
    display: none !important;
}


/*
   Hide post reactions (Teams), and experiments on main
   https://meta.stackoverflow.com/q/398367
*/
.votecell [data-controller="reactions"],
.js-reactions {
    display: none !important;
}


/*
   Hide new contributor popover
   Hide new contributor displaying twice on a post (post author and when commenting)
   https://meta.stackoverflow.com/q/372877
*/
.js-new-contributor-popover {
    display: none !important;
}
.comments .new-contributor-indicator {
    display: none !important;
}


/*
   Better "duplicates edited list" in question revisions page
   https://meta.stackoverflow.com/q/400817
*/
.revision-page .revision-comment.somu-duplicates-edited {
    display: block;
    padding-top: 5px;
}
.revision-page .revision-comment.somu-duplicates-edited ul {
    margin-bottom: 0;
}
.revision-page .revision-comment.somu-duplicates-edited li {
    padding-top: 0;
}
.revision-page .originals-of-duplicate li {
    position: relative;
    cursor: initial;
    list-style-type: none;
}
.revision-page .originals-of-duplicate li:before {
    display: block;
    position: absolute;
    top: 0;
    left: -16px;
    font-size: 1.2em;
    font-weight: bold;
    content: '•';
    color: var(--black-300);
}
.revision-page .revision-comment.somu-duplicates-edited .originals-of-duplicate li.somu-dupe-added:before {
    content: '+';
    color: var(--green-600);
    left: -18px;
}
.revision-page .revision-comment.somu-duplicates-edited .originals-of-duplicate li.somu-dupe-removed:before {
    content: '–';
    color: var(--red-600);
    top: -2px;
    left: -18px;
}


/*
   Hide follow post tooltip popup
   https://meta.stackexchange.com/q/345661
*/
.js-follow-post ~ .s-popover {
    display: none !important;
}


/*
   Set a variable max-height for code blocks
   https://meta.stackoverflow.com/q/397012
*/
.js-post-body pre,
.wmd-preview pre {
    max-height: 80vh;
}


/*
   Remove new edit button from question closed notice
   https://meta.stackexchange.com/q/349479
*/
.js-post-notice .mt24:last-child {
    display: none;
}


/*
   Revert large margins on .s-prose
   https://meta.stackexchange.com/q/353446
*/
.s-prose {
    margin-bottom: 1.4em;
    line-height: 1.4em;
}
.s-prose blockquote {
    margin-left: 0px;
    line-height: 1.4em;
}
.s-prose > * {
    margin-bottom: 1em !important;
}


/*
   Switch back to yellow background color for blockquotes
   https://meta.stackexchange.com/q/343919
   https://meta.stackexchange.com/q/344874
*/
.s-prose blockquote {
    margin-left: 0;
    margin-right: 0;
    padding: 1em;
    padding-left: 1.2em;
    background-color: var(--yellow-050) !important;
    color: inherit;
}


/*
   Fix some z-indexes to prevent them from being in front of (close) dialogs
*/
.s-btn-group .s-btn.is-selected {
    z-index: unset !important;
}


/* Expand profile descriptions on hover without using scrollbars in a small area */
#user-card .profile-user--about {
    max-height: auto;
    height: auto;
    overflow: hidden !important;
}
#user-card .profile-user--bio {
    height: 240px;
    overflow: hidden;
}
#user-card > .grid > .grid--cell:hover .profile-user--bio {
    height: auto;
}


/* Revert post menu to lowercase */
#edit-tags,
.js-post-menu > .grid > .grid--cell > a,
.js-post-menu > .grid > .grid--cell > button {
    text-transform: lowercase;
}


`);


    document.addEventListener('DOMContentLoaded', function(evt) {

        // If rep notification is displaying low values, remove it
        let repBadge = document.querySelector('.js-achievements-button .indicator-badge');
        if(repBadge) {
            let repCount = Number(repBadge.innerText);
            if(repCount > -5 && repCount < 5) repBadge.parentNode.removeChild(repBadge);
        }

        showAnnouncementIfNotBlacklisted();
        hideClickbaityBlogPosts();
        setTimeout(stripUnnecessaryTracking, 2000);

        revertVotecellTooltips();
        initShortUsernames();
        initShortenBadgeCounts();
        initFixBrokenImages();

        betterDuplicatesEditedList();

    });


    function showAnnouncementIfNotBlacklisted() {

        const annBar = document.getElementById('announcement-banner');
        if(annBar) {

            const annText = annBar.innerText.trim().toLowerCase();
            const isBlacklisted = blacklistedAnnouncementWords && blacklistedAnnouncementWords.some(v => annText.includes(v));

            // Show announcement bar when it doesn't contain blacklisted keywords
            if(!isBlacklisted) {
                annBar.style.setProperty('display', 'block', 'important');
            }
            else {
                console.log('Announcement bar has been blocked.', annText);
            }
        }
    }


    function hideClickbaityBlogPosts() {

        // Hide clickbaity featured blog post titles from sidebar
        const blogheader = $('.s-sidebarwidget__yellow .s-sidebarwidget--header').filter((i, el) => el.innerText.includes('Blog'));
        if(blogheader.length) {
            let itemsRemoved = 0;
            let items = blogheader.nextAll('li').find('a[href^="https://stackoverflow.blog"]').each(function(i, el) {
                const blogtext = el.innerText.toLowerCase().trim();
                const isBlacklisted = blacklistedBlogWords && blacklistedBlogWords.some(v => blogtext.includes(v));
                if(isBlacklisted) {
                    $(this).parents('li').remove();
                    itemsRemoved++;
                    console.log('Featured blogpost has been blocked.', blogtext);
                }
            });

            // if no items remaining, remove "Blog" heading
            if(items.length == itemsRemoved) {
                blogheader.remove();
            }
        }
    }


    function stripUnnecessaryTracking() {

        // Strip unnecessary tracking
        let trackedElemCount = 0;
        $('.js-gps-track, [data-ga], [data-gps-track], a[href*="utm_"]').each(function(i, el) {
            this.classList.remove('js-gps-track');
            el.dataset.ga = '';
            el.dataset.gpsTrack = '';
            el.removeAttribute('data-ga');
            el.removeAttribute('data-gps-track');

            // Specify which query params to remove from link
            let params = new URLSearchParams(el.search);
            params.delete('utm_source');
            params.delete('utm_medium');
            params.delete('utm_campaign');
            params.delete('utm_content');
            el.search = params.toString();

            trackedElemCount++;
        });
        console.log('Removed tracking data from ' + trackedElemCount + ' elements');

        // Strip unnecessary query params from Q&A links
        let trackedQaCount = 0;
        $('#content a').each(function(i, el) {
            if(el.dataset.searchsession) {
                el.dataset.searchsession = '';
                trackedQaCount++;
            }
            el.search ? el.href = el.getAttribute('href').replace(/[?&]((cb|lq|rq)=1|ref=.*)/i, '') : 0;
        });
        $('.js-search-results').off('mousedown touchstart');
        console.log('Removed tracking data from ' + trackedQaCount + ' Q&A links');
    }


    function betterDuplicatesEditedList() {

        $('#revisions .revcell3 .revision-comment').not('.somu-duplicates-edited').each(function(i, el) {

            // Duplicates list edit revisions
            if(el.innerText.includes('duplicates list edited from')) {
                let replacedHtml = el.innerHTML
                  .replace('duplicates list edited from', '<span>duplicates list edited from</span> <ul class="originals-of-duplicate">')
                  .replace(/<\/a>\s+to\s+<a/, '</a></ul><span>to</span><ul class="originals-of-duplicate"><a')
                  .replace(/\s*<\/a>,\s*/g, '</a>');
                el.innerHTML = replacedHtml + '</ul>';
                $(this).addClass('somu-duplicates-edited').find('a').wrap('<li>');

                // Highlight changes
                $(this).find('li').each(function() {
                    this.dataset.linkedpostid = $(this).children('a').attr('href').match(/\/(\d+)\//)[1];
                });
                const firstList = $(this).children('.originals-of-duplicate').first();
                const secondList = $(this).children('.originals-of-duplicate').last();

                // Find removals
                firstList.children('li').each(function(i, el) {
                    const removed = !secondList.children('li').get().map(v => v.dataset.linkedpostid).some(id => el.dataset.linkedpostid === id);
                    $(this).toggleClass('somu-dupe-removed', removed);
                });

                // Find additions
                secondList.children('li').each(function(i, el) {
                    const added = !firstList.children('li').get().map(v => v.dataset.linkedpostid).some(id => el.dataset.linkedpostid === id);
                    $(this).toggleClass('somu-dupe-added', added);
                });
            }
        });
    }


    function revertVotecellTooltips() {

        function findAndRevertTooltips() {
            $('.js-voting-container, .js-post-menu').find('[aria-describedby^="--stacks-s-tooltip"]').each(function() {
                const tooltipId = $(this).attr('aria-describedby');
                const tooltip = $('#' + $(this).attr('aria-describedby'));
                this.title = tooltip.text();

                $(this).attr('aria-describedby', '');
                tooltip.remove();
            });
        }

        findAndRevertTooltips();
        setTimeout(findAndRevertTooltips, 200);
        $(document).ajaxStop(() => setTimeout(findAndRevertTooltips, 200)); // on page update
    }


    function initShortUsernames() {

        function findAndShortenUsernames() {
            $('a[href^="/users/"], #qtoc a.post-hyperlink').not('.my-profile').not('.js-shortusernames')
                .filter((i, el) => el.children.length === 0)
                .addClass('js-shortusernames').text((i, v) => {
                    return v.trim()
                        .replace(/[\s-_]+(-|_|says|likes|loves|supports|is|is.at)[\s-_]*.+$/i, '');
                });
        }

        findAndShortenUsernames();
        $(document).ajaxStop(findAndShortenUsernames); // on page update
    }


    function initShortenBadgeCounts() {

        function findAndShortenBadgeCounts() {
            $('.badgecount').not('.js-shortbadgecounts').addClass('js-shortbadgecounts').text((i, v) => v.length <= 3 ? v : v.replace(/\d{3}$/, 'k'));
        }

        findAndShortenBadgeCounts();
        $(document).ajaxStop(findAndShortenBadgeCounts); // on page update
    }


    function initFixBrokenImages() {

        function fixBrokenImages() {

            // Apply to newly-loaded unprocessed images
            $('img').not('[js-error-check]').attr('js-error-check', '').each(function(i, img) {

                const originalImg = img.src;

                // When image throws an error, set to transparent with gray bgcolor
                img.addEventListener('error', function(evt) {
                    img.setAttribute('data-original-image', originalImg);
                    img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"; // https://stackoverflow.com/a/26896684
                    img.style.background = 'var(--black-100)';
                    img.classList.add('img-haserror');
                });

                // Workaround for cached images, swap the source so we can catch any image errors after setting the event listener
                img.src = '#';
                img.src = originalImg;
            });
        }

        fixBrokenImages();
        $(document).ajaxStop(fixBrokenImages); // on page update
    }


})();
