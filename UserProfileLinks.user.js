// ==UserScript==
// @name         User Profile Links
// @description  Expands user network links menu and add chat profile links
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0
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


/**
 * @summary Append styles used by this userscript to the page
 */
const style = document.createElement('style');
style.innerHTML = `
/* ===== SOMU - User Profile Links ===== */
#profiles-wrapper button[aria-controls="profiles-menu"] {
  display: none;
}
#profiles-wrapper {
  margin: 0 !important;
}
#profiles-menu {
  display: block !important;
  padding: 0 !important;
  position: static;
  max-width: none;
  min-width: 10rem;
  z-index: unset;
  border-radius: unset;
  border: unset;
  background: unset;
  box-shadow: unset;
  white-space: nowrap;
}
#profiles-menu a.s-block-link {
  padding: 3px !important;
}
#profiles-menu .iconLogoSEXxs.mr2 {
  margin-right: 4px !important;
}
`;
document.body.appendChild(style);
