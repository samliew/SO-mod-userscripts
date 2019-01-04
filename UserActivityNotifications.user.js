// ==UserScript==
// @name         User Activity Notifications
// @description  Display notifications on user profile when new activity is detected since page load
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.1.2
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


// If user accepts, we can show native notifications
if(!("Notification" in window)) {
    console.log("This browser does not support desktop notifications.");
}
Notification.requestPermission();


(function() {
    'use strict';


    const apikey = 'dhFaTnM59qx5gK807L7dNw((';
    const pollInterval = 30;
    let lastCheckedDate = Math.floor(Date.now() / 1000) - 5 * 60; // Start from five minutes ago
    let interval;
    let userId, username;


    // Get site favicon, adapted from https://stackoverflow.com/a/10283308
    let siteIcon = (function() {
        let ico = undefined;
        const nodeList = document.getElementsByTagName("link");
        for (var i = 0; i < nodeList.length; i++)
        {
            if(nodeList[i].getAttribute("rel") == "icon" || nodeList[i].getAttribute("rel") == "shortcut icon")
            {
                ico = nodeList[i].getAttribute("href");
                break;
            }
        }
        return ico;
    })();


    // Show native notification
    function notify(title, link, options = {}, dismissAfter = 15) {

        // User has not enabled notifications yet
        if(Notification.permission !== 'granted') {
            console.log('Notifications permission not granted.');
            return false;
        }

        $.extend(options, {
            silent: true,
            noscreen: true,
            icon: siteIcon,
            badge: siteIcon,
        });

        let n = new Notification(title, options);

        // Open content if notification clicked
        if(typeof link !== 'undefined') {
            n.onclick = function(evt) {
                evt.preventDefault(); // prevent the browser from focusing the triggering Notification's tab
                window.open(link, '_blank');
            }
        }

        // Auto-dismiss notification
        if(dismissAfter > 0) setTimeout(n.close.bind(n), dismissAfter * 1000);
    }


    // Set a global backoff variable from now until X seconds later
    function addBackoff(secs) {
        if(isNaN(secs)) return;
        const w = window;
        w.backoff = setTimeout(() => { clearTimeout(w.backoff); w.backoff = null }, secs * 1000);
    }
    // Helper method to check if backoff is active
    const hasBackoff = () => typeof backoff !== 'undefined' && !isNaN(backoff);


    // Get user timeline
    function getUserInfo(uid, fromdate = 0) {
        return new Promise(function(resolve, reject) {
            if(typeof uid === 'undefined' || uid === null || hasBackoff()) { reject(); return; }
            $.get(`http://api.stackexchange.com/2.2/users/${uid}/timeline?pagesize=${Math.ceil(pollInterval/2)}&fromdate=${lastCheckedDate}&site=${location.hostname}&filter=!))yem8S&key=${apikey}`)
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
            // Take last(latest) three
            v.slice(-3).forEach(function(w) {
                let action = w.timeline_type;
                switch(w.timeline_type) {
                    case 'commented': action = 'commented'; break;
                    case 'revision': action = 'edited post'; break;
                    case 'suggested': action = 'suggested edit'; break;
                    case 'reviewed': action = 'reviewed'; break;
                    case 'answer': action = 'posted answer'; break;
                    case 'question': action = 'asked question'; break;
                    case 'accepted': action = 'accepted answer'; break;
                    case 'badge': action = 'earned badge'; break;
                }
                notify(`${username} ${action}`, w.link, {
                    body: w.detail ? `"${w.detail}"` : w.title
                });
            });
        });
    }


    function doPageLoad() {

        // Do not run if not on user page
        if(!document.body.classList.contains('user-page') || !location.pathname.includes('/users/')) return;

        // Get user details
        userId = Number(location.pathname.match(/\/\d+\//)[0].replace(/\D+/g, ''));
        username = $('.profile-user--name > div:first, .mini-avatar .name').text().replace('♦', '').replace(/\s+/g, ' ').trim();

        // Run once on page load, then start polling API occasionally
        scheduledTask();
        interval = setInterval(scheduledTask, pollInterval * 1000);
    }


    function loadPnotify() {

        $('body').append('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/pnotify/3.2.1/pnotify.css" />');

        // Load pnotify - https://sciactive.com/pnotify/
        $.getScript('https://cdnjs.cloudflare.com/ajax/libs/pnotify/3.2.1/pnotify.js', function() {
            console.log('pnotify loaded');

            // TODO
        });
    }


    function appendStyles() {

        const styles = `
<style>
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageLoad();

})();
