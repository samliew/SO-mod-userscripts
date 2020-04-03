// ==UserScript==
// @name         Reduce Clutter
// @description  Revert recent changes that makes the page more cluttered
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.13.3
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*stackapps.com/*
// @include      https://*.stackexchange.com/*
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
.votecell [data-controller="reactions"] {
    display: none !important;
}


/* Hide new contributor popover */
.js-new-contributor-popover {
    display: none !important;
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
            let items = blogheader.nextAll().find('a[href^="https://stackoverflow.blog"]').each(function(i, el) {
                const blogtext = el.innerText.toLowerCase().trim();
                const isBlacklisted = blacklistedBlogWords && blacklistedBlogWords.some(v => blogtext.includes(v));
                if(isBlacklisted) {
                    $(this).parents('ul').remove();
                    itemsRemoved++;
                    console.log('Featured blogpost has been blocked.', blogtext);
                }
            });

            // if no items remaining, remove "Blog" heading
            if(items.length <= itemsRemoved * 2) {
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
            el.href ? el.href = el.href.replace(/\?.*/, '') : 0;
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
            el.href ? el.href = el.href.replace(/[?&]((cb|lq|rq)=1|ref=.*)/i, '') : 0;
        });
        $('.js-search-results').off('mousedown touchstart');
        console.log('Removed tracking data from ' + trackedQaCount + ' Q&A links');
    }


})();
