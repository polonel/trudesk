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

define(['angular', 'underscore', 'jquery'], function (angular, _, $) {
  return angular.module('trudesk.controllers.accounts', []).controller('accountsCtrl', function ($scope, $timeout) {
    $scope.selectAccountsImport = function (event, type) {
      if ($(event.currentTarget).hasClass('card-disabled')) {
        return false
      }

      switch (type) {
        case 'csv':
          $('#csv_wizard_card').removeClass('uk-hidden')
          $('#json-import-selector').addClass('card-disabled')
          $('#ldap-import-selector').addClass('card-disabled')
          break
        case 'json':
          $('#json_wizard_card').removeClass('uk-hidden')
          $('#csv-import-selector').addClass('card-disabled')
          $('#ldap-import-selector').addClass('card-disabled')
          break
        case 'ldap':
          $('#ldap_wizard_card').removeClass('uk-hidden')
          $('#csv-import-selector').addClass('card-disabled')
          $('#json-import-selector').addClass('card-disabled')
      }
    }

    $scope.resetWizardSelection = function () {
      $('#csv_wizard_card').addClass('uk-hidden')
      $('#json_wizard_card').addClass('uk-hidden')
      $('#ldap_wizard_card').addClass('uk-hidden')

      $('#csv-import-selector').removeClass('card-disabled')
      $('#json-import-selector').removeClass('card-disabled')
      $('#ldap-import-selector').removeClass('card-disabled')
    }

    $scope.accountEditPic = function () {
      throttledAccountPicClick()
    }

    function throttledAccountPicClick () {
      $timeout(function () {
        var $profileImageInput = $('#profileImageInput')
        $profileImageInput.on('click', function (event) {
          // This function is a firefox hack to stop it from spawning 100000 file dialogs
          event.stopPropagation()
        })

        $profileImageInput.trigger('click')
      }, 0)
    }
  })
})
