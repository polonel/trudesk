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

define(['angular', 'async'], function (angular, async) {
  angular.module('trudesk.services.session', []).factory('SessionService', function ($window, $http, $log) {
    var SessionService

    SessionService = function () {
      var sessionUser = null
      var groups = null
      var roles = null
      var roleOrder = null

      SessionService.prototype.init = function (callback) {
        async.series(
          {
            user: function (done) {
              if (sessionUser === null || angular.isUndefined(sessionUser)) {
                $http
                  .get('/api/v1/login')
                  .success(function (data) {
                    sessionUser = data.user

                    return done(null, sessionUser)
                  })
                  .error(function (error) {
                    return done(error, null)
                  })
              } else return done()
            },
            groups: function (done) {
              if (groups !== null && angular.isUndefined(groups)) return done()

              $http
                .get('/api/v1/users/' + sessionUser.username + '/groups')
                .success(function (data) {
                  groups = data.groups
                  sessionUser.groups = groups

                  return done(null, groups)
                })
                .error(function (err) {
                  return done(err, null)
                })
            },
            roles: function (done) {
              if (roles !== null && angular.isUndefined(roles)) return done()

              $http
                .get('/api/v1/roles')
                .success(function (data) {
                  roles = data.roles
                  roleOrder = data.roleOrder

                  return done(null, roles)
                })
                .error(function (error) {
                  return done(error, null)
                })
            }
          },
          function (e, o) {
            if (e) $log.error(e)
            if (angular.isFunction(callback)) callback(e, o)
          }
        )
      }

      SessionService.prototype.flushRoles = function (callback) {
        $http
          .get('/api/v1/roles')
          .success(function (data) {
            roles = data.roles
            roleOrder = data.roleorder

            if (angular.isFunction(callback)) return callback(null, roles)
          })
          .error(function (error) {
            $log.error(error)
            if (angular.isFunction(callback)) return callback(error, null)
          })
      }

      SessionService.prototype.getUser = function () {
        return sessionUser
      }
      SessionService.prototype.getRoles = function () {
        return roles
      }
      SessionService.prototype.getRoleOrder = function () {
        return roleOrder
      }
    }

    if (angular.isUndefined($window.trudeskSessionService) || $window.trudeskSessionService === null)
      $window.trudeskSessionService = new SessionService()

    return $window.trudeskSessionService
  })
})
