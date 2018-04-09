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
        var xhr = jQuery.ajaxSettings.xhr();
        var setRequestHeader = xhr.setRequestHeader;
        xhr.setRequestHeader = function(name, value) {
            if (name == 'X-Requested-With') return;
            setRequestHeader.call(this, name, value);
        };
        return xhr;
    };

    function doPageload() {

        $('#room-usercards-container').find('.usercard').slice(0, 10).each(function() {

            // Ignore mods
            var modFlair = $(this).find('.moderator');
            if(modFlair.length) return;

            // Grab annotation acount from user page
            var uid = $(this).attr('id').match(/\d+/);
            $.ajax({
                url: 'https://chat.stackoverflow.com/admin/annotations/' + uid,
                xhr: jQueryXhrOverride,
                success: function(data) {

                    // Parse user page
                    var annotlist = $('#annotlist', data);
                    var annotations = $('li > b:first', annotlist);
                    var numAnno = annotations.filter((i,e) => e.innerText.indexOf('Annotation') > -1).length;
                    var numSusp = annotations.filter((i,e) => e.innerText.indexOf('Suspension') > -1).length;
                    
                    // Add annotation count
                    if(numAnno + numSusp > 0) {
                        $('<div id="annotation-count" title="This user has ' + numAnno + ' moderator annotations and has been suspended ' + numSusp + ' times"><a href="/admin/annotations/' + uid + '">' + (numAnno + numSusp) + '</a></div>');
                            .prependTo('#user-'+uid);
                    }
                }
            });

        });
    };

    function appendStyles() {

        var styles = `
<style>
#annotation-count {
    transform: scale3d(0.9,0.9,1);
}
</style>
`;
        $('body').append(styles);
    };

    // On page load
    doPageload();
    appendStyles();

})();
