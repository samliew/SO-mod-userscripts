// ==UserScript==
// @name         Reduce Clutter
// @description  Revert recent changes that makes the page more cluttered
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.22
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
    const blacklistedBlogWords = [ 'podcast', 'worst', 'bad', 'surprise', 'trick', 'terrible', 'will change', 'actually', 'team', 'try', 'free', 'easy', 'easier' ];


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


/* Hide newsletter sidebar ad */
#newsletter-ad {
    display: none !important;
}


/* Hide post reactions (Teams) */
.votecell [data-controller="reactions"],
.votecell .js-reactions {
    display: none !important;
}


/* Hide new contributor popover */
.js-new-contributor-popover {
    display: none !important;
}
/* Hide new contributor displaying twice on a post */
.comments .new-contributor-indicator {
    display: none !important;
}


/* Better duplicates edited list in revisions */
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
    cursor: initial;
}
.revision-page .revision-comment.somu-duplicates-edited .originals-of-duplicate li.somu-dupe-added,
.revision-page .revision-comment.somu-duplicates-edited .originals-of-duplicate li.somu-dupe-removed {
    list-style-type: none;
}
.revision-page .revision-comment.somu-duplicates-edited .originals-of-duplicate li.somu-dupe-added:before,
.revision-page .revision-comment.somu-duplicates-edited .originals-of-duplicate li.somu-dupe-removed:before {
    display: block;
    position: absolute;
    top: 0;
    left: -18px;
    font-size: 1.2em;
    font-weight: bold;
}
.revision-page .revision-comment.somu-duplicates-edited .originals-of-duplicate li.somu-dupe-added:before {
    content: '+';
    color: var(--green-600);
}
.revision-page .revision-comment.somu-duplicates-edited .originals-of-duplicate li.somu-dupe-removed:before {
    content: '-';
    color: var(--red-600);
    left: -16px;
}


/* Hide follow post tooltip popup */
.js-follow-post ~ .s-popover {
    display: none !important;
}


/* Fix some z-indexes to prevent them from being in front of (close) dialogs */
.s-btn-group .s-btn.is-selected {
    z-index: unset !important;
}


/*
   Set a variable max-height for code blocks
   https://meta.stackoverflow.com/q/397012
*/
.post-text pre, .wmd-preview pre {
    max-height: 80vh;
}


/* Remove new edit button from question closed notice */
.js-post-notice .mt24:last-child {
    display: none;
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
        $('.js-gps-track, [data-ga], [data-gps-track]').each(function(i, el) {
            this.classList.remove('js-gps-track');
            el.dataset.ga = '';
            el.dataset.gpsTrack = '';
            el.search ? el.href = el.getAttribute('href').replace(/\?.*/, '') : 0;
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
            $('.js-voting-container, .post-menu').find('[aria-describedby^="--stacks-s-tooltip"]').each(function() {
                const tooltipId = $(this).attr('aria-describedby');
                const tooltip = $('#' + $(this).attr('aria-describedby'));
                this.title = tooltip.text();

                $(this).attr('aria-describedby', '');
                tooltip.remove();
            });
        }

        findAndRevertTooltips();
        setTimeout(findAndRevertTooltips, 200);
        $(document).ajaxStop(() => setTimeout(findAndRevertTooltips, 200));
    }


    function initShortUsernames() {

        function findAndShortenUsernames() {
            $('a[href^="/users/"], #qtoc a.post-hyperlink').not('.my-profile').not('.js-shortusernames')
                .filter((i, el) => el.children.length === 0)
                .addClass('js-shortusernames').text((i, v) => {
                    return v.trim()
                        .replace(/[\s-_]+(-|_|says|likes|loves|supports|is.at)[\s-_]*.+$/i, '');
                });
        }

        findAndShortenUsernames();
        $(document).ajaxStop(findAndShortenUsernames);
    }


    function initShortenBadgeCounts() {

        function findAndShortenBadgeCounts() {
            $('.badgecount').not('.js-shortbadgecounts').addClass('js-shortbadgecounts').text((i, v) => v.length <= 3 ? v : v.replace(/\d{3}$/, 'k'));
        }

        findAndShortenBadgeCounts();
        $(document).ajaxStop(findAndShortenBadgeCounts);
    }


})();
