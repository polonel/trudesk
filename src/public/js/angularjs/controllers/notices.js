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

define(['angular', 'underscore', 'jquery', 'modules/helpers', 'modules/socket', 'history'], function (
  angular,
  _,
  $,
  helpers,
  socketClient
) {
  return angular.module('trudesk.controllers.notices', []).controller('noticesCtrl', function ($scope, $http, $log) {
    $scope.editNotice = function ($event) {
      if (
        _.isNull($event.target) ||
        _.isUndefined($event.target) ||
        $event.target.tagName.toLowerCase() === 'label' ||
        $event.target.tagName.toLowerCase() === 'input'
      ) {
        return true
      }

      // currentTarget = ng-click() bound to. "<tr>"
      var id = $event.currentTarget.dataset.noticeoid
      if (!id) return true

      History.pushState(null, null, '/notices/' + id)
    }

    $scope.submitCreateNoticeForm = function (event) {
      event.preventDefault()
      var formData = $('#createNoticeForm').serializeObject()
      if (!formData.nName || !formData.nMessage) return false
      var apiData = {
        name: formData.nName,
        message: formData.nMessage,
        color: formData.nColor,
        fontColor: formData.nFontColor,
        alertWindow: formData.nAlertWindow === 'on'
      }

      $http({
        method: 'POST',
        url: '/api/v1/notices/create',
        data: apiData,
        headers: { 'Content-Type': 'application/json' }
      })
        .success(function () {
          helpers.UI.showSnackbar('Notice Created Successfully.', false)

          History.pushState(null, null, '/notices/')
        })
        .error(function (err) {
          $log.log('[trudesk:notices:submitCreateNoticeForm] - ' + err)
          helpers.UI.showSnackbar(err, true)
        })
    }

    $scope.submitEditNoticeForm = function (event) {
      event.preventDefault()
      var noticeId = $('#__noticeId').text()
      var formData = $('#editNoticeForm').serializeObject()
      var apiData = {
        name: formData.nName,
        message: formData.nMessage,
        color: formData.nColor,
        fontColor: formData.nFontColor,
        alertWindow: formData.nAlertWindow === 'on'
      }

      $http({
        method: 'PUT',
        url: '/api/v1/notices/' + noticeId,
        data: apiData,
        headers: { 'Content-Type': 'application/json' }
      })
        .success(function () {
          helpers.UI.showSnackbar('Notice Saved Successfully.', false)

          History.pushState(null, null, '/notices/')
        })
        .error(function (err) {
          $log.log('[trudesk:notices:submitEditNoticeForm] - ' + err)
          helpers.UI.showSnackbar(err, true)
        })
    }

    $scope.activateNotice = function () {
      var id = getChecked()
      if (id.length < 1) return true
      id = id[0]
      var $data = { active: true }

      if (!helpers.canUser('notices:activate', true)) {
        helpers.UI.showSnackbar('Unauthorized', true)
        return false
      }

      $http
        .get('/api/v1/notices/clearactive')
        .success(function () {
          $http({
            method: 'PUT',
            url: '/api/v1/notices/' + id,
            data: $data,
            headers: { 'Content-Type': 'application/json' }
          })
            .success(function () {
              socketClient.ui.setShowNotice(id)

              helpers.UI.showSnackbar('Notice has been activated', false)

              clearChecked()
              // History.pushState(null, null, '/notices/')
            })
            .error(function (err) {
              $log.log('[trudesk:notices:activateNotice] - ' + err)
              helpers.UI.showSnackbar(err, true)
            })
        })
        .error(function () {})

      helpers.hideAllpDropDowns()
    }

    $scope.clearNotice = function () {
      $http
        .get('/api/v1/notices/clearactive')
        .success(function () {
          socketClient.ui.setClearNotice()

          helpers.UI.showSnackbar('Notice has been deactivated', false)
        })
        .error(function (err) {
          $log.log('[trudesk:notices:clearNotice] - ' + err)
          helpers.UI.showSnackbar({
            text: 'Error: ' + err.message,
            actionTextColor: '#B92929'
          })
        })

      helpers.hideAllpDropDowns()
    }

    $scope.deleteNotices = function () {
      var ids = getChecked()
      _.each(ids, function (id) {
        $http
          .delete('/api/v1/notices/' + id)
          .success(function (data) {
            if (!data.success) {
              helpers.UI.showSnackbar({
                text: 'Error: ' + data.error,
                actionTextColor: '#B92929'
              })
              return
            }

            removeCheckedFromGrid(id)
            helpers.resizeDataTables('.noticesList')
            helpers.UI.showSnackbar({ text: 'Notice Successfully Deleted' })
          })
          .error(function (err) {
            $log.log('[trudesk:notices:deleteNotices] - ' + err)
            helpers.UI.showSnackbar({
              text: 'Error: ' + err,
              actionTextColor: '#B92929'
            })
          })
      })
    }

    function clearChecked () {
      $('#noticesTable input[type="checkbox"]:checked').each(function () {
        var vm = this

        var self = $(vm)

        self.prop('checked', false)
      })
    }

    function getChecked () {
      var checkedIds = []
      $('#noticesTable input[type="checkbox"]:checked').each(function () {
        var vm = this

        var self = $(vm)

        var $noticeTR = self.parents('tr')
        if (!_.isUndefined($noticeTR)) {
          var noticeOId = $noticeTR.attr('data-noticeOId')

          if (!_.isUndefined(noticeOId) && noticeOId.length > 0) {
            checkedIds.push(noticeOId)
          }
        }
      })

      return checkedIds
    }

    function removeCheckedFromGrid (id) {
      $('#noticesTable #c_' + id + '[type="checkbox"]:checked').each(function () {
        var vm = this

        var self = $(vm)

        var $noticeTR = self.parents('tr')
        if (!_.isUndefined($noticeTR)) {
          $noticeTR.remove()
        }
      })
    }
  })
})
