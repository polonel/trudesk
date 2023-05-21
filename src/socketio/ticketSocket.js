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
var winston = require('../logger')
var marked = require('marked')
var sanitizeHtml = require('sanitize-html')
var utils = require('../helpers/utils')
var emitter = require('../emitter')
var socketEvents = require('./socketEventConsts')
var ticketSchema = require('../models/ticket')
var prioritySchema = require('../models/ticketpriority')
var userSchema = require('../models').UserModel
var roleSchema = require('../models/role')
var permissions = require('../permissions')
var xss = require('xss')
const { PriorityModel } = require('../models')

var events = {}

function register (socket) {
  events.onUpdateTicketGrid(socket)
  events.onUpdateTicketStatus(socket)
  events.onUpdateTicket(socket)
  events.onUpdateAssigneeList(socket)
  events.onSetAssignee(socket)
  events.onUpdateTicketTags(socket)
  events.onClearAssignee(socket)
  events.onSetTicketType(socket)
  events.onSetTicketPriority(socket)
  events.onSetTicketGroup(socket)
  events.onSetTicketDueDate(socket)
  events.onSetTicketIssue(socket)
  events.onCommentNoteSet(socket)
  events.onRemoveCommentNote(socket)
  events.onAttachmentsUIUpdate(socket)
}

function eventLoop () {}

events.onUpdateTicketGrid = function (socket) {
  socket.on('ticket:updategrid', function () {
    utils.sendToAllConnectedClients(io, 'ticket:updategrid')
  })
}

events.onUpdateTicketStatus = socket => {
  socket.on(socketEvents.TICKETS_STATUS_SET, async data => {
    const ticketId = data._id
    const status = data.value
    const ownerId = socket.request.user._id

    try {
      let ticket = await ticketSchema.getTicketById(ticketId)

      ticket = await ticket.setStatus(ownerId, status)
      ticket = await ticket.save()
      // emitter.emit('ticket:updated', t)
      utils.sendToAllConnectedClients(io, socketEvents.TICKETS_UI_STATUS_UPDATE, {
        tid: ticket._id,
        owner: ticket.owner,
        status: status
      })
    } catch (e) {
      // Blank
    }
  })
}

events.onUpdateTicket = function (socket) {
  socket.on(socketEvents.TICKETS_UPDATE, async data => {
    try {
      const ticket = await ticketSchema.getTicketById(data._id)

      utils.sendToAllConnectedClients(io, socketEvents.TICKETS_UPDATE, ticket)
    } catch (error) {
      // Blank
    }
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
    const userId = data._id
    const ownerId = socket.request.user._id
    const ticketId = data.ticketId
    ticketSchema.getTicketById(ticketId, function (err, ticket) {
      if (err) return true
      if (!ticket) {
        winston.warn(`Unable to get ticket with id: ${ticketId}`)
        return true
      }

      async.parallel(
        {
          setAssignee: async function () {
            try {
              const response = await ticket.setAssignee(ownerId, userId)
              Promise.resolve(response)
            } catch (e) {
              await Promise.reject(e)
            }
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
  socket.on(socketEvents.TICKETS_PRIORITY_SET, async function (data) {
    const ticketId = data._id
    const priority = data.value
    const ownerId = socket.request.user._id

    if (_.isUndefined(ticketId) || _.isUndefined(priority)) return true
    try {
      let ticket = await ticketSchema.getTicketById(ticketId)
      const p = await PriorityModel.getPriority(priority)

      ticket = await ticket.setTicketPriority(ownerId, p)
      ticket = await ticket.save()

      utils.sendToAllConnectedClients(io, socketEvents.TICKETS_UI_PRIORITY_UPDATE, ticket)
    } catch (e) {
      winston.warn(e)
      return true
    }
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

events.onSetTicketIssue = socket => {
  socket.on(socketEvents.TICKETS_ISSUE_SET, async data => {
    const ticketId = data._id
    const issue = data.value
    const subject = data.subject
    const ownerId = socket.request.user._id
    if (_.isUndefined(ticketId) || _.isUndefined(issue)) return true

    try {
      let ticket = await ticketSchema.getTicketById(ticketId)
      if (subject !== ticket.subject) ticket = await ticket.setSubject(ownerId, subject)
      if (issue !== ticket.issue) ticket = await ticket.setIssue(ownerId, issue)

      ticket = await ticket.save()

      utils.sendToAllConnectedClients(io, socketEvents.TICKETS_UPDATE, ticket)
    } catch (e) {
      // Blank
    }
  })
}

events.onCommentNoteSet = socket => {
  socket.on(socketEvents.TICKETS_COMMENT_NOTE_SET, async data => {
    const ownerId = socket.request.user._id
    const ticketId = data._id
    const itemId = data.item
    let text = data.value
    const isNote = data.isNote

    if (_.isUndefined(ticketId) || _.isUndefined(itemId) || _.isUndefined(text)) return true

    marked.setOptions({
      breaks: true
    })

    text = sanitizeHtml(text).trim()
    const markedText = xss(marked.parse(text))

    try {
      let ticket = await ticketSchema.getTicketById(ticketId)
      if (!isNote) ticket = await ticket.updateComment(ownerId, itemId, markedText)
      else ticket = await ticket.updateNote(ownerId, itemId, markedText)
      ticket = await ticket.save()

      utils.sendToAllConnectedClients(io, socketEvents.TICKETS_UPDATE, ticket)
    } catch (e) {
      winston.error(e)
    }
  })
}

events.onRemoveCommentNote = socket => {
  socket.on(socketEvents.TICKETS_COMMENT_NOTE_REMOVE, async data => {
    const ownerId = socket.request.user._id
    const ticketId = data._id
    const itemId = data.value
    const isNote = data.isNote

    try {
      let ticket = await ticketSchema.getTicketById(ticketId)
      if (!isNote) ticket = await ticket.removeComment(ownerId, itemId)
      else ticket = await ticket.removeNote(ownerId, itemId)

      ticket = await ticket.save()

      utils.sendToAllConnectedClients(io, socketEvents.TICKETS_UPDATE, ticket)
    } catch (e) {
      // Blank
    }
  })
}

events.onAttachmentsUIUpdate = socket => {
  socket.on(socketEvents.TICKETS_UI_ATTACHMENTS_UPDATE, async data => {
    const ticketId = data._id

    if (_.isUndefined(ticketId)) return true

    try {
      const ticket = await ticketSchema.getTicketById(ticketId)
      const user = socket.request.user
      if (_.isUndefined(user)) return true

      const canRemoveAttachments = permissions.canThis(user.role, 'tickets:removeAttachment')

      const data = {
        ticket,
        canRemoveAttachments
      }

      utils.sendToAllConnectedClients(io, socketEvents.TICKETS_UI_ATTACHMENTS_UPDATE, data)
    } catch (e) {
      // Blank
    }
  })
}

module.exports = {
  events: events,
  eventLoop: eventLoop,
  register: register
}
