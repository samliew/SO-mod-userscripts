// ==UserScript==
// @name         User Social Media Profile Links
// @description  When PII is loaded, add links to social media profile
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.1
//
// @include      https://*stackoverflow.com/users/account-info/*
// @include      https://*serverfault.com/users/account-info/*
// @include      https://*superuser.com/users/account-info/*
// @include      https://*askubuntu.com/users/account-info/*
// @include      https://*mathoverflow.net/users/account-info/*
// @include      https://*.stackexchange.com/users/account-info/*
//
// @exclude      *chat.*
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';

// Moderator check
if (typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator) return;

if (unsafeWindow !== undefined && window !== unsafeWindow) {
    window.jQuery = unsafeWindow.jQuery;
    window.$ = unsafeWindow.jQuery;
}

function linkifySocialProfiles() {

    $('.mod-credentials a.lookup').each(function () {
        const num = (this.innerText || '').trim().match(/\d+$/);

        if (this.innerText.indexOf('/facebook/') >= 0 && num) {
            $(`<a href="https://www.facebook.com/profile.php?id=${num[0]}" target="_blank" class="social-profile-link">Facebook Account</a>`).insertAfter(this);
        }
    });
}

function doPageLoad() {

    // On any page update
    $(document).ajaxComplete(function (event, xhr, settings) {

        // Loaded PII, wait for other scripts to complete
        if (settings.url.indexOf('/admin/all-pii') >= 0) setTimeout(linkifySocialProfiles, 500);
    });
}


// On page load
doPageLoad();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
.social-profile-link {
    display: block;
    margin-top: 5px;
}
`;
document.body.appendChild(styles);
