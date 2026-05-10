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
import utils from '../helpers/utils'
import socketEvents from './socketEventConsts'
import Models from '../models'

declare const io: any

interface NotificationSocketEvents {
  updateNotifications: (socket: Socket) => void
  updateAllNotifications: (socket: Socket) => void
  markNotificationRead: (socket: Socket) => void
  clearNotifications: (socket: Socket) => void
}

const events = {} as NotificationSocketEvents

function register(socket: Socket): void {
  events.updateNotifications(socket)
  events.updateAllNotifications(socket)
  events.markNotificationRead(socket)
  events.clearNotifications(socket)
}

function eventLoop(): void {
  updateNotifications()
}

async function updateNotifications(): Promise<void> {
  const notificationSchema = (Models as any).NotificationModel
  // eslint-disable-next-line no-unused-vars
  for (const [_, socket] of (io as any).of('/').sockets) {
    const userId = (socket as Socket).request && (socket.request as any).user._id
    try {
      const [items, count] = await Promise.all([
        notificationSchema.getForUserWithLimit(userId),
        notificationSchema.getUnreadCount(userId)
      ])

      utils.sendToSelf(socket as Socket, socketEvents.NOTIFICATIONS_UPDATE, { items, count })
    } catch (err) {
      winston.warn(err)
      return
    }
  }
}

function updateAllNotifications(socket: Socket): void {
  const notifications: any = {}
  const notificationSchema = (Models as any).NotificationModel
  notificationSchema.findAllForUser((socket.request as any).user._id, function (err: Error | null, items: any[]) {
    if (err) return

    notifications.items = items

    utils.sendToSelf(socket, 'updateAllNotifications', notifications)
  })
}

events.updateNotifications = function (socket: Socket): void {
  socket.on(socketEvents.NOTIFICATIONS_UPDATE, function () {
    updateNotifications()
  })
}

events.updateAllNotifications = function (socket: Socket): void {
  socket.on('updateAllNotifications', function () {
    updateAllNotifications(socket)
  })
}

events.markNotificationRead = function (socket: Socket): void {
  socket.on(socketEvents.NOTIFICATIONS_MARK_READ, function (_id: string) {
    if (_.isUndefined(_id)) return
    const notificationSchema = (Models as any).NotificationModel
    notificationSchema.getNotification(_id, function (err: Error | null, notification: any) {
      if (err) return

      notification.markRead(function () {
        notification.save().then(function () {
          updateNotifications()
        }).catch(function () {})
      })
    })
  })
}

events.clearNotifications = function (socket: Socket): void {
  socket.on(socketEvents.NOTIFICATIONS_CLEAR, function () {
    const userId = (socket.request as any).user._id
    if (_.isUndefined(userId)) return
    const notifications: any = {}
    notifications.items = []
    notifications.count = 0
    const notificationSchema = (Models as any).NotificationModel
    notificationSchema.clearNotifications(userId, function (err: Error | null) {
      if (err) return

      utils.sendToSelf(socket, socketEvents.NOTIFICATIONS_UPDATE, notifications)
    })
  })
}

export { events, eventLoop, register }
export default { events, eventLoop, register }
