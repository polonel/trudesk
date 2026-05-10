/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b 888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    1/20/19 4:43 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import axios from 'axios'
import winston from 'winston'

interface NotificationData {
  hostname?: string
  users: string[]
  ticketId?: string
  ticketUid?: string
}

interface Notification {
  title: string
  content: string
  data: NotificationData
}

export function pushNotification(_tpsUsername: string, tpsApiKey: string, notification: Notification): void {
  const body = {
    title: notification.title,
    content: notification.content,
    data: {
      hostname: notification.data.hostname,
      users: notification.data.users
    }
  }

  if (notification.data.ticketId) {
    (body.data as any).ticketId = notification.data.ticketId
  }

  if (notification.data.ticketUid) {
    (body.data as any).ticketUid = notification.data.ticketUid
  }

  axios.post('http://push.trudesk.io/api/pushNotification', body, {
    headers: {
      'Content-Type': 'application/json',
      accesstoken: tpsApiKey
    }
  }).catch((err) => {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      winston.warn('[trudesk:TPS:pushNotification] Error - Invalid API Key and or Username.')
    } else {
      winston.debug(err)
    }
  })
}

export function init(): void {
  // emitter.on('ticket:created', onTicketCreate);
  // emitter.on('notification:count:update', onNotificationCountUpdate);
}

// function onTicketCreate(ticketObj) {
//
// }
//
// function onNotificationCountUpdate(user) {
//
// }