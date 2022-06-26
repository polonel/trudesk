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
  'serverSocket/socketEventConsts',
  'jquery',
  'underscore',
  'uikit',
  'modules/helpers',
  'modules/navigation',
  'modules/socket.io/noticeUI',
  'modules/socket.io/ticketsUI',
  'modules/socket.io/logs.io',
  'history'
], function (socketEvents, $, _, UIKit, helpers, nav, noticeUI, ticketsUI, logsIO) {
  var socketUi = {}

  var socket

  socketUi.init = function (sock) {
    socketUi.socket = socket = sock

    this.flushRoles()
    // this.onReconnect()
    // this.onDisconnect()
    // this.updateUi()

    // Events
    this.onProfileImageUpdate()

    // Logs
    // this.updateServerLogs(socket)

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
    socket.removeAllListeners(socketEvents.ROLES_FLUSH)
    socket.on(socketEvents.ROLES_FLUSH, function () {
      helpers.flushRoles()
    })
  }

  socketUi.sendUpdateTicketStatus = function (id, status) {
    socket.emit('updateTicketStatus', { ticketId: id, status: status })
  }

  socketUi.onReconnect = function () {
    socket.io.removeAllListeners('reconnect')
    socket.io.on('reconnect', function () {
      helpers.UI.hideDisconnectedOverlay()
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
