// ==UserScript==
// @name         SO-mod-userscripts Options
// @description  Adds right sidebar to modify options of installed userscripts from the repo https://github.com/samliew/SO-mod-userscripts
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.1
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

const store = window.localStorage;
const toInt = v => v == null || isNaN(Number(v)) ? null : Number(v);
const toBool = v => v == null ? null : v === true || v.toLowerCase() === 'true';
const toSlug = str => (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');


// Any way to avoid using a global variable?
SOMU = unsafeWindow.SOMU || {

    keyPrefix: 'SOMU:',
    hasInit: false,
    sidebar: null,


    getOptionValue: function(scriptName, optionName, dataType = 'string') {
        const scriptSlug = toSlug(scriptName);
        const optionSlug = toSlug(optionName);
        const uniqueSlug = `${SOMU.keyPrefix}${scriptSlug}:${optionSlug}`;
        let v = store.getItem(uniqueSlug);
        if(dataType === 'int') v = toInt(v);
        if(dataType === 'bool') v = toBool(v);
        return v;
    },


    saveOptionValue: function(key, value) {
        store.setItem(key, value.trim());
    },


    addOption: function(scriptName, optionName, defaultValue = "") {
        const scriptSlug = toSlug(scriptName);
        const optionSlug = toSlug(optionName);
        const uniqueSlug = `${SOMU.keyPrefix}${scriptSlug}:${optionSlug}`;
        let scriptHeader = this.sidebar.find(`.smu-${scriptSlug}`);

        // If option has already been added, do nothing
        if($('.' + uniqueSlug).length > 0) {
            console.log('Option has already been added!', uniqueSlug);
            return false;
        }

        // If scriptname header not found yet, insert header
        if(scriptHeader.length === 0) {
            scriptHeader = $(`<h3 class="title-section smu-${scriptSlug}">${scriptName}</h3>`).appendTo(this.sidebar);
        }

        // Get option value from store
        const currValue = SOMU.getOptionValue(scriptName, optionName) || defaultValue;

        // Insert option under header
        const optionElem = $(`<div class="col-12 details smu-${uniqueSlug}">
             <div class="info-header">${optionName}:</div>
             <div class="info-value"><input name="${uniqueSlug}" value="${currValue}" data-currentvalue="${currValue}" data-defaultvalue="${defaultValue}" />
                 <span class="smu-delete" title="reset value to default value">Del</span><span class="smu-save" title="save changes">Save</span>
           </div></div>`).insertAfter(scriptHeader);

        optionElem.find('input').trigger('change');

        this.sidebar.removeClass('no-items');
    },


    handleSidebarEvents: function() {
        $(this.sidebar)
            .on('change keyup', 'input', function() {
                $(this).toggleClass('js-changed', this.dataset.currentvalue !== this.value.trim());
                $(this).toggleClass('js-notdefault', !$(this).hasClass('js-changed') && this.dataset.currentvalue != this.dataset.defaultvalue);
            })
            .on('focus', 'input', function() {
                SOMU.sidebar.addClass('focused');
            })
            .on('blur', 'input', function() {
                SOMU.sidebar.removeClass('focused');
            })
            .on('click', '.smu-save', function() {
                const $el = $(this).prevAll('input').removeClass('js-changed');
                const el = $el.get(0);
                el.dataset.currentvalue = el.value;
                $el.trigger('change');
                SOMU.saveOptionValue(el.name, el.value);
            })
            .on('click', '.smu-delete', function() {
                const $el = $(this).prevAll('input');
                const el = $el.get(0);
                el.value = el.dataset.currentvalue = el.dataset.defaultvalue;
                $el.trigger('change');
                SOMU.saveOptionValue(el.name, el.value);
            });
    },


    appendStyles: function() {

        const styles = `
<style>
#optionssidebar {
    position: fixed;
    z-index: 8950;
    top: 44px;
    left: 100%;
    width: 280px;
    min-height: 300px;
    max-height: calc(100vh - 50px);
    padding: 10px 5px 0;
    background: white;
    opacity: 0.7;
    border: 1px solid #ccc;
    box-shadow: -2px 2px 14px -3px rgba(0,0,0,0.25);
}
#optionssidebar:after {
    content: 'opts';
    position: absolute;
    right: 100%;
    top: 5px;
    width: auto;
    height: 30px;
    padding: 5px 8px;
    background: white;
    border: 1px solid #ccc;
    border-right: none;
    box-shadow: -3px 2px 10px -2px rgba(0,0,0,0.25);
}
#optionssidebar.no-items {
    visibility: hidden;
    pointer-events: none;
    z-index: -1;
}
.optionssidebar-open #optionssidebar,
#optionssidebar.focused,
#optionssidebar:hover {
    right: -1px;
    left: initial;
    opacity: 1;
}
.optionssidebar-open #optionssidebar {
    top: 50px;
    box-shadow: none;
}
.optionssidebar-open #optionssidebar:after {
    display: none;
}
.optionssidebar-compact #optionssidebar {
    top: 0px;
    max-height: 100vh;
}
.optionssidebar-compact #optionssidebar:after {
    top: 49px;
}
#optionssidebar .title-section {
    cursor: pointer;
}
#optionssidebar .details {
    margin-bottom: 15px;
}
#optionssidebar .info-value {
    position: relative;
}
#optionssidebar .info-value input {
    width: 100%;
    margin: 0;
    padding-right: 38px;
}
#optionssidebar .info-value input ~ span {
    position: absolute;
    display: none;
    top: 0;
    right: 0px;
    width: auto;
    height: 100%;
    padding: 5px;
    font-size: 0.85em;
    text-transform: uppercase;
    background: #666;
    color: white;
    cursor: pointer;
}
#optionssidebar .info-value .smu-save:hover {
    background: green;
}
#optionssidebar .info-value .smu-delete:hover {
    background: red;
}
#optionssidebar .info-value input.js-notdefault:not(.js-changed) ~ .smu-delete,
#optionssidebar .info-value input.js-changed ~ .smu-save {
    display: block;
}
</style>
`;
        $('body').append(styles);
    },


    init: function() {

        // Run validation
        if(typeof jQuery === 'undefined') {
            console.log('jQuery not found!');
            return;
        }
        if(this.hasInit) {
            console.log('Options userscript has already initialized!');
            return;
        }

        this.hasInit = true;
        this.appendStyles();

        this.sidebar = $(`<div class="col-12 mod-links no-items" id="optionssidebar"></div>`).appendTo('body');

        this.handleSidebarEvents();

        $(window).on('load resize', function() {
            //$('body').toggleClass('optionssidebar-open', $(document).width() >= 1800);
            $('body').toggleClass('optionssidebar-compact', $(window).height() <= 680);
        });
    }

};


(function() {
    'use strict';

    // On page load
    SOMU.init();

    // For testing purposes
    // SOMU.addOption('Test Script', 'Testing Option', 'default value');

})();
