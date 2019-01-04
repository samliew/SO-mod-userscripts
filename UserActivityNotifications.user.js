// ==UserScript==
// @name         User Activity Notifications
// @description  Display notifications on user profile when new activity is detected since page load
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.1
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*.stackexchange.com/*
//
// @exclude      *chat.*
// @exclude      https://stackoverflow.com/c/*
// ==/UserScript==


(function() {
    'use strict';


    Notification.requestPermission();


    const apikey = 'dhFaTnM59qx5gK807L7dNw((';
    const siteTitle = StackExchange.options.site.name.replace(' Stack Exchange', '.SE');
    const pollInterval = 30;
    let lastCheckedDate = 0;
    let interval;
    let userId, username;


    // Show notification
    function notify(title, link, details = {}, dismissAfter = 15) {
        var n = new Notification(title, details);
        if(typeof link !== 'undefined') {
            n.onclick = function(event) {
                event.preventDefault(); // prevent the browser from focusing the Notification's tab
                window.open(link, '_blank');
            }
        }
        if(dismissAfter >= 3) setTimeout(n.close.bind(n), dismissAfter * 1000);
    }


    // Backoff from now
    function addBackoff(secs) {
        if(isNaN(secs)) return;
        const w = window;
        w.backoff = setTimeout(() => { clearTimeout(w.backoff); w.backoff = null }, secs * 1000);
    }
    const hasBackoff = () => typeof backoff !== 'undefined' && !isNaN(backoff);


    // Get user info
    function getUserInfo(uid, fromdate = 0) {
        return new Promise(function(resolve, reject) {
            if(typeof uid === 'undefined' || uid === null) { reject(); return; }
            if(hasBackoff()) { reject(); return; }
            $.get(`http://api.stackexchange.com/2.2/users/${uid}/timeline?pagesize=30&fromdate=${lastCheckedDate}&site=${location.hostname}&filter=!))yem8S&key=${apikey}`)
                .done(function(data) {
                    lastCheckedDate = Math.floor(Date.now() / 1000);
                    if(data.backoff) backoff = addBackoff(data.backoff);
                    resolve(data.items);
                    return;
                })
                .fail(reject);
        });
    }


    function scheduledTask() {
        getUserInfo(userId).then(function(v) {
            if(v.length > 0) {
                let lastAction = v[0];
                let action = "";
                switch(lastAction.timeline_type) {
                    case 'commented': action = 'commented'; break;
                    case 'revision': action = 'edited a post'; break;
                    case 'suggested': action = 'suggested an edit'; break;
                    case 'reviewed': action = 'reviewed'; break;
                    case 'answer': action = 'posted an answer'; break;
                    case 'question': action = 'asked a question'; break;
                    case 'accepted': action = 'accepted an answer'; break;
                    case 'badge': action = 'earned a badge'; break;
                }
                notify(`${username} ${action}`, lastAction.link, {
                    body: `${lastAction.detail ? '"'+lastAction.detail+'"' : ''} on ${lastAction.title}`
                });
            }
        });
    }


    function doPageLoad() {

        // Do not run if not on user page
        if(!document.body.classList.contains('user-page') || !location.pathname.includes('/users/')) return;

        // Get user details
        userId = Number(location.pathname.match(/\/\d+\//)[0].replace(/\D+/g, ''));
        username = $('.profile-user--name > div:first, .mini-avatar .name').text().trim().replace('♦', '').replace(/\s+/g, ' ');

        // Load pnotify - https://sciactive.com/pnotify/
        $.getScript('https://cdnjs.cloudflare.com/ajax/libs/pnotify/3.2.1/pnotify.js', function() {
            console.log('pnotify loaded');
        });

        // Run once on page load, then start polling API occasionally
        scheduledTask();
        interval = setInterval(scheduledTask, pollInterval * 1000);
    }


    function appendStyles() {

        const styles = `
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/pnotify/3.2.1/pnotify.css" />
<style>
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageLoad();

})();
