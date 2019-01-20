/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    1/20/19 4:43 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

define(['angular'], function(angular) {
    angular.module('trudesk.services.session', [])
        .factory('SessionService', function($window, $http) {
            var SessionService;

            var sessionUser = null;

            SessionService = (function() {
                SessionService = function() {

                };

                SessionService.prototype.init = function(callback) {
                    if (sessionUser === null || angular.isUndefined(sessionUser)) {
                        $http.get('/api/v1/login')
                            .success(function(data) {
                                sessionUser = data.user;

                                if (angular.isFunction(callback))
                                    return callback(null, sessionUser);
                            }).error(function(error) {
                                if (angular.isFunction(callback))
                                    return callback(error, null);
                        });
                    }
                };

                SessionService.prototype.getUser = function() { return sessionUser; };

                return SessionService;
            }());

            if (angular.isUndefined($window.trudeskSessionService) || $window.trudeskSessionService === null) 
                $window.trudeskSessionService = new SessionService();
            

            return $window.trudeskSessionService;
        });
});

