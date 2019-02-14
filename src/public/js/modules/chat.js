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

define('modules/chat', ['jquery', 'underscore', 'moment', 'modules/helpers', 'uikit', 'autogrow', 'history'], function (
  $,
  _,
  moment,
  helpers,
  UIKit
) {
  var chatClient = {}

  var socket

  var loggedInAccount

  chatClient.init = function (sock) {
    loggedInAccount = window.trudeskSessionService.getUser()
    socket = sock

    socket.removeAllListeners('updateUsers1')
    socket.on('updateUsers1', function (data) {
      var html = ''
      var onlineList = $('.online-list-wrapper').find('ul.online-list')
      var username = loggedInAccount.username
      var isUserRole = loggedInAccount.role === 'user'
      var filteredData = _.filter(data, function (item) {
        return item.user.username !== username
      })
      var activeNow = $('.active-now')
      if (_.size(filteredData) < 1) {
        activeNow.hide()
      } else {
        activeNow.show()
      }

      onlineList.html('')
      var activeCount = 0
      _.each(filteredData, function (v) {
        var onlineUser = v.user
        if (onlineUser.username === username) return true
        // This hides all other users from the active online list.
        if (isUserRole && onlineUser.role === 'user') return true
        var imageUrl = onlineUser.image
        if (_.isUndefined(imageUrl)) imageUrl = 'defaultProfile.jpg'
        html += '<li>'
        html +=
          '<a class="no-ajaxy" data-action="startChat" data-chatUser="' + onlineUser._id + '" href="#" role="button">'
        html += '<div class="online-list-user">'
        html += '<div class="image"><img src="/uploads/users/' + imageUrl + '"></div>'
        html += '<span class="online-status" data-user-status-id="' + onlineUser._id + '"></span>'
        html += '<div class="online-name">' + onlineUser.fullname + '</div>'
        html += '</div>'
        html += '</a>'
        html += '</li>'

        var allUserList = $('ul.user-list')
        var userStatus = allUserList.find('li[data-user-id="' + onlineUser._id + '"]').find('.online-status-offline')
        userStatus.removeClass('online-status-offline').addClass('online-status')
        userStatus.text('')
        activeCount++
      })

      onlineList.append(html)

      var onlineUserCount = $('.online-user-count')
      if (onlineUserCount.length > 0) {
        var size = _.size(filteredData)
        if (size < 1) onlineUserCount.addClass('hide')
        else {
          onlineUserCount.text(activeCount)
          onlineUserCount.removeClass('hide')
        }
      }

      chatClient.bindActions()
    })

    socket.removeAllListeners('$trudesk:chat:updateOnlineBubbles')
    socket.on('$trudesk:chat:updateOnlineBubbles', function (data) {
      var $u = _.throttle(
        function () {
          updateOnlineBubbles(data)
        },
        1000,
        { trailing: false }
      )

      $u()
    })

    socket.removeAllListeners('spawnChatWindow')
    socket.on('spawnChatWindow', function (data) {
      var messageContent = $('#message-content[data-conversation-id]')
      if (messageContent.length > 0) {
        var loggedInAccountId = loggedInAccount._id
        startConversation(loggedInAccountId, data._id, function (err, convo) {
          if (err) {
            console.log('[trudesk:chat:openChatWindow] - Error')
            console.error(err)
            helpers.UI.showSnackbar('Unable to start chat', true)
          } else {
            var splitPath = window.location.pathname.split('/')
            if (splitPath.length > 1) {
              if (splitPath[0].toString().toLowerCase() === 'messages') {
                return true
              }
            } else {
              History.pushState(null, null, '/messages/' + convo._id, true)
            }
          }
        })
      } else {
        chatClient.openChatWindow(data)
      }
    })

    socket.removeAllListeners('chatMessage')
    socket.on('chatMessage', function (data) {
      var type = data.type
      var to = data.to
      var from = data.from
      var chatBox = ''

      var chatMessage = ''

      var chatMessageList = ''

      var scroller = ''

      var selector = ''

      if (type === 's') {
        chatBox = $('.chat-box[data-chat-userid="' + to + '"]')
        chatMessage = createChatMessageDiv(data.message)
        chatMessageList = chatBox.find('.chat-message-list:first')
        scroller = chatBox.find('.chat-box-messages')
        chatMessageList.append(chatMessage)
        helpers.scrollToBottom(scroller)
        helpers.UI.playSound('sendChatMessage')
      } else if (type === 'r') {
        selector = '.chat-box[data-chat-userid="' + from + '"]'
        chatBox = $(selector)
        if (chatBox.length < 1) {
          chatClient.openChatWindow(data.fromUser, function () {
            chatBox = $(selector)
            scroller = chatBox.find('.chat-box-messages')
            helpers.scrollToBottom(scroller)
          })
        } else {
          chatMessage = createChatMessageFromUser(data.fromUser, data.message)
          chatMessageList = chatBox.find('.chat-message-list:first')
          chatMessageList.append(chatMessage)
          scroller = chatBox.find('.chat-box-messages')
          helpers.scrollToBottom(scroller)
        }

        helpers.UI.playSound('receivedChatMessage')
      }

      $.event.trigger('$trudesk:chat:message', data)

      // Ajaxify Any ticket links
      $('body').ajaxify()
    })

    socket.removeAllListeners('chatTyping')
    socket.on('chatTyping', function (data) {
      $.event.trigger('$trudesk:chat:typing', data)
      var chatBox = $('div[data-conversation-id="' + data.cid + '"]')
      var isTypingDiv = chatBox.find('.user-is-typing-wrapper')
      isTypingDiv.removeClass('hide')
      var scroller = chatBox.find('.chat-box-messages')
      if (scroller.length > 0) {
        // Only scroll if the scroller is on bottom
        if (scroller.scrollTop() + window.innerHeight >= scroller[0].scrollHeight) {
          helpers.scrollToBottom(scroller)
        }
      }

      scroller = $('#message-content')
      if (scroller.length > 0) {
        // Only scroll if the scroller is on bottom
        if (scroller.scrollTop() + window.innerHeight >= scroller[0].scrollHeight) {
          helpers.scrollToBottom(scroller)
        }
      }
    })

    socket.removeAllListeners('chatStopTyping')
    socket.on('chatStopTyping', function (data) {
      $.event.trigger('$trudesk:chat:stoptyping', data)
    })

    socket.removeAllListeners('leftChatServer')
    socket.on('leftChatServer', function (data) {
      $.event.trigger('$trudesk:chat:leftchatserver', data)
    })

    $(window).on('$trudesk:chat:stoptyping.chatSystem', function (event, data) {
      var chatBox = []
      var scroller
      chatBox[0] = $('#message-content[data-conversation-id="' + data.cid + '"]')
      chatBox[1] = $('.chat-box[data-conversation-id="' + data.cid + '"]')
      for (var i = 0; i < chatBox.length; i++) {
        chatBox[i].find('.user-is-typing-wrapper').addClass('hide')
        scroller = chatBox[i].find('.chat-box-messages')
        if (scroller.length > 0) {
          if (scroller.scrollTop() === scroller[0].scrollHeight) {
            helpers.scrollToBottom(scroller)
          }
        }
      }

      scroller = $('#message-content')
      if (scroller.length > 0) {
        // Only scroll if the scroller is on bottom
        if (scroller.scrollTop() === scroller[0].scrollHeight) {
          helpers.scrollToBottom(scroller)
        }
      }
    })
  }

  var typingTimeout = {}
  var isTyping = {}
  function stopTyping (cid, to) {
    isTyping[cid] = false
    typingTimeout[cid] = undefined
    var loggedInAccountId = loggedInAccount._id
    socket.emit('chatStopTyping', {
      cid: cid,
      to: to,
      from: loggedInAccountId
    })
  }

  chatClient.stopTyping = function (cid, to, complete) {
    stopTyping(cid, to)

    if (_.isFunction(complete)) {
      return complete()
    }
  }

  chatClient.startTyping = function (cid, userid, complete) {
    if (isTyping[cid]) {
      clearTimeout(typingTimeout[cid])
      typingTimeout[cid] = setTimeout(stopTyping, 5000, cid, userid)

      if (_.isFunction(complete)) {
        return complete()
      }
    } else {
      socket.emit('chatTyping', {
        cid: cid,
        to: userid,
        from: loggedInAccount._id
      })

      isTyping[cid] = true
      if (typingTimeout[cid] === undefined) {
        typingTimeout[cid] = setTimeout(stopTyping, 5000, cid, userid)
      }

      if (_.isFunction(complete)) {
        return complete()
      }
    }
  }

  chatClient.bindActions = function () {
    $(document).ready(function () {
      $('*[data-action="startChat"]').each(function () {
        var self = $(this)
        self.off('click')
        self.click(function (e) {
          var userId = self.attr('data-chatUser')
          socket.emit('spawnChatWindow', userId)
          UIKit.offcanvas.hide()
          e.preventDefault()
        })
      })
    })
  }

  function bindChatWindowActions (convoId) {
    var $chatBox = $('.chat-box[data-conversation-id="' + convoId + '"]')
    if ($chatBox.length < 1) {
      return false
    }

    var $textarea = $chatBox.find('textarea.textAreaAutogrow')
    var $chatBoxText = $chatBox.find('.chat-box-text')
    var $chatCloseButton = $chatBox.find('.chatCloseBtn')
    var $chatTitleBar = $chatBox.find('.chat-box-title')

    $textarea.off('keyup')
    $textarea.off('keydown')
    $textarea.on('keydown', function (e) {
      if (e.keyCode === 13) {
        return
      }

      var self = $(this)
      var cid = self
        .parent()
        .parent()
        .attr('data-conversation-id')
      var user = self
        .parent()
        .parent()
        .attr('data-chat-userid')

      if (cid === undefined || user === undefined) {
        console.log('Invalid Conversation ID or User ID')
        return
      }

      chatClient.startTyping(cid, user)
    })

    $textarea.autogrow({
      postGrowCallback: chatBoxTextAreaGrowCallback,
      enterPressed: function (self, v) {
        var messages = self.parent().siblings('.chat-box-messages')
        var cid = self
          .parent()
          .parent()
          .attr('data-conversation-id')
        var userId = self.parents('.chat-box').attr('data-chat-userid')
        helpers.scrollToBottom(messages)
        if (v.length < 1) return

        // Send Message
        chatClient.sendChatMessage(cid, userId, v, function () {
          clearTimeout(typingTimeout[cid])
          stopTyping(cid, userId)
        })
      }
    })

    $chatBoxText.off('click')
    $chatBoxText.click(function (e) {
      if (
        $(this)
          .children('textarea')
          .is(':focus')
      ) {
        e.stopPropagation()
        return false
      }

      $(this)
        .children('textarea')
        .focus()
      var val = $(this)
        .children('textarea')
        .val()
      $(this)
        .children('textarea')
        .val('')
        .val(val)
    })

    $chatCloseButton.off('click')
    $chatCloseButton.click(function (e) {
      e.preventDefault()
      $(this)
        .parents('.chat-box[data-chat-userid]')
        .parent()
        .remove()

      var $loggedInAccountId = loggedInAccount._id
      var cid = $chatCloseButton.parents('.chat-box[data-conversation-id]').attr('data-conversation-id')
      socket.emit('saveChatWindow', {
        userId: $loggedInAccountId,
        convoId: cid,
        remove: true
      })
    })

    $chatTitleBar.off('click')
    $chatTitleBar.click(function () {
      var p = $(this).parents('.chat-box-position')
      if (p.css('top') === '-280px') {
        p.animate(
          {
            top: -29
          },
          250
        )
      } else {
        p.animate(
          {
            top: -280
          },
          250
        )
      }
    })
  }

  // Make this return messages with single HTTP request
  function startConversation (owner, receiver, callback) {
    if (owner === receiver) {
      return callback('Invalid Participants')
    }

    $.ajax({
      url: '/api/v1/messages/conversation/start',
      type: 'POST',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify({
        owner: owner,
        participants: [owner, receiver]
      }),
      success: function (data) {
        $.ajax({
          url: '/api/v1/messages/conversation/' + data.conversation._id,
          type: 'GET',
          success: function (d) {
            var userMeta =
              data.conversation.userMeta[
                _.findIndex(data.conversation.userMeta, function (item) {
                  return item.userId.toString() === owner.toString()
                })
              ]
            if (userMeta && userMeta.deletedAt) {
              d.messages = _.filter(d.messages, function (message) {
                return moment(message.createdAt) > moment(userMeta.deletedAt)
              })
            }
            data.conversation.messages = d.messages
            return callback(null, data.conversation)
          },
          error: function (err) {
            return callback(err)
          }
        })
      },
      error: function (err) {
        return callback(err)
      }
    })
  }

  function loadChatMessages (chatBox, messageArray) {
    var to = chatBox.attr('data-chat-userid')

    var chatMessage

    var chatMessageList

    var scroller

    messageArray.reverse()

    _.each(messageArray, function (m) {
      if (m.owner._id === to) {
        chatMessage = createChatMessageFromUser(m.owner, m.body)
        chatMessageList = chatBox.find('.chat-message-list:first')
        chatMessageList.append(chatMessage)
        scroller = chatBox.find('.chat-box-messages')
        helpers.scrollToBottom(scroller)
      } else {
        chatMessage = createChatMessageDiv(m.body)
        chatMessageList = chatBox.find('.chat-message-list:first')
        scroller = chatBox.find('.chat-box-messages')
        chatMessageList.append(chatMessage)
        helpers.scrollToBottom(scroller)
      }
    })

    // Ajaxify Any ticket links
    $('body').ajaxify()
  }

  chatClient.sendChatMessage = function (cid, toUserId, message, complete) {
    var loggedInAccountId = loggedInAccount._id
    $.ajax({
      url: '/api/v1/messages/send',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        cId: cid,
        owner: loggedInAccountId,
        body: message
      }),
      success: function (data) {
        socket.emit('chatMessage', {
          conversation: cid,
          to: toUserId,
          from: loggedInAccountId,
          type: 's',
          messageId: data.message._id,
          message: data.message.body
        })

        if (_.isFunction(complete)) {
          return complete()
        }
      },
      error: function (error) {
        console.log('[trudesk:chat:bindActions] Error')
        console.log(error)
        helpers.UI.showSnackbar(error, true)

        if (complete !== undefined && _.isFunction(complete)) {
          return complete(error)
        }
      }
    })
  }

  chatClient.getOpenWindows = function () {
    socket.emit('getOpenChatWindows')
  }

  chatClient.openChatWindow = function (user, complete) {
    var isOnMessagesPage =
      $('#__page')
        .text()
        .toLowerCase() === 'messages'
    if (isOnMessagesPage) {
      if (_.isFunction(complete)) {
        return complete()
      }
      return true
    }
    var loggedInAccountId = loggedInAccount._id
    if (_.isUndefined(loggedInAccountId)) {
      return helpers.UI.showSnackbar('Unable to start chat', true)
    }

    startConversation(loggedInAccountId, user._id, function (err, convo) {
      if (err) {
        console.log('[trudesk:chat:openChatWindow] - Error')
        console.log(err)
        // return helpers.UI.showSnackbar('Unable to start chat', true);
      }

      var username = loggedInAccount.username
      if (user.username === username) return true

      var cWindow = $('.chat-box-position').find('.chat-box[data-chat-userid="' + user._id + '"]')
      if (cWindow.length > 0) {
        // loadChatMessages($('.chat-box-position').find('.chat-box[data-chat-userid="' + user._id + '"]'), convo.messages);
        cWindow.find('textarea').focus()
        helpers.scrollToBottom(cWindow.find('.chat-box-messages'))
        return true
      }

      var imageUrl = user.image
      if (_.isUndefined(imageUrl)) imageUrl = 'defaultProfile.jpg'

      var userMeta =
        convo.userMeta[
          _.findIndex(convo.userMeta, function (item) {
            return item.userId.toString() === loggedInAccountId.toString()
          })
        ]
      var html = '<div class="chat-box-position">'
      html += '<div class="chat-box" data-conversation-id="' + convo._id + '" data-chat-userid="' + user._id + '">'
      html += '<div class="chat-box-title">'
      html += '<div class="chat-box-title-buttons right">'
      html += '<a class="chatCloseBtn"><i class="material-icons material-icons-small">close</i></a>'
      html += '</div>'
      html += '<h4 class="chat-box-title-text-wrapper">'
      html += '<a href="#">' + user.fullname + '</a>'
      html += '</h4>'
      html += '</div>'
      html += '<div class="chat-box-messages scrollable">'
      if (userMeta && userMeta.deletedAt) {
        html +=
          '<div class="chat-box-deletedAt">Conversation deleted at ' +
          moment(userMeta.deletedAt).format(helpers.getShortDateFormat() + ' ' + helpers.getTimeFormat()) +
          '</div>'
      }
      html += '<div class="chat-message-list" data-chat-userid="' + user._id + '">'
      html += '</div>'
      html += '<div class="user-is-typing-wrapper hide">'
      html +=
        '<div class="chat-user-profile"><a href="#"><img src="/uploads/users/' +
        imageUrl +
        '" alt="' +
        user.fullname +
        '"/></a></div>'
      html += '<div class="user-is-typing"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>'
      html += '</div>'
      html += '</div>'
      html += '<div class="chat-box-text">'
      html += '<textarea class="textAreaAutogrow autogrow-short" name="message" rows="1"></textarea>'
      html += '</div>'
      html += '</div>'
      html += '</div>'

      $('.chat-box-wrapper').append(html)
      $('.chat-box[data-chat-userid="' + user._id + '"] textarea').focus()
      loadChatMessages($('.chat-box-position').find('.chat-box[data-chat-userid="' + user._id + '"]'), convo.messages)
      helpers.hideAllpDropDowns()
      helpers.setupScrollers('.chat-box[data-chat-userid="' + user._id + '"] > div.scrollable')
      bindChatWindowActions(convo._id)
      helpers.scrollToBottom($('.chat-box[data-chat-userid="' + user._id + '"]').find('.chat-box-messages'))

      socket.emit('saveChatWindow', {
        userId: loggedInAccountId,
        convoId: convo._id,
        remove: false
      })

      // Fire when window is done loading
      if (_.isFunction(complete)) {
        return complete()
      }
    })
  }

  chatClient.setUserIdle = function () {
    socket.emit('$trudesk:setUserIdle')
  }

  chatClient.setUserActive = function () {
    socket.emit('$trudesk:setUserActive')
  }

  chatClient.updateOnlineBubbles = function () {
    socket.emit('$trudesk:chat:updateOnlineBubbles')
  }

  function updateOnlineBubbles (usersOnline) {
    $('span[data-user-status-id]').each(function () {
      $(this)
        .removeClass('user-online user-idle')
        .addClass('user-offline')
    })

    var onlineUserList = usersOnline.sortedUserList
    var idleUserList = usersOnline.sortedIdleList

    _.each(onlineUserList, function (v) {
      var $bubble = $('span[data-user-status-id="' + v.user._id + '"]')
      $bubble.each(function () {
        var self = $(this)

        self.removeClass('user-offline user-idle').addClass('user-online')
      })
    })

    _.each(idleUserList, function (v) {
      var $bubble = $('span[data-user-status-id="' + v.user._id + '"]')
      $bubble.each(function () {
        var self = $(this)

        self.removeClass('user-offline user-online').addClass('user-idle')
      })
    })
  }

  function createChatMessageDiv (message) {
    var html = '<div class="chat-message chat-message-user uk-clearfix" data-chat-messageId="">'
    html += '<div class="chat-text-wrapper">'
    html += '<div class="chat-text chat-text-user">'
    html += '<div class="chat-text-inner"><span>' + message.replace(/\n\r?/g, '<br>') + '</span>'
    html += '</div></div></div></div>'

    return html
  }

  function createChatMessageFromUser (user, message) {
    var imageUrl = user.image
    if (_.isUndefined(imageUrl)) imageUrl = 'defaultProfile.jpg'
    var html = '<div class="chat-message uk-clearfix">'
    html +=
      '<div class="chat-user-profile"><a href="#"><img src="/uploads/users/' +
      imageUrl +
      '" alt="' +
      user.fullname +
      '"/></a></div>'
    html += '<div class="chat-text-wrapper">'
    html += '<div class="chat-text">'
    html += '<div class="chat-text-inner">'
    html += '<span>' + message.replace(/\n\r?/g, '<br>') + '</span>'
    html += '</div>'
    html += '</div>'
    html += '</div>'
    html += '</div>'

    return html
  }

  function chatBoxTextAreaGrowCallback (self, oldHeight, newHeight) {
    if (oldHeight === newHeight) {
      return true
    }

    // var textAreaHeight = self.parent().outerHeight();
    var messages = self.parent().siblings('.chat-box-messages')
    messages.css({ 'min-height': '170px', 'max-height': '220px' })
    self.parent().css({ 'max-height': '77px', 'min-height': '16px' })

    if (newHeight < 80) {
      messages.height(messages.height() - (newHeight - oldHeight))
    }
    // else
    //     messages.height(156);

    messages.scrollTop(messages[0].scrollHeight)
  }

  return chatClient
})
