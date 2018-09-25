// ==UserScript==
// @name         Comment Flag Type Colours
// @description  Background colours for each comment flag type
// @homepage     https://github.com/samliew/SO-mod-userscripts
// @author       @samliew
// @version      1.1
//
// @include      https://*stackoverflow.com/admin/dashboard?flag*=comment*
// @include      https://*serverfault.com/admin/dashboard?flag*=comment*
// @include      https://*superuser.com/admin/dashboard?flag*=comment*
// @include      https://*askubuntu.com/admin/dashboard?flag*=comment*
// @include      https://*mathoverflow.net/admin/dashboard?flag*=comment*
// @include      https://*.stackexchange.com/admin/dashboard?flag*=comment*
//
// @include      https://*stackoverflow.com/users/flag-summary/*?group=4*
// @include      https://*serverfault.com/users/flag-summary/*?group=4*
// @include      https://*superuser.com/users/flag-summary/*?group=4*
// @include      https://*askubuntu.com/users/flag-summary/*?group=4*
// @include      https://*mathoverflow.net/users/flag-summary/*?group=4*
// @include      https://*.stackexchange.com/users/flag-summary/*?group=4*
//
// @include      https://*stackoverflow.com/admin/users/*/post-comments*
// @include      https://*serverfault.com/admin/users/*/post-comments*
// @include      https://*superuser.com/admin/users/*/post-comments*
// @include      https://*askubuntu.com/admin/users/*/post-comments*
// @include      https://*mathoverflow.net/admin/users/*/post-comments*
// @include      https://*.stackexchange.com/admin/users/*/post-comments*
//
// @include      */posts*/timeline*
//
// @exclude      */admin/dashboard?flagtype=commenttoomanydeletedrudenotconstructiveauto*
// ==/UserScript==

(function() {
    'use strict';


    function doPageload() {

        // Path /post-comments
        if(location.pathname.indexOf('/post-comments') > 0) {

            // wrap comment type text with .revision-comment span
            $('.deleted-info').html((i, html) => html.replace(/span>\s*([a-z]+(\s[a-z]+)*)\s/i, `><span class="revision-comment">$1</span> `));
        }

        // On Post Timelines, highlight differently
        if(/^\/posts\/\d+\/timeline.*/.test(location.pathname)) {

            $('.event-verb span').each(function(i, el) {
                let cls = '';
                el.innerText = el.innerText.trim();
                switch(el.innerText.toLowerCase()) {
                    case 'rude or offensive':
                    case 'harassment, bigotry, or abuse':
                        cls = 'ctype-bad';
                        break;
                    case 'commentunwelcoming':
                    case 'unwelcoming':
                        cls = 'ctype-poor';
                        break;
                    case 'commentnolongerneeded':
                    case 'nolongerneeded':
                        cls = 'ctype-meh';
                        break;
                    case 'commentother':
                    case 'other':
                        cls = 'ctype-custom';
                        break;
                }
                if(cls !== '') el.classList.add(cls);

                if(cls == 'ctype-custom') {
                    $(el).closest('.event-verb').siblings('.event-comment').find('span').addClass('ctype-custom');
                }
            });

            return false;
        }

        // all other included pages
        $('.revision-comment').each(function(i, el) {
            let cls = 'ctype-custom';
            el.innerText = el.innerText.trim();
            switch(el.innerText.toLowerCase()) {
                case 'rude or offensive':
                case 'harassment, bigotry, or abuse':
                    cls = 'ctype-bad';
                    break;
                case 'unfriendly or unkind':
                case 'unwelcoming':
                    cls = 'ctype-poor';
                    break;
                case 'no longer needed':
                case 'not relevant':
                case 'not constructive':
                case 'obsolete':
                case 'not constructive or off topic':
                case 'too chatty':
                    cls = 'ctype-meh';
                    break;
            }
            el.classList.add(cls);

            if(cls == 'ctype-custom') {
                $(el).parents('.deleted-info').next('.flag-other-text').addClass('revision-comment ctype-custom');
            }
        });
    }


    function appendStyles() {

        const styles = `
<style>
.ctype-custom,
.ctype-bad,
.ctype-poor,
.ctype-meh {
    display: inline;
    padding: 2px 5px 3px !important;
    line-height: 1;
    font-size: 10px;
    font-style: normal;
    border-radius: 2px;
    color: white;
}
.ctype-custom {
    font-size: 1em;
    background-color: #ffc;
    color: black;
}
.ctype-bad {
    background-color: #ff2600;
}
.ctype-poor {
    background-color: #ff9300;
}
.ctype-meh {
    background-color: #999;
}
.comment-flag-off {
    color: #666;
}
</style>
`;
        $('body').append(styles);
    }


    appendStyles();
    doPageload();

})();
