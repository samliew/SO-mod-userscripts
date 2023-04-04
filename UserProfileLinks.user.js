// ==UserScript==
// @name         User Profile Links
// @description  Expands user network links menu and add chat profile links
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       Samuel Liew
// @version      2.0
//
// @match        https://*.stackoverflow.com/*
// @match        https://*.serverfault.com/*
// @match        https://*.superuser.com/*
// @match        https://*.askubuntu.com/*
// @match        https://*.mathoverflow.net/*
// @match        https://*.stackapps.com/*
// @match        https://*.stackexchange.com/*
// @match        https://stackoverflowteams.com/*
//
// @exclude      https://api.stackexchange.com/*
// @exclude      https://data.stackexchange.com/*
// @exclude      https://contests.stackoverflow.com/*
// @exclude      https://winterbash*.stackexchange.com/*
// @exclude      *chat.*
// @exclude      *blog.*
// @exclude      */tour
//
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/se-ajax-common.js
// @require      https://raw.githubusercontent.com/samliew/SO-mod-userscripts/master/lib/common.js
// ==/UserScript==

/* globals StackExchange */
/// <reference types="./globals" />

'use strict';

// Check if profile menu exists
const isUserPage = document.body.classList.contains('user-page');
const profilesMenu = document.getElementById('profiles-menu');
if (!isUserPage || !profilesMenu) {
  console.log('User network profile dropdown not found.');
  return;
}

// Add class to parent wrapper
const wrapper = profilesMenu.parentElement;
wrapper.id = 'profiles-wrapper';

// Add chat profile links to menu
const list = profilesMenu.querySelector('ul');
const links = list.querySelectorAll('a');
const aid = Number(links[links.length - 1].getAttribute('href').match(/\/users\/(\d+)\//)[1]); // user account id

list.innerHTML += `
  <li class="s-menu--divider"></li>
  <li role="menuitem">
    <a href="https://chat.stackoverflow.com/accounts/${aid}" title="Stack Overflow chat profile" class="s-block-link d-flex ai-center ws-nowrap d-flex ai-center">
      <div class="favicon favicon-stackoverflow site-icon mr4"></div>
      Chat.SO
    </a>
  </li>
  <li role="menuitem">
    <a href="https://chat.stackexchange.com/accounts/${aid}" title="Stack Exchange chat profile" class="s-block-link d-flex ai-center ws-nowrap d-flex ai-center">
      <div class="favicon favicon-stackexchange site-icon mr4"></div>
      Chat.SE
    </a>
  </li>
  <li role="menuitem">
    <a href="https://chat.meta.stackexchange.com/accounts/${aid}" title="Meta Stack Exchange chat profile" class="s-block-link d-flex ai-center ws-nowrap d-flex ai-center">
      <div class="favicon favicon-stackexchangemeta site-icon mr4"></div>
      Chat.MSE
    </a>
  </li>`;


// Append styles
const styles = document.createElement('style');
styles.setAttribute('data-somu', GM_info?.script.name);
styles.innerHTML = `
#profiles-wrapper button[aria-controls="profiles-menu"] {
  display: none;
}
#profiles-wrapper {
  align-items: flex-start !important;
  margin: 0 !important;
}
#profiles-menu {
  display: block !important;
  position: static;
  max-width: none;
  min-width: 10rem;
  margin-left: 10px;
  padding: 0 !important;
  z-index: unset;
  border-radius: unset;
  border: unset;
  background: var(--white);
  box-shadow: unset;
  white-space: nowrap;
}
#profiles-menu a.s-block-link {
  padding: 3px !important;
}
#profiles-menu .iconLogoSEXxs.mr2 {
  margin-right: 4px !important;
}
#profiles-menu .s-menu--title,
#profiles-menu .is-selected {
  display: none !important;
}
`;
document.body.appendChild(styles);
