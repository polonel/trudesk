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

import _ from 'lodash'
import type { Socket } from 'socket.io'
import winston from '../logger'
 
const marked = require('marked')
 
// @ts-ignore
import sanitizeHtml from 'sanitize-html'
import utils from '../helpers/utils'
import emitter from '../emitter'
import socketEvents from './socketEventConsts'
import { TicketModel as ticketSchema, PriorityModel, UserModel as userSchema } from '../models'
import roleSchema from '../models/role'
import permissions from '../permissions'
import xss from 'xss'

marked.setOptions({ breaks: true })

declare const io: any

interface TicketSocketEvents {
  onUpdateTicketGrid: (socket: Socket) => void
  onUpdateTicketStatus: (socket: Socket) => void
  onUpdateTicket: (socket: Socket) => void
  onUpdateAssigneeList: (socket: Socket) => void
  onSetAssignee: (socket: Socket) => void
  onUpdateTicketTags: (socket: Socket) => void 
  onClearAssignee: (socket: Socket) => void
  onSetTicketType: (socket: Socket) => void
  onSetTicketPriority: (socket: Socket) => void
  onSetTicketGroup: (socket: Socket) => void
  onSetTicketDueDate: (socket: Socket) => void
  onSetTicketIssue: (socket: Socket) => void
  onCommentNoteSet: (socket: Socket) => void
  onRemoveCommentNote: (socket: Socket) => void
  onAttachmentsUIUpdate: (socket: Socket) => void
}
 
const events = {} as TicketSocketEvents

function register(socket: Socket): void {
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

events.onUpdateTicketGrid = function (socket: Socket): void {
  socket.on('ticket:updategrid', function () {
    utils.sendToAllConnectedClients(io, 'ticket:updategrid')
  })
}

events.onUpdateTicketStatus = (socket: Socket) => {
  socket.on(socketEvents.TICKETS_STATUS_SET, async (data: any) => {
    const ticketId = data._id
    const status = data.value
    const ownerId = (socket.request as any).user._id

    try {
      let ticket = await ticketSchema.getTicketById(ticketId)

      ticket = await ticket.setStatus(ownerId, status)
      ticket = await ticket.save()
      ticket = await ticket.populate('status')

      utils.sendToAllConnectedClients(io, socketEvents.TICKETS_UI_STATUS_UPDATE, {
        tid: ticket._id,
        owner: ticket.owner,
        status: ticket.status
      })
    } catch (_e) {
      // Blank
    }
  })
}

events.onUpdateTicket = function (socket: Socket): void {
  socket.on(socketEvents.TICKETS_UPDATE, async (data: any) => {
    try {
      const ticket = await ticketSchema.getTicketById(data._id)

      utils.sendToAllConnectedClients(io, socketEvents.TICKETS_UPDATE, ticket)
    } catch (_error) {
      // Blank
    }
  })
}

events.onUpdateAssigneeList = function (socket: Socket): void {
  socket.on(socketEvents.TICKETS_ASSIGNEE_LOAD, function () {
    ;(roleSchema as any).getAgentRoles(function (err: Error | null, roles: any[]) {
      if (err) return
      userSchema.find({ role: { $in: roles }, deleted: false }, function (err: Error | null, users: any[]) {
        if (err) return

        const sortedUser = _.sortBy(users, 'fullname')

        utils.sendToSelf(socket, socketEvents.TICKETS_ASSIGNEE_LOAD, sortedUser)
      })
    })
  })
}

events.onSetAssignee = (socket: Socket) => {
  socket.on(socketEvents.TICKETS_ASSIGNEE_SET, async (data: any) => {
    const userId = data._id
    const ownerId = (socket.request as any).user._id
    const ticketId = data.ticketId

    try {
      let ticket = await ticketSchema.getTicketById(ticketId)
      if (!ticket) {
        winston.warn(`Unable to get ticket with id: ${ticketId}`)
        return
      }

      await Promise.all([ticket.setAssignee(ownerId, userId), ticket.addSubscriber(userId)])

      ticket = await ticket.save()
      ticket = await ticket.populate('assignee')

      emitter.emit('ticket:subscriber:update', { user: userId, subscribe: true })
      emitter.emit(socketEvents.TICKETS_ASSIGNEE_SET, {
        assigneeId: ticket.assignee._id,
        ticketId: ticket._id,
        ticketUid: ticket.uid,
        hostname: socket.handshake.headers.host
      })

      utils.sendToAllConnectedClients(io, socketEvents.TICKETS_ASSIGNEE_UPDATE, ticket)
    } catch (e) {
      winston.warn(e)
    }
  })
}

events.onSetTicketType = (socket: Socket) => {
  socket.on(socketEvents.TICKETS_TYPE_SET, async (data: any) => {
    const ticketId = data._id
    const typeId = data.value
    const ownerId = (socket.request as any).user._id

    if (_.isUndefined(ticketId) || _.isUndefined(typeId)) return
    try {
      let ticket = await ticketSchema.getTicketById(ticketId)
      ticket = await ticket.setTicketType(ownerId, typeId)
      ticket = await ticket.save()
      ticket = await ticket.populate('type')
      utils.sendToAllConnectedClients(io, socketEvents.TICKETS_UI_TYPE_UPDATE, ticket)
    } catch (_e) {
      // Blank
    }
  })
}

events.onUpdateTicketTags = (socket: Socket) => {
  socket.on(socketEvents.TICKETS_UI_TAGS_UPDATE, async (data: any) => {
    const ticketId = data.ticketId
    if (_.isUndefined(ticketId)) return

    try {
      const ticket = await ticketSchema.findOne({ _id: ticketId }).populate('tags')

      utils.sendToAllConnectedClients(io, socketEvents.TICKETS_UI_TAGS_UPDATE, ticket)
    } catch (_e) {
      // Blank
    }
  })
}

events.onSetTicketPriority = function (socket: Socket): void {
  socket.on(socketEvents.TICKETS_PRIORITY_SET, async function (data: any) {
    const ticketId = data._id
    const priority = data.value
    const ownerId = (socket.request as any).user._id

    if (_.isUndefined(ticketId) || _.isUndefined(priority)) return
    try {
      let ticket = await ticketSchema.getTicketById(ticketId)
      const p = await PriorityModel.getPriority(priority)

      ticket = await ticket.setTicketPriority(ownerId, p)
      ticket = await ticket.save()

      utils.sendToAllConnectedClients(io, socketEvents.TICKETS_UI_PRIORITY_UPDATE, ticket)
    } catch (e) {
      winston.warn(e)
    }
  })
}

events.onClearAssignee = (socket: Socket) => {
  socket.on(socketEvents.TICKETS_ASSIGNEE_CLEAR, async (id: string) => {
    const ownerId = (socket.request as any).user._id

    try {
      const ticket = await ticketSchema.findOne({ _id: id })
      if (!ticket) return

      const updatedTicket = await ticket.clearAssignee(ownerId)
      const savedTicket = await updatedTicket.save()

      utils.sendToAllConnectedClients(io, socketEvents.TICKETS_ASSIGNEE_UPDATE, savedTicket)
    } catch (_e) {
      // Blank
    }
  })
}

events.onSetTicketGroup = (socket: Socket) => {
  socket.on(socketEvents.TICKETS_GROUP_SET, async (data: any) => {
    const ticketId = data._id
    const groupId = data.value
    const ownerId = (socket.request as any).user._id

    if (_.isUndefined(ticketId) || _.isUndefined(groupId)) return
    try {
      let ticket = await ticketSchema.getTicketById(ticketId)
      ticket = await ticket.setTicketGroup(ownerId, groupId)
      ticket = await ticket.save()
      ticket = await ticket.populate('group')
      utils.sendToAllConnectedClients(io, socketEvents.TICKETS_UI_GROUP_UPDATE, ticket)
    } catch (_e) {
      // Blank
    }
  })
}

events.onSetTicketDueDate = function (socket: Socket): void {
  socket.on(socketEvents.TICKETS_DUEDATE_SET, function (data: any) {
    const ticketId = data._id
    const dueDate = data.value
    const ownerId = (socket.request as any).user._id

    if (_.isUndefined(ticketId)) return

    ticketSchema.getTicketById(ticketId, function (err: Error | null, ticket: any) {
      if (err) return

      ticket.setTicketDueDate(ownerId, dueDate, function (err: Error | null, t: any) {
        if (err) return

        t.save().then(function (tt: any) {
          utils.sendToAllConnectedClients(io, socketEvents.TICKETS_UI_DUEDATE_UPDATE, tt)
        }).catch(function () {})
      })
    })
  })
}

events.onSetTicketIssue = (socket: Socket) => {
  socket.on(socketEvents.TICKETS_ISSUE_SET, async (data: any) => {
    const ticketId = data._id
    const issue = data.value
    const subject = data.subject
    const ownerId = (socket.request as any).user._id
    if (_.isUndefined(ticketId) || _.isUndefined(issue)) return

    try {
      let ticket = await ticketSchema.getTicketById(ticketId)
      if (subject !== ticket.subject) ticket = await ticket.setSubject(ownerId, subject)
      if (issue !== ticket.issue) ticket = await ticket.setIssue(ownerId, issue)

      ticket = await ticket.save()

      utils.sendToAllConnectedClients(io, socketEvents.TICKETS_UPDATE, ticket)
    } catch (_e) {
      // Blank
    }
  })
}

events.onCommentNoteSet = (socket: Socket) => {
  socket.on(socketEvents.TICKETS_COMMENT_NOTE_SET, async (data: any) => {
    const ownerId = (socket.request as any).user._id
    const ticketId = data._id
    const itemId = data.item
    let text: string = data.value
    const isNote = data.isNote

    if (_.isUndefined(ticketId) || _.isUndefined(itemId) || _.isUndefined(text)) return

    text = sanitizeHtml(text).trim()
    const markedText = xss(marked.parse(text) as string)

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

events.onRemoveCommentNote = (socket: Socket) => {
  socket.on(socketEvents.TICKETS_COMMENT_NOTE_REMOVE, async (data: any) => {
    const ownerId = (socket.request as any).user._id
    const ticketId = data._id
    const itemId = data.value
    const isNote = data.isNote

    try {
      let ticket = await ticketSchema.getTicketById(ticketId)
      if (!isNote) ticket = await ticket.removeComment(ownerId, itemId)
      else ticket = await ticket.removeNote(ownerId, itemId)

      ticket = await ticket.save()

      utils.sendToAllConnectedClients(io, socketEvents.TICKETS_UPDATE, ticket)
    } catch (_e) {
      // Blank
    }
  })
}

events.onAttachmentsUIUpdate = (socket: Socket) => {
  socket.on(socketEvents.TICKETS_UI_ATTACHMENTS_UPDATE, async (data: any) => {
    const ticketId = data._id

    if (_.isUndefined(ticketId)) return

    try {
      const ticket = await ticketSchema.getTicketById(ticketId)
      const user = (socket.request as any).user
      if (_.isUndefined(user)) return

      const canRemoveAttachments = permissions.canThis(user.role, 'tickets:removeAttachment')

      const attachmentData = {
        ticket,
        canRemoveAttachments
      }

      utils.sendToAllConnectedClients(io, socketEvents.TICKETS_UI_ATTACHMENTS_UPDATE, attachmentData)
    } catch (_e) {
      // Blank
    }
  })
}

export { events, register }
export default { events, register }
