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
  'modules/socket',
  'history',
  'angularjs/services/session'
], function (angular, _, $, helpers, socket) {
  return angular
    .module('trudesk.controllers.messages', ['trudesk.services.session'])
    .controller('messagesCtrl', function (SessionService, $scope, $document, $http, $window, $cookies, $timeout, $log) {
      $scope.loadConversation = function (convoId) {
        History.pushState(null, null, '/messages/' + convoId)
      }

      $scope.sendChatMessage = function (cid, toUserId, event) {
        var form = $(event.target)
        if (form.length < 1) return false

        var input = form.find('input[name="chatMessage"]')

        if (input.val().length < 1) {
          return false
        }

        socket.chat.sendChatMessage(cid, toUserId, input.val(), function (err) {
          if (err) $log.warn(err)
          input.val('')

          socket.chat.stopTyping(cid, toUserId)
        })

        event.preventDefault()
      }

      $scope.onKeyDown = function (cid, toUserId, $event) {
        if ($event.keyCode !== 13) {
          socket.chat.startTyping(cid, toUserId)
        }
      }

      $scope.showUserList = function ($event, callback) {
        if (!_.isUndefined($event)) {
          $event.preventDefault()
        }
        var convoList = $document[0].getElementById('convo-list')
        convoList.style.transition = 'opacity 0.25s'
        convoList.style.opacity = 0

        var allUserList = $document[0].getElementById('new-convo-user-list')
        allUserList.style.opacity = 0
        allUserList.classList.remove('hide')
        allUserList.style.display = 'block'
        allUserList.style.transition = 'opacity 0.25s'

        $timeout(function () {
          convoList.style.display = 'none'

          allUserList.style.opacity = 1

          var actions = $document[0].getElementById('convo-actions').children
          ;[].forEach.call(actions, function (el) {
            if (el.style.display === 'none') {
              el.style.display = 'block'
            } else {
              el.style.display = 'none'
            }
          })

          // if ($('.all-user-list').getNiceScroll(0) != false) {
          //     $('.all-user-list').getNiceScroll(0).resize();
          // }

          if (_.isFunction(callback)) {
            return callback()
          }
        }, 200)
      }

      $scope.hideUserList = function ($event) {
        if (!_.isUndefined($event)) {
          $event.preventDefault()
        }
        var allUserList = $document[0].getElementById('new-convo-user-list')
        allUserList.style.transition = 'opacity 0.25s'
        allUserList.style.opacity = 0

        var convoList = $document[0].getElementById('convo-list')
        convoList.style.transition = 'opacity 0.25s'
        convoList.style.opacity = 0

        $timeout(function () {
          allUserList.style.display = 'none'
          convoList.style.display = 'block'

          convoList.style.opacity = 1

          $document[0].querySelector('.search-box > input').value = ''
          $('.all-user-list li').each(function () {
            var vm = this
            $(vm).show()
          })

          var actions = $document[0].getElementById('convo-actions').children
          ;[].forEach.call(actions, function (el) {
            if (el.style.display === 'none') {
              el.style.display = 'block'
            } else {
              el.style.display = 'none'
            }
          })
        }, 200)
      }

      $scope.showNewConvo = $('#__showNewConvo').text()
      if ($scope.showNewConvo.length > 0) {
        $scope.showUserList(undefined, function () {
          return _.defer(function () {
            helpers.resizeFullHeight()
            helpers.hideAllpDropDowns()
          }, 500)
        })
      }

      $scope.startNewConversation = function (userId) {
        var $loggedInAccountId = SessionService.getUser()._id
        $http
          .post('/api/v1/messages/conversation/start', {
            owner: $loggedInAccountId,
            participants: [userId, $loggedInAccountId]
          })
          .then(
            function (response) {
              var conversation = response.data.conversation
              if (!_.isUndefined(conversation)) {
                History.pushState(null, null, '/messages/' + conversation._id)
              }
            },
            function (err) {
              $log.error('[trudesk.Messages.startNewConversation()] - Error: ')
              $log.error(err)
            }
          )
      }
    })
})
