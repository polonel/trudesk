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
  'jquery_custom',
  'history',
  'multiselect'
], function (angular, _, $, helpers, UIkit) {
  return angular
    .module('trudesk.controllers.groups', [])
    .controller('groupsCtrl', function ($scope, $http, $timeout, $log) {
      $scope.editGroup = function ($event) {
        if (_.isNull($event.target) || _.isUndefined($event.target)) {
          return false
        }
        var self = $($event.target)
        var groupId = self.attr('data-group-id')

        $http
          .get('/api/v1/groups/' + groupId)
          .success(function (data) {
            var group = data.group
            var form = $('#editGroupForm')
            form.find('#__EditId').text(group._id)
            form
              .find('#gName')
              .val(group.name)
              .parent()
              .addClass('md-input-filled')
            var mappedMembers = _.map(group.members, '_id')
            var mappedSendMailTo = _.map(group.sendMailTo, '_id')

            form.find('#gMembers').multiSelect('deselect_all')
            form.find('#gMembers').multiSelect('select', mappedMembers)
            form.find('#gSendMailTo').multiSelect('deselect_all')
            form.find('#gSendMailTo').multiSelect('select', mappedSendMailTo)

            UIkit.modal('#groupEditModal').show()
          })
          .error(function (err) {
            $log.log('[trudesk:groups:editGroup] - Error: ' + err)
            helpers.UI.showSnackbar(err, true)
          })
      }

      $scope.saveEditGroup = function ($event) {
        var id = $($event.target)
          .parents('form')
          .find('#__EditId')
          .text()
        if (_.isUndefined(id)) {
          helpers.UI.showSnackbar('Unable to get Group ID', true)
          return false
        }
        var $form = $('#editGroupForm')
        var formData = $form.serializeObject()
        var members = $form.find('#gMembers').val()
        var sendMailTo = $form.find('#gSendMailTo').val()

        var apiData = {
          name: formData.gName,
          members: members,
          sendMailTo: sendMailTo
        }

        $http({
          method: 'PUT',
          url: '/api/v1/groups/' + id,
          data: apiData,
          headers: { 'Content-Type': 'application/json' }
        })
          .success(function () {
            helpers.UI.showSnackbar('Group Saved Successfully', false)
            UIkit.modal('#groupEditModal').hide()
            // Refresh Grid
            refreshGrid()
          })
          .error(function (err) {
            $log.log('[trudesk:groups:saveEditGroup] - Error: ' + err)
            helpers.UI.showSnackbar(err.error, true)
          })
      }

      $scope.createGroup = function () {
        var formData = $('#createGroupForm').serializeObject()
        var apiData = {
          name: formData.gName,
          members: formData.gMembers,
          sendMailTo: formData.gSendMailTo
        }

        $http({
          method: 'POST',
          url: '/api/v1/groups/create',
          data: apiData,
          headers: { 'Content-Type': 'application/json' }
        })
          .success(function () {
            helpers.UI.showSnackbar('Group Created Successfully', false)
            UIkit.modal('#groupCreateModal').hide()
            // Refresh Grid
            $timeout(function () {
              refreshGrid()
            }, 0)
          })
          .error(function (err) {
            $log.log('[trudesk:groups:createGroup] - Error: ' + err)
            helpers.UI.showSnackbar(err, true)
          })
      }

      $scope.deleteGroup = function (event) {
        event.preventDefault()
        var self = $(event.currentTarget)
        var groupID = self.attr('data-group-id')
        var card = self.parents('.tru-card-wrapper')
        if (groupID) {
          UIkit.modal.confirm(
            'Are you sure you want to delete group: <strong>' + card.find('h3').attr('data-group-name') + '</strong>',
            function () {
              helpers.showLoader(0.8)
              $http
                .delete('/api/v1/groups/' + groupID)
                .success(function () {
                  helpers.hideLoader()
                  helpers.UI.showSnackbar('Group Successfully Deleted', false)

                  card.remove()
                  UIkit.$html.trigger('changed.uk.dom')
                })
                .error(function (err) {
                  helpers.hideLoader()
                  $log.log('[trudesk:groups:deleteGroup] - Error: ' + err.error)
                  helpers.UI.showSnackbar(err.error, true)
                })
            },
            {
              labels: { Ok: 'Yes', Cancel: 'No' },
              confirmButtonClass: 'md-btn-danger'
            }
          )
        }
      }

      function refreshGrid () {
        var $cards = $('#group_list').find('.tru-card-wrapper')
        $cards.each(function () {
          var vm = this
          var self = $(vm)
          self.remove()
        })

        $http
          .get('/api/v1/groups/all')
          .success(function (data) {
            var $groupList = $('#group_list')

            var html = ''
            _.each(data.groups, function (group) {
              html += buildHTML(group)
            })

            var $injector = angular.injector(['ng', 'trudesk'])
            $injector.invoke([
              '$compile',
              '$rootScope',
              function ($compile, $rootScope) {
                var $scope = $groupList.append(html).scope()
                $compile($groupList)($scope || $rootScope)
                $rootScope.$digest()
              }
            ])

            UIkit.$html.trigger('changed.uk.dom')
          })
          .error(function (err) {
            $log.log('[trudesk:groups:refreshGrid] - Error: ' + err.error)
            helpers.UI.showSnackbar(err.error, true)
          })
      }

      function buildHTML (group) {
        var html = ''
        html += '<div class="tru-card-wrapper" data-uk-filter="' + group.name + '">'
        html += '<div class="tru-card tru-card-hover">'
        html += '<div class="tru-card-head">'
        html += '<div class="tru-card-head-menu" data-uk-dropdown="{pos: \'bottom-right\',mode:\'click\'}">'
        html += '<i class="material-icons tru-icon">&#xE5D4;</i>'
        html += '<div class="uk-dropdown uk-dropdown-small">'
        html += '<ul class="uk-nav">'
        html +=
          '<li><a href="#" class="no-ajaxy" data-group-id="' +
          group._id +
          '" ng-click="editGroup($event)">Edit</a></li>'
        html +=
          '<li><a href="#" class="no-ajaxy" data-group-id="' +
          group._id +
          '" ng-click="deleteGroup($event)">Remove</a></li>'
        html += '</ul>'
        html += '</div>'
        html += '</div>'
        html += '<h3 class="tru-card-head-text uk-text-center" style="padding-top:60px;">'
        html += group.name
        html += '<span class="uk-text-truncate">'
        html += _.size(group.members).toString() + ' ' + (_.size(group.members) === 1 ? 'member' : 'members')
        html += '</span>'
        html += '</h3>'
        html += '</div>'
        html += '</div>'
        html += '</div>'

        return html
      }
    })
})
