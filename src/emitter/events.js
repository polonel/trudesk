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

const _ = require('lodash')
const winston = require('../logger')
const emitter = require('../emitter')
const socketEvents = require('../socketio/socketEventConsts')
const notifications = require('../notifications') // Load Push Events
const eventTicketCreated = require('./events/event_ticket_created')
const eventUserCreated = require('./events/event_user_created')
const eventTicketAssigneChanged = require('./events/event_ticket_assignee_changed')
const eventTicketCommentAdded = require('./events/event_ticket_comment_added')


  ; (function () {
    notifications.init(emitter)

    emitter.on('ticket:created', async function (data) {
      await eventTicketCreated(data)
    })

    emitter.on('ticket:assignee:changed', async function (data) {
      await eventTicketAssigneChanged(data)
    })

    emitter.on('user:created', async function (data) {
      await eventUserCreated(data)
    })

    function sendPushNotification(tpsObj, data) {
      const tpsEnabled = tpsObj.tpsEnabled
      const tpsUsername = tpsObj.tpsUsername
      const tpsApiKey = tpsObj.tpsApiKey
      const hostname = tpsObj.hostname
      let ticket = data.ticket
      const message = data.message

      if (!tpsEnabled || !tpsUsername || !tpsApiKey) {
        winston.debug('Warn: TPS - Push Service Not Enabled')
        return
      }

      if (!hostname) {
        winston.debug('Could not get hostname for push: ' + data.type)
        return
      }

      // Data
      // 1 - Ticket Created
      // 2 - Ticket Comment Added
      // 3 - Ticket Note Added
      // 4 - Ticket Assignee Set
      //  - Message
      let title
      let users = []
      let content, comment, assigneeId, ticketUid
      switch (data.type) {
        case 1:
          title = 'Ticket #' + ticket.uid + ' Created'
          content = ticket.owner.fullname + ' submitted a ticket'
          users = _.map(ticket.group.sendMailTo, function (o) {
            return o._id
          })
          break
        case 2:
          title = 'Ticket #' + ticket.uid + ' Updated'
          content = _.last(ticket.history).description
          comment = _.last(ticket.comments)
          users = _.compact(
            _.map(ticket.subscribers, function (o) {
              if (comment.owner._id.toString() !== o._id.toString()) {
                return o._id
              }
            })
          )
          break
        case 3:
          title = message.owner.fullname + ' sent you a message'
          break
        case 4:
          assigneeId = data.assigneeId
          ticketUid = data.ticketUid
          ticket = {}
          ticket._id = data.ticketId
          ticket.uid = data.ticketUid
          title = 'Assigned to Ticket #' + ticketUid
          content = 'You were assigned to Ticket #' + ticketUid
          users = [assigneeId]
          break
        default:
          title = ''
      }

      if (_.size(users) < 1) {
        winston.debug('No users to push too | UserSize: ' + _.size(users))
        return
      }

      const n = {
        title: title,
        data: {
          ticketId: ticket._id,
          ticketUid: ticket.uid,
          users: users,
          hostname: hostname
        }
      }

      if (content) {
        n.content = content
      }

      notifications.pushNotification(tpsUsername, tpsApiKey, n)
    }

    emitter.on('ticket:updated', function (ticket) {
      io.sockets.emit('$trudesk:client:ticket:updated', { ticket: ticket })
    })

    emitter.on('ticket:deleted', function (oId) {
      io.sockets.emit('ticket:delete', oId)
      io.sockets.emit('$trudesk:client:ticket:deleted', oId)
    })

    emitter.on('ticket:subscriber:update', function (data) {
      io.sockets.emit('ticket:subscriber:update', data)
    })

    emitter.on('ticket:comment:added', async function (ticket, comment, hostname) {
      // Goes to client
      io.sockets.emit(socketEvents.TICKETS_UPDATE, ticket)
      await eventTicketCommentAdded(ticket,comment,hostname)
    })

    emitter.on('ticket:tcm:update', async function (tcm, ticket) {
      // Goes to client
      io.sockets.emit('$trudesk:client:tcm:update', {tcm, ticket})
      //await eventTicketCommentAdded(ticket,comment,hostname)
    })

    emitter.on('ticket:note:added', function (ticket) {
      // Goes to client
      io.sockets.emit('updateNotes', ticket)
    })

    emitter.on('trudesk:profileImageUpdate', function (data) {
      io.sockets.emit('trudesk:profileImageUpdate', data)
    })

    emitter.on(socketEvents.ROLES_FLUSH, function () {
      require('../permissions').register(function () {
        io.sockets.emit(socketEvents.ROLES_FLUSH)
      })
    })
  })()
