// ==UserScript==
// @name         Not An Answer Flag Queue Helper
// @description  Sorts NAA posts by poster rep
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.0
//
// @match        */admin/dashboard?flagtype=answernotananswer*
// ==/UserScript==

(function() {
    'use strict';

    function doPageLoad() {

        var $tbody = $('.flagged-post-row').first().parent();

        // Sort flags
        var $posts = $('.flagged-post-row')
            .sort(function(a, b) {
                var aRep = Number($(a).find('.reputation-score').text().replace(/[^\d.]/g, '')),
                    bRep = Number($(b).find('.reputation-score').text().replace(/[^\d.]/g, ''));
                if(aRep % 1 > 0) aRep *= 1000;
                if(bRep % 1 > 0) bRep *= 1000;

                if(aRep == bRep) return 0;
                return (aRep > bRep) ? 1 : -1;
            });
        $posts.detach().appendTo($tbody);
    }

    // On page load
    doPageLoad();

})();
