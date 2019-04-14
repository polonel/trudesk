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

define(['angular', 'underscore', 'jquery', 'modules/helpers', 'history'], function (angular, _, $, helpers) {
  return angular
    .module('trudesk.controllers.plugins', [])
    .controller('pluginsCtrl', function ($scope, $http, $log, $timeout, $window) {
      var $tableBody = $('#plugin_list_table > tbody')

      $scope.installedPlugins = []

      var pluginUrl = 'http://_plugins.trudesk.io'

      $scope.init = function () {
        $scope.installedPlugins = angular.fromJson($scope.installedPlugins)
        $http({
          method: 'GET',
          url: pluginUrl + '/api/plugins',
          headers: { 'Content-Type': 'apllication/json' }
        })
          .success(function (data) {
            if (!data.success) {
              if (data.error) {
                helpers.UI.showSnackbar({
                  text: 'Error: ' + data.error,
                  actionTextColor: '#B92929'
                })
                return
              }

              helpers.UI.showSnackbar({
                text: 'Error getting plugin list!',
                actionTextColor: '#B92929'
              })
            }

            var plugins = _.sortBy(data.plugins, 'name')
            $tableBody.children().remove()
            var html = ''

            _.each(plugins, function (p) {
              var description = 'No Description Set'
              if (p.pluginjson.description) description = p.pluginjson.description

              var loadedPlugin = _.findWhere($scope.installedPlugins, {
                name: p.name
              })
              var hasPluginInstalled = angular.isDefined(loadedPlugin)
              var update = false
              if (hasPluginInstalled) {
                update = compareVersions(loadedPlugin.version, '<', p.pluginjson.version)
              }
              var canUserManage = helpers.canUser('plugins:manage')

              html += '<tr data-plugin-id="' + p._id + '" data-plugin-name="' + p.name.toLowerCase() + '">'
              html += '<td style="vertical-align: middle;">' + p.name.toLowerCase() + '</td>'
              html += '<td style="vertical-align: middle;">' + description + '</td>'
              html += '<td style="vertical-align: middle;">' + p.pluginjson.version + '</td>'
              if (canUserManage) {
                if (hasPluginInstalled) {
                  html +=
                    '<td style="text-align: right;"><button class="uk-button uk-button-danger uk-button-small" ng-click="removePlugin(\'' +
                    p._id +
                    '\')">Remove</button>'
                  if (update) {
                    html +=
                      '<button class="uk-button uk-button-primary uk-button-small" style="margin-left: 5px;" ng-click="installPlugin(\'' +
                      p._id +
                      '\')">Update</button>'
                  }
                  html += '</td>'
                } else {
                  html +=
                    '<td style="text-align: right;"><button class="uk-button uk-button-success uk-button-small" ng-click="installPlugin(\'' +
                    p._id +
                    '\')">Install</button></td>'
                }
              } else {
                html += '<td></td>'
              }

              html += '</tr>'
            })

            var $injector = angular.injector(['ng', 'trudesk'])
            $injector.invoke([
              '$compile',
              '$rootScope',
              function ($compile, $rootScope) {
                var $scope = $tableBody.append(html).scope()
                $compile($tableBody)($scope || $rootScope)
                $rootScope.$digest()
              }
            ])
          })
          .error(function (err) {
            if (err) {
              $log.error('[trudesk:plugins:init] - ' + err.error.message)
              helpers.UI.showSnackbar({
                text: 'Error: ' + err.error.message,
                actionTextColor: '#B92929'
              })
            }

            var html =
              '<tr style="background: #B92929 !important;"><td style="color: #fff;">Unable to load plugin list!</td><td></td><td></td><td></td></tr>'

            $tableBody.children().remove()
            $tableBody.append(html)
          })
      }

      $scope.installPlugin = function (pluginId) {
        $http({
          url: '/api/v1/plugins/install/' + pluginId,
          method: 'GET',
          headers: { 'Content-Type': 'apllication/json' }
        })
          .success(function (data) {
            if (!data.success) {
              if (data.error) {
                helpers.UI.showSnackbar({
                  text: 'Error: ' + data.error,
                  actionTextColor: '#B92929'
                })
                return
              }

              helpers.UI.showSnackbar({
                text: 'Error installing plugin!',
                actionTextColor: '#B92929'
              })
            }

            // Real Success
            helpers.UI.showSnackbar({
              text: 'Installed Plugin. Restarting Server...'
            })
            $('#serverRestarting').removeClass('hide')
            $timeout(function () {
              $window.location.reload()
            }, 5000)
          })
          .error(function (err) {
            if (err) {
              $log.error('[trudesk:plugins:installPlugin] - ' + err.error.message)
              helpers.UI.showSnackbar({
                text: 'Error: ' + err.error.message,
                actionTextColor: '#B92929'
              })
            }
          })
      }

      $scope.removePlugin = function (pluginId) {
        $http({
          url: '/api/v1/plugins/remove/' + pluginId,
          method: 'DELETE'
        })
          .success(function (data) {
            if (!data.success) {
              if (data.error) {
                helpers.UI.showSnackbar({
                  text: 'Error: ' + data.error,
                  actionTextColor: '#B92929'
                })
                return
              }

              helpers.UI.showSnackbar({
                text: 'Error removing plugin!',
                actionTextColor: '#B92929'
              })
            }

            // Real Success
            helpers.UI.showSnackbar({
              text: 'Removed Plugin. Restarting Server...'
            })
            $('#serverRestarting').removeClass('hide')
            $timeout(function () {
              $window.location.reload()
            }, 5000)
          })
          .error(function (err) {
            if (err) {
              $log.error('[trudesk:plugins:removePlugin] - ' + err.error.message)
              helpers.UI.showSnackbar({
                text: 'Error: ' + err.error.message,
                actionTextColor: '#B92929'
              })
            }
          })
      }

      function compareVersions (v1, comparator, v2) {
        'use strict'
        comparator = comparator === '=' ? '==' : comparator
        if (['==', '===', '<', '<=', '>', '>=', '!=', '!=='].indexOf(comparator) === -1) {
          throw new Error('Invalid comparator. ' + comparator)
        }

        var v1parts = v1.split('.')
        var v2parts = v2.split('.')
        var maxLen = Math.max(v1parts.length, v2parts.length)
        var part1, part2
        var cmp = 0
        for (var i = 0; i < maxLen && !cmp; i++) {
          part1 = parseInt(v1parts[i], 10) || 0
          part2 = parseInt(v2parts[i], 10) || 0
          if (part1 < part2) {
            cmp = 1
          }
          if (part1 > part2) {
            cmp = -1
          }
        }
        // eslint-disable-next-line
        return eval('0' + comparator + cmp)
      }
    })
})
