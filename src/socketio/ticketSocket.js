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
var ticketSchema = require('../models/ticket')
var prioritySchema = require('../models/ticketpriority')
var userSchema = require('../models/user')
var roleSchema = require('../models/role')
var permissions = require('../permissions')

var events = {}

function register (socket) {
  events.onUpdateTicketGrid(socket)
  events.onUpdateTicketStatus(socket)
  events.onUpdateComments(socket)
  events.onUpdateAssigneeList(socket)
  events.onSetAssignee(socket)
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
  events.onRefreshTicketTags(socket)
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
  socket.on('updateAssigneeList', function () {
    roleSchema.getAgentRoles(function (err, roles) {
      if (err) return true
      userSchema.find({ role: { $in: roles }, deleted: false }, function (err, users) {
        if (err) return true

        var sortedUser = _.sortBy(users, 'fullname')

        utils.sendToSelf(socket, 'updateAssigneeList', sortedUser)
      })
    })
  })
}

events.onSetAssignee = function (socket) {
  socket.on('setAssignee', function (data) {
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
              emitter.emit('ticket:setAssignee', {
                assigneeId: ticket.assignee._id,
                ticketId: ticket._id,
                ticketUid: ticket.uid,
                hostname: socket.handshake.headers.host
              })

              // emitter.emit('ticket:updated', ticket)
              utils.sendToAllConnectedClients(io, 'updateAssignee', ticket)
            })
          })
        }
      )
    })
  })
}

events.onSetTicketType = function (socket) {
  socket.on('setTicketType', function (data) {
    var ticketId = data.ticketId
    var typeId = data.typeId
    var ownerId = socket.request.user._id

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
            utils.sendToAllConnectedClients(io, 'updateTicketType', tt)
          })
        })
      })
    })
  })
}

events.onSetTicketPriority = function (socket) {
  socket.on('setTicketPriority', function (data) {
    var ticketId = data.ticketId
    var priority = data.priority
    var ownerId = socket.request.user._id

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
            utils.sendToAllConnectedClients(io, 'updateTicketPriority', tt)
          })
        })
      })
    })
  })
}

events.onClearAssignee = function (socket) {
  socket.on('clearAssignee', function (id) {
    var ticketId = id
    var ownerId = socket.request.user._id
    ticketSchema.getTicketById(ticketId, function (err, ticket) {
      if (err) return true

      ticket.clearAssignee(ownerId, function (err, t) {
        if (err) return true

        t.save(function (err, tt) {
          if (err) return true

          // emitter.emit('ticket:updated', tt)
          utils.sendToAllConnectedClients(io, 'updateAssignee', tt)
        })
      })
    })
  })
}

events.onSetTicketGroup = function (socket) {
  socket.on('setTicketGroup', function (data) {
    var ticketId = data.ticketId
    var groupId = data.groupId
    var ownerId = socket.request.user._id

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
            utils.sendToAllConnectedClients(io, 'updateTicketGroup', tt)
          })
        })
      })
    })
  })
}

events.onSetTicketDueDate = function (socket) {
  socket.on('setTicketDueDate', function (data) {
    var ticketId = data.ticketId
    var dueDate = data.dueDate
    var ownerId = socket.request.user._id

    if (_.isUndefined(ticketId)) return true

    ticketSchema.getTicketById(ticketId, function (err, ticket) {
      if (err) return true

      ticket.setTicketDueDate(ownerId, dueDate, function (err, t) {
        if (err) return true

        t.save(function (err, tt) {
          if (err) return true

          // emitter.emit('ticket:updated', tt)
          utils.sendToAllConnectedClients(io, 'updateTicketDueDate', tt)
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

    var markedComment = marked(comment)

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
    var markedNote = marked(note)

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

events.onRefreshTicketTags = function (socket) {
  socket.on('refreshTicketTags', function (data) {
    var ticketId = data.ticketId
    if (_.isUndefined(ticketId)) return true

    ticketSchema.getTicketById(ticketId, function (err, ticket) {
      if (err) return true

      utils.sendToAllConnectedClients(io, 'updateTicketTags', ticket)
    })
  })
}

module.exports = {
  events: events,
  eventLoop: eventLoop,
  register: register
}
