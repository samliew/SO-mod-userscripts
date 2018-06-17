// ==UserScript==
// @name         Refresh Empty Mod Queue
// @description  If current mod queue is empty, reload page occasionally
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0
//
// @include      */admin/dashboard*
// ==/UserScript==

(function() {
    'use strict';

    const timeoutSecs = 15;
    const goToMain = () => location.href = '/admin/dashboard';
    const reloadPage = () => location.reload(true);


    function doPageload() {

        // If completely no post flags, redirect to main
        if($('.so-flag, .m-flag, .c-flag').length === 0) {
            setTimeout(goToMain, timeoutSecs * 1000);
        }

        // Otherwise refresh if no flags in current queue
        else if($('.flagged-posts.moderator').children().length === 0) {
            setTimeout(reloadPage, timeoutSecs * 1000);
        }
    }


    // On page load
    doPageload();

})();
