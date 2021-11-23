// ==UserScript==
// @name         10k Tools Helper
// @description  Expand all sections, and adds additional filters
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.3.1
//
// @include      https://*stackexchange.com/tools*
// @include      https://*stackoverflow.com/tools*
// @include      https://*serverfault.com/tools*
// @include      https://*superuser.com/tools*
// @include      https://*askubuntu.com/tools*
// @include      https://*mathoverflow.net/tools*
// @include      https://*.stackexchange.com/tools*
//
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';


    const currentTab = document.querySelector('#tabs .youarehere');
    const currentTabName = currentTab.dataset.value;


    function doPageload() {
        // Once on page load only
        $(document).one('ajaxStop', callbackWhenPageLoaded);
    }

    function callbackWhenPageLoaded() {

        if(currentTabName === 'stats') {


        }

        else if(currentTabName === 'migrated') {


        }

        else if(currentTabName === 'close') {


        }

        else if(currentTabName === 'delete') {

            const buttonWrapper = $(`<div class="modtools-filters-wrapper grid">Quick filters:&nbsp;<div class="modtools-filters grid tt-capitalize">
  <a class="flex--item s-btn s-btn__muted s-btn__outlined py8 ws-nowrap is-selected" data-filter="q">questions</a>
  <a class="flex--item s-btn s-btn__muted s-btn__outlined py8 ws-nowrap is-selected" data-filter="a">answers</a>
</div><div>`).appendTo('.tools-index-subtabs');
            const buttons = buttonWrapper.find('[data-filter]');

            const items = $('.summary-table tr').each(function() {
                this.dataset.posttype = $(this).find('.question-hyperlink').length ? 'q' : 'a';
            });

            buttons.on('click', function() {
                $(this).toggleClass('is-selected');
                const selectedButtons = buttons.filter('.is-selected');

                // if both selected or unselected, show all
                if(selectedButtons.length != 1) {
                    console.log('show all');
                    items.removeClass('dno');
                }
                else {
                    const activeFilter = selectedButtons.attr('data-filter');
                    console.log('show ' + activeFilter);
                    items.addClass('dno').filter((i, el) => el.dataset.posttype == activeFilter).removeClass('dno');
                }
            });
        }
    }


    GM_addStyle(`
.summary-table tr.collapsing {
    display: table-row;
}
.expander-arrow-small-hide,
.summary-table tr.dno {
    display: none !important;
}

.modtools-filters,
.modtools-filters-wrapper {
    display: inline-flex;
    align-items: center;
}
.modtools-filters .is-selected {
    box-shadow: inset 1px 1px 2px 0px rgba(0,0,0,0.3);
}
.modtools-filters a {
    float: none;
    padding: .8em;
    line-height: 1.15384615;
}
.modtools-filters a:first-child {
    border-bottom-right-radius: 0 !important;
    border-top-right-radius: 0 !important;
}
.modtools-filters a + a {
    border-bottom-left-radius: 0 !important;
    border-top-left-radius: 0 !important;
    border-left: 0;
    margin-left: -1px;
}
`);


    // On page load
    doPageload();

})();
