// ==UserScript==
// @name         User Activity Notifications
// @description  Display notifications on user profile when new activity is detected since page load
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.2.5
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
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==


// If user accepts, we can show native notifications
function initNotify(callback) {
    if("Notification" in window && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
}
if("Notification" in window === false) {
    console.error("This browser does not support notifications.");
}
else if(Notification.permission !== 'granted') {
    initNotify();
}


(function() {
    'use strict';


    const apikey = 'dhFaTnM59qx5gK807L7dNw((';
    const pollInterval = 60;
    let lastCheckedDate = Math.floor(Date.now() / 1000) - 60 * 60; // Start from x minutes ago
    let interval;
    let userId, username, shortname;


    // Get site favicon, adapted from https://stackoverflow.com/a/10283308
    let siteIcon = (function() {
        let ico = undefined;
        const nodeList = document.getElementsByTagName("link");
        for (var i = 0; i < nodeList.length; i++) {
            if(nodeList[i].getAttribute("rel") == "icon" || nodeList[i].getAttribute("rel") == "shortcut icon") {
                ico = nodeList[i].getAttribute("href");
                break;
            }
        }
        return ico;
    })();


    // Show native notification
    function notify(title, link, options = {}, dismissAfter = 15) {

        // User has not enabled notifications yet, try to request
        if(Notification.permission === 'default') {
            console.log('Notifications permission not granted yet.');
            initNotify(function() {
                notify(title, link, options, dismissAfter);
            });
            return false;
        }

        // Sanitize
        title = htmlDecode(title);
        options.body = htmlDecode(options.body);

        $.extend(options, {
            silent: true,
            noscreen: true,
            icon: siteIcon,
            badge: siteIcon,
        });
        //console.log(title, options);

        let n = new Notification(title, options);

        // Open content if notification clicked
        if(typeof link !== 'undefined' && link != null) {
            n.onclick = function(evt) {
                evt.preventDefault(); // prevent the browser from focusing the triggering Notification's tab
                window.open(link, '_blank');
            };
        }
        else {
            n.onclick = function(evt) {
                evt.preventDefault(); // prevent the browser from focusing the triggering Notification's tab
            };
        }

        // Auto-dismiss notification
        if(dismissAfter > 0) setTimeout(n.close.bind(n), dismissAfter * 1000, n);

        // Dismiss notification on page unload
        window.addEventListener('beforeunload', function(evt) {
            try { n.close(); }
            catch (e) {}
        });

        return n;
    }


    // Get user timeline
    function getUserInfo(uid, fromdate = 0) {
        return new Promise(function(resolve, reject) {
            if(hasBackoff()) { reject(); return; }
            if(typeof uid === 'undefined' || uid === null) { reject(); return; }
            $.get(`https://api.stackexchange.com/2.2/users/${uid}/timeline?pagesize=${Math.ceil(pollInterval/2)}&fromdate=${lastCheckedDate}&site=${location.hostname}&filter=!))yem8S&key=${apikey}`)
                .done(function(data) {
                    lastCheckedDate = Math.floor(Date.now() / 1000);
                    if(data.backoff) backoff = addBackoff(data.backoff);
                    resolve(data.items);
                    return;
                })
                .fail(function() {
                    addBackoff(5);
                    reject();
                });
        });
    }


    function scheduledTask() {
        getUserInfo(userId).then(function(v) {
            // Take latest three
            v.slice(-3).forEach(function(w) {
                let action = w.timeline_type;
                let text = w.title;
                let url = w.link;
                switch(w.timeline_type) {
                    case 'commented': action = 'commented'; text = w.detail;
                        break;
                    case 'revision': action = 'edited post';
                        break;
                    case 'suggested': action = 'suggested edit';
                        break;
                    case 'reviewed': action = 'reviewed edit';
                        break;
                    case 'answer': action = 'posted answer';
                        break;
                    case 'question': action = 'asked question';
                        break;
                    case 'accepted': action = 'accepted answer';
                        break;
                    case 'badge': action = 'earned badge'; text = w.detail; url = null;
                        break;
                }
                notify(`${shortname} ${action}`, url, {
                    body: text
                });
            });
        });
    }


    function doPageLoad() {

        // Do not run if not on user page
        if(!document.body.classList.contains('user-page') || !location.pathname.includes('/users/')) return;

        // Do not run if user is deleted
        if(document.title.contains('User deleted')) return;

        // Get user details
        userId = Number(location.pathname.match(/\/\d+/)[0].replace('/', ''));
        username = $('.profile-user--name > div:first, .mini-avatar .name').text().replace('♦', '').replace(/\s+/g, ' ').trim();
        shortname = username.split(' ')[0].substr(0, 12).trim();

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
    //appendStyles();
    doPageLoad();

})();
