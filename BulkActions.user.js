// ==UserScript==
// @name         Bulk Actions
// @description  Functionality to multi-select and perform bulk actions on search results
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      0.1.2
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


(function() {
    'use strict';

    // Moderator check
    if(typeof StackExchange == "undefined" || !StackExchange.options || !StackExchange.options.user || !StackExchange.options.user.isModerator ) return;


    const fkey = StackExchange.options.user.fkey;
    let ajaxRequests = 0;


    // Delete individual post
    function deletePost(pid) {
        ajaxRequests++;

        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }

            $.post({
                url: `https://${location.hostname}/posts/${pid}/vote/10`,
                data: {
                    'fkey': fkey
                }
            })
            .fail(reject)
            .always(() => ajaxRequests--);
        });
    }
    // Delete posts
    function deletePosts(pids) {
        if(typeof pids === 'undefined' || pids.length === 0) return;
        pids.forEach(v => deletePost(v));
    }


    // Undelete individual post
    function undeletePost(pid) {
        ajaxRequests++;

        return new Promise(function(resolve, reject) {
            if(typeof pid === 'undefined' || pid === null) { reject(); return; }

            $.post({
                url: `https://${location.hostname}/posts/${pid}/vote/11`,
                data: {
                    'fkey': fkey
                }
            })
            .fail(reject)
            .always(() => ajaxRequests--);
        });
    }
    // Undelete posts
    function undeletePosts(pids) {
        if(typeof pids === 'undefined' || pids.length === 0) return;
        pids.forEach(v => undeletePost(v));
    }


    function initBulkAction() {

        const resultsContainer = $('.js-search-results');
        const resultsHeader = resultsContainer.prev().children().first().addClass('results-header');
        const results = resultsContainer.children('.search-result');
        if(resultsContainer.length == 0 || resultsHeader.length == 0 || results.length == 0) return;

        // Add checkboxes
        resultsHeader.prepend(`<input type="checkbox" id="select-all" title="Select all" />`);
        results.each(function() {
            const link = $(this).find('.result-link a');
            const isQuestion = link.text().trim().indexOf('A:') === 0;
            const pid = link.attr('href').match(/\d+/g).reverse()[0];
            $(this).prepend(`<input type="checkbox" class="selected-post" value="${pid}" />`);
        });

        // Checkbox toggle
        const boxes = $('.selected-post');
        $('#select-all').change(function() {
            boxes.prop('checked', this.checked).trigger('change');
        });

        // Individual checkbox toggle
        results.on('change', '.selected-post', function() {
            $(this).parent().toggleClass('multiselect-itemselected', this.checked);

            // Count and toggle action buttons
            $('.action-btn').toggleClass('show', boxes.filter(':checked').length > 0);
        });

        // Action buttons
        $(`<input type="button" class="action-btn" value="Delete" />`)
            .appendTo(resultsHeader)
            .click(function() {
                let selPostIds = $('.selected-post').filter(':checked').map((i, v) => v.value).get();
                if(selPostIds.length === 0) {
                    alert('No posts selected!');
                    return false;
                }
                else if(!confirm('Delete all selected posts!?')) {
                    return false;
                }
                $('.action-btn').remove();
                deletePosts(selPostIds);
                reloadWhenDone();
            });

        $(`<input type="button" class="action-btn" value="Undelete" />`)
            .appendTo(resultsHeader)
            .click(function() {
                let selPostIds = $('.selected-post').filter(':checked').map((i, v) => v.value).get();
                if(selPostIds.length === 0) {
                    alert('No posts selected!');
                    return false;
                }
                else if(!confirm('Undelete all selected posts!?')) {
                    return false;
                }
                $('.action-btn').remove();
                undeletePosts(selPostIds);
                reloadWhenDone();
            });
    }


    function doPageLoad() {

        // If on search results page with results
        if(location.pathname.includes('/search')) {
            initBulkAction();
        }
    }


    function reloadWhenDone() {

        // Triggers when all ajax requests have completed
        $(document).ajaxStop(function() {
            location.reload(true);
        });
    }


    function appendStyles() {

        const styles = `
<style>
.results-header {
    position: relative;
    min-height: 44px;
    line-height: 42px;
}
.results-header input.action-btn {
    display: none;
    font-size: 1rem;
    margin-right: 0;
    margin-left: 10px;
}
.results-header input.action-btn.show {
    display: inline-block;
}
.action-btn {
    margin-right: 10px;
}
.results-header #select-all {
    position: absolute;
    top: 6px;
    left: -22px;
    width: 16px;
    height: 16px;
    z-index: 1;
    cursor: pointer;
}

.search-result {
    position: relative;
}
.search-result.multiselect-itemselected {
    box-shadow: inset 0 0 0 2px #C00;
}
.search-result:hover .selected-post,
.search-result.multiselect-itemselected .selected-post {
    opacity: 1;
}
.search-result .selected-post {
    position: absolute;
    top: 2px;
    left: 2px;
    margin: 0;
    width: 16px;
    height: 16px;
    z-index: 1;
    cursor: pointer;
    opacity: 0;
}
</style>
`;
        $('body').append(styles);
    }


    // On page load
    appendStyles();
    doPageLoad();

})();
