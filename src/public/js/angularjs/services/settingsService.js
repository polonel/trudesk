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

define(['angular'], function (angular) {
  angular.module('trudesk.services.settings', []).factory('SettingsService', function ($window, $http) {
    var SettingsService

    var settings = null

    SettingsService = (function () {
      SettingsService = function () {}

      SettingsService.prototype.init = function (callback) {
        if (settings === null || angular.isUndefined(settings)) {
          $http
            .get('/api/v1/settings')
            .success(function (data) {
              settings = data.settings.data.settings

              if (angular.isFunction(callback)) {
                return callback(null, settings)
              }
            })
            .error(function (error) {
              if (angular.isFunction(callback)) {
                return callback(error, null)
              }
            })
        }
      }

      SettingsService.prototype.getSettings = function () {
        return settings
      }

      return SettingsService
    })()

    if (angular.isUndefined($window.trudeskSettingsService) || $window.trudeskSettingsService === null) {
      $window.trudeskSettingsService = new SettingsService()
    }

    return $window.trudeskSettingsService
  })
})
