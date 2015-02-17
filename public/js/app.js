//http://code.angularjs.org/1.2.1/docs/guide/bootstrap#overview_deferred-bootstrap
//window.name = "NG_DEFER_BOOTSTRAP!";

require(['config', 'jquery', 'modules/helpers', 'angular', 'angularjs/main'], function(config, $, helpers, angular) {
    helpers.init();

    angular.element(document).ready(function() {
        //Static Bootstraps
        angular.bootstrap($('.top-bar'), ['trudesk']);

        //Dynamic Bootstrap
        angular.bootstrap($('#page-content'), ['trudesk']);
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

    ], function(nav) {
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
