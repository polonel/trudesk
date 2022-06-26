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
var _ = require('lodash')
var async = require('async')
var winston = require('winston')
var marked = require('marked')
var sanitizeHtml = require('sanitize-html')
var utils = require('../helpers/utils')
var emitter = require('../emitter')
var socketEvents = require('./socketEventConsts')
var ticketSchema = require('../models/ticket')
var prioritySchema = require('../models/ticketpriority')
var userSchema = require('../models/user')
var roleSchema = require('../models/role')
var permissions = require('../permissions')
var xss = require('xss')

var events = {}

function register (socket) {
  events.onUpdateTicketGrid(socket)
  events.onUpdateTicketStatus(socket)
  events.onUpdateComments(socket)
  events.onUpdateAssigneeList(socket)
  events.onSetAssignee(socket)
  events.onUpdateTicketTags(socket)
  events.onClearAssignee(socket)
  events.onSetTicketType(socket)
  events.onSetTicketPriority(socket)
  events.onSetTicketGroup(socket)
  events.onSetTicketDueDate(socket)
  events.onSetTicketIssue(socket)
  events.onSetCommentText(socket)
  events.onRemoveComment(socket)
  events.onSetNoteText(socket)
  events.onRemoveNote(socket)
  events.onRefreshTicketAttachments(socket)
}

function eventLoop () {}

events.onUpdateTicketGrid = function (socket) {
  socket.on('ticket:updategrid', function () {
    utils.sendToAllConnectedClients(io, 'ticket:updategrid')
  })
}

events.onUpdateTicketStatus = function (socket) {
  socket.on('updateTicketStatus', function (data) {
    var ticketId = data.ticketId
    var ownerId = socket.request.user._id
    var status = data.status

    ticketSchema.getTicketById(ticketId, function (err, ticket) {
      if (err) return true

      ticket.setStatus(ownerId, status, function (err, t) {
        if (err) return true

        t.save(function (err, t) {
          if (err) return true

          // emitter.emit('ticket:updated', t)
          utils.sendToAllConnectedClients(io, 'updateTicketStatus', {
            tid: t._id,
            owner: t.owner,
            status: status
          })
        })
      })
    })
  })
}

events.onUpdateComments = function (socket) {
  socket.on('updateComments', function (data) {
    var ticketId = data.ticketId

    ticketSchema.getTicketById(ticketId, function (err, ticket) {
      if (err) return true

      utils.sendToAllConnectedClients(io, 'updateComments', ticket)
    })
  })
}

events.onUpdateAssigneeList = function (socket) {
  socket.on(socketEvents.TICKETS_ASSIGNEE_LOAD, function () {
    roleSchema.getAgentRoles(function (err, roles) {
      if (err) return true
      userSchema.find({ role: { $in: roles }, deleted: false }, function (err, users) {
        if (err) return true

        var sortedUser = _.sortBy(users, 'fullname')

        utils.sendToSelf(socket, socketEvents.TICKETS_ASSIGNEE_LOAD, sortedUser)
      })
    })
  })
}

events.onSetAssignee = function (socket) {
  socket.on(socketEvents.TICKETS_ASSIGNEE_SET, function (data) {
    var userId = data._id
    var ownerId = socket.request.user._id
    var ticketId = data.ticketId
    ticketSchema.getTicketById(ticketId, function (err, ticket) {
      if (err) return true

      async.parallel(
        {
          setAssignee: function (callback) {
            ticket.setAssignee(ownerId, userId, function (err, ticket) {
              callback(err, ticket)
            })
          },
          subscriber: function (callback) {
            ticket.addSubscriber(userId, function (err, ticket) {
              callback(err, ticket)
            })
          }
        },
        function (err, results) {
          if (err) return true

          ticket = results.subscriber
          ticket.save(function (err, ticket) {
            if (err) return true
            ticket.populate('assignee', function (err, ticket) {
              if (err) return true

              emitter.emit('ticket:subscriber:update', {
                user: userId,
                subscribe: true
              })

              emitter.emit(socketEvents.TICKETS_ASSIGNEE_SET, {
                assigneeId: ticket.assignee._id,
                ticketId: ticket._id,
                ticketUid: ticket.uid,
                hostname: socket.handshake.headers.host
              })

              // emitter.emit('ticket:updated', ticket)
              utils.sendToAllConnectedClients(io, socketEvents.TICKETS_ASSIGNEE_UPDATE, ticket)
            })
          })
        }
      )
    })
  })
}

events.onSetTicketType = function (socket) {
  socket.on(socketEvents.TICKETS_TYPE_SET, function (data) {
    const ticketId = data._id
    const typeId = data.value
    const ownerId = socket.request.user._id

    if (_.isUndefined(ticketId) || _.isUndefined(typeId)) return true
    ticketSchema.getTicketById(ticketId, function (err, ticket) {
      if (err) return true
      ticket.setTicketType(ownerId, typeId, function (err, t) {
        if (err) return true

        t.save(function (err, tt) {
          if (err) return true

          ticketSchema.populate(tt, 'type', function (err) {
            if (err) return true

            // emitter.emit('ticket:updated', tt)
            utils.sendToAllConnectedClients(io, socketEvents.TICKETS_UI_TYPE_UPDATE, tt)
          })
        })
      })
    })
  })
}

events.onUpdateTicketTags = socket => {
  socket.on(socketEvents.TICKETS_UI_TAGS_UPDATE, async data => {
    const ticketId = data.ticketId
    if (_.isUndefined(ticketId)) return true

    try {
      const ticket = await ticketSchema.findOne({ _id: ticketId }).populate('tags')

      utils.sendToAllConnectedClients(io, socketEvents.TICKETS_UI_TAGS_UPDATE, ticket)
    } catch (e) {
      // Blank
    }
  })
}

events.onSetTicketPriority = function (socket) {
  socket.on(socketEvents.TICKETS_PRIORITY_SET, function (data) {
    const ticketId = data._id
    const priority = data.value
    const ownerId = socket.request.user._id

    if (_.isUndefined(ticketId) || _.isUndefined(priority)) return true
    ticketSchema.getTicketById(ticketId, function (err, ticket) {
      if (err) return true
      prioritySchema.getPriority(priority, function (err, p) {
        if (err) {
          winston.debug(err)
          return true
        }

        ticket.setTicketPriority(ownerId, p, function (err, t) {
          if (err) return true
          t.save(function (err, tt) {
            if (err) return true

            // emitter.emit('ticket:updated', tt)
            utils.sendToAllConnectedClients(io, socketEvents.TICKETS_UI_PRIORITY_UPDATE, tt)
          })
        })
      })
    })
  })
}

events.onClearAssignee = socket => {
  socket.on(socketEvents.TICKETS_ASSIGNEE_CLEAR, async id => {
    const ownerId = socket.request.user._id

    try {
      const ticket = await ticketSchema.findOne({ _id: id })
      const updatedTicket = await ticket.clearAssignee(ownerId)
      const savedTicket = await updatedTicket.save()

      // emitter.emit('ticket:updated', tt)
      utils.sendToAllConnectedClients(io, socketEvents.TICKETS_ASSIGNEE_UPDATE, savedTicket)
    } catch (e) {
      // Blank
    }
  })
}

events.onSetTicketGroup = function (socket) {
  socket.on(socketEvents.TICKETS_GROUP_SET, function (data) {
    const ticketId = data._id
    const groupId = data.value
    const ownerId = socket.request.user._id

    if (_.isUndefined(ticketId) || _.isUndefined(groupId)) return true

    ticketSchema.getTicketById(ticketId, function (err, ticket) {
      if (err) return true

      ticket.setTicketGroup(ownerId, groupId, function (err, t) {
        if (err) return true

        t.save(function (err, tt) {
          if (err) return true

          ticketSchema.populate(tt, 'group', function (err) {
            if (err) return true

            // emitter.emit('ticket:updated', tt)
            utils.sendToAllConnectedClients(io, socketEvents.TICKETS_UI_GROUP_UPDATE, tt)
          })
        })
      })
    })
  })
}

events.onSetTicketDueDate = function (socket) {
  socket.on(socketEvents.TICKETS_DUEDATE_SET, function (data) {
    const ticketId = data._id
    const dueDate = data.value
    const ownerId = socket.request.user._id

    if (_.isUndefined(ticketId)) return true

    ticketSchema.getTicketById(ticketId, function (err, ticket) {
      if (err) return true

      ticket.setTicketDueDate(ownerId, dueDate, function (err, t) {
        if (err) return true

        t.save(function (err, tt) {
          if (err) return true

          // emitter.emit('ticket:updated', tt)
          utils.sendToAllConnectedClients(io, socketEvents.TICKETS_UI_DUEDATE_UPDATE, tt)
        })
      })
    })
  })
}

events.onSetTicketIssue = function (socket) {
  socket.on('setTicketIssue', function (data) {
    var ticketId = data.ticketId
    var issue = data.issue
    var subject = data.subject
    var ownerId = socket.request.user._id
    if (_.isUndefined(ticketId) || _.isUndefined(issue)) return true

    ticketSchema.getTicketById(ticketId, function (err, ticket) {
      if (err) return true

      ticket.setSubject(ownerId, subject, function (err, ticket) {
        if (err) return true

        ticket.setIssue(ownerId, issue, function (err, t) {
          if (err) return true

          t.save(function (err, tt) {
            if (err) return true

            utils.sendToAllConnectedClients(io, 'updateTicketIssue', tt)
          })
        })
      })
    })
  })
}

events.onSetCommentText = function (socket) {
  socket.on('setCommentText', function (data) {
    var ownerId = socket.request.user._id
    var ticketId = data.ticketId
    var commentId = data.commentId
    var comment = data.commentText
    if (_.isUndefined(ticketId) || _.isUndefined(commentId) || _.isUndefined(comment)) return true

    marked.setOptions({
      breaks: true
    })

    comment = sanitizeHtml(comment).trim()

    var markedComment = xss(marked.parse(comment))

    ticketSchema.getTicketById(ticketId, function (err, ticket) {
      if (err) return winston.error(err)

      ticket.updateComment(ownerId, commentId, markedComment, function (err) {
        if (err) return winston.error(err)
        ticket.save(function (err, tt) {
          if (err) return winston.error(err)

          utils.sendToAllConnectedClients(io, 'updateComments', tt)
        })
      })
    })
  })
}

events.onRemoveComment = function (socket) {
  socket.on('removeComment', function (data) {
    var ownerId = socket.request.user._id
    var ticketId = data.ticketId
    var commentId = data.commentId

    if (_.isUndefined(ticketId) || _.isUndefined(commentId)) return true

    ticketSchema.getTicketById(ticketId, function (err, ticket) {
      if (err) return true

      ticket.removeComment(ownerId, commentId, function (err, t) {
        if (err) return true

        t.save(function (err, tt) {
          if (err) return true

          utils.sendToAllConnectedClients(io, 'updateComments', tt)
        })
      })
    })
  })
}

events.onSetNoteText = function (socket) {
  socket.on('$trudesk:tickets:setNoteText', function (data) {
    var ownerId = socket.request.user._id
    var ticketId = data.ticketId
    var noteId = data.noteId
    var note = data.noteText
    if (_.isUndefined(ticketId) || _.isUndefined(noteId) || _.isUndefined(note)) return true

    marked.setOptions({
      breaks: true
    })
    var markedNote = xss(marked.parse(note))

    ticketSchema.getTicketById(ticketId, function (err, ticket) {
      if (err) return winston.error(err)

      ticket.updateNote(ownerId, noteId, markedNote, function (err) {
        if (err) return winston.error(err)
        ticket.save(function (err, tt) {
          if (err) return winston.error(err)

          utils.sendToAllConnectedClients(io, 'updateNotes', tt)
        })
      })
    })
  })
}

events.onRemoveNote = function (socket) {
  socket.on('$trudesk:tickets:removeNote', function (data) {
    var ownerId = socket.request.user._id
    var ticketId = data.ticketId
    var noteId = data.noteId
    if (_.isUndefined(ticketId) || _.isUndefined(noteId)) return true

    ticketSchema.getTicketById(ticketId, function (err, ticket) {
      if (err) return true

      ticket.removeNote(ownerId, noteId, function (err, t) {
        if (err) return true

        t.save(function (err, tt) {
          if (err) return true

          utils.sendToAllConnectedClients(io, 'updateNotes', tt)
        })
      })
    })
  })
}

events.onRefreshTicketAttachments = function (socket) {
  socket.on('refreshTicketAttachments', function (data) {
    var ticketId = data.ticketId
    if (_.isUndefined(ticketId)) return true

    ticketSchema.getTicketById(ticketId, function (err, ticket) {
      if (err) return true

      var user = socket.request.user
      if (_.isUndefined(user)) return true

      var canRemoveAttachments = permissions.canThis(user.role, 'tickets:removeAttachment')

      var data = {
        ticket: ticket,
        canRemoveAttachments: canRemoveAttachments
      }

      utils.sendToAllConnectedClients(io, 'updateTicketAttachments', data)
    })
  })
}

module.exports = {
  events: events,
  eventLoop: eventLoop,
  register: register
}
