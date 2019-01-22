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
 *  Updated:    1/20/19 10:03 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

define([
  'angular',
  'underscore',
  'jquery',
  'modules/socket',
  'uikit',
  'modules/helpers',
  'grapesjs',
  'grapesjsEmail',
  'history'
], function (angular, _, $, socket, UIKit, helpers, grapesjs, grapesjsEmail) {
  return angular
    .module('trudesk.controllers.editor', [])
    .controller('editorController', function ($scope, $window, $http, $cookies, $timeout, $log) {
      $(document).ready(function () {
        var template = 'new-ticket'
        var editor = grapesjs.init({
          container: '#web-editor',
          plugins: ['gjs-preset-newsletter'],
          pluginOpts: {
            'gjs-preset-newsletter': {
              modalTitleImport: 'Import template'
            }
          },
          storageManager: {
            type: 'remote',
            autoSave: false,
            urlStore: '/api/v1/editor/save',
            urlLoad: '/api/v1/editor/load/' + template,
            contentTypeJson: true,
            params: { template: template }
          },
          commands: {
            defaults: [
              {
                id: 'store-data',
                run: function (editor, sender) {
                  sender.set('active', 0)
                  editor.store()
                }
              }
            ]
          }
        })

        var pnm = editor.Panels
        pnm.addButton('options', {
          id: 'save',
          className: 'fa fa-save',
          command: 'store-data',
          attributes: { title: 'Save' }
        })

        editor.on('storage:error', function (err) {
          var errObj = angular.fromJson(err)
          $log.error(errObj)
          helpers.UI.showSnackbar('Error: ' + errObj.error.message, true)
        })
      })
    })
})
