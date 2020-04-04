// ==UserScript==
// @name         Searchbar & Nav Improvements
// @description  Searchbar & Nav Improvements. Advanced search helper when search box is focused. Bookmark any search for reuse (stored locally, per-site).
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      4.13.4
//
// @include      https://*stackoverflow.com/*
// @include      https://*serverfault.com/*
// @include      https://*superuser.com/*
// @include      https://*askubuntu.com/*
// @include      https://*mathoverflow.net/*
// @include      https://*.stackexchange.com/*
//
// @exclude      https://data.stackexchange.com/*
// @exclude      https://contests.stackoverflow.com/*
//
// @exclude      *chat.*
// ==/UserScript==


(function() {
    'use strict';


    const svgicons = {
        delete : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M336 64l-33.6-44.8C293.3 7.1 279.1 0 264 0h-80c-15.1 0-29.3 7.1-38.4 19.2L112 64H24C10.7 64 0 74.7 0 88v2c0 3.3 2.7 6 6 6h26v368c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V96h26c3.3 0 6-2.7 6-6v-2c0-13.3-10.7-24-24-24h-88zM184 32h80c5 0 9.8 2.4 12.8 6.4L296 64H152l19.2-25.6c3-4 7.8-6.4 12.8-6.4zm200 432c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V96h320v368zm-176-44V156c0-6.6 5.4-12 12-12h8c6.6 0 12 5.4 12 12v264c0 6.6-5.4 12-12 12h-8c-6.6 0-12-5.4-12-12zm-80 0V156c0-6.6 5.4-12 12-12h8c6.6 0 12 5.4 12 12v264c0 6.6-5.4 12-12 12h-8c-6.6 0-12-5.4-12-12zm160 0V156c0-6.6 5.4-12 12-12h8c6.6 0 12 5.4 12 12v264c0 6.6-5.4 12-12 12h-8c-6.6 0-12-5.4-12-12z"/></svg>',
        bookmark : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M0 512V48C0 21.49 21.49 0 48 0h288c26.51 0 48 21.49 48 48v464L192 400 0 512z"/></svg>',
        refresh : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M481.162 164.326c19.478 25.678 30.997 57.709 30.836 92.388C511.61 340.638 442.361 408 358.436 408H176v64c-.001 10.683-12.949 16.021-20.485 8.485l-88-87.995c-4.686-4.686-4.687-12.284 0-16.971l88-88.005c7.58-7.58 20.485-2.14 20.485 8.485v64h182.668C415.933 360 464.06 313.154 464 255.889c-.023-22.372-7.149-43.111-19.237-60.082-3.431-4.817-2.962-11.387 1.223-15.564 8.269-8.255 13.592-13.545 17.137-17.104 5.131-5.152 13.645-4.605 18.039 1.187zM48 256.111C47.94 198.846 96.067 152 153.332 152H336v64c0 10.625 12.905 16.066 20.485 8.485l88-88.005c4.687-4.686 4.686-12.285 0-16.971l-88-87.995C348.949 23.979 336.001 29.317 336 40v64H153.564C69.639 104 .389 171.362.002 255.286c-.16 34.679 11.358 66.71 30.836 92.388 4.394 5.792 12.908 6.339 18.039 1.188 3.545-3.559 8.867-8.849 17.137-17.105 4.185-4.178 4.653-10.748 1.223-15.564-12.088-16.971-19.213-37.71-19.237-60.082z"/></svg>',
    };


    const mseDomain = 'meta.stackexchange.com';
    const isMSE = location.hostname === mseDomain;
    const isSO = location.hostname === 'stackoverflow.com';
    const channel = StackExchange.options.site.routePrefix || '';

    const isChildMeta = typeof StackExchange.options.site.isChildMeta !== 'undefined';
    const mainName = StackExchange.options.site.name.replace(/\bmeta\b/i, '').replace(/\bStack Exchange\b/, '').trim();
    const mainUrl = StackExchange.options.site.parentUrl || 'https://' + location.hostname;
    const metaUrl = StackExchange.options.site.childUrl || 'https://' + location.hostname;
    const siteslug = location.hostname.split('.')[0];
    const currentSiteSlug = location.hostname.replace('.stackexchange', '').replace(/\.\w+$/, ''); // for SEDE
    const hasSearchResults = (location.pathname === '/search' && location.search.length > 2) || location.pathname.indexOf('/questions/tagged/') == 0;
    const mixed = isSO ? '&mixed=0' : '';

    const store = window.localStorage;
    const searchSelector = $(`<div class="grid--cell s-select wmn1"><select id="search-channel-selector" class="search-channel-switcher w100 pr24">
  <option data-url="${mainUrl}/search" ${!isChildMeta ? 'selected="selected"' : ''} data-mixed="0">${mainName}</option>
  <option data-url="${metaUrl}/search" ${ isChildMeta ? 'selected="selected"' : ''}>Meta</option>
  <option data-url="https://${mseDomain}/search">Meta Stack Exchange</option>
</select></div>`);
    const lsidebar = $('#left-sidebar');
    const searchform = $('#search');
    const searchfield = $('#search input[name="q"]');
    let searchbtn = $('#search .js-search-submit');

    // If search button is missing due to layout change, attempt to re-insert a semi-hidden one
    if(searchbtn.length === 0) {
        searchbtn = $(`<button type="submit" class="js-search-submit alt-submit-button"></button>`).insertAfter(searchfield);
    }

    const autoRefreshDefaultSecs = 60;
    let searchhelper, orderby, autoRefreshTimeout;


    // Has value
    jQuery.fn.hasValue = function(i, v) {
        return $(this).filter(function() {
            return $(this).val() !== '';
        });
    };


    // Fetch and store last sort option
    const sortKeyRoot = 'SavedSearch-SearchLastSort';
    function setLastSort(val) {
        store.setItem(sortKeyRoot, val);
    }
    function getLastSort() {
        return store.getItem(sortKeyRoot);
    }


    // Fetch and store watched/ignored tags
    const wtKeyRoot = 'SavedSearch-TagsWatched';
    const itKeyRoot = 'SavedSearch-TagsIgnored';
    function tryUpdateWatchedIgnoredTags() {
        if($('.js-tag-preferences-container').length === 0) return;
        const wTags = $('.js-watched-tag-list .post-tag').map((i,el) => el.text).get() || [];
        const iTags = $('.js-ignored-tag-list .post-tag').map((i,el) => el.text).get() || [];
        store.setItem(wtKeyRoot, JSON.stringify(wTags));
        store.setItem(itKeyRoot, JSON.stringify(iTags));
    }
    function getWatchedTags() {
        return (JSON.parse(store.getItem(wtKeyRoot)) || []).join('  ');
    }
    function getIgnoredTags() {
        return (JSON.parse(store.getItem(itKeyRoot)) || []).join('  ');
    }


    function loadSvgIcons() {
        $('[data-svg]').each(function() {
            if($(this).children('svg').length > 0) return; // once
            const ico = svgicons[this.dataset.svg];
            if(ico) $(this).append(ico);
        });
    }


    // Display name to ID lookup plugin
    jQuery.fn.dnLookup = function(multiple = false, delay = 800) {

        const field = $(this);
        let debounceDuration = delay;
        let acTimeout = null;

        function doDnLookup(el) {
            const query = encodeURIComponent( multiple ? el.value.trim().replace(/^.+\s/, '') : el.value.trim() );
            const resultElem = $(el).nextAll('.aclookup_results').html('<li class="disabled" data-val>loading...</li>');
            const field = $(el).addClass('js-aclookup-complete');
            $.get('https://api.stackexchange.com/2.2/users?filter=!)RwcIFN1JaCrhVpgyYeR_oO*&order=desc&sort=reputation&inname='+query+'&site='+siteslug, function(data) {
                const resultlist = data.items.map(v => `<li data-val="${v.user_id}"><img src="${v.profile_image.replace('=128','=16')}" /> ${v.display_name}</li>`).join('');
                resultElem.html(resultlist);
            });
        }

        const resultslist = $(`<ul class="aclookup_results"></ul>`)
            .on('click', 'li', function(evt) {
                const field = $(this).parent().prevAll('input').first();
                field.removeClass('js-aclookup-complete');
                field.val((i,v) => ((multiple ? (' ' + v).replace(/\s\S+$/, '') : '') + ' ' + evt.target.dataset.val).trim() + ' ');
                field.triggerHandler('keyup');
            });

        field.after(resultslist)
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
    jQuery.fn.tagLookup = function(multiple = false, delay = 800) {

        const field = $(this);
        let debounceDuration = delay;
        let acTimeout = null;

        function doTagLookup(el) {
            const query = encodeURIComponent( multiple ? el.value.trim().replace(/^.+\s/, '') : el.value.trim() );
            const resultElem = $(el).siblings('.aclookup_results').html('<li class="disabled" data-val>loading...</li>');
            const field = $(el).addClass('js-aclookup-complete');
            $.get('https://api.stackexchange.com/2.2/tags?filter=!*MPoAL(KAgsdNw0T&order=desc&sort=popular&inname='+query+'&site='+siteslug, function(data) {
                const resultlist = data.items.map(v => `<li data-val="${v.name}">${v.name}</li>`).join('');
                resultElem.html(resultlist);
            });
        }

        const resultslist = $(`<ul class="aclookup_results"></ul>`)
            .on('click', 'li', function(evt) {
                const field = $(this).parent().prevAll('input').first();
                field.removeClass('js-aclookup-complete');
                field.val((i,v) => ((multiple ? (' ' + v).replace(/\s\S+$/, '') : '') + ' ' + evt.target.dataset.val).trim() + ' ');
            });

        field.after(resultslist)
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

        // Prevent tag brackets [] from being typed
        field
            .on('keydown blur', function(evt) {
                return /[^\[\]]/.test(evt.key);
            })
            .on('change blur', function(evt) {
                this.value = this.value.trim().replace(/[\[\]]/g, '').replace(/\s+/g, ' ');
            });
    };


    // Saved Search helper functions
    const ssKeyRoot = 'SavedSearch';
    // Sanitize: strip mixed, strip page, convert to lowercase
    function sanitizeQuery(value) {
        return value.toLowerCase()
                 .replace(/[?&]mixed=[10]/, '')
                 .replace(/[?&]page=\d+/, '')
                 .replace(/[?&]pagesize=\d+/, '')
                 .replace(/[?&]refresh=\d+/, '')
                 .replace(/^[&]/, '?')
                 .replace(/%20/g, '+')
                 .replace('tab=&', 'tab=relevance&');
    }
    function addSavedSearch(value, append = false) {
        if(value == null || value == '') return false;
        value = sanitizeQuery(value);

        let items = getSavedSearches();
        if(append) {
            items.push(value); // add to end
        }
        else {
            items.unshift(value); // add to beginning
        }
        store.setItem(ssKeyRoot, JSON.stringify(items));
    }
    function addSavedSearches(arrayValues) {
        if(typeof arrayValues !== 'object' || arrayValues.length == 0) return false;
        arrayValues.forEach(o => addSavedSearch(o, true));
    }
    function hasSavedSearch(value) {
        if(value == null || value == '') return false;
        value = sanitizeQuery(value);

        const items = getSavedSearches();
        const result = jQuery.grep(items, function(v) {
            return v == value;
        });
        return result.length > 0;
    }
    function removeSavedSearch(value) {
        if(value == null || value == '') return false;
        value = sanitizeQuery(value);

        const items = getSavedSearches();
        const result = jQuery.grep(items, function(v) {
            return v != value;
        });
        store.setItem(ssKeyRoot, JSON.stringify(result));
    }
    function removeAllSavedSearches() {
        store.setItem(ssKeyRoot, JSON.stringify([]));
    }
    function getSavedSearches() {
        return JSON.parse(store.getItem(ssKeyRoot)) || [];
    }
    function humanizeSearchQuery(value) {
        if(value == null || value == '') return false;
        value = decodeURIComponent(value);
        value = sanitizeQuery(value)
            .replace(/[?&][a-z]+=/g, ' ')
            .replace(/\+/g, ' ')
            .trim();
        return value;
    }


    // Search auto-refresh helper functions
    const afKeyRoot = 'SavedSearch-AutoRefresh';
    let animInterval;
    function addAutoRefresh(value, duration = autoRefreshDefaultSecs) {
        if(value == null || value == '') return false;
        value = sanitizeQuery(value);

        let items = getAutoRefreshes();
        items.push([value, duration]);
        store.setItem(afKeyRoot, JSON.stringify(items));
    }
    function getAutoRefreshDuration(value) {
        if(value == null || value == '') return false;
        value = sanitizeQuery(value);

        const items = getAutoRefreshes();
        const result = jQuery.grep(items, function(v) {
            return v[0] == value;
        });

        if(result.length > 0 && result[0] && result[0][1]) {
            return Number(result[0][1]);
        }
        return false;
    }
    function removeAutoRefresh(value) {
        if(value == null || value == '') return false;
        value = sanitizeQuery(value);

        const items = getAutoRefreshes();
        const result = jQuery.grep(items, function(v) {
            return v[0] != value;
        });
        store.setItem(afKeyRoot, JSON.stringify(result));
    }
    function removeAllAutoRefreshes() {
        store.setItem(afKeyRoot, JSON.stringify([]));
    }
    function getAutoRefreshes() {
        return JSON.parse(store.getItem(afKeyRoot)) || [];
    }
    function stopAutoRefresh() {
        if(autoRefreshTimeout) {
            clearTimeout(autoRefreshTimeout);
            //console.log(`Auto Refresh stopped`);
        }
        if(animInterval) {
            clearInterval(animInterval);
        }
    }
    function startAutoRefresh(duration = autoRefreshDefaultSecs) {
        stopAutoRefresh();
        autoRefreshTimeout = setTimeout("location.reload()", duration * 1000);
        //console.log(`Auto Refresh started (${duration} seconds)`);

        // Animation
        const pb = document.querySelector('#btn-auto-refresh .radial-progress');
        if(pb) {
            pb.dataset.progress = 0;
            animInterval = setInterval(function() {
                let v = Number(pb.dataset.progress) + 1;
                if(v > duration) v = duration;
                pb.dataset.progress = v;
            }, 1000);
        }
    }


    function initAutoRefresh() {

        if(!hasSearchResults) return;

        // Has auto refresh?
        const currRefreshDurationSecs = getAutoRefreshDuration(location.search);
        let refreshDurationSecs = currRefreshDurationSecs || autoRefreshDefaultSecs;

        const btnAutoRefresh = $(`<a id="btn-auto-refresh" class="s-btn" href="#" data-svg="refresh" tabindex="0" title="Auto Refresh (${refreshDurationSecs} seconds)">
  <div class="radial-progress" data-progress="0">
    <div class="circle">
      <div class="mask full">
        <div class="fill"></div>
      </div>
      <div class="mask half">
        <div class="fill"></div>
        <div class="fill fix"></div>
      </div>
    </div>
    <div class="inset"></div>
  </div>
</a>`)
        .click(function() {
            $(this).toggleClass('active');
            if($(this).hasClass('active')) {
                addAutoRefresh(location.search);
                startAutoRefresh(refreshDurationSecs);
            }
            else {
                removeAutoRefresh(location.search);
                stopAutoRefresh();
            }
        });

        // Insert refresh button
        btnAutoRefresh.insertBefore('#btn-bookmark-search');

        // If set, start auto refresh on page load
        if(currRefreshDurationSecs !== false) {
            btnAutoRefresh.addClass('active');
            startAutoRefresh(currRefreshDurationSecs);
        }
    }


    function initQuickfilters() {

        if(!hasSearchResults) return;

        let query = sanitizeQuery(location.search);
        const querysuffix = mixed;
        const lastSort = getLastSort();
        const isOnTagPage = query == '';

        if(isOnTagPage) {
            const tag = location.pathname.split('/').pop();
            query = `/search?tab=${lastSort}&q=%5B${tag}%5D`;
        }
        query = sanitizeQuery(query.toLowerCase());

        let quickfilter = $(`<div id="res-quickfilter">Quick filters:
<div class="grid tabs-filter tt-capitalize">
  <a class="grid--cell s-btn s-btn__muted s-btn__outlined py8 ws-nowrap ${isOnTagPage ? 'is-selected' : ''}"
     href="${removeParam(query, 'is')}+is%3aq${querysuffix}" data-onwhen="is%3aq"
     data-toggleoff="${removeParam(query, 'is')}${querysuffix}">questions</a>
  <a class="grid--cell s-btn s-btn__muted s-btn__outlined py8 ws-nowrap"
     href="${removeParam(query, 'is')}+is%3aa${querysuffix}" data-onwhen="is%3aa"
     data-toggleoff="${removeParam(query, 'is')}${querysuffix}">answers</a>
</div>
<div class="grid tabs-filter tt-capitalize">
  <a class="grid--cell s-btn s-btn__muted s-btn__outlined py8 ws-nowrap"
     href="${removeParam(query, 'deleted')}+deleted%3a1${querysuffix}" data-onwhen="deleted%3ayes"
     data-toggleoff="${removeParam(query, 'deleted')}+deleted%3aany${querysuffix}">deleted</a>
  <a class="grid--cell s-btn s-btn__muted s-btn__outlined py8 ws-nowrap"
     href="${removeParam(query, 'deleted')}+deleted%3a0${querysuffix}" data-onwhen="deleted%3ano" data-onwhenmissing="deleted%3a"
     data-toggleoff="${removeParam(query, 'deleted')}+deleted%3aany${querysuffix}">not deleted</a>
</div>
</div>`).insertAfter('.js-advanced-tips');

        quickfilter.find('a[data-onwhen]').each(function() {
            let se = this.dataset.onwhen;
            if(se.match(/(yes|no)$/) != null) {
                se = se.replace(/yes$/, '(yes|1)').replace(/no$/, '(no|0)');
            }
            const matches = query.toLowerCase().match(se);
            if(matches != null || (this.dataset.onwhenmissing && query.toLowerCase().match(this.dataset.onwhenmissing) == null) ) {
                $(this).addClass('is-selected');
            }
        });

        quickfilter.find('.is-selected').each(function() {
            this.href = this.dataset.toggleoff;
        });

        function removeParam(query, param) {
            const re = new RegExp('\\+?' + param + '%3a[a-z0-9]+');
            return query.toLowerCase().replace(re, '');
        }

    }


    function initSavedSearch() {

        const ss = $('#saved-search');
        const btnBookmark = $(`<a id="btn-bookmark-search" class="s-btn" href="#" data-svg="bookmark" tabindex="0" title="Bookmark Search"></a>`)
            .click(function() {
                $(this).toggleClass('active');
                if($(this).hasClass('active')) {
                    addSavedSearch(location.search);
                }
                else {
                    removeSavedSearch(location.search);
                }
                reloadSavedSearchList();
            });

        // Button toggle in Search helper
        $('#btn-saved-search').click(function() {
           $(this).toggleClass('active');
        });

        // Load Saved Searches
        function reloadSavedSearchList() {
            ss.empty();
            const ssitems = getSavedSearches();
            $.each(ssitems, function(i, v) {
                const readable = humanizeSearchQuery(v);
                const sstemplate = $(`<div class="item" data-value="${v}">
                  <span class="handle"></span>
                  <a href="${channel}/search${v}${mixed}">${readable}</a>
                  <div class="actions">
                    <a class="delete" data-svg="delete" title="Delete (no confirmation)"></a>
                  </div>
                </div>`).appendTo(ss);
            });
            loadSvgIcons();
        }
        reloadSavedSearchList(); // Once on init

        // Sortable bookmarks
        $.getScript('https://cdn.rawgit.com/RubaXa/Sortable/master/Sortable.js', function() {
            Sortable.create(ss.get(0), {
                ghostClass: 'sortable-ghost',
                onUpdate: function(evt) {
                    const items = ss.children('.item').map((i,el) => el.dataset.value).get();
                    removeAllSavedSearches();
                    addSavedSearches(items);
                },
            });
        });

        // Handle delete button
        ss.on('click', 'a.delete', function(evt) {
            const item = $(this).parents('.item');
            removeSavedSearch(item.get(0).dataset.value);

            // Update current search page's bookmark
            btnBookmark.toggleClass('active', hasSavedSearch(location.search));

            item.remove();
            return false;
        });

        // On Search Result page and has search query
        if(location.pathname === '/search' && location.search.length > 2) {

            // Check if current query is already bookmarked
            btnBookmark.toggleClass('active', hasSavedSearch(location.search));

            // Replace advanced search link with bookmark link
            $('.advanced-tips-toggle, .js-advanced-tips-toggle').after(btnBookmark).remove();
        }
    }


    function handleAdvancedSearch(evt) {
        const filledFields = searchhelper.find('input[data-autofill]:text, input[data-autofill]:checked, select[data-autofill]').hasValue();
        const rangedFields = searchhelper.find('input[data-range-to], select[data-range-to]');
        let addQuery = '';

        filledFields.each(function(i, el) {
            let currValue = el.value.trim().replace(/\s+/g, ' ');
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

            if(fromValue === '' && linkedToValue === '') return;

            // Do not validate if NOT age range (because you can use different unit values)
            if(el.id !== 'agerange-from') {

                // First value must be more than or equal to second value
                if(fromValue !== '' && linkedToValue !== '' && Number(fromValue) >= Number(linkedToValue)) return;
            }

            addQuery += ' ' + term + prefix +
                        (fromValue ? fromValue + suffixFrom : '') + (fromAdditionalValue ? addSep + fromAdditionalValue : '') + '..' +
                        (linkedToValue ? linkedToValue + linkedSuffixFrom : '') + (linkedToAdditionalValue ? addSep + linkedToAdditionalValue : '');
        });

        // Append search to existing field value
        searchfield.val((i, v) => (v + addQuery).replace(/\s+/g, ' ').replace(/([:])\s+/g, '$1').trim());

        // Move order-by fields before search field so that the resulting query will match SE's format
        orderby.hide().insertBefore(searchfield);

        // Save last search sort
        setLastSort(orderby.find(':checked').val() || 'relevance');

        // Remove search helper on submit so it doesn't pollute the query string
        searchhelper.remove();
    }


    function initAdvancedSearch() {

        appendAdvancedSearchStyles();

        const today = new Date();

        // Remove new top-search
        $('#top-search').remove();

        orderby = $(`<div id="order-by">
  <span class="label">Order by: </span>
  <input type="radio" name="tab" id="tab-relevance" value="" checked /><label for="tab-relevance">relevance</label>
  <input type="radio" name="tab" id="tab-newest" value="newest" /><label for="tab-newest">newest</label>
  <input type="radio" name="tab" id="tab-votes" value="votes" /><label for="tab-votes">votes</label>
  <input type="radio" name="tab" id="tab-active" value="active" /><label for="tab-active">active</label>
</div>`);

        searchhelper = $(`<div id="search-helper" class="search-helper">
<button type="reset" class="btnreset btn-warning">Reset</button>
<a id="btn-saved-search" data-svg="bookmark" title="Saved Search"></a>
<div id="saved-search"></div>
<div id="search-helper-tabs" class="tabs">
  <a class="youarehere">Text</a>
  <a>Tags</a>
  <a>Score</a>
  <a>Type</a>
  <a>Questions</a>
  <a>Answers</a>
  <a>Status</a>
  <a>Author</a>
  <a>Favorites</a>
  <a>Dates</a>
  <a>Other</a>
</div>
<div id="search-helper-tabcontent">
  <div class="active">
    <label class="section-label">Text</label>
    <label for="section">search these sections:</label>
      <input type="radio" name="section" id="section-any" value="" checked /><label for="section-any">Any</label>
      <input type="radio" name="section" id="section-title" value="title:" /><label for="section-title">Title</label>
      <input type="radio" name="section" id="section-body" value="body:" /><label for="section-body">Body</label>
    <label for="all-words">all these words:</label>
    <input name="all-words" id="all-words" data-clearbtn data-autofill data-termvalue="section" data-join=" " data-prefix=' ' />
    <label for="exact-phrase">this exact word or phrase:</label>
    <input name="exact-phrase" id="exact-phrase" data-clearbtn data-autofill data-termvalue="section" data-prefix='"' data-suffix='"' />
    <label for="any-words">any of these words:</label>
    <input name="any-words" id="any-words" data-clearbtn data-autofill data-termvalue="section" data-join=" OR " />
    <label for="not-words">excluding these words:</label>
    <input name="not-words" id="not-words" data-clearbtn data-autofill data-termvalue="section" data-neg=" -" />
    <label for="code-words">in a code block: <em>(exact phrase, case-sensitive)</em></label>
    <input name="code-words" id="code-words" data-clearbtn data-autofill data-prefix='code:"' data-suffix='"' />
    <label class="section-label">URL</label>
    <label for="url">mentions url/domain (accepts * wildcard):</label>
    <input name="url" id="url" placeholder="example.com" data-clearbtn data-autofill data-validate-url data-prefix='url:"' data-suffix='"' />
  </div>
  <div>
    <label class="section-label">Tags</label>
    <label for="tags">all of these tags:</label>
    <div><input name="tags" id="tags" class="js-taglookup" data-clearbtn data-autofill data-join="] [" data-prefix="[" data-suffix="]" /></div>
    <label for="any-tags">any of these tags:</label>
    <div><input name="any-tags" id="any-tags" class="js-taglookup" data-clearbtn data-autofill data-join="] OR [" data-prefix="[" data-suffix="]" />
      <div class="checkbox-right">
        <input type="checkbox" name="user-watched-tags" id="user-watched-tags" data-autofills-for="#any-tags" value="${getWatchedTags()}" />
        <label for="user-watched-tags" title="any watched tag">watched tags</label>
      </div>
    </div>
    <label for="not-tags">excluding these tags:</label>
    <div><input name="not-tags" id="not-tags" class="js-taglookup" data-clearbtn data-autofill data-join="] -[" data-prefix="-[" data-suffix="]" />
      <div class="checkbox-right">
        <input type="checkbox" name="user-ignored-tags" id="user-ignored-tags" data-autofills-for="#not-tags" value="${getIgnoredTags()}" />
        <label for="user-ignored-tags" title="exclude all ignored tags">ignored tags</label>
      </div>
    </div>
  </div>
  <div>
    <label class="section-label">Post Score</label>
    <div class="fromto">
      <label for="score-from">from:</label>
      <input type="number" name="score-from" id="score-from" placeholder="any" data-range-to="score-to" data-prefix="score:" />
      <label for="score-to">to:</label>
      <input type="number" name="score-to" id="score-to" placeholder="any" />
    </div>
  </div>
  <div>
    <label class="section-label">Post Type</label>
    <div><input type="radio" name="posttype" id="type-any" value="" checked /><label for="type-any">any</label></div>
    <div><input type="radio" name="posttype" id="type-q" value="is:q" data-autofill data-clears-tab="#tab-answers" /><label for="type-q">question</label></div>
    <div><input type="radio" name="posttype" id="type-a" value="is:a" data-autofill data-clears-tab="#tab-questions" /><label for="type-a">answer</label></div>
  </div>
  <div id="tab-questions" class="fixed-width-radios">
    <label class="section-label">Questions</label>
    <div>
      <label class="radio-group-label">closed:</label>
      <input type="radio" name="status-closed" id="status-closed-any" value="" checked /><label for="status-closed-any">any</label>
      <input type="radio" name="status-closed" id="status-closed-yes" value="closed:yes" data-autofill data-checks="#type-q" /><label for="status-closed-yes">yes</label>
      <input type="radio" name="status-closed" id="status-closed-no" value="closed:no" data-autofill data-checks="#type-q" /><label for="status-closed-no">no</label>
    </div>
    <div>
    <label class="radio-group-label">duplicate:</label>
      <input type="radio" name="status-duplicate" id="status-duplicate-any" value="" checked /><label for="status-duplicate-any">any</label>
      <input type="radio" name="status-duplicate" id="status-duplicate-yes" value="duplicate:yes" data-autofill data-checks="#type-q" /><label for="status-duplicate-yes">yes</label>
      <input type="radio" name="status-duplicate" id="status-duplicate-no" value="duplicate:no" data-autofill data-checks="#type-q" /><label for="status-duplicate-no">no</label>
    </div>
    <div>
    <label class="radio-group-label">accepted:</label>
      <input type="radio" name="status-hasaccepted" id="status-hasaccepted-any" value="" checked /><label for="status-hasaccepted-any">any</label>
      <input type="radio" name="status-hasaccepted" id="status-hasaccepted-yes" value="hasaccepted:yes" data-autofill data-checks="#type-q" /><label for="status-hasaccepted-yes">yes</label>
      <input type="radio" name="status-hasaccepted" id="status-hasaccepted-no" value="hasaccepted:no" data-autofill data-checks="#type-q" /><label for="status-hasaccepted-no">no</label>
    </div>
    <div>
    <label class="radio-group-label">answered:</label>
      <input type="radio" name="status-isanswered" id="status-isanswered-any" value="" checked /><label for="status-isanswered-any">any</label>
      <input type="radio" name="status-isanswered" id="status-isanswered-yes" value="isanswered:yes" data-autofill data-checks="#type-q" /><label for="status-isanswered-yes">yes</label>
      <input type="radio" name="status-isanswered" id="status-isanswered-no" value="isanswered:no" data-autofill data-checks="#type-q" /><label for="status-isanswered-no">no</label>
    </div>
    <div>
    <label class="radio-group-label">migrated:</label>
      <input type="radio" name="status-migrated" id="status-migrated-any" value="" checked /><label for="status-migrated-any">any</label>
      <input type="radio" name="status-migrated" id="status-migrated-yes" value="migrated:yes" data-autofill /><label for="status-migrated-yes">yes</label>
      <input type="radio" name="status-migrated" id="status-migrated-no" value="migrated:no" /><label for="status-migrated-no">no</label>
    </div>
    <label class="section-label"># Views</label>
    <div class="fromto">
        <label for="views-from">from:</label>
        <input type="number" name="views-from" id="views-from" placeholder="any" data-range-to="views-to" data-prefix="views:" data-checks="#type-q" />
        <label for="views-to">to:</label>
        <input type="number" name="views-to" id="views-to" placeholder="any" data-checks="#type-q" />
    </div>
    <label class="section-label"># Answers</label>
    <div class="fromto">
        <label for="answers-from">from:</label>
        <input type="number" name="answers-from" id="answers-from" placeholder="any" data-range-to="answers-to" data-prefix="answers:" data-checks="#type-q" />
        <label for="answers-to">to:</label>
        <input type="number" name="answers-to" id="answers-to" placeholder="any" data-checks="#type-q" />
    </div>
  </div>
  <div id="tab-answers" class="fixed-width-radios">
    <label class="section-label">Answers</label>
    <div>
      <label class="radio-group-label">is accepted:</label>
      <input type="radio" name="status-isaccepted" id="status-isaccepted-any" value="" checked /><label for="status-isaccepted-any">any</label>
      <input type="radio" name="status-isaccepted" id="status-isaccepted-yes" value="isaccepted:yes" data-autofill data-checks="#type-a" /><label for="status-isaccepted-yes">yes</label>
      <input type="radio" name="status-isaccepted" id="status-isaccepted-no" value="isaccepted:no" data-autofill data-checks="#type-a" /><label for="status-isaccepted-no">no</label>
    </div>
    <label class="section-label">In a Specific Question</label>
    <input type="checkbox" name="question-current" id="question-current" data-currentfor="#question-id" data-checks="#type-a" /><label for="question-current">current question</label>
    <label for="question-id">question id:</label>
    <input name="question-id" id="question-id" class="input-small" maxlength="12" data-clearbtn data-validate-numeric data-checks="#type-a" data-clears="#question-current" data-autofill data-prefix="inquestion:" />
  </div>
  <div class="fixed-width-radios">
    <label class="section-label">Post Status</label>
    <p>See Questions/Answers tab for type-specific status (closed/duplicate/etc.)</p>
    <div>
    <label class="radio-group-label">deleted:</label>
      <input type="radio" name="status-deleted" id="status-deleted-any" value="deleted:any" data-autofill /><label for="status-deleted-any">any</label>
      <input type="radio" name="status-deleted" id="status-deleted-yes" value="deleted:yes" data-autofill /><label for="status-deleted-yes">yes</label>
      <input type="radio" name="status-deleted" id="status-deleted-no" value="" checked /><label for="status-deleted-no">no</label>
    </div>
    <div>
    <label class="radio-group-label">wiki:</label>
      <input type="radio" name="status-wiki" id="status-wiki-any" value="" checked /><label for="status-wiki-any">any</label>
      <input type="radio" name="status-wiki" id="status-wiki-yes" value="wiki:yes" data-autofill /><label for="status-wiki-yes">yes</label>
      <input type="radio" name="status-wiki" id="status-wiki-no" value="wiki:no" data-autofill /><label for="status-wiki-no">no</label>
    </div>
    <div>
    <label class="radio-group-label">locked:</label>
      <input type="radio" name="status-locked" id="status-locked-any" value="" checked /><label for="status-locked-any">any</label>
      <input type="radio" name="status-locked" id="status-locked-yes" value="locked:yes" data-autofill /><label for="status-locked-yes">yes</label>
      <input type="radio" name="status-locked" id="status-locked-no" value="locked:no" data-autofill /><label for="status-locked-no">no</label>
    </div>
    <div>
    <label class="radio-group-label">notice:</label>
      <input type="radio" name="status-hasnotice" id="status-hasnotice-any" value="" checked /><label for="status-hasnotice-any">any</label>
      <input type="radio" name="status-hasnotice" id="status-hasnotice-yes" value="hasnotice:yes" data-autofill /><label for="status-hasnotice-yes">yes</label>
      <input type="radio" name="status-hasnotice" id="status-hasnotice-no" value="hasnotice:no" data-autofill /><label for="status-hasnotice-no">no</label>
    </div>
    <div>
    <label class="radio-group-label">code block:</label>
      <input type="radio" name="status-hascode" id="status-hascode-any" value="" checked /><label for="status-hascode-any">any</label>
      <input type="radio" name="status-hascode" id="status-hascode-yes" value="hascode:yes" data-autofill /><label for="status-hascode-yes">yes</label>
      <input type="radio" name="status-hascode" id="status-hascode-no" value="hascode:no" data-autofill /><label for="status-hascode-no">no</label>
    </div>
  </div>
  <div>
    <label class="section-label">Post Author</label>
    <div>
      <label for="user-self">my own posts:</label>
      <input type="checkbox" name="user-self" id="user-self" value="user:me" data-clears="#user-id" data-autofill /><label for="user-self">self</label>
    </div>
    <label for="user-id">posts by user: (autocomplete)</label>
    <input name="user-id" id="user-id" class="input-small js-dnlookup" placeholder="username or id" data-clearbtn data-clears="#user-self" data-autofill data-prefix="user:" />
  </div>
  <div>
    <label class="section-label">Favorites</label>
    <div>
      <label for="fav-self">my own favorites:</label>
      <input type="checkbox" name="fav-self" id="fav-self" value="infavorites:mine" data-clears="#fav-id" data-autofill /><label for="fav-self">self</label>
    </div>
    <label for="fav-id">favourited by: (autocomplete)</label>
    <input name="fav-id" id="fav-id" class="input-small js-dnlookup" placeholder="username or id" data-clearbtn data-clears="#fav-self" data-autofill data-prefix="infavorites:" />
  </div>
  <div>
    <label class="section-label">Post Date</label>
    <div>
      <label for="datetype">date type:</label>
      <input type="radio" name="datetype" id="datetype-created" value="created:" checked /><label for="datetype-created">created</label>
      <input type="radio" name="datetype" id="datetype-lastactive" value="lastactive:" /><label type="radio" for="datetype-lastactive">last active</label>
    </div>
    <label class="section-label">Age</label>
      <label for="age-quickselect">quick select:</label>
      <select name="age-quickselect" id="age-quickselect" data-autofill data-termvalue="datetype"
              data-clears="#yearrange-from, #monthrange-from, #yearrange-to, #monthrange-to, #agerange-from, #agerange-to">
        <option></option>
        <option value="${today.getUTCFullYear()}-${today.getUTCMonth()+1}-${today.getUTCDate()}">today</option>
        <option value="1d">yesterday</option>
        <option value="7d..">past 7 days</option>
        <option value="14d..">past 14 days</option>
        <option value="1m..">this month</option>
        <option value="1m">last month</option>
        <option value="3m..">this quarter</option>
        <option value="${today.getUTCFullYear()}">this year</option>
      </select>
    <label class="section-label">Age Range</label>
      <label for="agerange-from">from:</label>
      <input type="number" name="agerange-from" id="agerange-from" min="1" placeholder="any" data-termvalue="datetype" data-range-to="agerange-to" data-suffix-from="agerange-from-type"
             data-clears="#yearrange-from, #monthrange-from, #yearrange-to, #monthrange-to, #age-quickselect" />
      <select name="agerange-from-type" id="agerange-from-type">
        <option value="d" selected>days</option>
        <option value="m">months</option>
        <option value="y">years</option>
      </select> ago
      <label for="agerange-to">to:</label>
      <input type="number" name="agerange-to" id="agerange-to" min="1" placeholder="any" data-suffix-from="agerange-to-type"
             data-clears="#yearrange-from, #monthrange-from, #yearrange-to, #monthrange-to, #age-quickselect" />
      <select name="agerange-to-type" id="agerange-to-type">
        <option value="d" selected>days</option>
        <option value="m">months</option>
        <option value="y">years</option>
      </select> ago
    <label class="section-label">Year Range</label>
      <div class="fromto">
        <label for="yearrange-from">from:</label>
        <select name="yearrange-from" id="yearrange-from" class="js-yearpicker" data-termvalue="datetype" data-range-to="yearrange-to" data-additional="monthrange-from" data-additional-sep="-"
                data-clears="#agerange-from, #agerange-to, #age-quickselect">
          <option value="" selected>any</option>
        </select>
        <select name="monthrange-from" id="monthrange-from" data-clears="#agerange-from, #agerange-to, #age-quickselect">
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
        <select name="yearrange-to" id="yearrange-to" class="js-yearpicker" data-additional="monthrange-to"
                data-clears="#agerange-from, #agerange-to, #age-quickselect">
          <option value="" selected>any</option>
        </select>
        <select name="monthrange-to" id="monthrange-to" data-clears="#agerange-from, #agerange-to, #age-quickselect">
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
  <div id="tab-other">
    <label class="section-label">Questions closed as duplicate of</label>
    <div class="ext">
      <input type="checkbox" name="dupe-current" id="dupe-current" data-currentfor="#dupe-id" /><label for="dupe-current">current question</label>
      <label for="dupe-id">question id:</label>
      <input name="dupe-id" id="dupe-id" class="input-small" maxlength="12" data-clearbtn data-validate-numeric data-clears="#dupe-current" />
      <a class="button extbutton" data-exturl="https://data.stackexchange.com/${currentSiteSlug}/query/874526/?QuestionId={dupe-id}">SEDE</a>
    </div>
    <label class="section-label">Search comments</label>
    <div class="ext">
      <label for="comment-query">Text:</label>
      <input name="comment-query" id="comment-query" data-clearbtn />
      <a class="button extbutton" data-exturl="https://data.stackexchange.com/${currentSiteSlug}/query/898774/?Query={comment-query}">SEDE</a>
    </div>
    <div class="ext">
      <label for="comment-query2">Comments replying to username:</label>
      <input name="comment-query2" id="comment-query2" data-clearbtn placeholder="user display name without spaces (case-insensitive)" />
      <a class="button extbutton" data-exturl="https://data.stackexchange.com/${currentSiteSlug}/query/1160376/?UsernameWithoutSpaces={comment-query2}">SEDE</a>
    </div>
    <div class="ext">
      <label for="comment-query3">Comments by user: (autocomplete)</label>
      <input name="comment-query3" id="comment-query3" class="input-small js-dnlookup" data-clearbtn placeholder="username or id" />
      <a class="button extbutton" data-exturl="https://data.stackexchange.com/${currentSiteSlug}/query/1160377/?UserId={comment-query3}">SEDE</a>
    </div>
    <label class="section-label">Archive for</label>
    <div class="ext">
      <label for="archive-org">URL:</label>
      <input name="archive-org" id="archive-org" data-clearbtn />
      <a class="button extbutton" data-exturl="https://web.archive.org/web/*/{archive-org}">Search archive.org</a>
    </div>
  </div>
</div>
</div>`).appendTo(searchform);

        orderby.insertBefore('#search-helper-tabs');

        // Get last search sort
        let lastSort = getLastSort();
        if(lastSort) orderby.find('#tab-' + lastSort).click();


        // Opened/closed state
        let keepOpen = () => { searchhelper.addClass('open'); stopAutoRefresh(); }
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
        searchform
            .on('focus change click mouseup', '.js-search-field', keepOpen);

        // Save default checked state on radio buttons for reset purposes
        $('input:radio:checked').attr('data-default', '');

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

        // Current question
        const currentQid = $('#question').attr('data-questionid') || null;
        searchhelper
            .on('click', '[data-currentfor]', function(evt) {
                $(evt.target.dataset.currentfor).val(currentQid).triggerHandler('change');
            })
            .find('[data-currentfor]').each(function() {
                if(!currentQid) {
                    $(this).next('label').addBack().remove();
                }
            });

        // Restrict typed value to numerical value
        searchhelper
            .on('keydown', '[data-validate-numeric]', function(evt) {
                const isSpecialKey = evt.altKey || evt.ctrlKey || evt.metaKey || evt.shiftKey || evt.key.length > 1;
                return /\d/.test(evt.key) || isSpecialKey;
            })
            .on('change blur', '[data-validate-numeric]', function(evt) {
                this.value = this.value.replace(/[^\d]+/g, '');
            });

        // Restrict typed value to URL
        searchhelper
            .on('change blur', '[data-validate-url]', function(evt) {
                this.value = this.value.replace(/^https?:\/\//, '').replace(/\/$/, '');
            });

        // Handle display name lookup using API
        searchhelper.find('.js-dnlookup').dnLookup();

        // Handle tag name lookup using API
        searchhelper.find('.js-taglookup').tagLookup(true);

        // Handle radio/checkbox fields that populates another field
        searchhelper.on('click', '[data-autofills-for]', function() {
            if(this.checked) $(this.dataset.autofillsFor).val(this.value).trigger('change');
        });

        // Handle fields that checks another radio/checkbox
        searchhelper.on('change keyup click', '[data-checks]', function() {
            $(this.dataset.checks).prop('checked', true).trigger('change');
        });

        // Handle fields that resets another
        searchhelper.on('change keyup click clear', '[data-clears]', function(evt) {
            if(this.value.trim() != '' || this.type == 'radio' || this.type == 'checkbox' || evt.type == 'clear') {
                $(this.dataset.clears).val('').prop('checked', false);
            }
        })

        // Handle fields that resets fields in another tab
        searchhelper.on('change keyup click', '[data-clears-tab]', function() {
            $(this.dataset.clearsTab)
                .find('input').val('').prop('checked', false)
                .filter('[data-default]').prop('checked', true);
        });

        // Focus submit button when a radio/checkbox is clicked
        searchhelper.on('click', 'input:radio, input:checkbox', function() {
            searchbtn.focus();
        });

        // Insert clear buttons
        searchhelper
            .on('click', '.clearbtn', function() {
                $(this).prev('input').val('').trigger('change').trigger('clear');
                return false;
            })
            .find('[data-clearbtn]').after('<span class="clearbtn" title="clear"></span>');

        // External button links
        searchhelper.find('.extbutton[data-exturl]')
            .each(function(i, el) {
                const linkedEls = '#' + this.dataset.exturl.match(/{[a-z0-9_-]+}/i).join(', #').replace(/[{}]/g, '');
                $(linkedEls).on('change keyup', function(evt) {
                    $(el).trigger('updatelink');
                });
                el.target = '_blank';
            })
            .on('updatelink', function() {
                let valid = true;
                let output = this.dataset.exturl;
                const el = this;
                const linkedEls = output.match(/{[a-z0-9_-]+}/i);

                linkedEls.forEach(function(tag) {
                    tag = tag.replace(/[{}]/g, '');
                    const repl = document.getElementById(tag).value;
                    if(typeof repl === 'undefined' || repl == '') valid = false;
                    output = output.replace('{' + tag + '}', repl);
                });

                this.href = output;
                if(!valid) $(this).removeAttr('href');
            });

        // Intercept enter key on external inputs
        $('.ext').on('keypress', 'input', function(evt) {
            if(evt.key === 'Enter') {
                $(this).closest('.ext').find('.extbutton').first().get(0).click();
                return false;
            }
        });

        // Handle search form submit
        searchform.on('submit', handleAdvancedSearch);
    }


    function doPageLoad() {

        // If on Stack Overflow, make logo go to /questions
        if(location.hostname === 'stackoverflow.com') {
            $('.-main .-logo').attr('href', '/questions');
        }

        // If using old search bar
        const searchform = $('#search');
        if(!searchform.hasClass('search-channel-context')) {

            const grid = searchform.find('.ps-relative').first().removeClass('ps-relative').addClass('grid');

            // If not on MSE, insert channel selector
            if(!isMSE) {
               grid.prepend(searchSelector);
            }

            searchform.addClass('search-channel-context')
                .find('.js-search-field, .js-search-submit').wrapAll('<div class="grid--cell ps-relative fl1"></div>');

            searchform
                .append('<input name="mixed" value="0" type="hidden" id="search-channel-mixed">')
                .find('.js-search-field').addClass('search-channel-switcher-field');
        }
        // If using new search bar
        else {
            $('#search-channel-selector option[selected]')
                .after(`<option data-url="https://${mseDomain}/search">Meta Stack Exchange</option>`)
                .after(`<option data-url="${metaUrl}/search">Meta ${mainName}</option>`);
        }

        // Move new svg search icon before the search field
        $('#search .svg-icon.s-input-icon__search.iconSearch').insertBefore('#search input[name="q"]');

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

        // Expand dropdown-container tab items
        $('.dropdown-container').each(function() {
            const itemClasses = $(this).siblings('a').get(0).className.replace(/(youarehere|is-selected)/g, '');
            const items = $(this).find('li a').removeClass('disabled').addClass(itemClasses);
            items.filter('.selected').addClass('is-selected');
            $(this).before(items).remove();
        });

        // Post timeline buttons to open in new tab
        $('.js-post-issues a[title="Timeline"]').attr('target', '_blank');

        tryUpdateWatchedIgnoredTags();

        initAdvancedSearch();
        initSavedSearch();
        initAutoRefresh();
        initQuickfilters();

        loadSvgIcons();
    }


    function listenToPageUpdates() {

        // On any page update
        $(document).ajaxComplete(function(event, xhr, settings) {
            if(settings.url.indexOf('/users/save-preference') >= 0) {
                tryUpdateWatchedIgnoredTags();
                $('#user-watched-tags').val(getWatchedTags());
                $('#user-ignored-tags').val(getIgnoredTags());
            }
        });
    }


    function appendAdvancedSearchStyles() {

        const styles = `
<style>
.search-helper {
    display: none;
    position: absolute;
    top: 100%;
    left: 12px;
    right: -470px;
    max-width: 749px;
    z-index: 1;

    padding: 10px;
    background: #f9f9fa;
    box-shadow: 2px 2px 7px -2px hsla(0, 0%, 0%, 0.5);
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;

    font-size: 12px;
}
.top-bar .searchbar {
    max-width: none;
}
@media screen and (max-width: 980px) {
    .search-helper {
        right: -330px;
    }
}
/* Only works on large-enough screens */
@media screen and (min-width: 791px) {
    .top-bar._search-open #search .search-helper,
    #search input[name="q"]:focus ~ .search-helper,
    #search-helper.open {
        display: block;
    }
}
#search-helper #order-by {
    margin: 0 0 10px;
    font-size: 14px;
    user-select: none;
}
#search-helper #order-by span.label {
    display: inline-block;
    margin-right: 10px;
    font-weight: bold;
}
#search-helper .btnreset {
    position: absolute;
    top: 14px;
    right: 10px;
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
}
#search-helper label.section-label {
    margin: 28px 0 14px;
    font-weight: bold;
    font-size: 14px;
}
#search-helper label.radio-group-label {
    display: inline-block;
    min-width: 80px;
    margin-top: 15px;
    margin-right: 15px;
    font-weight: bold;
    font-size: 12px;
}
#search-helper label.section-label:first-child {
    margin-top: 5px;
}
#search-helper input {
    width: 500px;
    max-width: 100%;
    padding: 4px 10px;
    border: 1px solid #c8ccd0;
    font-size: 14px;
    line-height: 1.6;
}
#search-helper input.input-small,
#search-helper input[type="number"] {
    width: 200px;
}
#search-helper input[type="number"] {
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
#search-helper input[data-clearbtn] {
    padding-right: 26px;
}
#search-helper input[data-clearbtn] + .clearbtn {
    margin-left: -22px;
}
.clearbtn {
    display: inline-block;
    width: 22px;
    height: 32px;
    padding: 10px 0;
    text-align: center;
    color: #aaa;
    cursor: pointer;
}
.clearbtn:after {
    content: 'X';
}
.clearbtn:hover {
    color: red;
}
#search-helper .checkbox-right {
    display: inline-block;
    margin-left: 10px;
}
#search-helper label.radio-group-label ~ input[type="radio"] + label {
    min-width: 60px;
}
#search-helper input[type="radio"] + label,
#search-helper input[type="checkbox"] + label {
    display: inline-block;
    width: auto;
    min-width: 82px;
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
#search-helper .fromto {
    width: 320px;
    margin-top: 10px;
    columns: 2;
}
#search-helper .fromto > label {
    margin-top: 0;
}
#search-helper .ext a.button {
    display: inline-block;
    position: relative;
    top: -1px;
    height: 32px;
    margin-left: 5px;
}

/* Autocomplete */
.js-aclookup-complete ~ .aclookup_results,
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

/* Saved Search & Auto Refresh UI */
#search-helper [data-svg],
#btn-bookmark-search,
#btn-auto-refresh {
    display: inline-block;
    width: 28px;
    height: 28px;
    padding: 5px;
    font-size: 0px;
    background: #fff center/14px no-repeat;
    border-radius: 3px;
    border: 1px solid #aaa;
    outline: none;
    box-sizing: border-box;
}
#btn-bookmark-search,
#btn-auto-refresh {
    margin-left: 10px;
}
#btn-bookmark-search:focus,
#btn-auto-refresh:focus {
    box-shadow: 0 0 0 4px rgba(0, 149, 255, 0.15) !important;
}
#search-helper a[data-svg]:hover,
#btn-bookmark-search:hover,
#btn-auto-refresh:hover {
    border-color: #666;
    background: #f3f3f3;
}
#search-helper [data-svg] svg,
#btn-bookmark-search svg,
#btn-auto-refresh svg {
    position: relative;
    max-width: 16px;
    max-height: 16px;
    pointer-events: none;
}
#btn-saved-search[data-svg] {
    position: absolute;
    top: 14px;
    right: 78px;
    width: 30px;
    height: 30px;
    padding: 6px;
}
#btn-saved-search.active {
    background: #ddd !important;
    border-right: none;
    border-bottom: none;
}
#btn-bookmark-search.active,
#btn-auto-refresh.active {
    padding: 6px;
    border: none;
    background: #9E9E9E;
    fill: gold;
}
#btn-saved-search.active ~ #saved-search {
    display: block
}
#btn-saved-search.active ~ div {
    display: none
}
#saved-search {
    display: none;
    padding-top: 40px;
}
#saved-search:before {
    content: 'Saved Searches';
    position: absolute;
    top: 20px;
    left: 20px;
    font-size: 14px;
    font-weight: bold;
}
#saved-search .item,
#saved-search .sortable-ghost {
    position: relative;
    min-height: 50px;
    line-height: 1.2;
    padding-left: 30px;
    padding-right: 50px;
    border-bottom: 1px solid #ddd;
    background: white;
    font-size: 14px;
}
#saved-search .sortable-ghost {
    background: #eee;
    border: 1px dashed #aaa;
}
#saved-search .sortable-drag {
    cursor: ns-resize;
}
#saved-search .item > a {
    display: block;
    padding: 17px 15px;
}
#saved-search .actions {
    position: absolute;
    right: 10px;
    top: 11px;
}
#saved-search .handle {
    position: absolute;
    left: 12px;
    top: 18px;
    width: 15px;
    height: 14px;
    cursor: ns-resize;
}
#saved-search .handle:before,
#saved-search .handle:after {
    content: '';
    position: absolute;
    top: 4px;
    width: 100%;
    height: 2px;
    background: #666;
}
#saved-search .handle:after {
    top: initial;
    bottom: 4px;
}

/* Auto refresh button timer animation */
#btn-auto-refresh.active .radial-progress {
  display: block;
}
.radial-progress {
  display: none;
  position: absolute;
  top: 0;
  left: 0;
  width: 28px;
  height: 28px;
  background-color: #9E9E9E;
  border-radius: 50%;
  pointer-events: none;
}
.radial-progress .circle .mask,
.radial-progress .circle .fill {
  width: 28px;
  height: 28px;
  position: absolute;
  border-radius: 50%;
}
.radial-progress .circle .mask,
.radial-progress .circle .fill {
  -webkit-backface-visibility: hidden;
  transition: -webkit-transform .9s;
  transition: -ms-transform .9s;
  transition: transform .9s;
  border-radius: 50%;
}
.radial-progress .circle .mask {
  clip: rect(0px, 28px, 28px, 14px);
}
.radial-progress .circle .mask .fill {
  clip: rect(0px, 14px, 28px, 0px);
  background-color: #ffd700 !important;
}
.radial-progress .inset {
  width: 24px;
  height: 24px;
  position: absolute;
  margin-left: 2px;
  margin-top: 2px;
  background-color: #9e9e9e;
  border-radius: 50%;
}
.radial-progress[data-progress="0"] .circle .mask.full,
.radial-progress[data-progress="0"] .circle .fill {
  transform: rotate(0deg);
}
.radial-progress[data-progress="0"] .circle .fill.fix {
  transform: rotate(0deg);
}
.radial-progress[data-progress="1"] .circle .mask.full,
.radial-progress[data-progress="1"] .circle .fill {
  transform: rotate(3deg);
}
.radial-progress[data-progress="1"] .circle .fill.fix {
  transform: rotate(6deg);
}
.radial-progress[data-progress="2"] .circle .mask.full,
.radial-progress[data-progress="2"] .circle .fill {
  transform: rotate(6deg);
}
.radial-progress[data-progress="2"] .circle .fill.fix {
  transform: rotate(12deg);
}
.radial-progress[data-progress="3"] .circle .mask.full,
.radial-progress[data-progress="3"] .circle .fill {
  transform: rotate(9deg);
}
.radial-progress[data-progress="3"] .circle .fill.fix {
  transform: rotate(18deg);
}
.radial-progress[data-progress="4"] .circle .mask.full,
.radial-progress[data-progress="4"] .circle .fill {
  transform: rotate(12deg);
}
.radial-progress[data-progress="4"] .circle .fill.fix {
  transform: rotate(24deg);
}
.radial-progress[data-progress="5"] .circle .mask.full,
.radial-progress[data-progress="5"] .circle .fill {
  transform: rotate(15deg);
}
.radial-progress[data-progress="5"] .circle .fill.fix {
  transform: rotate(30deg);
}
.radial-progress[data-progress="6"] .circle .mask.full,
.radial-progress[data-progress="6"] .circle .fill {
  transform: rotate(18deg);
}
.radial-progress[data-progress="6"] .circle .fill.fix {
  transform: rotate(36deg);
}
.radial-progress[data-progress="7"] .circle .mask.full,
.radial-progress[data-progress="7"] .circle .fill {
  transform: rotate(21deg);
}
.radial-progress[data-progress="7"] .circle .fill.fix {
  transform: rotate(42deg);
}
.radial-progress[data-progress="8"] .circle .mask.full,
.radial-progress[data-progress="8"] .circle .fill {
  transform: rotate(24deg);
}
.radial-progress[data-progress="8"] .circle .fill.fix {
  transform: rotate(48deg);
}
.radial-progress[data-progress="9"] .circle .mask.full,
.radial-progress[data-progress="9"] .circle .fill {
  transform: rotate(27deg);
}
.radial-progress[data-progress="9"] .circle .fill.fix {
  transform: rotate(54deg);
}
.radial-progress[data-progress="10"] .circle .mask.full,
.radial-progress[data-progress="10"] .circle .fill {
  transform: rotate(30deg);
}
.radial-progress[data-progress="10"] .circle .fill.fix {
  transform: rotate(60deg);
}
.radial-progress[data-progress="11"] .circle .mask.full,
.radial-progress[data-progress="11"] .circle .fill {
  transform: rotate(33deg);
}
.radial-progress[data-progress="11"] .circle .fill.fix {
  transform: rotate(66deg);
}
.radial-progress[data-progress="12"] .circle .mask.full,
.radial-progress[data-progress="12"] .circle .fill {
  transform: rotate(36deg);
}
.radial-progress[data-progress="12"] .circle .fill.fix {
  transform: rotate(72deg);
}
.radial-progress[data-progress="13"] .circle .mask.full,
.radial-progress[data-progress="13"] .circle .fill {
  transform: rotate(39deg);
}
.radial-progress[data-progress="13"] .circle .fill.fix {
  transform: rotate(78deg);
}
.radial-progress[data-progress="14"] .circle .mask.full,
.radial-progress[data-progress="14"] .circle .fill {
  transform: rotate(42deg);
}
.radial-progress[data-progress="14"] .circle .fill.fix {
  transform: rotate(84deg);
}
.radial-progress[data-progress="15"] .circle .mask.full,
.radial-progress[data-progress="15"] .circle .fill {
  transform: rotate(45deg);
}
.radial-progress[data-progress="15"] .circle .fill.fix {
  transform: rotate(90deg);
}
.radial-progress[data-progress="16"] .circle .mask.full,
.radial-progress[data-progress="16"] .circle .fill {
  transform: rotate(48deg);
}
.radial-progress[data-progress="16"] .circle .fill.fix {
  transform: rotate(96deg);
}
.radial-progress[data-progress="17"] .circle .mask.full,
.radial-progress[data-progress="17"] .circle .fill {
  transform: rotate(51deg);
}
.radial-progress[data-progress="17"] .circle .fill.fix {
  transform: rotate(102deg);
}
.radial-progress[data-progress="18"] .circle .mask.full,
.radial-progress[data-progress="18"] .circle .fill {
  transform: rotate(54deg);
}
.radial-progress[data-progress="18"] .circle .fill.fix {
  transform: rotate(108deg);
}
.radial-progress[data-progress="19"] .circle .mask.full,
.radial-progress[data-progress="19"] .circle .fill {
  transform: rotate(57deg);
}
.radial-progress[data-progress="19"] .circle .fill.fix {
  transform: rotate(114deg);
}
.radial-progress[data-progress="20"] .circle .mask.full,
.radial-progress[data-progress="20"] .circle .fill {
  transform: rotate(60deg);
}
.radial-progress[data-progress="20"] .circle .fill.fix {
  transform: rotate(120deg);
}
.radial-progress[data-progress="21"] .circle .mask.full,
.radial-progress[data-progress="21"] .circle .fill {
  transform: rotate(63deg);
}
.radial-progress[data-progress="21"] .circle .fill.fix {
  transform: rotate(126deg);
}
.radial-progress[data-progress="22"] .circle .mask.full,
.radial-progress[data-progress="22"] .circle .fill {
  transform: rotate(66deg);
}
.radial-progress[data-progress="22"] .circle .fill.fix {
  transform: rotate(132deg);
}
.radial-progress[data-progress="23"] .circle .mask.full,
.radial-progress[data-progress="23"] .circle .fill {
  transform: rotate(69deg);
}
.radial-progress[data-progress="23"] .circle .fill.fix {
  transform: rotate(138deg);
}
.radial-progress[data-progress="24"] .circle .mask.full,
.radial-progress[data-progress="24"] .circle .fill {
  transform: rotate(72deg);
}
.radial-progress[data-progress="24"] .circle .fill.fix {
  transform: rotate(144deg);
}
.radial-progress[data-progress="25"] .circle .mask.full,
.radial-progress[data-progress="25"] .circle .fill {
  transform: rotate(75deg);
}
.radial-progress[data-progress="25"] .circle .fill.fix {
  transform: rotate(150deg);
}
.radial-progress[data-progress="26"] .circle .mask.full,
.radial-progress[data-progress="26"] .circle .fill {
  transform: rotate(78deg);
}
.radial-progress[data-progress="26"] .circle .fill.fix {
  transform: rotate(156deg);
}
.radial-progress[data-progress="27"] .circle .mask.full,
.radial-progress[data-progress="27"] .circle .fill {
  transform: rotate(81deg);
}
.radial-progress[data-progress="27"] .circle .fill.fix {
  transform: rotate(162deg);
}
.radial-progress[data-progress="28"] .circle .mask.full,
.radial-progress[data-progress="28"] .circle .fill {
  transform: rotate(84deg);
}
.radial-progress[data-progress="28"] .circle .fill.fix {
  transform: rotate(168deg);
}
.radial-progress[data-progress="29"] .circle .mask.full,
.radial-progress[data-progress="29"] .circle .fill {
  transform: rotate(87deg);
}
.radial-progress[data-progress="29"] .circle .fill.fix {
  transform: rotate(174deg);
}
.radial-progress[data-progress="30"] .circle .mask.full,
.radial-progress[data-progress="30"] .circle .fill {
  transform: rotate(90deg);
}
.radial-progress[data-progress="30"] .circle .fill.fix {
  transform: rotate(180deg);
}
.radial-progress[data-progress="31"] .circle .mask.full,
.radial-progress[data-progress="31"] .circle .fill {
  transform: rotate(93deg);
}
.radial-progress[data-progress="31"] .circle .fill.fix {
  transform: rotate(186deg);
}
.radial-progress[data-progress="32"] .circle .mask.full,
.radial-progress[data-progress="32"] .circle .fill {
  transform: rotate(96deg);
}
.radial-progress[data-progress="32"] .circle .fill.fix {
  transform: rotate(192deg);
}
.radial-progress[data-progress="33"] .circle .mask.full,
.radial-progress[data-progress="33"] .circle .fill {
  transform: rotate(99deg);
}
.radial-progress[data-progress="33"] .circle .fill.fix {
  transform: rotate(198deg);
}
.radial-progress[data-progress="34"] .circle .mask.full,
.radial-progress[data-progress="34"] .circle .fill {
  transform: rotate(102deg);
}
.radial-progress[data-progress="34"] .circle .fill.fix {
  transform: rotate(204deg);
}
.radial-progress[data-progress="35"] .circle .mask.full,
.radial-progress[data-progress="35"] .circle .fill {
  transform: rotate(105deg);
}
.radial-progress[data-progress="35"] .circle .fill.fix {
  transform: rotate(210deg);
}
.radial-progress[data-progress="36"] .circle .mask.full,
.radial-progress[data-progress="36"] .circle .fill {
  transform: rotate(108deg);
}
.radial-progress[data-progress="36"] .circle .fill.fix {
  transform: rotate(216deg);
}
.radial-progress[data-progress="37"] .circle .mask.full,
.radial-progress[data-progress="37"] .circle .fill {
  transform: rotate(111deg);
}
.radial-progress[data-progress="37"] .circle .fill.fix {
  transform: rotate(222deg);
}
.radial-progress[data-progress="38"] .circle .mask.full,
.radial-progress[data-progress="38"] .circle .fill {
  transform: rotate(114deg);
}
.radial-progress[data-progress="38"] .circle .fill.fix {
  transform: rotate(228deg);
}
.radial-progress[data-progress="39"] .circle .mask.full,
.radial-progress[data-progress="39"] .circle .fill {
  transform: rotate(117deg);
}
.radial-progress[data-progress="39"] .circle .fill.fix {
  transform: rotate(234deg);
}
.radial-progress[data-progress="40"] .circle .mask.full,
.radial-progress[data-progress="40"] .circle .fill {
  transform: rotate(120deg);
}
.radial-progress[data-progress="40"] .circle .fill.fix {
  transform: rotate(240deg);
}
.radial-progress[data-progress="41"] .circle .mask.full,
.radial-progress[data-progress="41"] .circle .fill {
  transform: rotate(123deg);
}
.radial-progress[data-progress="41"] .circle .fill.fix {
  transform: rotate(246deg);
}
.radial-progress[data-progress="42"] .circle .mask.full,
.radial-progress[data-progress="42"] .circle .fill {
  transform: rotate(126deg);
}
.radial-progress[data-progress="42"] .circle .fill.fix {
  transform: rotate(252deg);
}
.radial-progress[data-progress="43"] .circle .mask.full,
.radial-progress[data-progress="43"] .circle .fill {
  transform: rotate(129deg);
}
.radial-progress[data-progress="43"] .circle .fill.fix {
  transform: rotate(258deg);
}
.radial-progress[data-progress="44"] .circle .mask.full,
.radial-progress[data-progress="44"] .circle .fill {
  transform: rotate(132deg);
}
.radial-progress[data-progress="44"] .circle .fill.fix {
  transform: rotate(264deg);
}
.radial-progress[data-progress="45"] .circle .mask.full,
.radial-progress[data-progress="45"] .circle .fill {
  transform: rotate(135deg);
}
.radial-progress[data-progress="45"] .circle .fill.fix {
  transform: rotate(270deg);
}
.radial-progress[data-progress="46"] .circle .mask.full,
.radial-progress[data-progress="46"] .circle .fill {
  transform: rotate(138deg);
}
.radial-progress[data-progress="46"] .circle .fill.fix {
  transform: rotate(276deg);
}
.radial-progress[data-progress="47"] .circle .mask.full,
.radial-progress[data-progress="47"] .circle .fill {
  transform: rotate(141deg);
}
.radial-progress[data-progress="47"] .circle .fill.fix {
  transform: rotate(282deg);
}
.radial-progress[data-progress="48"] .circle .mask.full,
.radial-progress[data-progress="48"] .circle .fill {
  transform: rotate(144deg);
}
.radial-progress[data-progress="48"] .circle .fill.fix {
  transform: rotate(288deg);
}
.radial-progress[data-progress="49"] .circle .mask.full,
.radial-progress[data-progress="49"] .circle .fill {
  transform: rotate(147deg);
}
.radial-progress[data-progress="49"] .circle .fill.fix {
  transform: rotate(294deg);
}
.radial-progress[data-progress="50"] .circle .mask.full,
.radial-progress[data-progress="50"] .circle .fill {
  transform: rotate(150deg);
}
.radial-progress[data-progress="50"] .circle .fill.fix {
  transform: rotate(300deg);
}
.radial-progress[data-progress="51"] .circle .mask.full,
.radial-progress[data-progress="51"] .circle .fill {
  transform: rotate(153deg);
}
.radial-progress[data-progress="51"] .circle .fill.fix {
  transform: rotate(306deg);
}
.radial-progress[data-progress="52"] .circle .mask.full,
.radial-progress[data-progress="52"] .circle .fill {
  transform: rotate(156deg);
}
.radial-progress[data-progress="52"] .circle .fill.fix {
  transform: rotate(312deg);
}
.radial-progress[data-progress="53"] .circle .mask.full,
.radial-progress[data-progress="53"] .circle .fill {
  transform: rotate(159deg);
}
.radial-progress[data-progress="53"] .circle .fill.fix {
  transform: rotate(318deg);
}
.radial-progress[data-progress="54"] .circle .mask.full,
.radial-progress[data-progress="54"] .circle .fill {
  transform: rotate(162deg);
}
.radial-progress[data-progress="54"] .circle .fill.fix {
  transform: rotate(324deg);
}
.radial-progress[data-progress="55"] .circle .mask.full,
.radial-progress[data-progress="55"] .circle .fill {
  transform: rotate(165deg);
}
.radial-progress[data-progress="55"] .circle .fill.fix {
  transform: rotate(330deg);
}
.radial-progress[data-progress="56"] .circle .mask.full,
.radial-progress[data-progress="56"] .circle .fill {
  transform: rotate(168deg);
}
.radial-progress[data-progress="56"] .circle .fill.fix {
  transform: rotate(336deg);
}
.radial-progress[data-progress="57"] .circle .mask.full,
.radial-progress[data-progress="57"] .circle .fill {
  transform: rotate(171deg);
}
.radial-progress[data-progress="57"] .circle .fill.fix {
  transform: rotate(342deg);
}
.radial-progress[data-progress="58"] .circle .mask.full,
.radial-progress[data-progress="58"] .circle .fill {
  transform: rotate(174deg);
}
.radial-progress[data-progress="58"] .circle .fill.fix {
  transform: rotate(348deg);
}
.radial-progress[data-progress="59"] .circle .mask.full,
.radial-progress[data-progress="59"] .circle .fill {
  transform: rotate(177deg);
}
.radial-progress[data-progress="59"] .circle .fill.fix {
  transform: rotate(354deg);
}
.radial-progress[data-progress="60"] .circle .mask.full,
.radial-progress[data-progress="60"] .circle .fill {
  transform: rotate(180deg);
}
.radial-progress[data-progress="60"] .circle .fill.fix {
  transform: rotate(360deg);
}
</style>
`;
        $('body').append(styles);
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
label, .label,
button, .button,
#tabs, .tabs,
.unselectable {
    user-select: none;
}
.top-bar .searchbar .grid {
    display: flex;
}
.wmn1 {
    min-width: 8.1025641rem !important;
}
.w20 {
    width: 20% !important;
}
.top-bar .searchbar .s-select select {
    max-width: 140px;
}
.channels-page .search-channel-switcher-select {
    color: white;
}
.search-channel-switcher {
    height: 36px;
    border-radius: 3px !important;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    border-right: none !important;
    background-color: #eff0f1;
}
.search-channel-switcher-field {
    border-top-left-radius: 0 !important;
    border-bottom-left-radius: 0 !important;
}
.top-bar .searchbar .btn-topbar-primary {
    transition: none;
    opacity: 1;
    z-index: 1;
}
.alt-submit-button {
    position: absolute !important;
    width: 1px;
    height: 1px;
    padding: 0 !important;
    top: 0;
    right: 0;
    opacity: 0;
}

/* Hide duplicate search form on search results page */
#bigsearch {
    display: none !important;
}
/* Except help center search form */
#help-index #bigsearch {
    display: initial !important;
}
#help-index #bigsearch input[name=q] {
    width: 100%;
}

/* Quick filters */
#res-quickfilter {
    margin-top: -6px;
    margin-bottom: 23px;
}
#res-quickfilter .grid {
    display: inline-flex;
}
#res-quickfilter .is-selected {
    box-shadow: inset 1px 1px 2px 0px rgba(0,0,0,0.3);
}
#res-quickfilter a:first-child {
    border-bottom-right-radius: 0 !important;
    border-top-right-radius: 0 !important;
}
#res-quickfilter a + a {
    border-bottom-left-radius: 0 !important;
    border-top-left-radius: 0 !important;
    margin-left: -1px;
}

/* Other */
.s-btn-group .s-btn:last-of-type {
    border-top-right-radius: 3px !important;
    border-bottom-right-radius: 3px !important;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageLoad();
    listenToPageUpdates();

})();
