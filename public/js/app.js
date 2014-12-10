//http://code.angularjs.org/1.2.1/docs/guide/bootstrap#overview_deferred-bootstrap
//window.name = "NG_DEFER_BOOTSTRAP!";

require(['config', 'jquery', 'modules/helpers', 'angular', 'angularjs/main'], function(config, $, helpers, angular) {
    helpers.init();

    //Resume loading once Angular Modules are loaded!
    //var $html = angular.element(document.getElementsByName('html')[0]);
    var $ele = $('#page-content');
    angular.element(document).ready(function() {
        angular.bootstrap($ele, ['trudesk']);
    });

    require([
        'modules/navigation',
        'modules/socket',
        'modules/ajaxify',
        'modernizr',
        'fastclick',
        'placeholder',
        'foundation',
        'nicescroll',
        'easypiechart'

    ], function(nav, socket) {
        //Start App
        $(document).foundation({
            abide: {
                patterns: {
                    is5Long: /.{5,}/
                }
            }
        });

        nav.init();
        helpers.fadeOutLoader(300);
    });
});