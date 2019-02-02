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
var utils = require('../helpers/utils')

var events = {}

function register (socket) {
  events.updateNotifications(socket)
  events.updateAllNotifications(socket)
  events.markNotificationRead(socket)
  events.clearNotifications(socket)
}

function eventLoop () {
  updateNotifications()
}

function updateNotifications () {
  _.each(io.sockets.sockets, function (socket) {
    var notifications = {}
    var notificationSchema = require('../models/notification')
    async.parallel(
      [
        function (done) {
          notificationSchema.getForUserWithLimit(socket.request.user._id, function (err, items) {
            if (err) return done(err)

            notifications.items = items
            return done()
          })
        },
        function (done) {
          notificationSchema.getUnreadCount(socket.request.user._id, function (err, count) {
            if (err) return done(err)

            notifications.count = count
            return done()
          })
        }
      ],
      function (err) {
        if (err) {
          winston.warn(err)
          return true
        }

        utils.sendToSelf(socket, 'updateNotifications', notifications)
      }
    )
  })
}

function updateAllNotifications (socket) {
  var notifications = {}
  var notificationSchema = require('../models/notification')
  notificationSchema.findAllForUser(socket.request.user._id, function (err, items) {
    if (err) return false

    notifications.items = items

    utils.sendToSelf(socket, 'updateAllNotifications', notifications)
  })
}

events.updateNotifications = function (socket) {
  socket.on('updateNotifications', function () {
    updateNotifications(socket)
  })
}

events.updateAllNotifications = function (socket) {
  socket.on('updateAllNotifications', function () {
    updateAllNotifications(socket)
  })
}

events.markNotificationRead = function (socket) {
  socket.on('markNotificationRead', function (_id) {
    if (_.isUndefined(_id)) return true
    var notificationSchema = require('../models/notification')
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
  socket.on('clearNotifications', function () {
    var userId = socket.request.user._id
    if (_.isUndefined(userId)) return true
    var notifications = {}
    notifications.items = []
    notifications.count = 0

    var notificationSchema = require('../models/notification')
    notificationSchema.clearNotifications(userId, function (err) {
      if (err) return true

      utils.sendToSelf(socket, 'updateNotifications', notifications)
    })
  })
}

module.exports = {
  events: events,
  eventLoop: eventLoop,
  register: register
}
