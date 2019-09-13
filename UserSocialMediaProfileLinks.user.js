// ==UserScript==
// @name         User Social Media Profile Links
// @description  When PII is loaded, add links to social media profile
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.1
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
    
    function linkifySocialProfiles() {

        $('.mod-credentials a.lookup').each(function() {
            const num = (this.innerText || '').trim().match(/\d+$/);
            
            if(this.innerText.indexOf('/facebook/') >= 0 && num) {
                $(`<a href="${facebookProfileUrl}${num[0]}" target="_blank" class="social-profile-link">Facebook Account</a>`).insertAfter(this);
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
