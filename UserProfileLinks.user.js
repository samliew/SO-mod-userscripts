// ==UserScript==
// @name         User Profile Links
// @description  Expands user network links menu and add chat profile links
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.2
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*stackexchange.com/*
//
// @exclude      *chat.*
// @exclude      *blog.*
// @exclude      https://stackoverflow.com/c/*
// ==/UserScript==

/* globals StackExchange, GM_info */

'use strict';

(function() {

    // Check if profile menu exists
    const isUserPage = document.body.classList.contains('user-page');
    const profilesMenu = document.getElementById('profiles-menu');
    if(!isUserPage && !profilesMenu) {
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
</li>
`;

})();


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
