/**
      .                              .o8                     oooo
   .o8                             "888                     `888
 .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
   888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
   888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
   888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
   "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 ========================================================================
 Created:    02/10/2015
 Author:     Chris Brame

 **/

//http://code.angularjs.org/1.2.1/docs/guide/bootstrap#overview_deferred-bootstrap
//window.name = "NG_DEFER_BOOTSTRAP!";

require(['config', 'jquery', 'modules/helpers', 'angular', 'angularjs/main'], function(config, $, helpers, angular) {
    helpers.init();

    angular.element(document).ready(function() {
        //Static Bootstraps
        angular.bootstrap($('.top-bar'), ['trudesk']);
        angular.bootstrap($('#ticketFilterModal'), ['trudesk']);
        angular.bootstrap($('#ticketCreateModal'), ['trudesk']);

        //Dynamic Bootstrap
        angular.bootstrap($('#page-content'), ['trudesk']);
    });

    require([
        'underscore',
        'modules/navigation',
        'modules/enjoyhint',
        'uikit',
        'modules/socket',
        'modules/ajaxify',
        'modernizr',
        'fastclick',
        'placeholder',
        'pace',
        'nicescroll',
        'easypiechart'

    ], function(_, nav, eh) {
        //Page loading (init)
        require(['pages/pageloader'], function(pl) { pl.init(); });

        nav.init();

        var $event = _.debounce(function() {
            helpers.hideLoader(1000);
            helpers.countUpMe();
            helpers.UI.cardShow();

            $.event.trigger('$trudesk:ready');
        }, 100);

        $event();
    });
});
