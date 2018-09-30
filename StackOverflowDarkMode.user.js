// ==UserScript==
// @name         Stack Overflow Dark Mode
// @description  Dark theme for Stack Overflow
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0
//
// @include      https://*stackoverflow.com/*
//
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(`


/* Apply to all */
*,
*:before,
*:after,
#search-channel-selector,
.bg-black-025,
.fc-medium {
    background-color: #222;
    color: #ddd;
    border-color: #555;
    box-shadow: none;
    outline: none
}
#sidebar .community-bulletin .bulletin-item-content a,
a {
    color: #eee;
    border-bottom: 1px dashed inherit;
}
#sidebar .community-bulletin .bulletin-item-content a:hover,
a:hover {
    color: #fff;
    border-bottom-color: white;
}
iframe:hover,
a:hover img,
a:hover svg,
button:hover img,
button:hover svg {
    filter: none;
    background-color: inherit !important;
}
iframe, img, .-img, ._glyph {
    filter: brightness(0.8) saturate(90%);
}
button:hover, input[type="submit"]:hover, .s-btn:hover, .btn:hover {
    background-color: #333;
    color: white;
}


/* Selection */
::selection { background: #408050; }
::-moz-selection { background: #408050; }


/* Scrollbars */
::-webkit-scrollbar{ width:10px; height:10px; }
::-webkit-scrollbar-thumb{ background-color:rgb(196, 196, 196); border-radius: 5; }
::-webkit-scrollbar-thumb:hover{ background-color:rgb(196, 196, 196); }
::-webkit-scrollbar-track{ background-color:rgb(60, 60, 60); }


/* Specific elements opacity & hover */
#wmd-button-row,
#left-sidebar,
#sidebar > * {
    opacity: 0.6;
    transition: opacity 0.4s ease;
}
.question-summary .started {
    opacity: 0.4;
    transition: opacity 0.4s ease;
}
#wmd-button-row:hover,
#left-sidebar:hover,
#sidebar > *:hover,
.question-summary:hover .started {
    opacity: 1;
}


/* Specific elements */
.top-bar .-logo,
.top-bar .-logo span {
    background-color: white;
    filter: none;
}
.f-select:before, .f-select:after {
    border-color: #3b4045 transparent;
}
.s-btn__muted.s-btn__outlined.s-btn__dropdown:after {
    border-color: currentColor transparent;
}
.temp-popover--arrow:before,
.temp-popover--arrow:after {
    border-color: transparent;
    border-bottom-color: #e4e6e8;
}
.top-bar .indicator-badge {
    background-color: #07C;
    color: white;
}
.top-bar .indicator-badge._important {
    background-color: #C91D2E;
}
pre {
    background-color: #444;
}
pre * {
    background-color: inherit;
}
#wmd-button-row {
    background-color: white;
}
#wmd-button-row * {
    background-color: inherit;
}
.js-post-issues .s-btn {
    border-color: transparent;
}
.question-summary .excerpt {
    color: #aaa;
}
.tags .post-tag {
    background-color: #333;
    color: #aaa;
}
.s-progress {
    background-color: #d6d9dc;
}
.s-progress--bar {
    background-color: #42d773;
}
a.youarehere {
    background: #555;
}
.bounty-indicator-tab {
    color: white;
    background-color: #0077dd;
}
.supernovabg {
    background-color: #F48024;
}
.hotbg {
    background-color: #CF7721;
}
.coolbg {
    background-color: #9199a1;
}
.tagged-interesting {
    box-shadow: inset 0 0 20px #fffbec !important;
}


/* Dark mode for SOMU userscripts */
.js-usercolor:after {
    opacity: 0.7;
}


`.replace(/;/g, ' !important;'));

})();
