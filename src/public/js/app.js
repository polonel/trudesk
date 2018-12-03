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

//Load SASS (Webpack)
// require('../../sass/app.sass');

require(['jquery', 'modules/helpers', 'angular', 'sessionLoader'], function($, helpers, angular) {
    helpers.init();

    angular.element(document).ready(function() {
        // Call the Session service before bootstrapping.
        // Allowing the SessionUser to be populated before the controllers have access.
        angular.injector(['ng', 'sessionLoader']).get('SessionService').init(function(err) {
            if (err)
                throw new Error(err);

            require(['angularjs/main'], function() {
                //Static Bootstraps
                angular.bootstrap($('.top-bar'), ['trudesk']);
                angular.bootstrap($('#ticketFilterModal'), ['trudesk']);
                angular.bootstrap($('#ticketCreateModal'), ['trudesk']);

                //Dynamic Bootstrap
                angular.bootstrap($('#page-content'), ['trudesk']);


                require([
                    'underscore',
                    'modules/navigation',
                    'modules/socket',
                    'uikit',
                    'modules/ajaxify',
                    'modernizr',
                    'fastclick',
                    'placeholder',
                    'pace',
                    'easypiechart',
                    'idletimer'

                ], function(_, nav, socket) {
                    //Page loading (init)
                    require(['pages/pageloader'], function(pl) {
                        pl.init(function() {
                            nav.init();

                            var $event = _.debounce(function() {
                                helpers.hideLoader(1000);
                                helpers.countUpMe();
                                helpers.UI.cardShow();

                                //5min idle timer
                                var idleTime = 5 * 60 * 1000;

                                $(document).idleTimer(idleTime);
                                $(document).on('idle.idleTimer', function() {
                                    socket.chat.setUserIdle();
                                });

                                $(document).on('active.idleTimer', function() {
                                    socket.chat.setUserActive();
                                });

                                $.event.trigger('$trudesk:ready', window);

                            }, 100);

                            $event();
                        });
                    });
                });
            });
        });
    });
});
