// ==UserScript==
// @name         Stack Exchange Dark Mode
// @description  Dark theme for sites and chat on the Stack Exchange Network
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.9.4
//
// @include      https://*stackexchange.com/*
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*.stackexchange.com/*
//
// @include      https://stackapps.com/*
// @include      https://stackoverflow.blog/*
//
// @include      https://chat.stackoverflow.com/*
// @include      https://chat.stackexchange.com/*
// @include      https://chat.meta.stackexchange.com/*
//
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';


    const darkgreen = '#296538';
    const darkblue = '#035';
    const bountyblue = '#0057a3';
    const orange = '#f48024';


    let textcolor = '#bbb';
    let linkcolor = '#fff';
    let highlightcolor = '#eee';
    let bgcolor = '#222';
    let btncolor = '#333';
    let bordercolor = '#555';


    // Black mode for late nights
    const hour = new Date().getHours();
    const isLateNight = hour >= 22 || hour <= 6;
    if(isLateNight) {
        textcolor = '#999';
        linkcolor = '#ccc';
        highlightcolor = '#ddd';
        bgcolor = '#000';
        btncolor = '#333';
        bordercolor = '#333';
    }


    // Custom white versions of SVG logos
    const soLogo = `<svg xmlns="http://www.w3.org/2000/svg" class="-img _glyph" style="width:160px;height:40px;margin:0 -7px;background:none !important;" viewBox="0 0 480.5 117.9"><style>.st0{fill:${linkcolor}}.st1{fill:#bcbbbb}.st2{fill:#f48024}</style><path class="st0" d="M123.7 67.3l-4.8-.4c-3.7-.3-5.2-1.8-5.2-4.3 0-3 2.3-4.9 6.6-4.9 3.1 0 5.8.7 7.9 2.4l2.8-2.8c-2.7-2.2-6.4-3.2-10.7-3.2-6.3 0-10.9 3.3-10.9 8.7 0 4.9 3.1 7.5 8.9 8l4.9.4c3.4.3 4.9 1.7 4.9 4.3 0 3.5-3 5.2-7.9 5.2-3.7 0-6.9-1-9.2-3.4l-2.9 2.9c3.3 3.1 7.2 4.3 12.2 4.3 7.2 0 12.1-3.3 12.1-9 .1-5.8-3.5-7.7-8.7-8.2zm37.2-13.4c-4.8 0-7.8.9-10.4 4.3l2.8 2.8c1.7-2.5 3.7-3.4 7.5-3.4 5.4 0 7.6 2.2 7.6 6.5V67h-8.9c-6.6 0-10.2 3.4-10.2 8.6 0 2.4.8 4.6 2.2 6 1.9 1.9 4.3 2.7 8.4 2.7 4 0 6.1-.8 8.6-3.2V84h4.3V63.8c-.1-6.4-4-9.9-11.9-9.9zm7.5 19.6c0 2.5-.5 4.2-1.5 5.1-1.9 1.8-4.1 2-6.6 2-4.7 0-6.8-1.6-6.8-5.1 0-3.4 2.2-5.2 6.6-5.2h8.3v3.2zm21.3-15.7c2.8 0 4.6.8 6.8 3.3l2.9-2.8c-3-3.3-5.6-4.3-9.7-4.3-7.5 0-13.1 5.1-13.1 15.2s5.7 15.2 13.1 15.2c4.1 0 6.7-1.1 9.8-4.4l-3-2.8c-2.2 2.5-4 3.4-6.8 3.4-2.9 0-5.3-1.1-6.9-3.4-1.4-1.9-1.9-4.2-1.9-8 0-3.7.5-6 1.9-8 1.6-2.3 4-3.4 6.9-3.4zm37.2-3.5h-5.4L208 67.4V41.1h-4.3V84h4.3V73.2l5.3-5.3 9.9 16.1h5.4l-12.3-19.1 10.6-10.6zm20.4-1.6c-4.6 0-7.6 1.8-9.5 3.8-2.8 2.9-3.5 6.4-3.5 12s.7 9.1 3.5 12c1.9 2 5 3.8 9.5 3.8 4.6 0 7.7-1.8 9.6-3.8 2.8-2.9 3.5-6.4 3.5-12s-.7-9.1-3.5-12c-1.9-2-5.1-3.8-9.6-3.8zm3.6 23.3c-.9.9-2.1 1.4-3.6 1.4s-2.7-.5-3.6-1.4c-1.6-1.6-1.8-4.3-1.8-7.5s.2-5.9 1.8-7.5c.9-.9 2-1.4 3.6-1.4 1.5 0 2.7.5 3.6 1.4 1.6 1.6 1.8 4.3 1.8 7.5s-.2 5.9-1.8 7.5zm30-22.9l-6.2 19.1-6.3-19.1h-8.1L271.7 84h6L289 53.1h-8.1zm21.3-.4c-8 0-13.5 5.7-13.5 15.8 0 12.5 7 15.8 14.3 15.8 5.6 0 8.6-1.7 11.7-4.9l-4.7-4.6c-2 2-3.6 2.9-7 2.9-4.3 0-6.8-2.9-6.8-6.9h19.3v-3.4c.1-8.4-4.8-14.7-13.3-14.7zm-5.9 12.9c.1-1.4.2-2.2.7-3.3.8-1.8 2.5-3.2 5.2-3.2 2.6 0 4.3 1.4 5.2 3.2.5 1.1.7 2 .7 3.3h-11.8zM327 56v-3h-7.5v31h7.7V65.4c0-3.9 2.6-5.7 5-5.7 1.9 0 2.9.6 4.1 1.8l5.8-5.8c-2.1-2.1-4.3-2.9-7.3-2.9-3.4-.1-6.3 1.5-7.8 3.2zm17.4-6.1V84h7.7V59.6h5.7v-5.9h-5.7v-3.4c0-1.8.9-2.8 2.7-2.8h3V41h-4.4c-6.2 0-9 4.5-9 8.9zm45.2 2.8c-4.6 0-7.6 1.8-9.5 3.8-2.8 2.9-3.5 6.4-3.5 12s.7 9.1 3.5 12c1.9 2 5 3.8 9.5 3.8 4.6 0 7.7-1.8 9.6-3.8 2.8-2.9 3.5-6.4 3.5-12s-.7-9.1-3.5-12c-1.9-2-5.1-3.8-9.6-3.8zm3.6 23.3c-.9.9-2.1 1.4-3.6 1.4s-2.7-.5-3.6-1.4c-1.6-1.6-1.8-4.3-1.8-7.5s.2-5.9 1.8-7.5c.9-.9 2-1.4 3.6-1.4 1.5 0 2.7.5 3.6 1.4 1.6 1.6 1.8 4.3 1.8 7.5s-.2 5.9-1.8 7.5zm45.9-22.9l-5 19.1-6.3-19.1h-5.6l-6.3 19.1-5-19.1h-8.2l9.5 30.9h6.3l6.5-19.4 6.5 19.4h6.3l9.4-30.9h-8.1zm-69.9 21.6V41h-7.7v34.1c0 4.4 2.7 8.8 9 8.8h4.4v-6.5h-3c-1.9 0-2.7-.9-2.7-2.7zM144.5 59l4-4h-8.2v-9.8H136V76c0 4.4 2.5 8 7.6 8h3.1v-3.7h-2.3c-2.8 0-4-1.6-4-4.3V59h4.1z"/><path class="st1" d="M87.6 91.3v-22H95v29.3H29.1V69.3h7.3v22z"/><path class="st2" d="M44.5 67.3l35.9 7.5 1.5-7.2L46 60.1l-1.5 7.2zm4.7-17.2l33.2 15.5 3.1-6.6-33.2-15.6-3.1 6.7zm9.2-16.3l28.2 23.4 4.7-5.6-28.2-23.4-4.7 5.6zm18.2-17.3l-5.9 4.4 21.9 29.4 5.9-4.4-21.9-29.4zM43.7 83.9h36.6v-7.3H43.7v7.3z"/></svg>`;
    const suLogo = `<svg xmlns="http://www.w3.org/2000/svg" width="208" height="47"><style>.st0{fill:${highlightcolor}}</style><g fill="none" fill-rule="evenodd"><path d="M.5 37.01c-.3 0-.5-.1-.5-.4V.43c0-.3.2-.4.5-.4h8.91c.3 0 .6.1.6.4v2.2c0 .3-.2.4-.5.4h-4.9c-.5 0-.6.2-.6.5V33.6c0 .3.2.4.6.4h4.8c.3 0 .6.1.6.4v2.12c-.1.3-.2.5-.6.5H.5z" class="st0"/><path d="M24.03 26.5v6.3c0 4.7-4.03 4.2-9.53 4.2h-.9c-.3 0-.6-.1-.6-.4v-2.2c0-.3.2-.4.5-.4h.7c3.3 0 5.8.7 5.8-1.9v-6c0-1.9 1.3-4.4 3.9-5.4.2 0 .2-.1.2-.2s-.1-.2-.2-.3c-2.4-1.1-3.9-2.8-3.9-5V8.3C20 5.7 17.52 3 14.22 3h-.7c-.3 0-.5-.1-.5-.4V.4c0-.3.2-.4.6-.4h.9c5.6 0 9.53 4 9.53 8.7v5.7c0 2.2 1.41 3.4 3.71 4.2.9.3 1.3.3 1.3 1v1.8c0 .4-.4.6-1.5.9-2.3.7-3.52 2-3.52 4.2z" fill="#38A1CE"/><path d="M17.01 16.1c0 .5-.5.9-1 .9h-2c-.6 0-1-.4-1-.9V13.9c0-.5.5-.9 1-.9h2c.6 0 1 .4 1 .9v2.21zM43.87 36.96c-3.3 0-5.8-.8-8-2.9l1.9-2c1.5 1.7 3.6 2.3 6 2.3 3.2 0 5.2-1.2 5.2-3.6 0-1.8-1-2.7-3.2-3l-3.2-.3c-3.8-.3-5.8-2.1-5.8-5.4 0-3.7 3-5.9 7.1-5.9 2.8 0 5.2.7 7 2.2l-1.9 1.9a8.26 8.26 0 0 0-5.2-1.6c-2.8 0-4.3 1.3-4.3 3.3 0 1.7.9 2.7 3.4 3l3.1.3c3.4.3 5.7 1.7 5.7 5.5.1 3.9-3.1 6.2-7.8 6.2M67.6 36.69v-2.3a6.73 6.73 0 0 1-5.4 2.6c-2.1 0-3.8-.7-5-1.9-1.4-1.4-2-3.3-2-5.7v-12.8H58v12.4c0 3.6 1.8 5.4 4.7 5.4 2.9 0 4.9-1.8 4.9-5.4v-12.4h2.8v20.2h-2.8v-.1zM88.65 35.22c-1 1.1-2.8 1.8-4.7 1.8-2.1 0-3.9-.5-5.5-2.6v11.4h-2.8v-29.3h2.8v2.4c1.6-2.1 3.4-2.6 5.5-2.6 2 0 3.7.7 4.7 1.8 2 2 2.4 5.4 2.4 8.6 0 3.1-.4 6.4-2.4 8.5m-5.3-16.3c-4.2 0-4.9 3.8-4.9 7.7 0 3.9.7 7.7 4.9 7.7s4.9-3.8 4.9-7.7c-.1-3.9-.7-7.7-4.9-7.7M96.9 27.42c0 4.4 2 7 5.7 7 2.2 0 3.6-.7 5.1-2.3l1.9 1.8c-2 2.1-3.8 3.1-7.1 3.1-5.1 0-8.5-3.2-8.5-10.3 0-6.5 3-10.3 8-10.3s8 3.8 8 9.8v1.2H96.9zm9.7-5.6c-.8-1.8-2.5-3-4.5-3-2.1 0-3.8 1.2-4.5 3a9.9 9.9 0 0 0-.6 3.4h10.1c0-1.7-.1-2.3-.5-3.4zM124.86 20.39c-1.1-1.1-1.9-1.5-3.4-1.5-2.8 0-4.7 2.3-4.7 5.4v12.4h-2.7v-20.1h2.8v2.5c1.1-1.8 3.2-2.8 5.5-2.8 1.9 0 3.3.5 4.7 1.9l-2.2 2.2zM141.88 37.05v-1.9a6.95 6.95 0 0 1-5.1 2.1c-2.1 0-3.7-.7-4.9-1.8-1.7-1.7-2.1-3.6-2.1-5.8v-13.2h5.1v12.4c0 2.8 1.8 3.8 3.4 3.8 1.6 0 3.4-.9 3.4-3.8v-12.4h5.1v20.6h-4.9zM159.12 37.34c-3.2 0-6.2-.4-8.8-3l3.4-3.4c1.7 1.7 3.9 1.9 5.5 1.9 1.8 0 3.6-.6 3.6-2.1 0-1-.6-1.7-2.2-1.9l-3.2-.3c-3.7-.4-6-2-6-5.8 0-4.3 3.8-6.6 7.9-6.6 3.2 0 5.9.6 7.9 2.4l-3.2 3.2c-1.2-1.1-3-1.4-4.8-1.4-2.1 0-2.9.9-2.9 2 0 .7.3 1.6 2.1 1.8l3.2.3c4.1.4 6.1 2.6 6.1 6 .1 4.7-3.7 6.9-8.6 6.9M176.02 28.36c0 2.6 1.6 4.6 4.5 4.6 2.2 0 3.4-.6 4.7-1.9l3.1 3c-2.1 2.1-4.1 3.2-7.8 3.2-4.9 0-9.5-2.2-9.5-10.5 0-6.7 3.6-10.5 9-10.5 5.7 0 9 4.2 9 9.8v2.3h-13zm7.3-5.7c-.6-1.2-1.7-2.1-3.4-2.1s-2.9.9-3.4 2.1c-.3.8-.4 1.3-.5 2.2h7.8c-.1-.9-.2-1.5-.5-2.2zM203.78 22.08c-.8-.8-1.5-1.2-2.7-1.2-1.6 0-3.3 1.2-3.3 3.8v12.4h-5.1v-20.6h5v2a7 7 0 0 1 5.2-2.2c2 0 3.4.5 4.9 1.9l-4 3.9z" class="st0"/></g></svg>`;
    const sfLogo = `<svg xmlns="http://www.w3.org/2000/svg" width="203" height="33" viewBox="0 0 203 33" fill="none"><style>.st0{fill:${highlightcolor};}.st1{fill:${highlightcolor};}</style><path fill-rule="evenodd" clip-rule="evenodd" d="M6.53241 16C3.84847 16 1.74681 15.3972 0 13.7458L1.55235 12.2218C2.81357 13.524 4.52742 14.0324 6.50055 14.0324C9.11967 14.0324 10.7368 13.1112 10.7368 11.2698C10.7368 9.90395 9.92825 9.14301 8.08476 8.98382L5.46565 8.76201C2.36094 8.5073 0.711907 7.14248 0.711907 4.57097C0.711907 1.71398 3.16953 0 6.56427 0C8.82853 0 10.8654 0.540196 12.2881 1.68214L10.7687 3.17432C9.63712 2.31679 8.18144 1.93685 6.53241 1.93685C4.20443 1.93685 2.97507 2.92067 2.97507 4.50836C2.97507 5.84134 3.7518 6.63518 5.75568 6.79331L8.31108 7.01618C11.0917 7.26983 13 8.31733 13 11.238C13 14.2542 10.3809 16 6.53241 16Z" transform="translate(58 16)" class="st0"/><path fill-rule="evenodd" clip-rule="evenodd" d="M10.2004 4.28552C9.58931 2.85703 8.17366 1.93689 6.50001 1.93689C4.82636 1.93689 3.4118 2.85703 2.79962 4.28552C2.44544 5.14304 2.38203 5.61956 2.31754 6.88887H10.6836C10.6191 5.61956 10.5546 5.14304 10.2004 4.28552ZM2.31752 8.60281C2.31752 12.0318 3.95838 14.0005 6.98318 14.0005C8.81643 14.0005 9.87899 13.4603 11.134 12.2229L12.7103 13.5877C11.1023 15.1754 9.62101 16 6.91868 16C2.73512 16 0 13.524 0 8C0 2.95251 2.47822 0 6.5 0C10.5874 0 13 2.92067 13 7.55638V8.60281H2.31752Z" transform="translate(73 16)" class="st0"/><path fill-rule="evenodd" clip-rule="evenodd" d="M8.38426 3.21267C7.56189 2.34479 6.95184 2.05585 5.79285 2.05585C3.59814 2.05585 2.19575 3.88722 2.19575 6.29753V16H0V0.192266H2.19575V2.1203C3.01916 0.803437 4.66494 0 6.4029 0C7.83532 0 8.9332 0.352309 10 1.47798L8.38426 3.21267Z" transform="translate(89 16)" class="st0"/><path fill-rule="evenodd" clip-rule="evenodd" d="M8.03741 16H5.92902L0 0H2.56946L6.98321 12.8461L11.4305 0H14L8.03741 16Z" transform="translate(100 16)" class="st0"/><path fill-rule="evenodd" clip-rule="evenodd" d="M10.2004 4.28552C9.58931 2.85703 8.17366 1.93689 6.50001 1.93689C4.82636 1.93689 3.41071 2.85703 2.79962 4.28552C2.44544 5.14304 2.38094 5.61956 2.31754 6.88887H10.6825C10.6191 5.61956 10.5546 5.14304 10.2004 4.28552ZM2.31752 8.60281C2.31752 12.0318 3.95838 14.0005 6.98318 14.0005C8.81643 14.0005 9.87899 13.4603 11.134 12.2229L12.7103 13.5877C11.1012 15.1754 9.62101 16 6.91868 16C2.73512 16 0 13.524 0 8C0 2.95251 2.47822 0 6.5 0C10.5874 0 13 2.92067 13 7.55638V8.60281H2.31752Z" transform="translate(115 16)" class="st0"/><path fill-rule="evenodd" clip-rule="evenodd" d="M8.38426 3.21267C7.56085 2.34479 6.95184 2.05585 5.79285 2.05585C3.59814 2.05585 2.19472 3.88722 2.19472 6.29753V16H0V0.192266H2.19472V2.1203C3.01813 0.803437 4.66494 0 6.4029 0C7.83635 0 8.9332 0.352309 10 1.47798L8.38426 3.21267Z" transform="translate(131 16)" class="st0"/><path fill-rule="evenodd" clip-rule="evenodd" d="M5.91482 9.99796V23H1.73535V9.99796H0V6.83582H1.73535V4.75976C1.73535 2.39537 3.21405 0 6.62141 0H9V3.51349H7.36076C6.36476 3.51349 5.91482 4.05706 5.91482 5.015V6.83582H9V9.99796H5.91482Z" transform="translate(143 9)" class="st1"/><path fill-rule="evenodd" clip-rule="evenodd" d="M9.7777 9.80969H6.43165C4.9054 9.80969 4.06006 10.5137 4.06006 11.6962C4.06006 12.8456 4.83919 13.6126 6.49676 13.6126C7.66655 13.6126 8.41368 13.5165 9.1597 12.8147C9.61547 12.398 9.7777 11.7272 9.7777 10.7049V9.80969ZM9.87482 16.8398V15.4019C8.73814 16.5204 7.66656 17 5.71654 17C3.80073 17 2.40359 16.5204 1.39603 15.5301C0.486678 14.6029 0 13.2612 0 11.7913C0 9.13988 1.8507 6.966 5.78165 6.966H9.77771V6.13491C9.77771 4.31356 8.86836 3.51452 6.62699 3.51452C5.00252 3.51452 4.2554 3.89801 3.37805 4.88934L0.682012 2.30099C2.33959 0.51062 3.96295 0 6.78922 0C11.5324 0 14 1.98159 14 5.8796V16.8398H9.87482Z" transform="translate(153 15)" class="st1"/><path fill-rule="evenodd" clip-rule="evenodd" d="M9.89392 16.8059V15.2573C8.79435 16.4187 7.24331 17 5.69117 17C4.00942 17 2.65171 16.4511 1.71361 15.5161C0.354806 14.1606 0 12.5807 0 10.7409V0H4.20275V10.1607C4.20275 12.4513 5.65932 13.2256 6.98407 13.2256C8.30993 13.2256 9.79725 12.4513 9.79725 10.1607V0H14V16.8059H9.89392Z" transform="translate(170 15)" class="st1"/><path fill-rule="evenodd" clip-rule="evenodd" d="M4.7084 23C1.39516 23 0 20.5778 0 18.1868V0H4.0266V17.9287C4.0266 18.9298 4.42853 19.4471 5.45122 19.4471H7V23H4.7084Z" transform="translate(186 9)" class="st1"/><path fill-rule="evenodd" clip-rule="evenodd" d="M6.73667 21.6233C3.27 21.6233 1.79889 19.1667 1.79889 16.7418V8.28876H0V5.04576H1.79889V0H6.05V5.04576H9.05889V8.28876H6.05V16.48C6.05 17.4625 6.50778 18.02 7.52111 18.02H9.05889V21.6233H6.73667Z" transform="translate(193.736 9.79614)" class="st1"/><path fill-rule="evenodd" clip-rule="evenodd" d="M0 5H24V0H0V5Z" transform="translate(0 7)" fill="#A7A8AB"/><path fill-rule="evenodd" clip-rule="evenodd" d="M0 5H24V0H0V5Z" transform="translate(0 14)" fill="#808284"/><path fill-rule="evenodd" clip-rule="evenodd" d="M0 5H24V0H0V5Z" transform="translate(0 21)" fill="#59595B"/><path fill-rule="evenodd" clip-rule="evenodd" d="M0 5H24V0H0V5Z" fill="#D1D2D4"/><path fill-rule="evenodd" clip-rule="evenodd" d="M0 5H24V0H0V5Z" transform="translate(0 28)" fill="#59595B"/><path fill-rule="evenodd" clip-rule="evenodd" d="M0 5H10V0H0V5Z" transform="translate(27 7)" fill="#982224"/><path fill-rule="evenodd" clip-rule="evenodd" d="M0 5H10V0H0V5Z" transform="translate(27 14)" fill="#630F16"/><path fill-rule="evenodd" clip-rule="evenodd" d="M0 5H10V0H0V5Z" transform="translate(27 21)" fill="#2B1315"/><path fill-rule="evenodd" clip-rule="evenodd" d="M0 5H10V0H0V5Z" transform="translate(27)" fill="#E7282D"/><path fill-rule="evenodd" clip-rule="evenodd" d="M0 5H10V0H0V5Z" transform="translate(27 28)" fill="#2B1315"/><path fill-rule="evenodd" clip-rule="evenodd" d="M0 5H10V0H0V5Z" transform="translate(40 7)" fill="#A7A8AB"/><path fill-rule="evenodd" clip-rule="evenodd" d="M0 5H10V0H0V5Z" transform="translate(40 14)" fill="#808284"/><path fill-rule="evenodd" clip-rule="evenodd" d="M0 5H10V0H0V5Z" transform="translate(40 21)" fill="#59595B"/><path fill-rule="evenodd" clip-rule="evenodd" d="M0 5H10V0H0V5Z" transform="translate(40)" fill="#D1D2D4"/><path fill-rule="evenodd" clip-rule="evenodd" d="M0 5H10V0H0V5Z" transform="translate(40 28)" fill="#59595B"/></svg>`;
    const blogLogo = `<svg viewBox="0 0 162 32" id="so-icon-logo"><title>logo</title><path fill="${linkcolor}" d="M36.211 19.453l-1.853-.168c-1.432-.084-1.937-.674-1.937-1.684 0-1.179.842-1.853 2.526-1.853 1.179 0 2.189.253 3.032.926l1.095-1.095c-1.011-.842-2.442-1.263-4.042-1.263-2.442 0-4.211 1.263-4.211 3.368 0 1.853 1.179 2.863 3.368 3.032l1.853.168c1.347.084 1.853.674 1.853 1.684 0 1.347-1.179 2.021-3.032 2.021-1.432 0-2.611-.337-3.537-1.347l-1.011 1.095c1.263 1.179 2.779 1.6 4.632 1.6 2.779 0 4.632-1.263 4.632-3.453 0-2.105-1.347-2.863-3.368-3.032zm14.231-5.137c-1.853 0-2.947.337-3.958 1.6l1.095 1.095c.674-.926 1.432-1.263 2.863-1.263 2.105 0 2.947.842 2.947 2.442v1.095h-3.453c-2.526 0-3.958 1.263-3.958 3.284 0 .926.253 1.768.842 2.358.758.758 1.6 1.011 3.2 1.011 1.516 0 2.358-.253 3.284-1.263v1.095h1.684v-7.747c0-2.358-1.516-3.705-4.547-3.705zm2.863 7.495c0 .926-.168 1.6-.589 1.937-.758.674-1.6.758-2.526.758-1.768 0-2.611-.589-2.611-1.937s.842-2.021 2.526-2.021h3.2v1.263zm8.169-5.979c1.095 0 1.768.337 2.611 1.263L65.18 16c-1.179-1.263-2.189-1.684-3.705-1.684-2.863 0-5.053 1.937-5.053 5.811s2.189 5.811 5.053 5.811c1.6 0 2.526-.421 3.705-1.684l-1.095-1.095c-.842.926-1.516 1.263-2.611 1.263s-2.021-.421-2.611-1.263c-.505-.758-.758-1.6-.758-3.032s.253-2.358.758-3.032c.589-.842 1.516-1.263 2.611-1.263zm14.231-1.348H73.6l-5.137 5.053V9.432h-1.684v16.421h1.684v-4.126l2.021-2.021 3.789 6.147h2.021l-4.716-7.326 4.126-4.042zm7.748-.589c-1.768 0-2.947.674-3.621 1.432-1.095 1.095-1.347 2.442-1.347 4.547 0 2.189.253 3.453 1.347 4.632.758.758 1.853 1.432 3.621 1.432s2.947-.674 3.705-1.432c1.095-1.095 1.347-2.442 1.347-4.632 0-2.105-.253-3.453-1.347-4.547-.758-.758-1.937-1.432-3.705-1.432zm1.431 8.926c-.337.337-.758.505-1.347.505s-1.011-.168-1.347-.505c-.589-.589-.674-1.684-.674-2.863 0-1.263.084-2.274.674-2.863.337-.337.758-.505 1.347-.505s1.011.168 1.347.505c.589.589.674 1.6.674 2.863 0 1.179-.084 2.189-.674 2.863zm11.453-8.842l-2.358 7.326-2.358-7.326h-3.2L92.8 25.768h2.358l4.379-11.789h-3.2zm8.168-.084c-3.032 0-5.137 2.189-5.137 6.063 0 4.8 2.695 6.063 5.474 6.063 2.105 0 3.284-.674 4.463-1.853l-1.768-1.768c-.758.758-1.347 1.095-2.695 1.095-1.684 0-2.611-1.095-2.611-2.611h7.411v-1.347c0-3.284-1.853-5.642-5.137-5.642zm-2.273 4.884c0-.505.084-.842.253-1.263.337-.674 1.011-1.263 1.937-1.263 1.011 0 1.684.505 1.937 1.263.168.421.253.758.253 1.263h-4.379zm11.705-3.621v-1.179h-2.863v11.789h2.947v-7.074c0-1.516 1.011-2.189 1.853-2.189.758 0 1.095.253 1.516.674l2.274-2.274c-.842-.842-1.6-1.095-2.779-1.095-1.179.084-2.358.674-2.947 1.347zm6.737-2.358v13.053h2.947v-9.347h2.189v-2.274h-2.189v-1.347c0-.674.337-1.095 1.011-1.095h1.179V9.264h-1.684c-2.442.084-3.453 1.853-3.453 3.537zm17.263 1.095c-1.768 0-2.947.674-3.621 1.432-1.095 1.095-1.347 2.442-1.347 4.547 0 2.189.253 3.453 1.347 4.632.758.758 1.853 1.432 3.621 1.432s2.947-.674 3.705-1.432c1.095-1.095 1.347-2.442 1.347-4.632 0-2.105-.253-3.453-1.347-4.547-.758-.758-2.021-1.432-3.705-1.432zm1.347 8.926c-.337.337-.758.505-1.347.505s-1.011-.168-1.347-.505c-.589-.589-.674-1.684-.674-2.863 0-1.263.084-2.274.674-2.863.337-.337.758-.505 1.347-.505s1.011.168 1.347.505c.589.589.674 1.6.674 2.863 0 1.179-.084 2.189-.674 2.863zm17.6-8.842l-1.853 7.326-2.442-7.326H150.4l-2.358 7.326-1.853-7.326h-3.116l3.621 11.789h2.442l2.442-7.411 2.442 7.411h2.442l3.621-11.789h-3.2zm-26.779 8.253V9.348h-2.947v13.053c0 1.684 1.011 3.368 3.453 3.368h1.684v-2.526h-1.179c-.674.084-1.011-.253-1.011-1.011zm-85.894-5.979l1.516-1.516h-3.116v-3.705h-1.684v11.789c0 1.684.926 3.032 2.947 3.032h1.179v-1.516h-.842c-1.095 0-1.516-.589-1.516-1.684v-6.484l1.516.084z"></path><path fill="#bcbbbb" d="M22.4 28.632v-8.421h2.779v11.2H0v-11.2h2.779v8.421z"></path><path fill="#f48024" d="M5.895 19.453l13.726 2.863.589-2.779-13.726-2.863-.589 2.779zm1.768-6.569l12.716 5.895 1.179-2.526-12.716-5.979-1.179 2.611zM11.2 6.653l10.779 9.011 1.768-2.189-10.779-9.011L11.2 6.653zM18.189 0l-2.274 1.684 8.337 11.284 2.274-1.684L18.189 0zM5.558 25.768h14.063v-2.779H5.558v2.779z"></path></svg>`;
    const stackappsLogo = `<svg xmlns="http://www.w3.org/2000/svg" width="204" height="53"><style>.st0{fill:${highlightcolor};}</style><defs><radialGradient id="a" cx="26.5" cy="26.5" r="26.5" gradientUnits="userSpaceOnUse"><stop offset=".38" stop-color="#72869a"/><stop offset=".39" stop-color="#7a90a3"/><stop offset=".41" stop-color="#849bad"/><stop offset=".43" stop-color="#8aa2b3"/><stop offset=".51" stop-color="#8ca4b5"/><stop offset="1" stop-color="#7d92a5"/></radialGradient></defs><path class="st0" d="M69.56 35.2c-2.97 0-5.3-.68-7.23-2.54l1.72-1.72a7.2 7.2 0 0 0 5.47 2.04c2.9 0 4.69-1.04 4.69-3.11 0-1.54-.9-2.4-2.93-2.58l-2.9-.25c-3.44-.28-5.26-1.82-5.26-4.72 0-3.22 2.72-5.15 6.47-5.15a9.95 9.95 0 0 1 6.33 1.9l-1.68 1.68a7.51 7.51 0 0 0-4.68-1.4c-2.58 0-3.94 1.11-3.94 2.9 0 1.5.86 2.4 3.08 2.58l2.82.25c3.08.29 5.2 1.47 5.2 4.76 0 3.4-2.9 5.36-7.16 5.36zM84.7 34.98c-3.01 0-4.52-2.1-4.52-4.72v-10.8h-2.21V17.5h2.21v-5.51h2.58v5.5h3.76v1.98h-3.76v10.73c0 1.61.75 2.58 2.4 2.58h1.36v2.21zM100.54 34.98V33.3a6.18 6.18 0 0 1-5.08 1.9c-2.43 0-3.86-.47-4.97-1.61a5.07 5.07 0 0 1-1.33-3.58c0-3.08 2.15-5.08 6.09-5.08h5.3v-1.68c0-2.58-1.3-3.86-4.51-3.86-2.26 0-3.4.53-4.44 2l-1.75-1.61c1.57-2.04 3.36-2.62 6.22-2.62 4.73 0 7.05 2.04 7.05 5.87v11.95zm0-8.12H95.6c-2.65 0-3.94 1.08-3.94 3.12s1.26 3 4.05 3a5.14 5.14 0 0 0 3.93-1.18 4.07 4.07 0 0 0 .9-3.04zM113.53 35.2c-4.44 0-7.8-3-7.8-9.02s3.36-9.01 7.8-9.01a6.97 6.97 0 0 1 5.8 2.6l-1.76 1.66a4.83 4.83 0 0 0-4.04-1.97 4.77 4.77 0 0 0-4.08 2 7.55 7.55 0 0 0-1.14 4.72 7.55 7.55 0 0 0 1.14 4.72 4.77 4.77 0 0 0 4.08 2 4.87 4.87 0 0 0 4.04-2l1.76 1.68a6.97 6.97 0 0 1-5.8 2.62zM133.89 34.98l-5.58-9.01-3.44 3.94v5.07h-2.58V9.52h2.58v17.03l7.94-9.16h3.22l-5.97 6.73 7.01 10.88h-3.18zM146.09 17.17c-2.99 0-4.7.55-6.46 2.47l2.85 2.78a3.84 3.84 0 0 1 3.44-1.48c2.36 0 3.33.86 3.33 2.82v.9h-4.23c-4.15 0-6.1 2.33-6.1 5.18a5.73 5.73 0 0 0 1.47 4.01 6.1 6.1 0 0 0 4.56 1.58 5.44 5.44 0 0 0 4.4-1.71v1.54h4.36V23.5c0-4.19-2.61-6.32-7.62-6.32zm3.16 11.5a2.94 2.94 0 0 1-.66 2.26 3.54 3.54 0 0 1-2.81.86c-1.75 0-2.58-.82-2.58-2.06 0-1.27.9-2.02 2.51-2.02h3.54zM169.21 18.78a6.23 6.23 0 0 0-4.36-1.61 5.44 5.44 0 0 0-4.46 1.88v-1.68h-4.33v24.45h4.46v-8.14a5.29 5.29 0 0 0 4.33 1.79 6.23 6.23 0 0 0 4.36-1.62c1.78-1.78 1.82-4.87 1.82-7.55s-.03-5.73-1.82-7.52zm-5.67 12.67c-2.67 0-3.02-2.23-3.02-5.15s.35-5.12 3.02-5.12 3.03 2.2 3.03 5.12-.35 5.15-3.03 5.15zM186.19 18.78a6.23 6.23 0 0 0-4.37-1.61 5.44 5.44 0 0 0-4.46 1.88v-1.68h-4.33v24.45h4.47v-8.14a5.29 5.29 0 0 0 4.33 1.79 6.23 6.23 0 0 0 4.36-1.62c1.78-1.78 1.81-4.87 1.81-7.55s-.03-5.73-1.81-7.52zm-5.67 12.67c-2.68 0-3.02-2.23-3.02-5.15s.34-5.12 3.02-5.12 3.02 2.2 3.02 5.12-.34 5.15-3.02 5.15zM196.07 35.47c-2.81 0-5.36-.31-7.62-2.58l2.92-2.92a6.5 6.5 0 0 0 4.77 1.69c1.54 0 3.16-.52 3.16-1.86 0-.89-.48-1.5-1.89-1.65l-2.82-.27c-3.22-.31-5.22-1.72-5.22-5.01 0-3.71 3.27-5.7 6.9-5.7 2.79 0 5.12.48 6.84 2.1l-2.75 2.77a6.22 6.22 0 0 0-4.15-1.2c-1.79 0-2.54.83-2.54 1.72 0 .65.27 1.4 1.85 1.54l2.82.28c3.53.34 5.32 2.23 5.32 5.25 0 3.95-3.37 5.84-7.59 5.84z"/><path d="M46.41 20.87a20.57 20.57 0 0 0-1.85-4.47l2.91-6.4-2.23-2.24L43 5.53l-6.42 2.92a20.61 20.61 0 0 0-4.46-1.85L29.66 0h-6.32l-2.47 6.6a20.61 20.61 0 0 0-4.46 1.85L10 5.53 7.76 7.76 5.53 10l2.91 6.42a20.57 20.57 0 0 0-1.85 4.46L0 23.34v6.32l6.57 2.46a20.62 20.62 0 0 0 1.86 4.5l-2.9 6.4 2.24 2.22 2.22 2.23 6.38-2.9a20.52 20.52 0 0 0 4.51 1.87L23.34 53h6.32l2.46-6.56a20.52 20.52 0 0 0 4.5-1.87l6.39 2.9 2.23-2.23L47.47 43l-2.9-6.4a20.57 20.57 0 0 0 1.86-4.5L53 29.67v-6.32zM26.9 36.07a10.05 10.05 0 1 1 10.05-10.05A10.05 10.05 0 0 1 26.9 36.07z" fill="url(#a)"/></svg>`;


    GM_addStyle(`


/* Apply to all */
body {
    background-image: none;
}
*:not(em):not(strong):not(span):not(svg):not(.deleted-answer):not(.accepted):not(.answered-accepted):not(.coolbg):not(.hotbg):not(.supernovabg):not(.bounty-indicator):not(.badge):not(.s-badge):not(.msbar):not(.mini-counts):not(.s-progress):not(.s-progress--bar):not(.favicon),
*:before,
*:after,
#search-channel-selector,
body .bg-black-025,
body .bg-black-050,
body .bg-black-700,
body .fc-light,
body .fc-medium,
body .fc-dark,
body .fc-black-900,
body .fc-black-800,
body .fc-black-700,
body .fc-black-600 {
    background-color: ${bgcolor};
    color: ${textcolor};
    box-shadow: none;
    outline: none;
    text-shadow: none;
}
i,
b,
em,
strong,
span {
    color: ${textcolor};
}
.btn,
.button,
button,
input[type="submit"],
input[type="button"],
input[type="reset"] {
    background-image: none;
    border-color: ${bordercolor};
}
hr {
    background-color: ${bordercolor};
    border-color: ${bordercolor};
}
table,
table th,
table td {
    border-color: ${bordercolor};
    border-collapse: collapse;
    border-width: 1px;
}
#sidebar .module,
#sidebar .s-sidebarwidget:not(:last-child),
#sidebar .s-sidebarwidget__yellow {
    margin-bottom: 25px;
    padding-bottom: 20px;
    border: none;
    border-bottom: 1px dashed ${bordercolor};
}
.s-sidebarwidget,
.s-sidebarwidget--header,
.s-sidebarwidget--content,
.s-sidebarwidget:after {
    border: none;
}
#sidebar .community-bulletin .bulletin-item-content a,
a:not(.s-btn) {
    color: ${linkcolor};
}
#sidebar .community-bulletin .bulletin-item-content a:hover,
a:hover {
    color: ${linkcolor};
}
iframe:hover,
a:hover img,
a:hover svg,
button:hover img,
button:hover svg {
    filter: none;
    background-color: inherit;
}
iframe,
img,
.-img,
._glyph {
    filter: brightness(0.8) saturate(90%);
}
button:hover,
input[type="button"]:hover,
input[type="submit"]:hover,
.s-btn:hover, .btn:hover {
    background-color: ${btncolor};
    color: ${linkcolor};
}
.s-label {
    color: inherit;
}
body .fc-dark {
    color: #ddd;
}
body .fc-medium {
    color: #888;
}
#user-menu,
body .bc-black-1,
body .bc-black-2,
body .bc-black-3 {
    border-color: ${bordercolor};
}
body .fc-theme-primary {
    color: ${orange};
}
.s-modal {
    background-color: rgba(12,13,14,0.4);
}
.popup,
.s-modal--dialog {
    border: 2px solid #888;
    border-radius: 7px;
}


/* Selection */
::selection { background: ${highlightcolor}; color: ${bordercolor}; }
::-moz-selection { background: ${highlightcolor}; color: ${bordercolor}; }


/* Scrollbars */
::-webkit-scrollbar{ width:10px; height:10px; }
::-webkit-scrollbar-thumb{ background-color:${textcolor}; border-radius: 5; }
::-webkit-scrollbar-thumb:hover{ background-color:${textcolor}; }
::-webkit-scrollbar-track{ background-color:${bordercolor}; }


/* Specific elements opacity & hover */
.wmd-button-row,
#left-sidebar:not(.js-unpinned-left-sidebar),
#sidebar > *,
.deleted-answer,
.downvoted-answer,
.top-bar .-logo,
#usersidebar,
.usersidebar-open #usersidebar,
.js-admin-dashboard aside > * {
    opacity: 0.6;
    transition: opacity 0.2s ease;
}
.question-summary .started,
#footer > div {
    opacity: 0.4;
    transition: opacity 0.2s ease;
}
ul.comments-list .comment-up-off,
ul.comments-list .comment-flag {
    opacity: 0.1;
}
.wmd-button-row:hover,
#left-sidebar:hover,
#sidebar > *:hover,
.deleted-answer:hover,
.downvoted-answer:hover,
.top-bar .-logo:hover,
#usersidebar:hover,
.js-admin-dashboard aside > *:hover,
.question-summary:hover .started,
#footer:hover > div,
ul.comments-list .comment:hover .comment-up-off,
ul.comments-list .comment:hover .comment-flag {
    opacity: 1;
}
.wmd-button,
.wmd-spacer {
    height: 43px;
}
.wmd-button > span {
    filter: invert(1) brightness(1.2);
    background-color: transparent;
}


/* Site Favicons */
/* gray meta icons */
.favicon[class$="meta"]:not([title="Meta Stack Exchange"]),
.favicon[title*="Meta"]:not([title="Meta Stack Exchange"]) {
    filter: brightness(2.1) contrast(1.6);
}
/* black or navy blu-ish icons */
.favicon-anime, .favicon-mathoverflow, .favicon-patents, .favicon-softwarerecs, .favicon-wordpress {
    filter: invert(1);
    background-color: #e3e3e3;
}
/* others that just need a slight boost */
.favicon-codereview, .favicon-salesforce, .favicon-unix, .favicon-ux {
    filter: brightness(2.5) contrast(2.3);
}


/* Site Headers */
.site-header--link {
    transition: 0.1s opacity linear;
    opacity: 0.8;
}
.site-header--link:hover {
    opacity: 1;
}
/* black or navy blu-ish icons */
.site-header--link img[src*="/mathoverflow"] {
    filter: invert(1);
    background-color: #e3e3e3;
}
/* others that just need a slight boost */
.site-header--link img[src*="/anime"],
.site-header--link img[src*="/codereview"],
.site-header--link img[src*="/patents"],
.site-header--link img[src*="/unix"] {
    filter: brightness(2.5) contrast(2.3);
}


/* Specific elements */
#content,
.flush-left,
.question-summary,
.top-bar .searchbar .s-input,
#search-channel-selector,
.topbar-dialog .modal-content li,
#badge-progress-menu {
    border-color: ${bordercolor};
}
#tabs,
#content .tabs {
    position: relative;
    bottom: 1px;
}
#tabs:after,
#content .tabs:after {
    content: '';
    clear: both;
    display: block;
    border-bottom: 1px solid #e4e6e8;
}
#tabs a,
#content .tabs a {
    position: relative;
    bottom: -1px;
    border-color: ${btncolor};
}
#tabs a:before,
#content .tabs a:before {
    background-color: transparent;
}
#tabs a.youarehere,
#content .tabs a.youarehere {
    border-color: #e4e6e8;
    border-bottom-color: ${bgcolor};
}
#tabs a:hover,
#content .tabs a:hover,
#content .diff-choices a:hover {
    background-color: ${btncolor};
    color: ${linkcolor};
}
.s-btn svg,
.s-btn svg * {
    color: inherit;
}
.s-badge__votes,
.s-btn * {
    background: none;
}
#content span[class*="badge"] a {
    background-color: transparent;
    color: white;
}
#sidebar a,
#content #sidebar .community-bulletin .bulletin-item-content a,
a.fc-medium,
a.fc-dark,
.revision-comment {
    color: inherit;
}
#sidebar a:hover,
#content #sidebar .community-bulletin .bulletin-item-content a:hover,
a.fc-medium:hover,
a.fc-dark:hover {
    color: ${linkcolor};
}
#content {
    border-right: none;
}
#footer {
    border-top: 1px solid ${bordercolor};
}
.topbar-dialog .unread-item *,
.expander-arrow-small-hide {
    background-color: transparent;
}
.top-bar .-logo,
.top-bar .-logo span {
    background-color: transparent;
    filter: none;
}
.top-bar.top-bar__network .-logo {
    background-color: transparent;
    opacity: 1;
}
.top-bar .left-sidebar-toggle span,
.top-bar .left-sidebar-toggle span:before,
.top-bar .left-sidebar-toggle span:after {
    background-color: ${textcolor};
}
.top-bar .left-sidebar-toggle.topbar-icon-on span {
    background-color: transparent;
}
.top-bar .left-sidebar-toggle.topbar-icon-on {
    background-color: ${bordercolor};
}
.topbar-dialog.help-dialog .item-summary {
    color: ${textcolor};
}
.s-select:before, .s-select:after,
.f-select:before, .f-select:after {
    border-color: #AAA transparent;
}
#sidebar .s-btn__muted {
    border: none;
    background-color: transparent;
}
.s-btn__primary,
.s-btn__muted.s-btn__outlined {
    border-color: ${bordercolor};
}
#content .s-btn__primary {
    background: #242729;
}
#content .s-btn__primary:hover {
    background: #333;
}
.s-btn__muted.s-btn__outlined.s-btn__dropdown:after {
    border-color: currentColor transparent;
}
.s-btn__filled[disabled] {
    background-color: #222;
    color: #666;
}
.temp-popover--arrow:before,
.temp-popover--arrow:after {
    border-color: transparent;
    border-bottom-color: #e4e6e8;
}
.top-bar .indicator-badge {
    background-color: ${bountyblue};
    color: #eee;
}
.top-bar .indicator-badge {
    border: none;
}
.top-bar .indicator-badge._important {
    background-color: #C91D2E;
}
.topbar-dialog .unread-item {
    background-color: ${darkblue};
}
.top-bar ._danger-indicator:after,
.danger-dialog .-item.danger-urgent a:before {
    background-color: #C91D2E;
}
ul.comments-list .comment > * {
    border-color: #333;
}
.comment .relativetime,
.comment .relativetime-clean,
.comment .comment-score {
    opacity: 0.5;
}
.message {
    border: 1px solid ${bordercolor};
}
.wmd-button-row {
    background-color: white;
}
.wmd-button-row * {
    background-color: inherit;
}
.js-post-issues .s-btn {
    border-color: transparent;
}
.question-summary .excerpt {
    color: #aaa;
}
.post-tag,
.tags .post-tag,
.post-taglist .post-tag {
    background-color: ${btncolor};
    border-color: #3b4045;
    color: #aaa;
}
body > div[style*="absolute"],
#content .tag-popup,
#badge-progress-bar-vis {
    background-color: transparent;
}
.tag-popup .-container,
.tag-popup .-container > *,
.tag-popup .-container .grid {
    background-color: black;
}
#content .s-progress {
    background-color: ${bordercolor};
}
#content .s-progress--bar,
#content div.meter > div {
    background-color: ${darkgreen};
}
.youarehere,
.is-selected {
    background-color: ${bordercolor};
}
.nav-links .youarehere .nav-links--link {
    border-right: 3px solid ${orange};
}
.summary .bounty-indicator {
    z-index: 2;
    position: relative;
    color: white;
    background-color: ${bountyblue};
}
.s-badge__bounty,
.bounty-indicator,
.bounty-indicator-tab,
.tabs .bounty-indicator-tab {
    color: #eee;
    background-color: ${bountyblue};
}
#post-filters,
.post-tag *,
.s-badge__bounty * {
    background-color: transparent;
}
.supernovabg {
    color: white;
    background-color: #F48024;
}
.hotbg {
    color: white;
    background-color: #CF7721;
}
.coolbg {
    color: white;
    background-color: ${bountyblue};
}
.tagged-interesting {
    position: relative;
}
.tagged-interesting:before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: #bbbb00;
}
body .deleted-answer,
body .deleted-comment .comment-actions,
body .deleted-comment .comment-text,
body .deleted-comment .comment-flags,
body td.deleted-answer {
    box-shadow: inset 0 0 0 9999px #220000;
}
.tagged-interesting *,
#content .deleted-answer > a,
.deleted-answer .post-layout,
.deleted-answer .votecell,
.deleted-answer .votecell svg,
.deleted-answer .votecell .js-voting-container,
.deleted-answer .votecell .js-voting-container > *,
.deleted-answer .postcell,
.deleted-answer .postcell *:not(.post-tag),
.deleted-answer .answercell,
.deleted-answer .answercell *,
.deleted-answer .js-post-notices,
.deleted-answer .js-post-notices *,
.deleted-answer .answercell *:not(.popup):not(.comment-flags):not(.comment-flagcount),
.deleted-comment .comment-text *:not(.popup),
.question-status * {
    background-color: transparent;
}
#question .question-status {
    background-color: ${bgcolor};
}
.vote-up-off,
.vote-down-off,
.star-off {
    opacity: 0.2;
}
.vote-up-on,
.vote-down-on {
    background-blend-mode: exclusion;
    filter: brightness(1000%);
    background-color: #030303;
    opacity: 1;
}
.star-on {
    opacity: 1;
}
body .fc-green-500,
.fc-green-500 svg * {
    color: ${darkgreen};
}
.answered-accepted,
.answered-accepted strong,
.show-votes .sidebar-linked .spacer > a:first-child .answer-votes.answered-accepted,
.show-votes .sidebar-related .spacer > a:first-child .answer-votes.answered-accepted,
.user-show-new #user-tab-answers .answer-votes.accepted,
.user-show-new .post-container .vote.accepted,
.user-show-new .user-panel .mini-counts.accepted,
.user-show-new .user-rep .rep-amount .rep-down.accepted,
.user-show-new .user-rep .rep-amount .rep-up.accepted,
.user-show-new #user-tab-answers .answer-votes.answered-accepted,
.user-show-new .post-container .vote.answered-accepted,
.user-show-new .user-panel .mini-counts.answered-accepted,
.user-show-new .user-rep .rep-amount .rep-down.answered-accepted,
.user-show-new .user-rep .rep-amount .rep-up.answered-accepted,
.user-show-new #user-tab-answers .answer-votes.special-rep,
.user-show-new .post-container .vote.special-rep,
.user-show-new .user-panel .mini-counts.special-rep,
.user-show-new .user-rep .rep-amount .rep-down.special-rep,
.user-show-new .user-rep .rep-amount .rep-up.special-rep {
    color: ${linkcolor};
    background-color: ${darkgreen};
    border: none;
}
body .bg-white,
body .bg-yellow-100 {
    background-color: ${bgcolor};
}
body .bg-green-400,
.accepted:not(.icon-q):not(.icon-a),
.answered-accepted,
.special-rep {
    background-color: ${darkgreen};
}
.status > *,
.status.answered-accepted * {
    background-color: transparent;
}
.new-post-activity,
.new-answer-activity {
    background-color: #888;
}
.new-post-activity a,
.new-answer-activity a {
    background-color: transparent;
}
.answer-votes.answered-accepted {
    color: white;
    background-color: #5fba7d;
}
.profile-cards--graph {
    background-image: none;
}
.avatar-wrapper #change-picture,
.avatar-wrapper .change-picture {
    background-color: rgba(12,13,14,0.6);
}
.avatar-wrapper #change-picture:hover,
.avatar-wrapper .change-picture:hover {
    background-color: rgba(12,13,14,0.8);
}
#avatar-card {
    box-shadow: none;
}
.user-info.user-hover .user-gravatar32,
.user-info.user-hover .user-gravatar48 {
    box-shadow: 2px 2px 4px rgba(255,255,255,0.3);
}
a.comment-user.owner {
    background-color: #E1ECF4;
    color: #555;
}
.page-numbers {
    background-image: none;
}
body table.sorter > tbody > tr:nth-child(odd) > td {
    background-color: #181818;
}
body table.sorter > tbody > tr:nth-child(even) > td {
    background: none;
}
.user-show-new .user-rep-chart-summary .user-rep-chart-summary-bar {
    background-color: ${darkgreen};
}
.profile-cards--graph .line {
    stroke: ${darkgreen};
}
.highcharts-container *[fill="#FFFFFF"],
.highcharts-container *[fill="rgb(255,255,255)"] {
    fill: ${bgcolor};
}
svg text {
    fill: ${textcolor};
}
svg line,
svg path.domain {
    stroke: ${textcolor};
}
.ui-datepicker-prev span,
.ui-datepicker-next span {
    background-color: transparent;
    filter: invert(1);
}
.ui-widget-header,
.ui-state-default, .ui-widget-content .ui-state-default, .ui-widget-header .ui-state-default, .ui-button, html .ui-button.ui-state-disabled:hover, html .ui-button.ui-state-disabled:active,
.ui-state-hover, .ui-widget-content .ui-state-hover, .ui-widget-header .ui-state-hover, .ui-state-focus, .ui-widget-content .ui-state-focus, .ui-widget-header .ui-state-focus, .ui-button:hover, .ui-button:focus, .ui-state-active, .ui-state-active:focus {
    background: none;
}
body > div[style*="absolute"].ui-widget {
    background: ${bgcolor};
}
.bg-blue-500,
.wz-progress.wz-progress--active {
    background-color: #0095ff;
}
#badge-progress-count {
    height: auto;
}


/* Diff colours */
span.diff-delete {
    background-color: #e5bdb2;
    color: #a82400;
}
span.diff-add {
    background-color: #d1e1ad;
    color: #222200;
}
span.diff-add .pun,
span.diff-add .pln {
    color: ${bgcolor};
}
img.diff-delete {
    border-color: red;
}
img.diff-add {
    border-color: #d1e1ad;
}
.inserted > div {
    background-color: #113311;
}
.deleted > div {
    background-color: #551111;
}
.body-diffs {
    margin: 30px 0;
}
.diff-choices a {
    border-color: ${bordercolor};
}
.diff-choices a:hover {
    background-color: ${btncolor};
    color: ${linkcolor};
}
.js-search-results .result-highlight {
    color: #bb5;
}


/* Code colours */
pre, code {
    background-color: #444;
}
pre * {
    background-color: inherit;
}
.str, .lit, .tag {
    color: #d68585;
}
.kwd, .dec {
    color: #7878d2;
}
.typ {
    color: #6dbcd5;
}
.atn {
    color: #d84222;
}
.pun, .pln {
    color: ${textcolor};
}
.atv {
    color: #0F74BD;
}


/* Dark mode for SOMU userscripts */
.js-usercolor:after {
    opacity: 0.7;
}
#content .post-stickyheader {
    background: #0c0d0e;
}
#content .post-stickyheader a,
#content .post-stickyheader span,
#content .post-stickyheader div {
    background: none;
}
.post-stickyheader .relativetime,
.post-stickyheader .sticky-tools a {
    color: ${textcolor};
    border-bottom-color: ${textcolor};
}
.ctype-custom,
.ctype-bad,
.ctype-poor,
.ctype-meh {
    display: inline;
    padding: 2px 5px 3px;
    line-height: 1;
    font-size: 10px;
    font-style: normal;
    border-radius: 2px;
    color: white;
}
.ctype-custom {
    background-color: #ffc;
    color: #333;
}
.ctype-bad {
    background-color: #ff2600;
}
.ctype-poor {
    background-color: #ff9300;
}
.ctype-meh {
    background-color: #999;
}
.cmmt-chatty {
    color: coral;
}
.cmmt-rude {
    color: red;
}
a.comment-user.owner {
    background-color: #5f666d;
    color: ${linkcolor};
}
.delete-comment,
.cancel-comment-flag,
.skip-post {
    background: #444;
}
.cancel-comment-flag .cancel-delete-comment-flag {
    background-color: red;
}
.post-mod-menu-link .post-mod-menu {
    background-color: ${bgcolor};
    box-shadow: 0px 0px 5px 0px white;
}
.mod-userlinks,
.mod-userlinks a {
    color: #666;
}
.deleted-answer .mod-userlinks,
.deleted-answer .post-mod-menu-link .post-mod-menu {
    background-color: #220000;
}
.post-mod-menu-link .post-mod-menu a.disabled,
.post-mod-menu-link .post-mod-menu a.disabled:hover {
    background-color: #222;
    color: #888;
}
.post-mod-menu-link .post-mod-menu a:hover {
    background-color: #666;
    color: ${textcolor};
}
#search-helper {
    padding-bottom: 20px;
    border: 1px solid ${bordercolor};
    border-top: none;
}
#saved-search .handle:before,
#saved-search .handle:after {
    background-color: ${bordercolor};
}
#search-helper svg,
#btn-bookmark-search svg,
#btn-auto-refresh svg {
    background-color: transparent;
    fill: #ccc;
}
#search-helper .active svg {
    fill: #888;
}
#btn-bookmark-search.active svg,
#btn-auto-refresh.active svg {
    fill: gold;
}
.fancybox-bg,
.fancybox-inner,
.fancybox-stage,
.fancybox-slide {
    background: none;
}
.fancybox-container {
    background-color: rgba(0,0,0,0.6);
}
#search-helper input[type="radio"] + label:before {
    color: transparent;
}
#search-helper input[type="radio"]:checked + label:before {
    color: ${orange};
}
#search-helper input[type="radio"] + label:before,
#search-helper input[type="checkbox"] + label:before {
    color: transparent;
}
#search-helper input[type="radio"]:checked + label:before,
#search-helper input[type="checkbox"]:checked + label:before {
    color: #dd8;
}
#search-helper .clearbtn {
    width: 21px;
    height: 30px;
    padding: 9px 0;
}
.emojionearea .emojionearea-button {
    background-color: #777;
}
.reviewban-history .reviewban-ending.current span.type,
.reviewban-history .reviewban-ending.recent span.type {
    color: ${orange};
}
#review-flowchart svg * {
    background-color: transparent;
}
#review-flowchart svg text {
    fill: inherit;
}
#review-flowchart svg path {
    fill: ${linkcolor};
    stroke: ${linkcolor};
}
#review-flowchart svg rect {
    stroke: none;
}
span.mod-flair {
    background-color: inherit;
}
.orig-username:before ,
.orig-username:after {
    background-color: transparent;
}
.deleted-user,
#answers .deleted-answer .deleted-user,
#question.deleted-answer .deleted-user {
    background: indianred;
}

/* Chat */
.topbar {
    background: black;
}
.topbar .topbar-wrapper,
.topbar .topbar-wrapper *,
#modflag-count a,
#flag-count a,
#annotation-count a {
    background-color: transparent;
}
.topbar .topbar-icon-on,
.topbar .topbar-icon-on:hover {
    background-color: #eff0f1;
}
.topbar .js-topbar-dialog-corral > * {
    background-color: black;
}
#header-logo img,
#transcript-logo img {
    background-color: white;
}
#chat-body .messages,
#chat-body .message,
.messages,
.message,
.monologue .timestamp {
    background: none;
    border: none;
}
.message .content a {
    border-bottom: 1px dotted #777;
}
.pager .page-numbers.current,
#chat-body .button,
.button {
    background-color: #444;
}
.calendar,
.calendar-small {
    background-image: none;
}
#chat-body .notification {
    border-bottom: 2px dashed ${textcolor};
}
#chat-body div.message.reply-parent .content,
#chat-body div.message.reply-child .content,
#transcript div.message.reply-parent .content,
#transcript div.message.reply-child .content {
    background-color: #444;
}
#chat-body .mine .messages {
    background-color: #181818;
}
#chat-body .mine .messages *:not(code):not(.popup) {
    background-color: transparent;
}
body#chat-body .messages .message.cmmt-deleted,
body#chat-body .messages .message.cmmt-deleted .content,
body#chat-body .messages .message.cmmt-deleted .content * {
    background-color: #331111;
}
#chat-body .signature .username.moderator,
#chat-body .signature .username.moderator:after {
    color: #58abbf;
}
.message .mention {
    background-color: #6f477c;
}
.vote-count-container.stars .img {
    background-size: 11px;
    background-position: 0px -125px;
    filter: brightness(0.8);
}
.vote-count-container.stars.owner-star .img {
    background-size: 32px;
    background-position: 0px -343px;
    filter: brightness(1);
}
.vote-count-container.stars.owner-star.user-star .img,
.vote-count-container.stars.user-star .img {
    background-size: auto;
    background-position: top left;
    background-position: 0 -110px;
    filter: brightness(1);
}
#feed-ticker {
    border: 2px dashed ${textcolor};
}
#feed-ticker > *,
#feed-ticker .ticker-item {
    background: none;
    border: none;
}
#chat-body .system-message-container .system-message {
    color: ${textcolor};
}
.mspark .mspbar,
.room-histogram .mspark .mspbar,
.mini-room-chart .mspark .mspbar,
.mini-user-chart .mspark .mspbar {
    background-color: ${bordercolor};
}
.mspark .mspbar.now,
.room-histogram .mspark .mspbar.now,
.mini-room-chart .mspark .mspbar.now,
.mini-user-chart .mspark .mspbar.now {
    background-color: #dd6205;
}
.highlight .content,
#main.select-mode .message.selected .content {
    background-color: #135;
}
#starred-posts > div > ul > li {
    border-bottom-color: #666;
}
#sidebar #info #sound {
    filter: brightness(6.5);
    background-color: transparent;
}
#sidebar .sprite-sec-private {
    filter: invert(0.9);
}
#sidebar .sprite-sec-gallery {
    filter: invert(0.9) brightness(2);
}
button#sayit-button {
    background: #f48024 url('') 60% 50% no-repeat;
    opacity: 0.8;
}
body.mob button#sayit-button {
    background-image: url('https://cdn-chat.sstatic.net/chat/Img/mobile/skin/dark/ico-send.svg');
}
#header .first-trigger[data-for="sidebar-left"] .ico-hamburger em {
    background: white;
}
#header [data-for="search"] {
    background: url('https://cdn-chat.sstatic.net/chat/Img/mobile/skin/light/ico-search.svg') 50% 50% no-repeat;
}
.sidebar-middle {
    background: transparent;
}
#chat-body #footer-legal a {
    color: ${textcolor};
}
div.message .meta {
    background: ${bgcolor};
}


/* New mod interface only */
body .js-flagged-post .bc-black-3 {
    border: 1px dotted #666;
}
.js-post-flag-options {
    background-color: transparent;
}
.js-post-flag-group.js-cleared {
    opacity: 0.5;
}


`.replace(/;/g, ' !important;'));


    document.addEventListener('DOMContentLoaded', function() {
        const $ = unsafeWindow.jQuery || window.jQuery;
        document.body.classList.add('SOMU-SEDM');

        if(location.hostname === "stackoverflow.com") {
            $('.top-bar .-logo .-img').replaceWith(soLogo);
        }
        else if(location.hostname === "chat.stackoverflow.com") {
            $('#footer-logo img').replaceWith(soLogo);
        }
        else if(location.hostname === "superuser.com") {
            $('.site-header .site-header--link img').replaceWith(suLogo);
        }
        else if(location.hostname === "serverfault.com") {
            $('.site-header .site-header--link img').replaceWith(sfLogo);
        }
        else if(location.hostname === "stackoverflow.blog") {
            $('.site-header .so-icon-logo').replaceWith(blogLogo);
        }
        else if(location.hostname === "stackapps.com") {
            $('.site-header .site-header--link img').replaceWith(stackappsLogo);
        }
    });


})();
