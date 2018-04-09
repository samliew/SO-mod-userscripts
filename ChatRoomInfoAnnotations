// ==UserScript==
// @name         Chat room general annotations
// @description  Display users' annotations in chat room info (first 10 users only)
// @match        https://chat.stackoverflow.com/rooms/info/*
// @match        https://chat.stackexchange.com/rooms/info/*
// @author       @samliew
// ==/UserScript==

(function() {
    'use strict';

    // Solution from https://stackoverflow.com/a/24719409/584192
    function jQueryXhrOverride() {
        // Get new xhr object using default factory
        var xhr = jQuery.ajaxSettings.xhr();
        // Copy the browser's native setRequestHeader method
        var setRequestHeader = xhr.setRequestHeader;
        // Replace with a wrapper
        xhr.setRequestHeader = function(name, value) {
            // Ignore the X-Requested-With header
            if (name == 'X-Requested-With') return;
            // Otherwise call the native setRequestHeader method
            // Note: setRequestHeader requires its 'this' to be the xhr object,
            // which is what 'this' is here when executed.
            setRequestHeader.call(this, name, value);
        };
        // pass it on to jQuery
        return xhr;
    }

    function doPageload() {

        $('#room-usercards-container').find('.usercard').slice(0, 10).each(function() {

            // Ignore mods
            //var modFlair = $(this).next('.mod-flair');
            //if(modFlair.length) return;

            // Grab annotation acount from user page
            var uid = $(this).attr('id').match(/\d+/);
            var domResult = $.ajax({
                url: 'https://chat.stackoverflow.com/admin/annotations/' + uid,
                xhr: jQueryXhrOverride,
                success: function(data) {

                    var domResult = $('<span/>').html(data);
                    var numAnno = domResult.find('li b').filter((i,e) => e.innerText.indexOf('Annotation') > -1).length;
                    var numSusp = domResult.find('li b').filter((i,e) => e.innerText.indexOf('Suspension') > -1).length;
                    if(numAnno + numSusp === 0) return;

                    var $annoElem = $('<div id="annotation-count" title="This user has '+numAnno+' moderator annotations and has been suspended '+numSusp+' times"><a href="/admin/annotations/'+uid+'">'+(numAnno+numSusp)+'</a></div>');
                    $('#user-'+uid).prepend($annoElem);
                }
            });

        });
    }

    function appendStyles() {

        var styles = `
<style>
#annotation-count {
    transform: scale3d(0.9,0.9,1);
}
</style>
`;
        $('body').append(styles);
    }

    // On page load
    doPageload();
    appendStyles();

})();
