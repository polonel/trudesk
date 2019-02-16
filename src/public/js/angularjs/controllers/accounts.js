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
  'pages/accounts',
  'history',
  'selectize',
  'formvalidator',
  'multiselect'
], function (angular, _, $, helpers, UIkit, accountsPage) {
  return angular
    .module('trudesk.controllers.accounts', [])
    .controller('accountsCtrl', function ($scope, $http, $timeout, $window, $log) {
      function checkGroupValidation () {
        var data = {}
        var form = $('#createAccountForm')
        data.aGrps = form.find('select[name="caGrps[]"]').val()

        if (!data.aGrps || data.aGrps.length < 1) {
          // Validate Group
          $('label[for="caGrps"]').css('color', '#d85030')
          $('select[name="caGrps[]"] + .selectize-control > .selectize-input').css('border-bottom', '1px solid #d85030')
          $('.aGrps-error-message')
            .removeClass('hide')
            .css('display', 'block')
            .css('color', '#d85030')
            .css('font-weight', 'bold')
          return false
        }

        $('label[for="caGrps"]').css('color', '#4d4d4d')
        $('select[name="caGrps[]"] + .selectize-control > .selectize-input').css(
          'border-bottom',
          '1px solid rgba(0,0,0,.12)'
        )
        $('.aGrps-error-message').addClass('hide')
        return true
      }

      $scope.createAccount = function (event) {
        var data = {}
        var form = $('#createAccountForm')
        // if (!form.isValid(null, null, false)) return true;
        if (!form.isValid(null, null, false)) {
          checkGroupValidation()
          return false
        }

        if (!checkGroupValidation()) {
          event.preventDefault()
          return false
        }

        event.preventDefault()
        form.serializeArray().map(function (x) {
          data[x.name] = x.value
        })
        data.aGrps = form.find('select[name="caGrps[]"]').val()
        $http({
          method: 'POST',
          url: '/api/v1/users/create',
          data: data,
          headers: { 'Content-Type': 'application/json' }
        })
          .success(function (data) {
            if (!data.success) {
              if (data.error) {
                helpers.UI.showSnackbar('Error: ' + data.error, true)
                return
              }

              helpers.UI.showSnackbar('Error Creating Account', true)
            }

            helpers.UI.showSnackbar({ text: 'Account Created' })

            // Refresh UserGrid
            History.pushState(
              null,
              null,
              '/accounts/?refresh=' + (Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000)
            )

            UIkit.modal('#accountCreateModal').hide()
          })
          .error(function (err) {
            $log.log('[trudesk:accounts:createAccount]', err)
            helpers.UI.showSnackbar('An error occurred while creating the account. Check Console.', true)
          })
      }

      var running = false
      $scope.deleteAccount = function ($event) {
        if (running) {
          return true
        }

        $event.preventDefault()
        var self = $($event.target)
        var username = self.attr('data-username')
        if (_.isUndefined(username)) {
          return true
        }

        running = true
        $http
          .delete('/api/v1/users/' + username)
          .success(function (data) {
            if (!data.success) {
              helpers.UI.showSnackbar(data.error, true)
              running = false
              return true
            }

            if (data.disabled) {
              self.parents('.tru-card-head').addClass('tru-card-head-deleted')
              self.addClass('hide')
              self
                .parents('.uk-nav')
                .find('.enable-account-action')
                .removeClass('hide')

              helpers.UI.showSnackbar('Account ' + username + ' Successfully Disabled', false)
            } else {
              self
                .parents('.tru-card[data-card-username]')
                .parent()
                .remove()
              UIkit.$html.trigger('changed.uk.dom')

              helpers.UI.showSnackbar('Account ' + username + ' Successfully Deleted', false)
            }

            running = false
          })
          .error(function (err) {
            $log.log('[trudesk:accounts:deleteAccount] - Error: ' + err.error)
            helpers.UI.showSnackbar(err.error, true)

            running = false
          })
      }

      $scope.enableAccount = function ($event) {
        $event.preventDefault()
        var self = $($event.target)
        var username = self.attr('data-username')
        if (_.isUndefined(username)) {
          return true
        }

        $http
          .get('/api/v1/users/' + username + '/enable')
          .success(function (data) {
            if (!data.success) {
              helpers.UI.showSnackbar(data.error, true)
              return
            }

            self.parents('.tru-card-head').removeClass('tru-card-head-deleted')
            self.addClass('hide')
            self
              .parents('.uk-nav')
              .find('.delete-account-action')
              .removeClass('hide')

            helpers.UI.showSnackbar('Account successfully enabled', false)
          })
          .error(function (err) {
            $log.log('[trudesk:accounts:enableAccount] - Error: ' + err.error)
            helpers.UI.showSnackbar(err.error, true)
          })
      }

      $scope.editAccount = function ($event) {
        $event.preventDefault()

        var self = $($event.target)
        var username = self.attr('data-username')
        if (_.isUndefined(username)) return true

        var $menu = self.parents('.tru-card-head-menu')
        if (!_.isUndefined($menu)) $menu.find('.uk-dropdown').removeClass('uk-dropdown-shown uk-dropdown-active')

        $http
          .get('/api/v1/users/' + username)
          .success(function (data) {
            var editAccountModal = $('#editAccountModal')
            var form = editAccountModal.find('form#editAccountForm')
            var user = data.user
            if (_.isUndefined(user) || _.isNull(user)) return true

            var loggedInAccount = $window.trudeskSessionService.getUser()
            if (loggedInAccount === null) return true

            var $userHeadingContent = $('.user-heading-content')
            $userHeadingContent.find('.js-username').text(user.username)
            if (!user.title) $userHeadingContent.find('.js-user-title').text('')
            else $userHeadingContent.find('.js-user-title').text(user.title)

            var isEditingSelf = false
            if (user.username === loggedInAccount.username) isEditingSelf = true

            var canEdit = false
            var hasEdit = helpers.canUser('accounts:update')
            if (isEditingSelf && helpers.canUserEditSelf(loggedInAccount._id, 'account')) {
              hasEdit = true
              canEdit = true
            }

            if (
              helpers.hasHierarchyEnabled(loggedInAccount.role._id) &&
              helpers.hasPermOverRole(loggedInAccount.role._id, user.role._id)
            )
              canEdit = true

            if (!hasEdit && !canEdit) {
              // Disable editing user with higher roles.
              form
                .find('#aPass')
                .parent()
                .hide()
              form
                .find('#aPassConfirm')
                .parent()
                .hide()
              form
                .find('#aRole')
                .parent()
                .hide()
              form.find('#aFullname').attr('disabled', 'disabled')
              form.find('#aTitle').attr('disabled', 'disabled')
              form.find('#aEmail').attr('disabled', 'disabled')
              form.find('#aGrps').attr('disabled', 'disabled')
              form
                .find('#aSaveButton')
                .addClass('disabled')
                .attr('disabled', 'disabled')
            } else {
              form
                .find('#aPass')
                .parent()
                .show()
              form
                .find('#aPassConfirm')
                .parent()
                .show()
              form
                .find('#aRole')
                .parent()
                .show()
              form.find('#aFullname').attr('disabled', false)
              form.find('#aTitle').attr('disabled', false)
              form.find('#aEmail').attr('disabled', false)
              form.find('#aGrps').attr('disabled', false)
              form
                .find('#aSaveButton')
                .removeClass('disabled')
                .attr('disabled', false)
            }

            form.find('#aId').val(user._id)
            form
              .find('#aUsername')
              .val(user.username)
              .prop('disabled', true)
              .parent()
              .addClass('md-input-filled')
            form
              .find('#aFullname')
              .val(user.fullname)
              .parent()
              .addClass('md-input-filled')
            form
              .find('#aTitle')
              .val(user.title)
              .parent()
              .addClass('md-input-filled')
            form
              .find('#aEmail')
              .val(user.email)
              .parent()
              .addClass('md-input-filled')
            form.find('#aRole option[value="' + user.role._id + '"]').prop('selected', true)
            if (form.find('#aRole').length > 0) {
              var $selectizeRole = form.find('#aRole')[0].selectize
              $selectizeRole.setValue(user.role._id, true)

              var items = _.map($selectizeRole.options, function (m) {
                return m.value
              })

              var assignableRoles = helpers.parseRoleHierarchy(loggedInAccount.role._id)

              _.each(items, function (role) {
                var i = _.find(assignableRoles, function (o) {
                  return o.toString() === role.toString()
                })
                if (_.isUndefined(i)) $selectizeRole.removeOption(role)
              })

              $selectizeRole.refreshOptions(false)
            }

            form.find('#aGrps').multiSelect('deselect_all')
            form.find('#aGrps').multiSelect('select', data.groups)
            form.find('#aGrps').multiSelect('refresh')

            // Profile Picture
            var aImageUploadForm = $('form#aUploadImageForm')
            var image = aImageUploadForm.find('img')
            var inputId = aImageUploadForm.find('input#imageUpload_id')
            var inputUsername = aImageUploadForm.find('input#imageUpload_username')
            inputId.val(user._id)
            inputUsername.val(user.username)
            if (user.image)
              image.attr(
                'src',
                '/uploads/users/' + user.image + '?r=' + (Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000)
              )
            else
              image.attr(
                'src',
                '/uploads/users/defaultProfile.jpg?r=' + (Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000)
              )

            var modal = UIkit.modal('#editAccountModal')
            if (!modal.isActive()) modal.show()
          })
          .error(function (err) {
            $log.log('[trudesk:Accounts:editAccount] - Error: ' + err.error)
            helpers.UI.showSnackbar(err.error, true)
          })
      }

      $scope.saveAccount = function () {
        var form = $('#editAccountForm')
        var data = form.serializeObject()
        data.aUsername = form.find('#aUsername').val()
        data.aGrps = form.find('#aGrps').val()
        data.saveGroups = true
        data.aRole = form.find('#aRole').val().length > 0 ? form.find('#aRole').val() : undefined
        data.aPass = form.find('#aPass').val().length > 0 ? form.find('#aPass').val() : undefined
        data.aPassConfirm = form.find('#aPassConfirm').val().length > 0 ? form.find('#aPassConfirm').val() : undefined

        $http({
          method: 'PUT',
          url: '/api/v1/users/' + data.aUsername,
          data: data,
          headers: { 'Content-Type': 'application/json' }
        })
          .success(function (data) {
            if (!data.success) {
              if (data.error) {
                helpers.UI.showSnackbar('Error: ' + data.error, true)
                return
              }

              helpers.UI.showSnackbar('Error Saving Account', true)
            }

            helpers.UI.showSnackbar('Account Saved', false)

            UIkit.modal('#editAccountModal').hide()

            accountsPage.init(null, true)
          })
          .error(function (err) {
            $log.log('[trudesk:accounts:saveAccount] - ' + err.error.message)
            helpers.UI.showSnackbar('Error: ' + err.error.message, true)
          })
      }

      $scope.accountEditPic = function () {
        throttledAccountPicClick()
      }

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
