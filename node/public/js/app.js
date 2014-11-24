require(['config', 'jquery', 'modules/helpers'], function(config, $, helpers) {
    helpers.init();

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