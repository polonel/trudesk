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

define([
  'angular',
  'underscore',
  'jquery',
  'modules/helpers',
  'uikit',
  'qrcode',
  'history',
  'angularjs/services/session'
], function (angular, _, $, helpers, UIKit) {
  return angular
    .module('trudesk.controllers.profile', ['trudesk.services.session'])
    .controller('profileCtrl', function (SessionService, $scope, $window, $http, $log, $timeout) {
      $scope.init = function () {
        // Fix Inputs if input is preloaded with a value
        fixInputLabels()
      }

      function fixInputLabels () {
        $timeout(function () {
          $('input.md-input').each(function () {
            var vm = this
            var self = $(vm)
            if (!_.isEmpty(self.val())) {
              var s = self.parent('.md-input-wrapper')
              if (s.length > 0) {
                s.addClass('md-input-filled')
              }
            }
          })
        }, 0)
      }

      $scope.updateUser = function ($event) {
        $event.preventDefault()

        var id = $('div[data-user_id]').attr('data-user_id')
        if (_.isUndefined(id)) return
        var data = getFormData()

        $http
          .put('/api/v1/users/' + data.username, {
            aId: id,
            aFullname: data.fullname,
            aPass: data.password,
            aPassConfirm: data.cPassword,
            aEmail: data.email,

            saveGroups: false
          })
          .success(function () {
            resetForm()
            helpers.UI.showSnackbar({
              text: 'Profile Successfully Saved',
              textColor: '#f8f8f2'
            })
          })
          .error(function (e) {
            $log.log('[trudesk:profile:updateUser] - ' + e.error.message)
            helpers.UI.showSnackbar('Error ' + e.error.message, true)
          })
      }

      $scope.showTour = function () {
        var username = SessionService.getUser().username
        $http
          .put('/api/v1/users/' + username + '/updatepreferences', {
            preference: 'tourCompleted',
            value: false
          })
          .success(function () {
            $window.location.href = '/'
          })
          .error(function (e) {
            $log.log('[trudesk:profile:showTour] - ' + e.error.message)
            helpers.UI.showSnackbar('Error ' + e.error.message, true)
          })
      }

      $scope.back = function ($event) {
        History.go(-1)
        $event.preventDefault()
      }

      $scope.generateApiKey = function ($event) {
        $event.preventDefault()

        var id = $('div[data-user_id]').attr('data-user_id')
        if (_.isUndefined(id)) return

        $http
          .post('/api/v1/users/' + id + '/generateapikey')
          .success(function (tokenJson) {
            $('#aApiKey').val(tokenJson.token)
            $('.removeApiButton').removeClass('hide')
            $('.generateApiButton').addClass('hide')
            // helpers.showFlash('API Key Successfully Generated');
            helpers.UI.showSnackbar('API Key Successfully Generated', false)
          })
          .error(function (e) {
            $log.log('[trudesk:profile:generateApiKey] - ' + e)
            // helpers.showFlash('Error: ' + e, true);
            helpers.UI.showSnackbar('Error: Unable to generate API Key!', true)
          })
      }

      $scope.removeApiKey = function ($event) {
        $event.preventDefault()

        var id = $('div[data-user_id]').attr('data-user_id')
        if (_.isUndefined(id)) return

        $http
          .post('/api/v1/users/' + id + '/removeapikey')
          .success(function () {
            $('#aApiKey').val('')
            $('.generateApiButton').removeClass('hide')
            $('.removeApiButton').addClass('hide')
            helpers.UI.showSnackbar('API Key Successfully Revoked', false)
          })
          .error(function (e) {
            $log.log('[trudesk:profile:removeApiKey]', e)
            helpers.UI.showSnackbar('Error: Unable to remove API Key!', true)
          })
      }

      $scope.otpChange = function (event) {
        var $totpSettings = $('.totp-settings-wrap')
        var $totpPanel = $totpSettings.find('.panel-body2')
        var $tOTPKey = $totpSettings.find('#tOTPKey')
        var $qrCode = $totpSettings.find('#totp-qrcode')
        event.preventDefault()

        if ($scope.otpEnabled) {
          UIKit.modal.confirm(
            '<span style="font-size: 16px; color: #FF9800;">WARNING: Disabling Two Factor Authentication will remove your shared secret. A new key will generate when re-enabled.</span><br />' +
              'Are you sure you want to disable two factor authentication?',
            function () {
              removeL2Auth(function (err) {
                if (err) {
                  $log.error(err)
                }

                angular.element(event.target).attr('checked', false)
                $totpPanel.slideUp(400, function () {
                  $totpPanel.css({ overflow: 'hidden', margin: 0 })
                  $qrCode.find('canvas').remove()
                  $tOTPKey.val()
                  $timeout(function () {
                    $scope.otpEnabled = false
                  }, 0)
                })
              })
            },
            {
              labels: { Ok: 'Yes', Cancel: 'No' }
            }
          )
        } else {
          generateL2Auth(function (err, key) {
            if (err) {
              $log.error(err)
              helpers.UI.showSnackbar('An unknown error occurred. Check console.', true)
              return
            }

            $timeout(function () {
              $scope.otpEnabled = true
              angular.element(event.target).prop('checked', true)
            }, 0)

            var host = $('div[data-host]').attr('data-host')
            var username = SessionService.getUser().username
            var qrKey =
              'otpauth://totp/' +
              host +
              '-' +
              username +
              ':' +
              host +
              '-' +
              username +
              '?secret=' +
              key +
              '&issuer=Trudesk'
            $qrCode.qrcode({ width: 242, height: 242, text: qrKey })
            $tOTPKey.val(key)
            $totpPanel.css({ margin: '10px 7px 7px 7px' })
            $totpPanel.find('input').removeClass('hide')
            $totpPanel.removeClass('hide')
            fixInputLabels()
            $totpPanel.slideDown()
            // }
          })
        }
      }

      function generateL2Auth (completed) {
        var id = SessionService.getUser()._id
        if (_.isUndefined(id)) {
          return helpers.UI.showSnackbar('Unable to get user ID.', true)
        }

        $http.post('/api/v1/users/' + id + '/generatel2auth').then(
          function success (response) {
            if (!response.data.success) {
              helpers.UI.showSnackbar('Error: Unknown error has occurred.', true)
              if (_.isFunction(completed)) {
                return completed('Error: Unknown error has occurred.')
              }
            } else {
              // Success
              if (_.isFunction(completed)) {
                completed(null, response.data.generatedKey)
              }
            }
          },
          function error (err) {
            $log.error('[trudesk:profile:generateL2Auth]')
            $log.error(err)
            helpers.UI.showSnackbar('Error: Could not generate new secret! Check Console', true)
            if (_.isFunction(completed)) {
              completed(err)
            }
          }
        )
      }

      function removeL2Auth (completed) {
        var id = SessionService.getUser()._id
        if (_.isUndefined(id)) {
          return helpers.UI.showSnackbar('Unable to get user ID.', true)
        }

        $http
          .post('/api/v1/users/' + id + '/removel2auth')
          .success(function () {
            if (_.isFunction(completed)) {
              completed()
            }
          })
          .error(function (e) {
            $log.error('[trudesk:profile:removeL2Auth]')
            $log.error(e)
            helpers.UI.showSnackbar('Error: Could not remove. Check Console', true)
            if (_.isFunction(completed)) {
              completed(e)
            }
          })
      }

      function getFormData () {
        var data = {}
        data.username = $('#aUsername').val()
        data.fullname = $('#aFullname').val()
        data.password = $('#aPass').val()
        data.cPassword = $('#aPassConfirm').val()
        data.email = $('#aEmail').val()

        return data
      }

      function resetForm () {
        $('#aPass').val('')
        $('#aPassConfirm').val('')
      }
    })
})
