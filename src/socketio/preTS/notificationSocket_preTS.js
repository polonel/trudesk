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
const _async = require('async')
const winston = require('../logger')
const utils = require('../helpers/utils')
const socketEvents = require('./socketEventConsts')
const Models = require('../models')
const events = {}

function register (socket) {
  events.updateNotifications(socket)
  events.updateAllNotifications(socket)
  events.markNotificationRead(socket)
  events.clearNotifications(socket)
}

function eventLoop () {
  updateNotifications()
}

async function updateNotifications () {
  const notificationSchema = Models.NotificationModel
   
  for (const [_, socket] of io.of('/').sockets) {
    const notifications = {}
    const notificationsPromise = new Promise((resolve, reject) => {
      ;(async () => {
        try {
          const items = await notificationSchema.getForUserWithLimit(socket.request.user._id)
          notifications.items = items

          return resolve(items)
        } catch (e) {
          return reject(e)
        }
      })()
    })

    const unreadCountPromise = new Promise((resolve, reject) => {
      ;(async () => {
        try {
          const count = await notificationSchema.getUnreadCount(socket.request.user._id)
          notifications.count = count

          return resolve(count)
        } catch (e) {
          return reject(e)
        }
      })()
    })

    try {
      const [_items, _count] = await Promise.all([notificationsPromise, unreadCountPromise])

      utils.sendToSelf(socket, socketEvents.NOTIFICATIONS_UPDATE, notifications)
    } catch (err) {
      winston.warn(err)
      return true
    }
  }
}

function updateAllNotifications (socket) {
  const notifications = {}
  const notificationSchema = Models.NotificationModel
  notificationSchema.findAllForUser(socket.request.user._id, function (err, items) {
    if (err) return false

    notifications.items = items

    utils.sendToSelf(socket, 'updateAllNotifications', notifications)
  })
}

events.updateNotifications = function (socket) {
  socket.on(socketEvents.NOTIFICATIONS_UPDATE, function () {
    updateNotifications(socket)
  })
}

events.updateAllNotifications = function (socket) {
  socket.on('updateAllNotifications', function () {
    updateAllNotifications(socket)
  })
}

events.markNotificationRead = function (socket) {
  socket.on(socketEvents.NOTIFICATIONS_MARK_READ, function (_id) {
    if (_.isUndefined(_id)) return true
    const notificationSchema = Models.NotificationModel
    notificationSchema.getNotification(_id, function (err, notification) {
      if (err) return true

      notification.markRead(function () {
        notification.save(function (err) {
          if (err) return true

          updateNotifications(socket)
        })
      })
    })
  })
}

events.clearNotifications = function (socket) {
  socket.on(socketEvents.NOTIFICATIONS_CLEAR, function () {
    const userId = socket.request.user._id
    if (_.isUndefined(userId)) return true
    const notifications = {}
    notifications.items = []
    notifications.count = 0
    const notificationSchema = Models.NotificationModel
    notificationSchema.clearNotifications(userId, function (err) {
      if (err) return true

      utils.sendToSelf(socket, socketEvents.UPDATE_NOTIFICATIONS, notifications)
    })
  })
}

module.exports = {
  events: events,
  eventLoop: eventLoop,
  register: register
}
