// ==UserScript==
// @name         Searchbar & Nav Improvements
// @description  Site search selector on meta sites. Add advanced search helper when search box is focused. Adds link to meta in left sidebar, and link to main from meta.
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      2.1
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*.stackexchange.com/*
//
// @exclude      *chat.*
// ==/UserScript==


(function() {
    'use strict';


    const isChildMeta = typeof StackExchange.options.site.isChildMeta !== 'undefined';
    const mainName = StackExchange.options.site.name.replace(/\bmeta\b/i, '').trim();
    const siteslug = mainName.toLowerCase().replace(/[^a-z]+/g, '');
    const mainUrl = StackExchange.options.site.parentUrl || 'https://' + location.hostname;
    const metaUrl = StackExchange.options.site.childUrl || 'https://' + location.hostname;
    const metaSearchSelector = $(`<div class="grid--cell f-select w20 wmn1"><select id="search-channel-selector" class="search-channel-switcher w100 pr24">
  <option data-url="${metaUrl}/search" selected="selected">Meta</option>
  <option data-url="${mainUrl}/search" data-mixed="0">${mainName}</option>
</select></div>`);
    const lsidebar = $('#left-sidebar');
    const searchform = $('#search');
    const searchfield = $('#search input[name="q"]');
    const searchbtn = $('#search .js-search-submit');
    let searchhelper;


    // Has value
    jQuery.fn.hasValue = function(i, v) {
        return $(this).filter(function() {
            return $(this).val() !== '';
        });
    };


    // Display name to ID lookup plugin
    jQuery.fn.dnLookup = function(append = false, delay = 1000) {

        let debounceDuration = delay;
        let acTimeout = null;

        function doDnLookup(el) {
            const query = encodeURIComponent( append ? el.value.trim().replace(/^.+\s/, '') : el.value.trim() );
            const resultElem = $(el).next('.aclookup_results').html('<li class="disabled" data-val>loading...</li>');
            $(el).addClass('js-aclookup-complete');
            $.get('http://api.stackexchange.com/2.2/users?filter=!)RwcIFN1JaCrhVpgyYeR_oO*&order=desc&sort=reputation&inname='+query+'&site='+siteslug, function(data) {
                const resultlist = data.items.map(v => `<li data-val="${v.user_id}"><img src="${v.profile_image.replace('=128','=16')}" /> ${v.display_name}</li>`).join('');
                resultElem.html(resultlist);
            });
        }

        const resultslist = $(`<ul class="aclookup_results"></ul>`)
            .on('click', 'li', function(evt) {
                const input = $(this).closest('ul').prev('input').removeClass('js-aclookup-complete');
                input.val((i,v) => ((append ? (' ' + v).replace(/\s\S+$/, '') : '') + ' ' + evt.target.dataset.val).trim() + ' ');
            });

        $(this).after(resultslist)
            .on('keydown blur', function(evt) {
                if(acTimeout) clearTimeout(acTimeout);
                $(this).removeClass('js-aclookup-complete').next('.aclookup_results').html();
            })
            .on('keyup', function(evt) {
                if(acTimeout) clearTimeout(acTimeout);
                if(evt.target.value.trim().length > 1) {
                    acTimeout = setTimeout(doDnLookup, debounceDuration, evt.target);
                }
            });
    };


    // Tags lookup plugin
    jQuery.fn.tagLookup = function(append = false, delay = 1000) {

        let debounceDuration = delay;
        let acTimeout = null;

        function doTagLookup(el) {
            const query = encodeURIComponent( append ? el.value.trim().replace(/^.+\s/, '') : el.value.trim() );
            const resultElem = $(el).next('.aclookup_results').html('<li class="disabled" data-val>loading...</li>');
            $(el).addClass('js-aclookup-complete');
            $.get('https://api.stackexchange.com/2.2/tags?filter=!*MPoAL(KAgsdNw0T&order=desc&sort=popular&inname='+query+'&site='+siteslug, function(data) {
                const resultlist = data.items.map(v => `<li data-val="${v.name}">${v.name}</li>`).join('');
                resultElem.html(resultlist);
            });
        }

        const resultslist = $(`<ul class="aclookup_results"></ul>`)
            .on('click', 'li', function(evt) {
                const input = $(this).closest('ul').prev('input').removeClass('js-aclookup-complete');
                input.val((i,v) => ((append ? (' ' + v).replace(/\s\S+$/, '') : '') + ' ' + evt.target.dataset.val).trim() + ' ');
            });

        $(this).after(resultslist)
            .on('keydown blur', function(evt) {
                if(acTimeout) clearTimeout(acTimeout);
                $(this).removeClass('js-aclookup-complete').next('.aclookup_results').html();
            })
            .on('keyup', function(evt) {
                if(acTimeout) clearTimeout(acTimeout);
                if(evt.target.value.trim().length > 1) {
                    acTimeout = setTimeout(doTagLookup, debounceDuration, evt.target);
                }
            });
    };


    // If on Stack Overflow, make logo go to /questions
    function soLogoToQuestions() {

        if(location.hostname === 'stackoverflow.com') {
            $('.-main .-logo').attr('href', '/questions');
        }
    }


    function handleAdvancedSearch(evt) {
        const filledFields = searchhelper.find('input[data-autofill]:text, input[data-autofill]:checked').hasValue();
        const rangedFields = searchhelper.find('input[data-range-to], select[data-range-to]');
        let addQuery = '';

        filledFields.each(function(i, el) {
            let currValue = el.value.trim();
            if(currValue === '') return;

            const term = searchhelper.find(`[name="${el.dataset.termvalue}"]:checked`).val() || '';
            const neg = el.dataset.neg || '';
            const prefix = el.dataset.prefix || '';
            const suffix = el.dataset.suffix || '';
            const joiner = el.dataset.join || '';

            if(prefix !== '"' && suffix !== '"') currValue = currValue.split(' ').join(neg + joiner + term);

            addQuery += ' ' + neg + term + prefix + currValue + suffix;
        });

        rangedFields.each(function(i, el) {
            const addSep = el.dataset.additionalSep || '';

            const fromValue = el.value;
            const fromAdditional = document.getElementById(el.dataset.additional);
            const fromAdditionalValue = fromAdditional ? fromAdditional.value : null;
            const linkedToField = document.getElementById(el.dataset.rangeTo);
            const linkedToValue = linkedToField.value;
            const linkedToAdditional = document.getElementById(linkedToField.dataset.additional);
            const linkedToAdditionalValue = linkedToAdditional ? linkedToAdditional.value : null;
            const linkedSuffixFrom = linkedToField.dataset.suffixFrom ? document.getElementById(linkedToField.dataset.suffixFrom).value : '';

            const term = searchhelper.find(`[name="${el.dataset.termvalue}"]:checked`).val() || '';
            const prefix = el.dataset.prefix || '';
            const suffix = el.dataset.suffix || '';
            const suffixFrom = el.dataset.suffixFrom ? document.getElementById(el.dataset.suffixFrom).value : '';

            if(el.value === '' && linkedToValue === '') return;
            if(Number(fromValue) > Number(linkedToValue)) return;

            addQuery += ' ' + term + prefix +
                        (fromValue ? fromValue + suffixFrom : '') + (fromAdditionalValue ? addSep + fromAdditionalValue : '') + '..' +
                        (linkedToValue ? linkedToValue + linkedSuffixFrom : '') + (linkedToAdditionalValue ? addSep + linkedToAdditionalValue : '');
        });

        searchfield.val((i, v) => (v + addQuery).replace(/\s+/g, ' ').replace(/([:])\s+/g, '$1'));

        // Live only - remove on submit
        searchhelper.remove();

        // Dev only - block submit for testing
        //return false;
    }


    function initAdvancedSearch() {

        searchhelper = $(`<div id="search-helper" class="search-helper">
<div id="search-helper-tabs" class="tabs">
  <a class="youarehere">Text</a>
  <a>Tags</a>
  <a>User</a>
  <a>Score</a>
  <a>Answers</a>
  <a>Views</a>
  <a>URL</a>
  <a>Favorites</a>
  <a>Status</a>
  <a>Types</a>
  <a>Dates</a>
  <button type="reset">Reset</button>
</div>
<div id="search-helper-tabcontent">
  <div class="active">
    <label for="section">search these sections:</label>
      <input type="radio" name="section" id="section-any" value="" checked /><label for="section-any">Any</label>
      <input type="radio" name="section" id="section-title" value="title:" /><label for="section-title">Title</label>
      <input type="radio" name="section" id="section-body" value="body:" /><label for="section-body">Body</label>
    <label for="all-words">all these words:</label>
    <input name="all-words" id="all-words" data-autofill data-termvalue="section" data-join=" " data-prefix=' ' />
    <label for="exact-phrase">this exact word or phrase:</label>
    <input name="exact-phrase" id="exact-phrase" data-autofill data-termvalue="section" data-prefix='"' data-suffix='"' />
    <label for="any-words">any of these words:</label>
    <input name="any-words" id="any-words" data-autofill data-termvalue="section" data-join=" OR " />
    <label for="not-words">excluding these words:</label>
    <input name="not-words" id="not-words" data-autofill data-termvalue="section" data-neg=" -" />
  </div>
  <div>
    <label for="tags">all of these tags:</label>
    <input name="tags" id="tags" class="js-taglookup" data-autofill data-join="] [" data-prefix="[" data-suffix="]" />
    <label for="any-tags">any of these tags:</label>
    <input name="any-tags" id="any-tags" class="js-taglookup" data-autofill data-join="] OR [" data-prefix="[" data-suffix="]" />
    <label for="not-tags">excluding these tags:</label>
    <input name="not-tags" id="not-tags" class="js-taglookup" data-autofill data-join="] -[" data-prefix="-[" data-suffix="]" />
  </div>
  <div>
    <div>
      <label for="user-self">my own posts:</label>
      <input type="checkbox" name="user-self" id="user-self" value="user:me" data-clears="#user-id" data-autofill /><label for="user-self">self</label>
    </div>
    <label for="user-id">posts by user:</label>
    <input name="user-id" id="user-id" class="js-dnlookup" data-clears="#user-self" data-autofill data-prefix="user:" />
  </div>
  <div>
    <label>score range</label>
    <label for="score-from">from:</label>
    <input type="number" name="score-from" id="score-from" placeholder="any" data-range-to="score-to" data-prefix="score:" />
    <label for="score-to">to:</label>
    <input type="number" name="score-to" id="score-to" placeholder="any" />
  </div>
  <div>
    <label>(question) number of answers</label>
    <label for="answers-from">from:</label>
    <input type="number" name="answers-from" id="answers-from" placeholder="any" data-range-to="answers-to" data-prefix="answers:" />
    <label for="answers-to">to:</label>
    <input type="number" name="answers-to" id="answers-to" placeholder="any" />
  </div>
  <div>
    <label>(question) number of views</label>
    <label for="views-from">from:</label>
    <input type="number" name="views-from" id="views-from" placeholder="any" data-range-to="views-to" data-prefix="views:" />
    <label for="views-to">to:</label>
    <input type="number" name="views-to" id="views-to" placeholder="any" />
  </div>
  <div>
    <label for="url">mentions url/domain (accepts * wildcard):</label>
    <input name="url" id="url" placeholder="example.com" data-autofill data-prefix="url:" />
  </div>
  <div>
    <div>
      <label for="fav-self">my own favorites:</label>
      <input type="checkbox" name="fav-self" id="fav-self" value="infavorites:mine" data-clears="#fav-id" data-autofill /><label for="fav-self">self</label>
    </div>
    <label for="fav-id">favorited by:</label>
    <input name="fav-id" id="fav-id" class="js-dnlookup" data-clears="#fav-self" data-autofill data-prefix="infavorites:" />
  </div>
  <div class="fixed-width">
    <label>post status</label>
    <label for="status">accepted (answers):</label>
      <input type="radio" name="status-isaccepted" id="status-isaccepted-any" value="" checked /><label for="status-isaccepted-any">isaccepted:any</label>
      <input type="radio" name="status-isaccepted" id="status-isaccepted-yes" value="isaccepted:yes" data-autofill /><label for="status-isaccepted-yes">isaccepted:yes</label>
      <input type="radio" name="status-isaccepted" id="status-isaccepted-no" value="isaccepted:no" data-autofill /><label for="status-isaccepted-no">isaccepted:no</label>
    <label for="status">has accepted answer (questions):</label>
      <input type="radio" name="status-hasaccepted" id="status-hasaccepted-any" value="" checked /><label for="status-hasaccepted-any">hasaccepted:any</label>
      <input type="radio" name="status-hasaccepted" id="status-hasaccepted-yes" value="hasaccepted:yes" data-autofill /><label for="status-hasaccepted-yes">hasaccepted:yes</label>
      <input type="radio" name="status-hasaccepted" id="status-hasaccepted-no" value="hasaccepted:no" data-autofill /><label for="status-hasaccepted-no">hasaccepted:no</label>
    <label for="status">is answered (questions):</label>
      <input type="radio" name="status-isanswered" id="status-isanswered-any" value="" checked /><label for="status-isanswered-any">isanswered:any</label>
      <input type="radio" name="status-isanswered" id="status-isanswered-yes" value="isanswered:yes" data-autofill /><label for="status-isanswered-yes">isanswered:yes</label>
      <input type="radio" name="status-isanswered" id="status-isanswered-no" value="isanswered:no" data-autofill /><label for="status-isanswered-no">isanswered:no</label>
    <label for="status">has code block:</label>
      <input type="radio" name="status-hascode" id="status-hascode-any" value="" checked /><label for="status-hascode-any">hascode:any</label>
      <input type="radio" name="status-hascode" id="status-hascode-yes" value="hascode:yes" data-autofill /><label for="status-hascode-yes">hascode:yes</label>
      <input type="radio" name="status-hascode" id="status-hascode-no" value="hascode:no" data-autofill /><label for="status-hascode-no">hascode:no</label>
    <label for="status">closed:</label>
      <input type="radio" name="status-closed" id="status-closed-any" value="" checked /><label for="status-closed-any">closed:any</label>
      <input type="radio" name="status-closed" id="status-closed-yes" value="closed:yes" data-autofill /><label for="status-closed-yes">closed:yes</label>
      <input type="radio" name="status-closed" id="status-closed-no" value="closed:no" data-autofill /><label for="status-closed-no">closed:no</label>
    <label for="status">duplicate:</label>
      <input type="radio" name="status-duplicate" id="status-duplicate-any" value="" checked /><label for="status-duplicate-any">duplicate:any</label>
      <input type="radio" name="status-duplicate" id="status-duplicate-yes" value="duplicate:yes" data-autofill /><label for="status-duplicate-yes">duplicate:yes</label>
      <input type="radio" name="status-duplicate" id="status-duplicate-no" value="duplicate:no" data-autofill /><label for="status-duplicate-no">duplicate:no</label>
    <label for="status">migrated:</label>
      <input type="radio" name="status-migrated" id="status-migrated-any" value="" checked /><label for="status-migrated-any">migrated:any</label>
      <input type="radio" name="status-migrated" id="status-migrated-yes" value="migrated:yes" data-autofill /><label for="status-migrated-yes">migrated:yes</label>
      <input type="radio" name="status-migrated" id="status-migrated-no" value="migrated:no" /><label for="status-migrated-no">migrated:no</label>
    <label for="status">community wiki:</label>
      <input type="radio" name="status-wiki" id="status-wiki-any" value="" checked /><label for="status-wiki-any">wiki:any</label>
      <input type="radio" name="status-wiki" id="status-wiki-yes" value="wiki:yes" data-autofill /><label for="status-wiki-yes">wiki:yes</label>
      <input type="radio" name="status-wiki" id="status-wiki-no" value="wiki:no" data-autofill /><label for="status-wiki-no">wiki:no</label>
    <label for="status">deleted:</label>
      <input type="radio" name="status-deleted" id="status-deleted-any" value="deleted:any" data-autofill /><label for="status-deleted-any">deleted:any</label>
      <input type="radio" name="status-deleted" id="status-deleted-yes" value="deleted:yes" data-autofill /><label for="status-deleted-yes">deleted:yes</label>
      <input type="radio" name="status-deleted" id="status-deleted-no" value="" checked /><label for="status-deleted-no">deleted:no</label>
    <label for="status">locked:</label>
      <input type="radio" name="status-locked" id="status-locked-any" value="" checked /><label for="status-locked-any">locked:any</label>
      <input type="radio" name="status-locked" id="status-locked-yes" value="locked:yes" data-autofill /><label for="status-locked-yes">locked:yes</label>
      <input type="radio" name="status-locked" id="status-locked-no" value="locked:no" data-autofill /><label for="status-locked-no">locked:no</label>
    <label for="status">hasnotice:</label>
      <input type="radio" name="status-hasnotice" id="status-hasnotice-any" value="" checked /><label for="status-hasnotice-any">hasnotice:any</label>
      <input type="radio" name="status-hasnotice" id="status-hasnotice-yes" value="hasnotice:yes" data-autofill /><label for="status-hasnotice-yes">hasnotice:yes</label>
      <input type="radio" name="status-hasnotice" id="status-hasnotice-no" value="hasnotice:no" data-autofill /><label for="status-hasnotice-no">hasnotice:no</label>
  </div>
  <div>
    <label for="posttype">post type:</label>
    <input type="radio" name="posttype" id="type-any" value="" checked /><label for="type-any">any</label>
    <input type="radio" name="posttype" id="type-q" value="is:q" data-autofill /><label for="type-q">question</label>
    <input type="radio" name="posttype" id="type-a" value="is:a" data-autofill /><label for="type-a">answer</label>
  </div>
  <div>
    <div>
      <label for="datetype">date type:</label>
      <input type="radio" name="datetype" id="datetype-created" value="created:" checked /><label for="datetype-created">created</label>
      <input type="radio" name="datetype" id="datetype-lastactive" value="lastactive:" /><label type="radio" for="datetype-lastactive">last active</label>
    <div>
    <label for="agerange">age range</label>
      <label for="agerange-from">from:</label>
      <input type="number" name="agerange-from" id="agerange-from" placeholder="any" data-termvalue="datetype" data-range-to="agerange-to" data-suffix-from="agerange-from-type"
             data-clears="#yearrange-from, #monthrange-from, #yearrange-to, #monthrange-to" />
      <select name="agerange-from-type" id="agerange-from-type">
        <option value="d" selected>days</option>
        <option value="m">months</option>
        <option value="y">years</option>
      </select> ago
      <label for="agerange-to">to:</label>
      <input type="number" name="agerange-to" id="agerange-to" placeholder="any" data-suffix-from="agerange-to-type"
             data-clears="#yearrange-from, #monthrange-from, #yearrange-to, #monthrange-to" />
      <select name="agerange-to-type" id="agerange-to-type">
        <option value="d" selected>days</option>
        <option value="m">months</option>
        <option value="y">years</option>
      </select> ago
    <label for="yearrange">year range</label>
      <label for="yearrange-from">from:</label>
      <select name="yearrange-from" id="yearrange-from" class="js-yearpicker" data-termvalue="datetype" data-range-to="yearrange-to" data-additional="monthrange-from" data-additional-sep="-"
              data-clears="#agerange-from, #agerange-to">
        <option value="" selected>any</option>
      </select>
      <select name="monthrange-from" id="monthrange-from" data-clears="#agerange-from, #agerange-to">
        <option value="" selected>any</option>
        <option value="01">01</option>
        <option value="02">02</option>
        <option value="03">03</option>
        <option value="04">04</option>
        <option value="05">05</option>
        <option value="06">06</option>
        <option value="07">07</option>
        <option value="08">08</option>
        <option value="09">09</option>
        <option value="10">10</option>
        <option value="11">11</option>
        <option value="12">12</option>
      </select>
      <label for="yearrange-to">to:</label>
      <select name="yearrange-to" id="yearrange-to" class="js-yearpicker" data-additional="monthrange-to" data-clears="#agerange-from, #agerange-to">
        <option value="" selected>any</option>
      </select>
      <select name="monthrange-to" id="monthrange-to" data-clears="#agerange-from, #agerange-to">
        <option value="" selected>any</option>
        <option value="01">01</option>
        <option value="02">02</option>
        <option value="03">03</option>
        <option value="04">04</option>
        <option value="05">05</option>
        <option value="06">06</option>
        <option value="07">07</option>
        <option value="08">08</option>
        <option value="09">09</option>
        <option value="10">10</option>
        <option value="11">11</option>
        <option value="12">12</option>
      </select>
  </div>
</div>
</div>`).insertAfter(searchbtn);


        // State
        let keepOpen = () => searchhelper.addClass('open');
        let clearOpen = () => searchhelper.removeClass('open');
        $(document).on('click', function(evt) {
            // Any click on page except header
            if($(evt.target).closest('.top-bar').length === 0) {
                clearOpen();
            }
        }).on('keydown', function(evt) {
            // On 'esc' keypress
            // https://stackoverflow.com/a/3369743/584192
            evt = evt || window.event;
            var isEscape = false;
            if ("key" in evt) {
                isEscape = (evt.key == "Escape" || evt.key == "Esc");
            } else {
                isEscape = (evt.keyCode == 27);
            }
            if (isEscape) {
                clearOpen();
            }
        });
        searchhelper
            .on('mouseenter click mouseup', keepOpen)
            .on('focus change click mouseup', 'input, select', keepOpen);

        // Tabs
        $('#search-helper-tabs', searchhelper).on('click', 'a', function(e) {
            $(this).addClass('youarehere').siblings().removeClass('youarehere');
            $('#search-helper-tabcontent > div').removeClass('active').eq($(this).index()).addClass('active');
            return false;
        });

        // Pre-populate year pickers with years up to current
        const currYear = new Date().getFullYear();
        $('.js-yearpicker', searchhelper).each(function() {
            for(let i = currYear; i >= 2008; i--) {
                $(this).append(`<option value="${i}">${i}</option>`);
            }
        });

        // Handle display name lookup using API
        searchhelper.find('.js-dnlookup').dnLookup();

        // Handle tag name lookup using API
        searchhelper.find('.js-taglookup').tagLookup(true);

        // Handle fields that resets another
        searchhelper.on('change keyup click', '[data-clears]', function() {
            if(this.value.trim() != '' || this.type == 'radio' || this.type == 'checkbox') {
                $(this.dataset.clears).val('').attr('checked', false);
            }
        });

        // Focus submit button when a radio/checkbox is clicked
        searchhelper.on('click change', 'input:radio, input:checkbox', function() {
            searchbtn.focus();
        });

        // Handle search form submit
        searchform.on('submit', handleAdvancedSearch);
    }


    function doPageLoad() {

        soLogoToQuestions();

        // If on meta site, use new search bar
        if(isChildMeta) {

            searchform
                .find('.ps-relative').first().removeClass('ps-relative').addClass('grid')
                .prepend(metaSearchSelector);

            searchform.addClass('search-channel-context')
                .find('.js-search-field, .js-search-submit').wrapAll('<div class="grid--cell ps-relative fl1"></div>');

            searchform
                .append('<input name="mixed" value="0" type="hidden" id="search-channel-mixed">')
                .find('.js-search-field').addClass('search-channel-switcher-field');
        }
        // If on main and using new search bar
        else {
            $('#search-channel-selector option[selected]').after(`<option data-url="${metaUrl}/search">Meta ${mainName}</option>`);
        }

        // New left navigation, link to parent/meta site
        if(isChildMeta) {
            lsidebar.find('.pl8').removeClass('pl8');
            $('ol.nav-links', lsidebar).first().prepend(`<li><a id="nav-main" href="${mainUrl}/questions" class="nav-links--link -link__with-icon pl8">
<svg aria-hidden="true" class="svg-icon iconGlobe" width="16" height="16" viewBox="0 0 1000 1000">
  <path d="M570,318.4V173.2c0-26.8-14.2-51.4-37-64.1c-22.7-12.6-50.4-11.2-71.9,3.6l-420,290.5C21.7,416.7,10,439.4,10,463.7c0,24.3,11.7,47,31.2,60.4l420,290.5c21.5,14.9,49.1,16.3,71.9,3.6c22.7-12.7,37-37.2,37-64.1V608.9c182.8,0,337.9,121.4,395.6,290.5C981.1,854,990,805.2,990,754.2C990,513.5,802,318.4,570,318.4z"></path></svg>
<span class="-link--channel-name">${mainName}</span></a></li>`);
        }
        // If on main site and has child site
        else if(metaUrl !== mainUrl) {
            $('ol.nav-links ol.nav-links', lsidebar).first().append(`<li><a id="nav-meta" href="${metaUrl}/questions" class="nav-links--link">Meta</a></li>`);
        }

        // If on a question page
        if(location.pathname.indexOf('/questions/') === 0) {
            const qid = $('#question').attr('data-questionid');
            if(qid) searchfield.val(`inquestion:${qid} `);
        }

        initAdvancedSearch();
    }


    function appendStyles() {

        const styles = `
<style>
/* Left sidebar */
.nav-links .nav-links--link.-link__with-icon {
    display: flex;
    padding: 8px 6px 8px 0;
}

/* Search */
.grid {
    display: flex;
}
.f-select {
    position: relative;
}
.wmn1 {
    min-width: 8.1025641rem !important;
}
.w20 {
    width: 20% !important;
}
.f-select>select {
    margin: 0;
    padding-top: 6px;
    padding-bottom: 6px;
}
.f-select > select {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    flex: 1 auto;
    padding: 8px 16px;
    padding-right: 32px;
    font-size: 13px;
    font-family: Arial,"Helvetica Neue",Helvetica,sans-serif;
    line-height: 1.46153846;
    color: #3b4045;
    background-color: #FFF;
    border: 1px solid #c8ccd0;
    border-radius: 2px;
    transition: color 600ms cubic-bezier(.165, .84, .44, 1),border-color 600ms cubic-bezier(.165, .84, .44, 1),box-shadow 600ms cubic-bezier(.165, .84, .44, 1),background-color 600ms cubic-bezier(.165, .84, .44, 1);
}
.search-channel-switcher {
    height: 36px;
    border-radius: 3px !important;
    border-top-right-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
    border-right: none !important;
    background-color: #eff0f1 !important;
}
.search-channel-switcher-field {
    border-top-left-radius: 0 !important;
    border-bottom-left-radius: 0 !important;
}
.top-bar .searchbar .btn-topbar-primary {
    transition: none;
    opacity: 1;
    transform: translateY(-50%) translateX(1px);
    z-index: 1;
}

/* Advanced Search */
.search-helper {
    display: none;
    position: absolute;
    top: 100%;
    left: 12px;
    right: calc(-50vw + 150px);
    max-width: 1000px;
    z-index: 1;

    padding: 10px;
    background: hsla(240, 11%, 98%);
    box-shadow: 2px 2px 7px -2px hsla(0, 0%, 0%, 0.5);
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;

    font-size: 12px;
}
.top-bar .searchbar {
    max-width: none;
}
.searchbar .ps-relative {
    position: inherit !important;
}
/* Only works on large-enough screens */
@media screen and (min-width: 791px) {
    .top-bar._search-open #search .search-helper,
    #search input[name="q"]:focus ~ .search-helper,
    #search-helper.open {
        display: block;
    }
}
.tabs:after, #tabs:after {
    content: '';
    clear: both;
    display: block;
}
#search-helper-tabs a.youarehere {
    position: relative;
    z-index: 1;
    padding-bottom: 13px;
}
#search-helper-tabs {
    float: none;
    margin: 0 0 -1px;
    user-select: none;
}
#search-helper-tabs:after {
    content: '';
    position: relative;
    top: -1px;
    border-bottom: 1px solid #e4e6e8;
}
#search-helper-tabs > a {
    transition: none;
}
#search-helper-tabs > button {
    float: right;
    margin: 5px 1px 5px 7px;
}
#search-helper-tabcontent {
    border: 1px solid #e4e6e8;
    border-top: none;
    clear: both;
}
#search-helper-tabcontent > div {
    display: none;
    min-height: 250px;
    padding: 15px 20px 25px;
    background: white;
}
#search-helper-tabcontent > div.active {
    display: block;
}
#search-helper label {
    display: block;
    margin-top: 10px;
    user-select: none;
}
#search-helper input {
    width: 500px;
    max-width: 100%;
    padding: 4px 10px;
    border: 1px solid #c8ccd0;
    font-size: 14px;
    line-height: 1.6;
}
#search-helper input[type="number"] {
    width: 140px;
    padding-right: 0;
}
#search-helper select {
    box-sizing: content-box;
    height: 22px;
    margin: 5px 0;
    padding: 4px 10px;
    border: 1px solid #c8ccd0;
    font-size: 14px;
}
#search-helper .fixed-width input[type] + label {
    width: 140px;
}
#search-helper input[type="radio"] + label,
#search-helper input[type="checkbox"] + label {
    display: inline-block;
    width: auto;
    min-width: 100px;
    margin: 6px 10px 5px 0;
    font-size: 14px;
    line-height: 1.6;
    cursor: pointer;
}
#search-helper input[type="radio"],
#search-helper input[type="checkbox"] {
    display: none;
}
#search-helper input[type="radio"] + label:before,
#search-helper input[type="checkbox"] + label:before {
    content: '';
    display: inline-block;
    width: 20px;
    height: 20px;
    margin-right: 5px;
    padding-top: 2px;
    border-radius: 50%;
    border: 1px solid #888;
    text-align: center;
    line-height: 16px;
    font-size: 16px;
    font-weight: bold;
    color: transparent;
}
#search-helper input[type="radio"] + label:hover:before,
#search-helper input[type="checkbox"] + label:hover:before {
    box-shadow: inset 0px 0px 3px 0px rgba(0,0,0,0.7);
}
#search-helper input[type="radio"]:checked + label:before,
#search-helper input[type="checkbox"]:checked + label:before {
    color: #F44336;
}
#search-helper input[type="radio"] + label:before {
    content: '●';
    line-height: 12px;
    font-size: 18px;
}
#search-helper input[type="checkbox"] + label:before {
    content: '✓';
    border-radius: 4px;
}

/* Display name autocomplete */
.js-aclookup-complete + .aclookup_results,
.aclookup_results:hover {
    display: block;
}
.aclookup_results {
    position: absolute;
    display: none;
    max-height: 200px;
    width: 300px;
    max-width: 100%;
    margin: 0;
    padding: 4px 2px;
    border: 1px solid #ccc;
    border-radius: 3px;
    overflow-y: auto;
    overflow-x: hidden;
    white-space: nowrap;
    list-style: none;
    background: #f6f6f6;
    box-shadow: 0 1px 15px #9c9c9c;
}
.aclookup_results li {
    padding: 2px 4px;
    border: 1px dotted transparent;
    cursor: pointer;
}
.aclookup_results li:not(.disabled):hover {
    background-color: #f7e7b7;
    border-color: #222;
}
.aclookup_results li img {
    position: relative;
    top: 2px;
    width: 16px;
    height: 16px;
    background: white;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageLoad();

})();
