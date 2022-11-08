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
var logger = require('../logger')
var socketEvents = require('./socketEventConsts')
var ticketSchema = require('../models/ticket')
var prioritySchema = require('../models/ticketpriority')
var userSchema = require('../models/user')
var roleSchema = require('../models/role')
var permissions = require('../permissions')
var xss = require('xss')
var { head, filter} = require('lodash')
var settingSchema = require('../models/setting')
var templateSchema = require('../models/template')
var path = require('path')
var templateDir = path.resolve(__dirname, '../..', 'mailer', 'templates')
var Email = require('email-templates')
var Mailer = require('../mailer')
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


const sendMail = async (ticket, emails, baseUrl, betaEnabled, templateName) => {
  let email = null
  if (betaEnabled) {
    email = new Email({
      render: (view, locals) => {
        return new Promise((resolve, reject) => {
          ; (async () => {
            try {
              if (!global.Handlebars) return reject(new Error('Could not load global.Handlebars'))
              const template = await templateSchema.findOne({ name: view })
              if (!template) return reject(new Error('Invalid Template'))
              const html = global.Handlebars.compile(template.data['gjs-fullHtml'])(locals)
              const results = await email.juiceResources(html)
              return resolve(results)
            } catch (e) {
              return reject(e)
            }
          })()
        })
      }
    })
  } else {
    email = new Email({
      views: {
        root: templateDir,
        options: {
          extension: 'handlebars'
        }
      }
    })
  }

  const template = await templateSchema.findOne({ name: templateName })
  if (template) {
    const ticketJSON = ticket.toJSON()
    ticketJSON.status = ticket.statusFormatted
    switch ( ticketJSON.status) {
      case 'New':
        ticketJSON.status = 'Новая'
        break
      case 'Open':
        ticketJSON.status = 'Открыта'
        break
      case 'Pending':
        ticketJSON.status = 'В ожидании'
        break
      case 'Closed':
        ticketJSON.status = 'Закрыта'
        break
    }
    if (ticketJSON.assignee){
      const assignee = await userSchema.findOne({ _id: ticketJSON.assignee })
      ticketJSON.assignee = assignee.fullname
      }
    const context = { base_url: baseUrl, ticket: ticketJSON }


    const html = await email.render(templateName, context)
    const subjectParsed = global.Handlebars.compile(template.subject)(context)
    const mailOptions = {
      to: emails.join(),
      subject: subjectParsed,
      html,
      generateTextFromHTML: true
    }

    await Mailer.sendMail(mailOptions)

    logger.debug(`Sent [${emails.length}] emails.`)
  }
}

const configForSendMail = async (ticket,templateName) =>{
  const ticketObject = ticket
  try {
    const ticket = await ticketSchema.getTicketById(ticketObject._id)
    const settings = await settingSchema.getSettingsByName(['gen:siteurl', 'mailer:enable', 'beta:email'])

    const baseUrl = head(filter(settings, ['name', 'gen:siteurl'])).value
    let mailerEnabled = head(filter(settings, ['name', 'mailer:enable']))
    mailerEnabled = !mailerEnabled ? false : mailerEnabled.value
    let betaEnabled = head(filter(settings, ['name', 'beta:email']))
    betaEnabled = !betaEnabled ? false : betaEnabled.value

    //++ ShaturaPro LIN 14.10.2022
    //const [emails] = await Promise.all([parseMemberEmails(ticket)])
    const emails = []
    if (ticket.owner.email && ticket.owner.email !== '') {
      emails.push(ticket.owner.email)
    }

    if (mailerEnabled) await sendMail(ticket, emails, baseUrl, betaEnabled, templateName)

  } catch (e) {
    logger.warn(`[trudesk:events:ticket:status:change] - Error: ${e}`)
  }
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
      configForSendMail(ticket, 'status-changed')
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
      configForSendMail(ticket, 'comment-added')
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
      configForSendMail(ticket)
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
