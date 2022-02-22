// ==UserScript==
// @name         Chat Transcript Helper
// @description  Converts UTC timestamps to local time, Load entire day into single page
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      3.0
//
// @include      https://chat.stackoverflow.com/transcript/*
// @include      https://chat.stackexchange.com/transcript/*
// @include      https://chat.meta.stackexchange.com/transcript/*
//
// @include      https://chat.stackoverflow.com/search*
// @include      https://chat.stackexchange.com/search*
// @include      https://chat.meta.stackexchange.com/search*
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';

const isMob = document.body.classList.contains('mob');
const tzOffset = new Date().getTimezoneOffset();
const tzHours = -(tzOffset / 60);
const tzSymbol = (tzHours >= 0 ? '+' : '') + tzHours;


function parseSearchTimestamps() {

    $('.timestamp').not('[data-orig-timestamp]').each(function (i, el) {
        const str = el.innerText;
        let prefix = str.split(/\s*\d+:\d+\s[AP]M/)[0];
        prefix += prefix.length > 0 && !prefix.includes('yst') ? ', ' : '';
        const time = str.match(/\d+:\d+\s(AM|PM)/)[0];
        let h = Number(time.split(':')[0]);
        const m = time.split(':')[1].split(' ')[0];
        const a = time.split(' ')[1];
        if (a == 'PM' && h < 12) h += 12;
        else if (a == 'AM' && h == 12) h = 0;
        h += tzHours;
        if (h < 0) h += 24;
        else if (h >= 24) h %= 24;
        if (h.toString().length != 2) h = '0' + h;
        $(this).text(`${prefix} ${h}:${m}`).attr('data-orig-timestamp', str);
    });
}


function parseTimestamps() {

    $('.timestamp').not('[data-orig-timestamp]').each(function (i, el) {
        const str = el.innerText;
        let h = Number(str.split(':')[0]);
        const m = str.split(':')[1].split(' ')[0];
        const a = str.split(' ')[1];
        if (a == 'PM' && h < 12) h += 12;
        else if (a == 'AM' && h == 12) h = 0;
        h += tzHours;
        if (h < 0) h += 24;
        else if (h >= 24) h %= 24;
        if (h.toString().length != 2) h = '0' + h;
        $(this).text(`${h}:${m}`).attr('data-orig-timestamp', str);
    });

    $('.msplab').not('[data-orig-timestamp]').each(function (i, el) {
        const str = el.innerText;
        let h = Number(str.split(':')[0]) + tzHours;
        const m = str.split(':')[1];
        if (h < 0) h += 24;
        else if (h >= 24) h %= 24;
        if (h.toString().length != 2) h = '0' + h;
        $(this).text(`${h}:${m}`).attr('data-orig-timestamp', str);
    });

    $('.pager span.page-numbers').not('[data-orig-text]').each(function (i, el) {
        const str = $(this).text();
        const t1 = str.split(' - ')[0];
        const t2 = str.split(' - ')[1];

        let h1, h2;
        if (isMob) {
            h1 = Number(t1) + tzHours;
            h2 = Number(t2.replace('h', '')) + tzHours;
        }
        else {
            h1 = Number(t1.split(':')[0]) + tzHours;
            h2 = Number(t2.split(':')[0]) + tzHours;
        }

        if (h1 < 0) h1 += 24;
        else if (h1 >= 24) h1 %= 24;
        if (h2 < 0) h2 += 24;
        else if (h2 >= 24) h2 %= 24;

        if (isNaN(h1) || isNaN(h2)) debugger;

        if (h1.toString().length != 2) h1 = '0' + h1;
        if (h2.toString().length != 2) h2 = '0' + h2;
        $(this).text(`${h1}:00 - ${h2}:00`).attr('data-orig-text', str);
    });

    // Amend timezone message in sidebar
    $('#info .msg-small').text(`all times have been converted to local time (UTC${tzSymbol})`);
}


function highlightMessageReplies() {

    $('#transcript').on('mouseover', '.message', function () {
        $('.message').removeClass('reply-parent reply-child'); // reset

        // Replies to selected message
        const mid = this.id.split('-')[1];
        $('.reply-info').filter((i, el) => el.href.includes('#' + mid)).closest('.message').addClass('reply-child');

        // Replying to another message
        const pMid = ($(this).find('.reply-info').attr('href') || '#').split('#')[1];
        if (pMid !== '') {
            $('#message-' + pMid).addClass('reply-child');
        }
    });
}


function scrollToRepliedToMessage() {

    // If replied-to message is on the same page, scroll to it instead
    $('#transcript').on('click', '.reply-info', function () {

        const pMid = this.href.split('#')[1];

        // Scroll to if exists on page
        const msg = $('#message-' + pMid);
        if (msg.length !== 0) {

            // clear all message highlights on page
            $('.message').removeClass('reply-parent reply-child highlight');

            // highlight current message
            msg.addClass('highlight');

            // perform scroll
            $('html, body').animate({ scrollTop: msg.offset().top }, 400);

            // replace browser history
            window.history.replaceState({}, null, this.href);

            // prevent default link action
            return false;
        }
    });
}


function addLoadEntireDayButton() {

    // Fix transcript nav
    const main = $('#main');
    const tsWrapper = $('#transcript');
    let btns = main.children('.button');
    let btns2 = btns.slice(Math.floor(btns.length / 2));
    let nav = $('<div class="transcript-nav"></div>').prependTo(main).append(btns2)
        .clone(true, true).appendTo(main).end().end();
    main.children('.button').remove();

    // Add domain to document title when printing
    $(window).one('beforeprint', function () {
        document.title = location.hostname + ' - ' + document.title;
    });

    // If there are no other hourly links/pagination, do nothing
    const currentHoursItem = $('.pager > span.current');
    if (currentHoursItem.length == 0) return;

    // Wrap current transcript messages into an hourly div
    const currHours = currentHoursItem.attr('data-orig-text').split(' - ');
    const currStartHour = Number(currHours[0].split(':').shift());
    const currEndHour = Number(currHours[1].split(':').shift());
    const currHour = $(`<div class="hourly" data-hour-start="${currStartHour}" data-hour-end="${currEndHour}"></div>`).appendTo(tsWrapper);
    tsWrapper.children('.monologue, .system-message-container').appendTo(currHour);

    // Get today's date from sidebar
    const date = $('#info > .icon').attr('title').split('-');

    // Get current room ID from sidebar
    const roomId = Number($('#info .room-name a').attr('href').match(/\/(\d+)\//)[1]);

    // Note the pages we need to fetch
    const otherPageLinks = $('.pager').first().children('a').get().map(el => el.href);

    console.log(date, roomId, otherPageLinks);

    // Add load-entire-day-button to top nav
    const loadDayBtn = $(`<a href="#" class="button noprint load-entire-day-btn" title="Load entire day into this page for easier reading/printing/searching">Load entire day</a>`).appendTo(nav);
    loadDayBtn.on('click', function () {

        // This button can only be clicked once
        $(this).remove();

        // Change URL to start of "today"
        history.replaceState(null, '', '/transcript/' + roomId + '/' + date.join('/'));

        // Remove pagination from document title
        document.title = document.title.replace(/ \(.+$/, '');

        // Fetch content of hourly pages and attach to current page
        otherPageLinks.forEach(function (v) {
            const hours = v.split('/').pop();
            const n = Number(hours.split('-')[0]);
            const m = Number(hours.split('-')[1]);
            const wrapper = $(`<div class="hourly" data-hour-start="${n}" data-hour-end="${m}"></div>`).load(v + ' #transcript');

            if (m <= currEndHour) {
                wrapper.insertBefore(currHour);
            }
            else {
                wrapper.appendTo(tsWrapper);
            }
        });

        // Remove highlight and hourly selectors from sidebar
        $('#info .mspark .msparea').remove();

        // Remove hourly selectors from subnavs
        $('#main').children('.pager').remove();

        return false;
    });

    // Parse timestamps for loaded pages
    $(document).ajaxStop(parseTimestamps);
}


function doPageload() {
    if (location.pathname.includes('/search')) {
        parseSearchTimestamps();
    }
    else if (location.pathname.includes('/transcript')) {
        parseTimestamps();
        highlightMessageReplies();
        scrollToRepliedToMessage();
        addLoadEntireDayButton();
    }
}


// On page load
doPageload();


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
.transcript-nav {
    display: block;
    padding: 10px 0;
}
.transcript-nav .button {
    margin-right: 5px;
}
.transcript-nav .load-entire-day-btn {
    border: 2px solid #822d00;
}
.load-entire-day-button {
    position: fixed !important;
    bottom: 3px;
    right: 3px;
    z-index: 999999;
    opacity: 0.5;
}
.load-entire-day-button:hover {
    opacity: 1;
}
#transcript > .hourly > div[id="transcript"] {
    padding-bottom: 0px;
}`;
document.body.appendChild(styles);