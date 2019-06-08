// ==UserScript==
// @name         SO-mod-userscripts Options
// @description  Adds right sidebar to modify options of installed userscripts from the repo https://github.com/samliew/SO-mod-userscripts
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.4
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
    sidebarContent: null,


    getOptionValue: function(scriptName, optionName, defaultValue = null, dataType = 'string') {
        const scriptSlug = toSlug(scriptName);
        const optionSlug = toSlug(optionName);
        const uniqueSlug = `${SOMU.keyPrefix}${scriptSlug}:${optionSlug}`;
        let v = store.getItem(uniqueSlug);
        if(dataType === 'int') v = toInt(v);
        if(dataType === 'bool') v = toBool(v);
        return v || defaultValue;
    },


    saveOptionValue: function(key, value) {
        store.setItem(key, value.trim());
    },


    // TODO: support other data types like boolean (toggle)
    addOption: function(scriptName, optionName, defaultValue = '', dataType = 'string') {
        const scriptSlug = toSlug(scriptName);
        const optionSlug = toSlug(optionName);
        const uniqueSlug = `${SOMU.keyPrefix}${scriptSlug}:${optionSlug}`;
        let scriptHeader = this.sidebar.find(`.somu-${scriptSlug}`);

        // If option has already been added, do nothing
        if($('.' + uniqueSlug).length > 0) {
            console.log('Option has already been added!', uniqueSlug);
            return false;
        }

        // If scriptname header not found yet, insert header
        if(scriptHeader.length === 0) {
            scriptHeader = $(`<h3 class="title-section somu-${scriptSlug}">${scriptName}</h3>`).prependTo(this.sidebarContent);
        }

        // Get option value from store
        const currValue = SOMU.getOptionValue(scriptName, optionName, defaultValue, dataType) || defaultValue;

        // Build field HTML
        let fieldHtml = '';
        if(dataType === 'bool') {
            fieldHtml = `<input type="checkbox" class="input" name="${uniqueSlug}" data-datatype="bool" data-currentvalue="${currValue}" data-defaultvalue="${defaultValue}" ${currValue === true ? 'checked="checked"': '' } />`;
        }
        else if(dataType === 'string') {
            fieldHtml = `<textarea class="input" name="${uniqueSlug}" data-datatype="string" data-currentvalue="${currValue}" data-defaultvalue="${defaultValue}">${currValue}</textarea>`;
        }

        // Insert option under header
        const optionElem = $(`<div class="col-12 details somu-${uniqueSlug}">
             <div class="info-header">${optionName}:</div>
             <div class="info-value">
                 ${fieldHtml}
                 <span class="somu-delete" title="reset value to default value">Del</span><span class="somu-save" title="save changes">Save</span>
           </div></div>`).insertAfter(scriptHeader);

        optionElem.find('.input').trigger('change');

        this.sidebar.removeClass('no-items');
    },


    handleSidebarEvents: function() {
        $(this.sidebar)
            .on('change keyup', '.input', function() {
                if(this.dataset.datatype === 'bool') {
                    let currvalue = this.dataset.currentvalue === 'true';
                    let defaultvalue = this.dataset.defaultvalue === 'true';
                    $(this).toggleClass('js-changed', $(this).prop('checked') != currvalue);
                    $(this).toggleClass('js-notdefault', !$(this).hasClass('js-changed') && currvalue != defaultvalue);
                }
                else {
                    $(this).toggleClass('js-changed', this.dataset.currentvalue !== this.value.trim());
                    $(this).toggleClass('js-notdefault', !$(this).hasClass('js-changed') && this.dataset.currentvalue != this.dataset.defaultvalue);
                }
            })
            .on('focus', '.input', function() {
                SOMU.sidebar.addClass('focused');
            })
            .on('blur', '.input', function() {
                SOMU.sidebar.removeClass('focused');
            })
            .on('click', '.somu-save', function() {
                const $el = $(this).prevAll('.input').removeClass('js-changed');
                const el = $el.get(0);
                if(el.dataset.datatype === 'bool') {
                    el.dataset.currentvalue = $el.prop('checked');
                }
                else {
                    el.dataset.currentvalue = el.value;
                }
                $el.trigger('change');
                SOMU.saveOptionValue(el.name, el.dataset.currentvalue);
            })
            .on('click', '.somu-delete', function() {
                const $el = $(this).prevAll('.input');
                const el = $el.get(0);
                el.dataset.currentvalue = el.dataset.defaultvalue;
                if(el.dataset.datatype === 'bool') {
                    $el.prop('checked', el.dataset.defaultvalue === 'true');
                }
                else {
                    el.value = el.dataset.currentvalue;
                }
                $el.trigger('change');
                SOMU.saveOptionValue(el.name, el.dataset.currentvalue);
            })
            .on('click', '.title-section', function() {
                $(this).nextUntil('.title-section').toggle();
            });
    },


    appendStyles: function() {

        const styles = `
<style>
#somusidebar {
    position: fixed;
    z-index: 8950;
    top: 44px;
    left: 100%;
    width: calc(100% - 60px);
    height: calc(100vh - 43px);
    padding: 10px 5px 40px;
    background: white;
    opacity: 0.7;
    border: 1px solid #ccc;
    box-shadow: -2px 2px 14px -3px rgba(0,0,0,0.25);
}
#somusidebar:after {
    content: 'somu';
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
#somusidebar.no-items {
    visibility: hidden;
    pointer-events: none;
    z-index: -1;
}
.somusidebar-open #somusidebar,
#somusidebar.focused,
#somusidebar:hover {
    right: -1px;
    left: initial;
    opacity: 1;
}
.somusidebar-open #somusidebar {
    top: 50px;
    box-shadow: none;
}
.somusidebar-open #somusidebar:after {
    display: none;
}
.somusidebar-compact #somusidebar {
    top: 0px;
    height: 100vh;
}
.somusidebar-compact #somusidebar:after {
    top: 49px;
}
#somusidebar .title-section {
    cursor: pointer;
}
#somusidebar .details {
    margin-bottom: 15px;
}
#somusidebar .info-value {
    position: relative;
    margin: 3px 0 10px;
}
#somusidebar .info-value .input {
    display: block;
    width: 100%;
    margin: 0;
    padding: 5px 7px;
    padding-right: 45px;
    border: 1px solid #ccc;
}
#somusidebar .info-value .input[type="checkbox"] {
    width: auto;
}
#somusidebar .info-value .input ~ span {
    position: absolute;
    display: none;
    top: 0;
    right: 0px;
    width: auto;
    height: 100%;
    padding: 16px 5px;
    font-size: 0.85em;
    text-transform: uppercase;
    background: #666;
    color: white;
    cursor: pointer;
}
#somusidebar .info-value .input[type="checkbox"] ~ span {
    top: -11px;
    height: auto;
    padding: 5px 5px;
}
#somusidebar .info-value .somu-save:hover {
    background: green;
}
#somusidebar .info-value .somu-delete:hover {
    background: red;
}
#somusidebar .info-value .input.js-notdefault:not(.js-changed) ~ .somu-delete,
#somusidebar .info-value .input.js-changed ~ .somu-save {
    display: block;
}
#somusidebar span.info {
    position: absolute;
    bottom: 0;
    left: 0;
    padding: 5px;
    font-size: 0.85em;
    font-style: italic;
    color: indianred;
}
#somusidebar-content {
    clear: both;
    position: absolute;
    top: 10px;
    left: 10px;
    right: 0;
    bottom: 24px;
    padding-right: 10px;
    overflow-y: auto;
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

        this.sidebar = $(`<div class="col-12 mod-links no-items" id="somusidebar"><span class="info">Reload the page after you're done making changes for values to take effect.</span></div>`).appendTo('body');
        this.sidebarContent = $(`<div id="somusidebar-content"></div>`).prependTo(this.sidebar);

        this.handleSidebarEvents();

        $(window).on('load resize', function() {
            //$('body').toggleClass('somusidebar-open', $(document).width() >= 1800);
            $('body').toggleClass('somusidebar-compact', $(window).height() <= 680);
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
