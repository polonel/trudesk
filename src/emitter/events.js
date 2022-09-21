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
const path = require('path')
const async = require('async')
const winston = require('../logger')
const emitter = require('../emitter')
const NotificationSchema = require('../models/notification')
const settingsSchema = require('../models/setting')
const Email = require('email-templates')
const templateDir = path.resolve(__dirname, '..', 'mailer', 'templates')
const socketEvents = require('../socketio/socketEventConsts')
const notifications = require('../notifications') // Load Push Events

const eventTicketCreated = require('./events/event_ticket_created')

;(function () {
  notifications.init(emitter)

  emitter.on('ticket:created', async function (data) {
    await eventTicketCreated(data)
  })

  function sendPushNotification (tpsObj, data) {
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

  emitter.on('ticket:comment:added', function (ticket, comment, hostname) {
    // Goes to client
    io.sockets.emit(socketEvents.TICKETS_UPDATE, ticket)

    settingsSchema.getSettingsByName(['tps:enable', 'tps:username', 'tps:apikey', 'mailer:enable'], function (
      err,
      tpsSettings
    ) {
      if (err) return false

      let tpsEnabled = _.head(_.filter(tpsSettings, ['name', 'tps:enable']))
      let tpsUsername = _.head(_.filter(tpsSettings, ['name', 'tps:username']))
      let tpsApiKey = _.head(_.filter(tpsSettings), ['name', 'tps:apikey'])
      let mailerEnabled = _.head(_.filter(tpsSettings), ['name', 'mailer:enable'])
      mailerEnabled = !mailerEnabled ? false : mailerEnabled.value

      if (!tpsEnabled || !tpsUsername || !tpsApiKey) {
        tpsEnabled = false
      } else {
        tpsEnabled = tpsEnabled.value
        tpsUsername = tpsUsername.value
        tpsApiKey = tpsApiKey.value
      }

      async.parallel(
        [
          function (cb) {
            if (ticket.owner._id.toString() === comment.owner.toString()) return cb
            if (!_.isUndefined(ticket.assignee) && ticket.assignee._id.toString() === comment.owner.toString())
              return cb

            const notification = new NotificationSchema({
              owner: ticket.owner,
              title: 'Comment Added to Ticket#' + ticket.uid,
              message: ticket.subject,
              type: 1,
              data: { ticket: ticket },
              unread: true
            })

            notification.save(function (err) {
              return cb(err)
            })
          },
          function (cb) {
            if (_.isUndefined(ticket.assignee)) return cb()
            if (ticket.assignee._id.toString() === comment.owner.toString()) return cb
            if (ticket.owner._id.toString() === ticket.assignee._id.toString()) return cb()

            const notification = new NotificationSchema({
              owner: ticket.assignee,
              title: 'Comment Added to Ticket#' + ticket.uid,
              message: ticket.subject,
              type: 2,
              data: { ticket: ticket },
              unread: true
            })

            notification.save(function (err) {
              return cb(err)
            })
          },
          function (cb) {
            sendPushNotification(
              {
                tpsEnabled: tpsEnabled,
                tpsUsername: tpsUsername,
                tpsApiKey: tpsApiKey,
                hostname: hostname
              },
              { type: 2, ticket: ticket }
            )
            return cb()
          },
          // Send email to subscribed users
          function (c) {
            if (!mailerEnabled) return c()

            const mailer = require('../mailer')
            let emails = []
            async.each(
              ticket.subscribers,
              function (member, cb) {
                if (_.isUndefined(member) || _.isUndefined(member.email)) return cb()
                if (member._id.toString() === comment.owner.toString()) return cb()
                if (member.deleted) return cb()

                emails.push(member.email)

                cb()
              },
              function (err) {
                if (err) return c(err)

                emails = _.uniq(emails)

                if (_.size(emails) < 1) {
                  return c()
                }

                const email = new Email({
                  views: {
                    root: templateDir,
                    options: {
                      extension: 'handlebars'
                    }
                  }
                })

                ticket.populate('comments.owner', function (err, ticket) {
                  if (err) winston.warn(err)
                  if (err) return c()

                  ticket = ticket.toJSON()

                  email
                    .render('ticket-comment-added', {
                      ticket: ticket,
                      comment: comment
                    })
                    .then(function (html) {
                      const mailOptions = {
                        to: emails.join(),
                        subject: 'Updated: Ticket #' + ticket.uid + '-' + ticket.subject,
                        html: html,
                        generateTextFromHTML: true
                      }

                      mailer.sendMail(mailOptions, function (err) {
                        if (err) winston.warn('[trudesk:events:sendSubscriberEmail] - ' + err)

                        winston.debug('Sent [' + emails.length + '] emails.')
                      })

                      return c()
                    })
                    .catch(function (err) {
                      winston.warn('[trudesk:events:sendSubscriberEmail] - ' + err)
                      return c(err)
                    })
                })
              }
            )
          }
        ],
        function () {
          // Blank
        }
      )
    })
  })

  emitter.on('ticket:note:added', function (ticket) {
    // Goes to client
    io.sockets.emit('updateNotes', ticket)
  })

  emitter.on('trudesk:profileImageUpdate', function (data) {
    io.sockets.emit('trudesk:profileImageUpdate', data)
  })

  // emitter.on('message', function (data) {
  //   console.log("Запрос от chatwoot");  
  //   const eventData = JSON.parse(event.data);
  //   window.location = "https://trudesk-dev.shatura.pro/loginChatwoot"
  // })

  emitter.on('message', function (event) {
    console.log("Запрос от chatwoot");  
    const eventData = JSON.parse(event.data);
    window.location = "https://trudesk-dev.shatura.pro/loginChatwoot"
    })
  

  emitter.on(socketEvents.ROLES_FLUSH, function () {
    require('../permissions').register(function () {
      io.sockets.emit(socketEvents.ROLES_FLUSH)
    })
  })
})()
