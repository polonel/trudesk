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

define('pages/messages', [
  'jquery',
  'underscore',
  'angular',
  'uikit',
  'moment',
  'modules/helpers',
  'modules/socket',
  'history',
  'isinview'
], function ($, _, angular, UIKit, moment, helpers) {
  var messagesPage = {}

  messagesPage.init = function (callback) {
    $(document).ready(function () {
      var $messageScroller = $('#message-content.scrollable')

      var $messagesWrapper = $('#messages')

      var $scrollspy = $('#conversation-scrollspy')

      var $spinner = $scrollspy.find('i')

      var $searchBox = $('.search-box').find('input')

      var $nextPage = 2

      var $enabled = true

      var $loading = false

      // $inview             = null,

      var $recentMessages = {}

      var $convoId = $('#message-content[data-conversation-id]').attr('data-conversation-id')

      var $loggedInAccountId = window.trudeskSessionService.getUser()._id

      // Setup Context Menu
      helpers.setupContextMenu('#convo-list > ul > li', function (action, target) {
        var $li = $(target)
        if (!$li.is('li')) {
          $li = $(target).parents('li')
        }
        var convoId = $li.attr('data-conversation-id')
        if (action.toLowerCase() === 'delete') {
          UIKit.modal.confirm(
            'Are you sure you want to delete this conversation?',
            function () {
              // Confirm
              deleteConversation(convoId)
            },
            function () {
              // Cancel
            },
            {
              labels: {
                Ok: 'YES'
              },
              confirmButtonClass: 'md-btn-danger'
            }
          )
        }
      })

      $searchBox.off('keyup')
      $searchBox.on('keyup', onSearchKeyUp)

      $(window).off('$trudesk:ready.messages')
      $(window).on('$trudesk:ready.messages', function () {
        helpers.scrollToBottom($messageScroller)

        // set active
        if ($convoId !== undefined) {
          var item = $('ul > li[data-conversation-id="' + $convoId + '"]')
          item.addClass('active')
        }

        // Remove All Chat Boxes
        if (
          $('#__page')
            .text()
            .toLowerCase() === 'messages'
        ) {
          $('.chat-box-position').each(function () {
            var self = $(this)
            self.remove()
          })

          $('.message-textbox')
            .find('input')
            .focus()

          $messageScroller.scroll(function () {
            if ($scrollspy.isInView($messageScroller)) {
              var run = _.throttle(loadMoreMessages, 100)
              run()
            }
          })
        }
      })

      function deleteConversation (convoId) {
        $.ajax({
          url: '/api/v1/messages/conversation/' + convoId,
          method: 'DELETE',
          success: function (response) {
            if (response.success) {
              // Check if on conversation
              var $convo = $('#message-content[data-conversation-id="' + response.conversation._id + '"]')
              if ($convo.length > 0) {
                History.pushState(null, null, '/messages', false)
              } else {
                var $convoLI = $('#convo-list').find('li[data-conversation-id="' + response.conversation._id + '"]')
                if ($convoLI.length > 0) {
                  $convoLI.remove()
                }
              }

              $.event.trigger('$trudesk:chat:conversation:deleted', {
                conversation: response.conversation
              })

              helpers.UI.showSnackbar('Conversation Deleted.', false)
            }
          },
          error: function (error) {
            console.log(error)
          }
        })
      }

      function onSearchKeyUp () {
        var searchTerm = $searchBox.val().toLowerCase()
        $('.all-user-list li').each(function () {
          if ($(this).filter('[data-search-term *= ' + searchTerm + ']').length > 0 || searchTerm.length < 1) {
            $(this).show()
          } else {
            $(this).hide()
          }
        })
      }

      function loadMoreMessages () {
        if (!$enabled || $loading) return false
        if (_.isUndefined($convoId)) return false
        $loading = true
        $spinner.removeClass('uk-hidden')

        // Load Messages
        $.ajax({
          url: '/api/v1/messages/conversation/' + $convoId + '?page=' + $nextPage
        })
          .done(function (data) {
            $spinner.addClass('uk-hidden')
            var messages = data.messages
            if (_.size(messages) < 1) {
              $enabled = false
              $loading = false
              return false
            }

            var html = ''

            _.each(messages, function (m) {
              var h = buildMessageHTML(m)
              if (h.length > 0) html += h
            })

            var stage = $('<div></div>')
              .appendTo('body')
              .addClass('stage')
              .css({
                opacity: 0,
                visibility: 'hidden',
                position: 'absolute',
                top: '-9999em',
                left: '-9999em'
              })
              .append(html)
            var height = $(stage).outerHeight()
            $(stage).remove()

            $messagesWrapper.prepend(html)

            UIKit.$html.trigger('changed.uk.dom')
            $messageScroller.scrollTop(height, true)

            $nextPage = $nextPage + 1
            $loading = false
          })
          .error(function (err) {
            console.log(err)
          })
      }

      function buildMessageHTML (message) {
        var html = ''
        var loggedInAccountId = window.trudeskSessionService.getUser()._id
        if (loggedInAccountId === undefined) return false
        var left = true
        if (message.owner._id.toString() === loggedInAccountId.toString()) {
          left = false
        }

        var image = message.owner.image === undefined ? 'defaultProfile.jpg' : message.owner.image

        if (left) {
          html += '<div class="message message-left">'
          html +=
            '<img class="profileImage" src="/uploads/users/' +
            image +
            '" data-userId="' +
            message.owner._id +
            '" data-uk-tooltip="{pos:\'left\', animation: false}" title="' +
            message.owner.fullname +
            ' - ' +
            moment(message.createdAt)
              .tz(helpers.getTimezone())
              .format(helpers.getShortDateFormat() + ' ' + helpers.getTimeFormat()) +
            '"/>'
          html += '<div class="message-body">'
          html += '<p>' + message.body + '</p>'
          html += '</div>'
          html += '</div>'
        } else {
          html += '<div class="message message-right">'
          html +=
            '<div class="message-body" data-uk-tooltip="{pos:\'right\', animation: false}" title="' +
            moment(message.createdAt)
              .tz(helpers.getTimezone())
              .format(helpers.getShortDateFormat() + ' ' + helpers.getTimeFormat()) +
            '">'
          html += '<p>' + message.body + '</p>'
          html += '</div>'
          html += '</div>'
        }

        return html
      }

      // Remove all Events in the .conversation namespace for this page.
      $(window).off('.conversation')

      // On user Typing
      $(window).on('$trudesk:chat:typing.conversation', function (event, data) {
        var convoListItem = $('#convo-list').find('li[data-conversation-id="' + data.cid + '"]')
        if (convoListItem.length > 0) {
          $recentMessages[data.cid] = convoListItem.find('.message-subject').text()
          convoListItem.find('.message-subject').text(data.fromUser.fullname + ' is typing...')
        }
      })

      $(window).on('$trudesk:chat:stoptyping.conversation', function (event, data) {
        var convoListItem = $('#convo-list').find('li[data-conversation-id="' + data.cid + '"]')
        if (convoListItem.length > 0) {
          convoListItem.find('.message-subject').text($recentMessages[data.cid])
        }
      })

      // On Chat Message
      $(window).on('$trudesk:chat:message.conversation', function (event, data) {
        var message = {
          _id: data.messageId,
          conversation: data.conversation,
          body: data.message,
          owner: data.fromUser
        }

        var html = buildMessageHTML(message)
        var messageWrapper = $('#message-content[data-conversation-id="' + message.conversation + '"]')
        if (messageWrapper.length > 0) {
          messageWrapper.find('#messages').append(html)
        }

        var convoListItem = $('li[data-conversation-id="' + data.conversation + '"]')
        if (convoListItem.length > 0) {
          convoListItem.attr('data-updatedAt', new Date())
          var ul = convoListItem.parent('ul')
          var li = ul.children('li')
          li.detach().sort(function (a, b) {
            return new Date($(a).attr('data-updatedAt')) < new Date($(b).attr('data-updatedAt'))
          })

          ul.append(li)

          var fromName = message.owner.fullname
          if (message.owner._id.toString() === $loggedInAccountId) {
            fromName = 'You'
          }

          convoListItem.find('.message-subject').text(fromName + ': ' + message.body)
          $recentMessages[message.conversation] = fromName + ': ' + message.body
          var timezone = helpers.getTimezone()
          convoListItem.find('.message-date').text(
            moment
              .utc()
              .tz(timezone)
              .calendar()
          )
        } else {
          var convoUL = $('#convo-list > ul.message-items')
          if (convoUL.length > 0) {
            var partner = message.owner
            if (message.owner._id.toString() === $loggedInAccountId.toString()) {
              partner = data.toUser
            }
            var newLI = buildConversationListItem({
              _id: message.conversation,
              partner: partner,
              updatedAt: new Date(),
              recentMessage: message.owner.fullname + ': ' + message.body
            })

            var $injector = angular.injector(['ng', 'trudesk'])
            $injector.invoke([
              '$compile',
              '$rootScope',
              function ($compile, $rootScope) {
                var $scope = convoUL.prepend(newLI).scope()
                $compile(convoUL)($scope || $rootScope)
                $rootScope.$digest()
              }
            ])
          }
        }

        UIKit.$html.trigger('changed.uk.dom')
        helpers.scrollToBottom($messageScroller)
      })

      function buildConversationListItem (data) {
        var html = ''

        html +=
          '<li ng-click="loadConversation(\'' +
          data._id +
          '\');" data-conversation-id="' +
          data._id +
          '" data-updatedAt="' +
          data.updatedAt +
          '">'
        html += '<div class="profile-pic">'
        var imageUrl = 'defaultProfile.jpg'
        if (data.partner.image) {
          imageUrl = data.partner.image
        }
        html +=
          '<img src="/uploads/users/' +
          imageUrl +
          '" class="uk-border-circle profileImage" data-userid="' +
          data.partner._id +
          '" />'
        html += '<span class="user-online uk-border-circle" data-user-status-id="' + data.partner._id + '"></span>'
        html += '</div>'
        html += '<div class="convo-info">'
        html += '<span class="message-from">' + data.partner.fullname + '</span>'
        html += '<span class="message-date">' + moment(data.updatedAt).calendar() + '</span>'
        html += '<span class="message-subject">' + data.recentMessage + '</span>'
        html += '</div>'
        html += '</li>'

        return html
      }

      if (typeof callback === 'function') {
        return callback()
      }
    })
  }

  return messagesPage
})
