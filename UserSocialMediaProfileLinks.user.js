// ==UserScript==
// @name         User Social Media Profile Links
// @description  When PII is loaded, add links to social media profile
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0
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


(function() {
    'use strict';


    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;


    const facebookProfileUrl = 'https://www.facebook.com/profile.php?id=';
    const googleProfileUrl = 'https://plus.google.com/';


    function linkifySocialProfiles() {

        $('.mod-credentials a.lookup').each(function() {
            const num = (this.innerText || '').trim().match(/\d+$/);
            let profileUrl = null, platform = null;

            if(this.innerText.indexOf('/facebook/') >= 0) {
                platform = 'Facebook';
                profileUrl = facebookProfileUrl;
            }
            else if(this.innerText.indexOf('/google/') >= 0) {
                platform = 'Google+';
                profileUrl = googleProfileUrl;
            }

            if(profileUrl && platform && num) {
                $(`<a href="${profileUrl}${num[0]}" target="_blank" class="social-profile-link">${platform} Account</a>`).insertAfter(this);
            }
        });
    }


    function listenToPageUpdates() {

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {

            // Loaded PII, wait for other scripts to complete
            if(settings.url.indexOf('/admin/all-pii') >= 0) setTimeout(linkifySocialProfiles, 500);
        });
    }


    function appendStyles() {

        const styles = `
<style>
.social-profile-link {
    display: block;
    margin-top: 5px;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    listenToPageUpdates();

})();
