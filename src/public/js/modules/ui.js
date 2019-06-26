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
 *  Updated:    1/20/19 4:46 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

define('modules/ui', [
  'jquery',
  'underscore',
  'uikit',
  'modules/helpers',
  'modules/navigation',
  'modules/socket.io/noticeUI',
  'modules/socket.io/ticketsUI',
  'modules/socket.io/logs.io',
  'history'
], function ($, _, UIKit, helpers, nav, noticeUI, ticketsUI, logsIO) {
  var socketUi = {}

  var socket

  socketUi.init = function (sock) {
    // loggedInAccount = window.trudeskSessionService.getUser();
    socketUi.socket = socket = sock

    this.flushRoles()
    this.onReconnect()
    this.onDisconnect()
    this.updateUi()

    // Events
    this.onTicketCreated()
    this.onProfileImageUpdate()

    // Logs
    this.updateServerLogs(socket)

    // Backup / Restore
    this.onShowRestoreOverlay()
    this.onRestoreComplete()
  }

  socketUi.onShowRestoreOverlay = function () {
    socket.removeAllListeners('$trudesk:restore:showOverlay')
    socket.on('$trudesk:restore:showOverlay', function () {
      $('#restoreBackupOverlay').removeClass('hide')
    })
  }

  socketUi.emitShowRestoreOverlay = function () {
    socket.emit('$trudesk:restore:showOverlay')
  }

  socketUi.onRestoreComplete = function () {
    socket.removeAllListeners('$trudesk:restore:complete')
    socket.on('$trudesk:restore:complete', function () {
      location.reload()
    })
  }

  socketUi.emitRestoreComplete = function () {
    socket.emit('$trudesk:restore:complete')
  }

  socketUi.setShowNotice = function (notice) {
    noticeUI.setShowNotice(socket, notice)
  }

  socketUi.setClearNotice = function () {
    noticeUI.setClearNotice(socket)
  }

  socketUi.updateShowNotice = noticeUI.updateShowNotice
  socketUi.updateClearNotice = noticeUI.updateClearNotice

  socketUi.updateSubscribe = ticketsUI.updateSubscribe

  socketUi.updateServerLogs = logsIO.getLogData
  socketUi.fetchServerLogs = function () {
    socket.emit('logs:fetch')
  }
  socketUi.flushRoles = function () {
    socket.removeAllListeners('$trudesk:flushRoles')
    socket.on('$trudesk:flushRoles', function () {
      helpers.flushRoles()
    })
  }

  socketUi.sendUpdateTicketStatus = function (id, status) {
    socket.emit('updateTicketStatus', { ticketId: id, status: status })
  }

  socketUi.onReconnect = function () {
    socket.removeAllListeners('reconnect')
    socket.on('reconnect', function () {
      helpers.UI.hideDisconnectedOverlay()
    })
  }

  socketUi.onDisconnect = function () {
    socket.removeAllListeners('disconnect')
    socket.on('disconnect', function () {
      helpers.UI.showDisconnectedOverlay()
    })

    socket.removeAllListeners('reconnect_attempt')
    socket.on('reconnect_attempt', function () {
      helpers.UI.showDisconnectedOverlay()
    })

    socket.removeAllListeners('connect_timeout')
    socket.on('connect_timeout', function () {
      helpers.UI.showDisconnectedOverlay()
    })
  }

  socketUi.sendUpdateTicketStatus = function (id, status) {
    socket.emit('updateTicketStatus', { ticketId: id, status: status })
  }

  socketUi.clearAssignee = function (id) {
    socket.emit('clearAssignee', id)
  }

  socketUi.setTicketType = function (ticketId, typeId) {
    var payload = {
      ticketId: ticketId,
      typeId: typeId
    }

    socket.emit('setTicketType', payload)
  }
  socketUi.setTicketPriority = function (ticketId, priority) {
    var payload = {
      ticketId: ticketId,
      priority: priority
    }

    socket.emit('setTicketPriority', payload)
  }
  socketUi.setTicketGroup = function (ticketId, groupId) {
    var payload = {
      ticketId: ticketId,
      groupId: groupId
    }

    socket.emit('setTicketGroup', payload)
  }
  socketUi.setTicketDueDate = function (ticketId, dueDate) {
    var payload = {
      ticketId: ticketId,
      dueDate: dueDate
    }

    socket.emit('setTicketDueDate', payload)
  }
  socketUi.setTicketIssue = function (ticketId, issue, subject) {
    var payload = {
      ticketId: ticketId,
      issue: issue,
      subject: subject
    }

    socket.emit('setTicketIssue', payload)
  }
  socketUi.setCommentText = function (ticketId, commentId, commentText) {
    var payload = {
      ticketId: ticketId,
      commentId: commentId,
      commentText: commentText
    }

    socket.emit('setCommentText', payload)
  }
  socketUi.removeComment = function (ticketId, commentId) {
    var payload = {
      ticketId: ticketId,
      commentId: commentId
    }

    socket.emit('removeComment', payload)
  }
  socketUi.setNoteText = function (ticketId, noteId, noteText) {
    var payload = {
      ticketId: ticketId,
      noteId: noteId,
      noteText: noteText
    }

    socket.emit('$trudesk:tickets:setNoteText', payload)
  }
  socketUi.removeNote = function (ticketId, noteId) {
    var payload = {
      ticketId: ticketId,
      noteId: noteId
    }

    socket.emit('$trudesk:tickets:removeNote', payload)
  }
  socketUi.refreshTicketAttachments = function (ticketId) {
    var payload = {
      ticketId: ticketId
    }

    socket.emit('refreshTicketAttachments', payload)
  }
  socketUi.refreshTicketTags = function (ticketId) {
    var payload = {
      ticketId: ticketId
    }

    socket.emit('refreshTicketTags', payload)
  }

  socketUi.updateUi = function () {
    $(document).ready(function () {
      var $button = $('*[data-updateUi]')
      $.each($button, function () {
        var self = $(this)
        var $action = self.attr('data-updateUi')
        if ($action.toLowerCase() === 'online-users') {
          self.off('click', updateUsersBtnClicked)
          self.on('click', updateUsersBtnClicked)
        } else if ($action.toLowerCase() === 'assigneelist') {
          self.off('click', updateAssigneeList)
          self.on('click', updateAssigneeList)
        } else if ($action.toLowerCase() === 'notifications') {
          self.off('click', updateNotificationsClicked)
          self.on('click', updateNotificationsClicked)
        }
      })
    })
  }

  function updateUsersBtnClicked (e) {
    e.preventDefault()
    socket.emit('updateUsers')
  }

  socketUi.updateUsers = function () {
    socket.emit('updateUsers')
  }

  function updateAssigneeList (e) {
    socket.emit('updateAssigneeList')
    e.preventDefault()
  }

  function updateNotificationsClicked (e) {
    socket.emit('updateNotifications')
    e.preventDefault()
  }

  socketUi.clearNotifications = function () {
    socket.emit('clearNotifications')

    helpers.hideAllpDropDowns()
  }

  socketUi.markNotificationRead = function (_id) {
    socket.emit('markNotificationRead', _id)

    helpers.hideAllpDropDowns()
  }

  socketUi.updateNotifications = function () {
    socket.emit('updateNotifications')
  }

  socketUi.onTicketCreated = function () {
    socket.removeAllListeners('ticket:created')
    socket.on('ticket:created', function () {
      socket.emit('updateNotifications')
      var audio = $('audio#newticketaudio')
      if (audio.length > 0) audio.trigger('play')
      $('a#refreshTicketGrid').trigger('click')
    })
  }

  socketUi.onProfileImageUpdate = function () {
    socket.removeAllListeners('trudesk:profileImageUpdate')
    socket.on('trudesk:profileImageUpdate', function (data) {
      var profileImage = $('#profileImage[data-userid="' + data.userid + '"]')
      if (profileImage.length > 0) {
        profileImage.attr('src', '/uploads/users/' + data.img + '?r=' + new Date().getTime())
      }
    })
  }

  return socketUi
})
