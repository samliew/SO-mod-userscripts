// ==UserScript==
// @name         Revert Tooltips
// @description  Revert annoying instant popup tooltips
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.1
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*stackapps.com/*
// @include      https://*.stackexchange.com/*
//
// @exclude      *chat.*
// @exclude      *blog.*
// ==/UserScript==


(function() {
    'use strict';

    function findAndRevertTooltips() {
        $('.js-voting-container, .post-menu').find('[aria-describedby^="--stacks-s-tooltip"]').each(function() {
            const tooltipId = $(this).attr('aria-describedby');
            const tooltip = $('#' + $(this).attr('aria-describedby'));
            this.title = tooltip.text();

            $(this).attr('aria-describedby', '');
            tooltip.remove();
        });
    }

    findAndRevertTooltips();
    $(document).ajaxStop(findAndRevertTooltips);

})();
